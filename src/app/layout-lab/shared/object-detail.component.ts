import { ChangeDetectionStrategy, Component, computed, ElementRef, input, output, viewChild } from '@angular/core';
import { ButtonDirective, IconComponent, KeyValueListComponent, PillComponent } from '@ndwnu/design-system';
import { statusColor } from './status';

export interface DetailData {
  id: string;
  title: string;
  status: string;
  fields: { key: string; value: string }[];
}

/**
 * One detail pattern for every template: the same content whether it is docked next to the results or
 * shown as its own view on a narrow screen. A map popup only previews; the full detail lives here.
 */
@Component({
  selector: 'app-object-detail',
  imports: [ButtonDirective, IconComponent, KeyValueListComponent, PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="detail" [attr.aria-labelledby]="headingId">
      @if (mode() === 'view') {
        <button ndwButton tertiary class="back" type="button" (click)="closed.emit()">
          <ndw-icon>arrow_back</ndw-icon> Terug naar {{ backLabel() }}
        </button>
      }
      <header>
        <h2 [id]="headingId" class="ndw-heading-sm" tabindex="-1" #heading>{{ data().id }} · {{ data().title }}</h2>
        @if (mode() === 'dock') {
          <button ndwButton tertiary extra-small type="button" aria-label="Sluit details" (click)="closed.emit()">
            <ndw-icon>close</ndw-icon>
          </button>
        }
      </header>
      <ndw-pill [color]="color()">{{ data().status }}</ndw-pill>
      <ndw-key-value-list [data]="fields()" [hasZebraStripes]="false" fontSize="md"></ndw-key-value-list>
      <div class="actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </section>
  `,
  styleUrl: './object-detail.component.scss',
})
export class ObjectDetailComponent {
  readonly data = input.required<DetailData>();
  readonly mode = input<'dock' | 'view'>('dock');
  readonly backLabel = input('resultaten');
  readonly closed = output<void>();

  protected readonly headingId = `detail-heading-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly color = computed(() => statusColor(this.data().status));
  protected readonly fields = computed(() => this.data().fields.map((f) => ({ key: f.key, value: f.value || 'Niet ingevuld' })));
  private readonly headingRef = viewChild<ElementRef<HTMLElement>>('heading');

  /** Move focus to the heading (used when the detail replaces the results view). */
  focusHeading() {
    this.headingRef()?.nativeElement.focus();
  }
}
