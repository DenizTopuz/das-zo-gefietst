import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content select="[breadcrumbs]"></ng-content>
    <div class="row">
      <div>
        <h1 class="ndw-heading-lg">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="ndw-paragraph-lg">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content></ng-content></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--ndw-spacing-lg);
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--ndw-spacing-md);
      flex-wrap: wrap;
    }
    h1,
    p {
      margin: 0;
    }
    .actions {
      display: flex;
      gap: var(--ndw-spacing-xs);
      align-items: center;
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
