import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { ButtonDirective, FormFieldComponent, IconComponent, InputDirective, PillComponent } from '@ndwnu/design-system';

/** Search, "Alle filters (n)", the active scope and a slot for the view controls. */
@Component({
  selector: 'app-scope-toolbar',
  imports: [ButtonDirective, FormFieldComponent, IconComponent, InputDirective, PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar" role="search" [attr.aria-label]="searchLabel()">
      <ndw-form-field class="search" [label]="searchLabel()" [hideLabel]="true">
        <!-- ndw-form-field adds the search icon and clear button itself for type="search" -->
        <input ndwInput type="search" [placeholder]="placeholder()" [value]="search()" (input)="search.set($any($event.target).value)" />
      </ndw-form-field>

      @if (showFilters()) {
        <button ndwButton secondary type="button" [attr.aria-expanded]="filtersOpen()" [attr.aria-controls]="filtersId()" (click)="filtersToggle.emit()">
          <ndw-icon>tune</ndw-icon> Alle filters ({{ filterCount() }})
        </button>
      }
      @if (scope()) {
        <ndw-pill color="gray" [attr.title]="'Globale scope: ' + scope()">Actief: {{ scope() }}</ndw-pill>
      }
      <div class="end"><ng-content></ng-content></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      background: var(--ndw-color-white);
      border-bottom: var(--ndw-border-size-sm) solid var(--ndw-color-grey-200);
    }
    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ndw-spacing-sm);
      padding: var(--ndw-spacing-sm) var(--ndw-spacing-md);
    }
    .search {
      flex: 1 1 14rem;
      max-width: 22rem;
    }
    .end {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ndw-spacing-sm);
      margin-left: auto;
    }
  `,
})
export class ScopeToolbarComponent {
  readonly search = model('');
  readonly searchLabel = input('Zoeken');
  readonly placeholder = input('Zoek op naam of ID');
  readonly showFilters = input(true);
  readonly filterCount = input(0);
  readonly filtersOpen = input(false);
  readonly filtersId = input('filters');
  readonly scope = input('');
  readonly filtersToggle = output<void>();
}
