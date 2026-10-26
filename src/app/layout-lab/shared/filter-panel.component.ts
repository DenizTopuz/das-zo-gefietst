import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective, CheckboxComponent, CheckboxGroupComponent, FormFieldComponent, IconComponent } from '@ndwnu/design-system';
import { EMPTY_FILTERS, Filters } from '../lab-store';

export interface FilterGroup {
  key: 'status' | 'type';
  label: string;
  options: readonly string[];
}

/**
 * "Alle filters": the same content docked next to the results, as an overlay when space is tight, and
 * inside a dialog (with Toepassen/Annuleren) on a narrow screen. Docked and overlay apply immediately.
 */
@Component({
  selector: 'app-filter-panel',
  imports: [ButtonDirective, CheckboxComponent, CheckboxGroupComponent, FormFieldComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel" [attr.aria-labelledby]="headingId">
      @if (mode() !== 'dialog') {
        <header>
          <h2 [id]="headingId" class="ndw-heading-sm">{{ title() }}</h2>
          <button ndwButton tertiary extra-small type="button" aria-label="Sluit filters" (click)="closed.emit()"><ndw-icon>close</ndw-icon></button>
        </header>
      }
      <p class="scope ndw-paragraph-md">{{ scopeText() }}</p>

      @for (group of groups(); track group.key) {
        <ndw-form-field [label]="group.label">
          <ndw-checkbox-group>
            @for (option of group.options; track option) {
              <ndw-checkbox [checked]="filters()[group.key].includes(option)" (checkedChange)="toggle(group.key, option, $event)">{{ option }}</ndw-checkbox>
            }
          </ndw-checkbox-group>
        </ndw-form-field>
      }

      @if (inViewAvailable()) {
        <ndw-form-field label="Kaartbeeld">
          <ndw-checkbox [switch]="true" [checked]="filters().inView" (checkedChange)="setInView($event)">Alleen binnen kaartbeeld</ndw-checkbox>
        </ndw-form-field>
        <p class="hint ndw-paragraph-sm">
          {{ filters().inView ? 'Aan: de resultaten volgen het zichtbare kaartgebied.' : 'Uit: zoomen en slepen verandert de resultaten niet.' }}
        </p>
      }

      <button ndwButton tertiary type="button" (click)="filtersChange.emit(empty)"><ndw-icon>filter_alt_off</ndw-icon> Wis filters</button>
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      overflow: auto;
    }
    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--ndw-spacing-md);
      padding: var(--ndw-spacing-md);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ndw-spacing-xs);
    }
    h2,
    p {
      margin: 0;
    }
    .scope {
      color: var(--ndw-color-grey-600);
    }
    .hint {
      margin-top: calc(var(--ndw-spacing-xs) * -1);
      color: var(--ndw-color-grey-600);
    }
    .panel > button {
      align-self: flex-start;
    }
  `,
})
export class FilterPanelComponent {
  readonly groups = input.required<readonly FilterGroup[]>();
  readonly filters = input.required<Filters>();
  readonly mode = input<'dock' | 'overlay' | 'dialog'>('dock');
  readonly title = input('Alle filters');
  readonly scopeText = input('Deze filters gelden voor de kaart, de resultaten en de aantallen.');
  readonly inViewAvailable = input(true);
  readonly filtersChange = output<Filters>();
  readonly closed = output<void>();

  protected readonly empty = EMPTY_FILTERS;
  protected readonly headingId = `filters-heading-${Math.random().toString(36).slice(2, 8)}`;

  protected toggle(key: 'status' | 'type', option: string, checked: boolean) {
    const current = this.filters()[key];
    const next = checked ? [...current.filter((o) => o !== option), option] : current.filter((o) => o !== option);
    this.filtersChange.emit({ ...this.filters(), [key]: next });
  }

  protected setInView(checked: boolean) {
    this.filtersChange.emit({ ...this.filters(), inView: checked });
  }
}
