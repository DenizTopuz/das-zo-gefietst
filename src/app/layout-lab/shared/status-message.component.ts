import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AlertComponent, ButtonDirective, IconComponent, LoaderComponent } from '@ndwnu/design-system';

/**
 * The four non-normal states of a results area, each with its own look and next step:
 * loading, recoverable error, no results because of filters, and no source data at all.
 */
@Component({
  selector: 'app-status-message',
  imports: [AlertComponent, ButtonDirective, IconComponent, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (kind()) {
      @case ('loading') {
        <div class="state" role="status" aria-live="polite">
          <ndw-loader></ndw-loader>
          <p class="ndw-paragraph-md">{{ text() || 'Gegevens laden…' }}</p>
        </div>
      }
      @case ('error') {
        <div class="state state--error">
          <ndw-alert type="critical" ariaLive="assertive">
            <strong>{{ title() || 'Laden mislukt.' }}</strong> {{ text() || 'De bron is tijdelijk niet bereikbaar. Je filters en selectie zijn bewaard.' }}
          </ndw-alert>
          <button ndwButton secondary type="button" (click)="retry.emit()"><ndw-icon>refresh</ndw-icon> Opnieuw proberen</button>
        </div>
      }
      @case ('empty') {
        <div class="state" role="status">
          <ndw-icon>search_off</ndw-icon>
          <h3 class="ndw-heading-sm">{{ title() || 'Geen resultaten voor deze filters' }}</h3>
          <p class="ndw-paragraph-md">{{ text() }}</p>
          <button ndwButton secondary type="button" (click)="clear.emit()">Wis filters en zoekopdracht</button>
        </div>
      }
      @case ('no-data') {
        <div class="state" role="status">
          <ndw-icon>inbox</ndw-icon>
          <h3 class="ndw-heading-sm">{{ title() || 'Nog geen gegevens beschikbaar' }}</h3>
          <p class="ndw-paragraph-md">{{ text() || 'Deze bron bevat nog geen records. Filters veranderen dit niet.' }}</p>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ndw-spacing-sm);
      padding: var(--ndw-spacing-xl) var(--ndw-spacing-md);
      text-align: center;
      color: var(--ndw-color-grey-600);
    }
    .state--error {
      align-items: stretch;
      text-align: left;
    }
    .state--error button {
      align-self: flex-start;
    }
    h3,
    p {
      margin: 0;
    }
    h3 {
      color: var(--ndw-color-grey-700);
    }
  `,
})
export class StatusMessageComponent {
  readonly kind = input.required<'loading' | 'error' | 'empty' | 'no-data'>();
  readonly title = input('');
  readonly text = input('');
  readonly retry = output<void>();
  readonly clear = output<void>();
}
