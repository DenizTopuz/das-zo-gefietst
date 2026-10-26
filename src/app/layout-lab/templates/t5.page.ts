import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, Injector, signal, untracked, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonDirective, IconComponent, PillComponent, ToastService } from '@ndwnu/design-system';
import { LabRecord, Locatierecord, LOCATIERECORDS, LOCATIE_TYPEN, updatedLabel } from '../data/lab-data';
import { FIELD_LABEL, validateLocatie, withStatus } from '../data/locatie-validation';
import { bindUrlState, EMPTY_FILTERS, hostWidth, LabStore } from '../lab-store';
import { LabDialogs } from '../shared/dialogs';
import { FilterGroup, FilterPanelComponent } from '../shared/filter-panel.component';
import { DetailData, ObjectDetailComponent } from '../shared/object-detail.component';
import { createResults } from '../shared/results-model';
import { ResultsTableComponent, TableColumn } from '../shared/results-table.component';
import { ScopeToolbarComponent } from '../shared/scope-toolbar.component';
import { ScreenHeaderComponent } from '../shared/screen-header.component';
import { statusColor } from '../shared/status';
import { StatusMessageComponent } from '../shared/status-message.component';

const NARROW = 760;
const MIN_MAIN = 560;
const DOCK_FILTERS = 320;
const GAP = 16;

const COLUMNS: TableColumn<Locatierecord>[] = [
  { key: 'title', label: 'ID / naam', sortable: true, kind: 'primary', text: (r) => `${r.id} · ${r.title}` },
  { key: 'status', label: 'Status', sortable: true, kind: 'status', text: (r) => r.status },
  { key: 'type', label: 'Type', sortable: true, text: (r) => r.type, hideBelow: 700 },
  { key: 'location', label: 'Locatie', sortable: true, text: (r) => r.location, hideBelow: 900 },
  { key: 'updatedAt', label: 'Bijgewerkt', sortable: true, text: (r) => updatedLabel(r.updatedAt), hideBelow: 560 },
];

const FILTER_GROUPS: FilterGroup[] = [
  { key: 'status', label: 'Status', options: ['Geldig', 'Aandachtspunt', 'Fout'] },
  { key: 'type', label: 'Type', options: LOCATIE_TYPEN },
];

/** T5 · Overzicht + detail: records zoeken en beheren zonder permanente kaart. */
@Component({
  selector: 'app-t5',
  imports: [ButtonDirective, FilterPanelComponent, IconComponent, ObjectDetailComponent, PillComponent, ResultsTableComponent, ScopeToolbarComponent, ScreenHeaderComponent, StatusMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-header title="Objecten beheren" />

    <app-scope-toolbar
      [(search)]="state.search"
      searchLabel="Zoek in objecten"
      placeholder="Zoek op naam of ID"
      [filterCount]="results.activeFilterCount()"
      [filtersOpen]="filtersMode() !== 'none'"
      filtersId="t5-filters"
      scope="Midden-Nederland"
      (filtersToggle)="toggleFilters()"
    >
      <button ndwButton type="button" (click)="newObject()"><ndw-icon>add</ndw-icon> Nieuw object</button>
    </app-scope-toolbar>

    <p class="sr-only" role="status" aria-live="polite">{{ countText() }}</p>

    <div class="workspace">
      @if (filtersMode() === 'dock') {
        <aside id="t5-filters" class="dock dock--filters" aria-label="Filters">
          <app-filter-panel [groups]="filterGroups" [filters]="state.filters()" [inViewAvailable]="false" scopeText="Deze filters gelden voor de resultaten en de aantallen. Dit scherm heeft geen kaart." (filtersChange)="state.filters.set($event)" (closed)="state.filtersOpen.set(false)" />
        </aside>
      }
      @if (filtersMode() === 'overlay') {
        <aside id="t5-filters" class="overlay" aria-label="Filters" (keydown.escape)="state.filtersOpen.set(false)">
          <app-filter-panel mode="overlay" [groups]="filterGroups" [filters]="state.filters()" [inViewAvailable]="false" scopeText="Deze filters gelden voor de resultaten en de aantallen. Dit scherm heeft geen kaart." (filtersChange)="state.filters.set($event)" (closed)="state.filtersOpen.set(false)" />
        </aside>
      }

      <div class="main" [hidden]="detailMode() === 'view'">
        <div class="pane">
          @if (statusKind(); as kind) {
            <app-status-message [kind]="kind" [text]="kind === 'empty' ? 'Pas de filters of de zoekopdracht aan.' : ''" (retry)="retry()" (clear)="clearAll()" />
          } @else if (narrow()) {
            <ul class="cards" aria-label="Objecten">
              @for (r of results.filtered(); track r.id) {
                <li>
                  <button type="button" class="card" [attr.data-card-id]="r.id" [attr.aria-current]="r.id === state.selectedId() ? 'true' : null" [class.card--selected]="r.id === state.selectedId()" (click)="select(r.id)">
                    <strong class="ndw-paragraph-bold-lg">{{ r.id }} · {{ r.title }}</strong>
                    <span class="ndw-paragraph-md">{{ r.type }} · {{ r.location || 'Locatie ontbreekt' }}</span>
                    <ndw-pill [color]="color(r.status)">{{ r.status }}</ndw-pill>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <app-results-table [rows]="results.filtered()" [columns]="columns" [selectedId]="state.selectedId()" [sort]="state.sort()" (sortChange)="state.sort.set($event)" caption="Objecten" (rowSelected)="select($event)" />
          }
          <p class="count ndw-paragraph-sm" aria-hidden="true">{{ countText() }}</p>
        </div>
      </div>

      @if (detailMode() !== 'none' && detail(); as d) {
        <aside [class]="detailMode() === 'dock' ? 'dock dock--detail' : 'detail-view'" aria-label="Details van geselecteerd object" [class.dock--wide]="state.detailWide() && detailMode() === 'dock'">
          <app-object-detail [data]="d" [mode]="detailMode() === 'dock' ? 'dock' : 'view'" (closed)="closeDetail()">
            <ng-container actions>
              <button ndwButton type="button" (click)="edit()"><ndw-icon>edit</ndw-icon> Bewerken</button>
              @if (detailMode() === 'dock') {
                <button ndwButton secondary type="button" (click)="closeDetail()">Sluiten</button>
              }
            </ng-container>
          </app-object-detail>
        </aside>
      }
    </div>
  `,
  styleUrl: './list-templates.scss',
})
export class T5Page {
  readonly #store = inject(LabStore);
  readonly #dialogs = inject(LabDialogs);
  readonly #router = inject(Router);
  readonly #toast = inject(ToastService);
  readonly #injector = inject(Injector);
  protected readonly state = this.#store.state('t5');
  protected readonly width = hostWidth();

  /** The same records as the T4 editor, with their validation status. */
  protected readonly records = signal<Locatierecord[]>(withStatus(LOCATIERECORDS));
  protected readonly results = createResults(this.records, this.state);
  protected readonly columns = COLUMNS;
  protected readonly filterGroups = FILTER_GROUPS;
  protected readonly color = statusColor;
  private readonly table = viewChild(ResultsTableComponent);

  protected readonly narrow = computed(() => this.width() < NARROW);
  protected readonly detailWidth = computed(() => (this.state.detailWide() ? 560 : 400));
  protected readonly hasDetail = computed(() => this.state.detailOpen() && !!this.results.selected());
  protected readonly detailMode = computed<'none' | 'dock' | 'view'>(() => {
    if (!this.hasDetail()) return 'none';
    return this.narrow() || this.width() < MIN_MAIN + this.detailWidth() + 2 * GAP ? 'view' : 'dock';
  });
  protected readonly filtersMode = computed<'none' | 'dock' | 'overlay'>(() => {
    if (!this.state.filtersOpen() || this.narrow()) return 'none';
    const detail = this.detailMode() === 'dock' ? this.detailWidth() + GAP : 0;
    return this.width() >= MIN_MAIN + DOCK_FILTERS + detail + 2 * GAP ? 'dock' : 'overlay';
  });
  protected readonly statusKind = computed<'loading' | 'error' | 'empty' | 'no-data' | null>(() => {
    switch (this.state.demo()) {
      case 'laden':
        return 'loading';
      case 'fout':
        return 'error';
      case 'geen-data':
        return 'no-data';
    }
    return this.results.filtered().length === 0 ? 'empty' : null;
  });
  protected readonly countText = computed(() => {
    const shown = this.results.filtered().length;
    const total = this.results.total();
    return shown === total ? `${total} resultaten` : `${shown} van ${total} resultaten`;
  });

  protected readonly detail = computed<DetailData | null>(() => {
    const r = this.results.selected();
    if (!r) return null;
    const findings = validateLocatie(r);
    return {
      id: r.id,
      title: r.title,
      status: r.status,
      fields: [
        { key: 'Type', value: r.type },
        { key: 'Locatie', value: r.location },
        { key: 'Richting', value: r.direction },
        { key: 'Coördinaten', value: r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : '' },
        { key: 'Gebied', value: r.area },
        { key: 'Beheerder', value: r.owner },
        { key: 'Bijgewerkt', value: updatedLabel(r.updatedAt) },
        { key: 'Aandachtspunten', value: findings.length ? findings.map((f) => `${FIELD_LABEL[f.field]}: ${f.message}`).join(' ') : 'Geen' },
      ],
    };
  });

  constructor() {
    bindUrlState('t5', ['id', 'breedte']);

    effect(() => {
      const id = this.state.selectedId();
      const visible = this.results.filtered().some((r) => r.id === id);
      untracked(() => {
        if (id && !visible && !this.statusKind()?.match(/loading|error|no-data/)) {
          this.state.setSelection(null, false);
          this.#toast.open(`${id} valt buiten de huidige resultaten. Het detail is gesloten.`);
        }
      });
    });
  }

  protected select(id: string) {
    this.state.setSelection(id, true);
  }

  protected closeDetail() {
    const id = this.state.selectedId();
    this.state.detailOpen.set(false);
    afterNextRender(
      () => {
        this.table()?.focusRow(id);
        document.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(id ?? '')}"]`)?.focus();
      },
      { injector: this.#injector },
    );
  }

  protected edit() {
    const id = this.state.selectedId();
    if (id) void this.#router.navigate(['/layout-lab', 't4'], { queryParams: { id } });
  }

  protected newObject() {
    void this.#router.navigate(['/layout-lab', 't4'], { queryParams: { id: 'nieuw' } });
  }

  protected async toggleFilters() {
    if (this.narrow()) {
      const trigger = document.querySelector<HTMLElement>('[aria-controls="t5-filters"]');
      const result = await this.#dialogs.filters({ groups: FILTER_GROUPS, filters: this.state.filters(), inViewAvailable: false });
      if (result) this.state.filters.set(result);
      trigger?.focus();
      return;
    }
    this.state.filtersOpen.update((open) => !open);
  }

  protected clearAll() {
    this.state.search.set('');
    this.state.filters.set({ ...EMPTY_FILTERS });
  }

  protected retry() {
    this.state.demo.set('laden');
    setTimeout(() => this.state.demo.set('normaal'), 700);
  }

  protected asRecord(r: LabRecord) {
    return r;
  }
}
