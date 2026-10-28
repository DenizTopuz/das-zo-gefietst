import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Page title for assistive technology plus an optional status row. The visible title is the breadcrumb in the
 * app's top bar, and the "Voorbeeldgegevens" marker lives there as well; only projected content (a status or
 * one page action) shows as a thin row.
 */
@Component({
  selector: 'app-screen-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sr-only">{{ title() }}</h1>
    <div class="extra"><ng-content></ng-content></div>
  `,
  styles: `
    :host {
      display: block;
    }
    .extra {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ndw-spacing-xs);
      padding: var(--ndw-spacing-2xs) var(--ndw-spacing-md);
      background: var(--ndw-color-white);
      border-bottom: var(--ndw-border-size-sm) solid var(--ndw-color-grey-200);
    }
    .extra:empty {
      display: none;
    }
  `,
})
export class ScreenHeaderComponent {
  readonly title = input.required<string>();
}
