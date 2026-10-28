import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, model, output, untracked } from '@angular/core';
import { IconComponent, PillComponent } from '@ndwnu/design-system';
import { LabRecord } from '../data/lab-data';
import { hostWidth, Sort } from '../lab-store';
import { statusColor } from './status';

export interface TableColumn<T extends LabRecord> {
  key: string;
  label: string;
  sortable?: boolean;
  kind?: 'primary' | 'status' | 'text';
  text: (row: T) => string;
  /** Second line below the text (e.g. the subject below the ID). */
  sub?: (row: T) => string;
  /** Hide the column when the table is narrower than this many px. */
  hideBelow?: number;
}

/**
 * Accessible results table: real table semantics, sortable column buttons with `aria-sort`, and a
 * button in the first cell to select a row (keyboard alternative to clicking a row or a map marker).
 */
@Component({
  selector: 'app-results-table',
  imports: [IconComponent, PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scroller" tabindex="-1">
      <table>
        <caption class="sr-only">{{ caption() }}</caption>
        <thead>
          <tr>
            @for (col of visibleColumns(); track col.key) {
              <th scope="col" [attr.aria-sort]="ariaSort(col)">
                @if (col.sortable) {
                  <button type="button" class="sort" (click)="toggleSort(col)">
                    {{ col.label }}
                    <ndw-icon size="sm">{{ sortIcon(col) }}</ndw-icon>
                  </button>
                } @else {
                  {{ col.label }}
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.id) {
            <tr [class.selected]="row.id === selectedId()" [attr.data-row-id]="row.id" (click)="rowSelected.emit(row.id)">
              @for (col of visibleColumns(); track col.key; let first = $first) {
                <td>
                  @if (first) {
                    <div class="first-cell">
                      <button type="button" class="row-link" [attr.aria-current]="row.id === selectedId() ? 'true' : null" (click)="$event.stopPropagation(); rowSelected.emit(row.id)">
                        <span class="primary">{{ col.text(row) }}</span>
                        @if (col.sub) {
                          <span class="sub">{{ col.sub(row) }}</span>
                        }
                      </button>
                      @if (detailIcon(); as icon) {
                        <button type="button" class="detail-link" [attr.aria-label]="'Details van ' + col.text(row)" [attr.title]="'Details van ' + col.text(row)" (click)="$event.stopPropagation(); rowSelected.emit(row.id)">
                          <ndw-icon size="sm">{{ icon }}</ndw-icon>
                        </button>
                      }
                    </div>
                  } @else if (col.kind === 'status') {
                    <ndw-pill [color]="color(col.text(row))">{{ col.text(row) }}</ndw-pill>
                  } @else {
                    {{ col.text(row) || '—' }}
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './results-table.component.scss',
})
export class ResultsTableComponent<T extends LabRecord> {
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly selectedId = input<string | null>(null);
  readonly caption = input('Resultaten');
  /** Icon of an extra button next to the first cell that opens the details of the row (off by default). */
  readonly detailIcon = input<string | null>(null);
  readonly sort = model.required<Sort>();
  readonly rowSelected = output<string>();

  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly #width = hostWidth();
  protected readonly color = statusColor;
  protected readonly visibleColumns = computed(() => this.columns().filter((c) => !c.hideBelow || this.#width() >= c.hideBelow));

  constructor() {
    // Keep the selected row visible when it is selected elsewhere (map, detail), without moving focus.
    effect(() => {
      const id = this.selectedId();
      this.rows();
      untracked(() => {
        if (!id) return;
        queueMicrotask(() => this.#row(id)?.scrollIntoView({ block: 'nearest' }));
      });
    });
  }

  /** Focus the select button of a row, e.g. after closing the detail. */
  focusRow(id: string | null) {
    const button = id ? this.#row(id)?.querySelector<HTMLElement>('.row-link') : this.#host.querySelector<HTMLElement>('.row-link');
    button?.focus({ preventScroll: false });
  }

  protected ariaSort(col: TableColumn<T>) {
    const s = this.sort();
    return col.sortable && s.key === col.key ? (s.dir === 'asc' ? 'ascending' : 'descending') : col.sortable ? 'none' : null;
  }

  protected sortIcon(col: TableColumn<T>) {
    const s = this.sort();
    return s.key === col.key ? (s.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more';
  }

  protected toggleSort(col: TableColumn<T>) {
    const s = this.sort();
    this.sort.set(s.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: col.key === 'updatedAt' ? 'desc' : 'asc' });
  }

  #row(id: string) {
    return this.#host.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"]`);
  }
}

