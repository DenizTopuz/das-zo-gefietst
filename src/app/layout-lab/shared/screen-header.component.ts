import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PillComponent } from '@ndwnu/design-system';

/** Compact page header: title, a "Voorbeeldgegevens" marker and optional status or one page action. */
@Component({
  selector: 'app-screen-header',
  imports: [PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1 class="ndw-heading-md">{{ title() }}</h1>
      <div class="meta">
        <ndw-pill color="gray">Voorbeeldgegevens</ndw-pill>
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
      background: var(--ndw-color-white);
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ndw-spacing-xs) var(--ndw-spacing-md);
      padding: var(--ndw-spacing-sm) var(--ndw-spacing-md);
      border-bottom: var(--ndw-border-size-sm) solid var(--ndw-color-grey-200);
    }
    h1 {
      margin: 0;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ndw-spacing-xs);
    }
  `,
})
export class ScreenHeaderComponent {
  readonly title = input.required<string>();
}
