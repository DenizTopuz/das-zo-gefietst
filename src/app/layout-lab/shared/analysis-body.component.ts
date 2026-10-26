import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TemplateState } from '../lab-store';
import { createAnalysis } from './analysis-model';
import { KpiCardComponent } from './kpi-card.component';
import { LineChartComponent } from './line-chart.component';
import { StatusMessageComponent } from './status-message.component';

/** Indicator cards and trend of an analysis page (T3, T6); extra sections are projected below the trend. */
@Component({
  selector: 'app-analysis-body',
  imports: [KpiCardComponent, LineChartComponent, StatusMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (kind(); as k) {
      <app-status-message [kind]="k" [text]="k === 'empty' ? 'Kies een ander gebied of een andere periode.' : ''" (retry)="retry.emit()" (clear)="clear.emit()" />
    } @else {
      <ul class="kpis" aria-label="Indicatoren. Kies er één voor de grafiek en de resultaten">
        @for (v of analysis().values(); track v.indicator.key) {
          <li>
            <app-kpi-card
              [label]="v.indicator.label"
              [value]="v.indicator.format(v.value)"
              [definition]="v.indicator.definition"
              [updated]="v.indicator.updated"
              [source]="v.indicator.source"
              [delta]="analysis().delta(v.indicator)"
              [selected]="v.indicator.key === analysis().active().key"
              (chosen)="state().indicator.set(v.indicator.key)"
            />
          </li>
        }
      </ul>
      <section aria-labelledby="trend-heading" class="section">
        <h2 id="trend-heading" class="ndw-heading-sm">Verloop: {{ analysis().active().label }}</h2>
        <p class="scope ndw-paragraph-sm">Scope: {{ analysis().scopeText() }}</p>
        <app-line-chart
          [title]="analysis().active().label"
          [values]="analysis().trend()"
          [comparison]="state().compare() ? analysis().previous() : []"
          [labels]="analysis().labels"
          [unit]="analysis().active().unit"
          [decimals]="analysis().active().decimals"
        />
      </section>
      <ng-content />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ndw-spacing-md);
      min-width: 0;
    }
    .kpis {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: var(--ndw-spacing-sm);
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: var(--ndw-spacing-xs);
    }
    h2,
    .scope {
      margin: 0;
    }
    .scope {
      color: var(--ndw-color-grey-600);
    }
  `,
})
export class AnalysisBodyComponent {
  readonly analysis = input.required<ReturnType<typeof createAnalysis>>();
  readonly state = input.required<TemplateState>();
  readonly kind = input<'loading' | 'error' | 'empty' | 'no-data' | null>(null);
  readonly retry = output<void>();
  readonly clear = output<void>();
}
