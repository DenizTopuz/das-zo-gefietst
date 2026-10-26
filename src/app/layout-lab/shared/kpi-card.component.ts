import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@ndwnu/design-system';

/** An indicator the user can select: it drives one clearly labelled "verdieping" and shows its definition and actuality. */
@Component({
  selector: 'app-kpi-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [attr.aria-pressed]="selected()" [class.selected]="selected()" (click)="chosen.emit()">
      <span class="label ndw-paragraph-bold-md">{{ label() }}</span>
      <span class="value ndw-heading-md">{{ value() }}</span>
      @if (delta()) {
        <span class="delta ndw-paragraph-bold-sm"><ndw-icon size="sm">{{ delta().startsWith('-') ? 'trending_down' : 'trending_up' }}</ndw-icon> {{ delta() }}</span>
      }
      <span class="definition ndw-paragraph-sm">{{ definition() }}</span>
      <span class="updated ndw-paragraph-sm">Bijgewerkt {{ updated() }} · {{ source() }}</span>
    </button>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    button {
      all: unset;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--ndw-spacing-2xs);
      padding: var(--ndw-spacing-md);
      background: var(--ndw-color-grey-100);
      border: var(--ndw-border-size-md) solid transparent;
      border-radius: var(--ndw-border-radius-md);
      cursor: pointer;
    }
    button:hover {
      background: var(--ndw-color-grey-200);
    }
    button.selected {
      background: var(--ndw-color-info-100);
      border-color: var(--ndw-color-secondary-500);
    }
    button:focus-visible {
      outline: var(--ndw-border-size-md) solid var(--ndw-color-warning-500);
      outline-offset: var(--ndw-border-size-md);
    }
    .value {
      color: var(--ndw-color-grey-700);
    }
    .delta {
      display: inline-flex;
      align-items: center;
      gap: var(--ndw-spacing-2xs);
    }
    .definition,
    .updated {
      color: var(--ndw-color-grey-600);
    }
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly definition = input('');
  readonly updated = input('10:42');
  readonly source = input('');
  readonly delta = input('');
  readonly selected = input(false);
  readonly chosen = output<void>();
}
