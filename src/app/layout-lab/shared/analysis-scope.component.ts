import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { InputDirective } from '@ndwnu/design-system';
import { AREA_OPTIONS, PERIODS, SOURCES } from '../data/analysis';

/** Global scope of an analysis page: period, area and source apply to every indicator, chart, map and table. */
@Component({
  selector: 'app-analysis-scope',
  imports: [InputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="bar" role="group" aria-label="Globale scope: geldt voor alle indicatoren, de grafiek en de resultaten" (submit)="$event.preventDefault()">
      <label class="field"><span class="ndw-paragraph-bold-sm">Periode</span>
        <select ndwInput [value]="period()" (change)="period.set($any($event.target).value)">
          @for (o of periods; track o.value) { <option [value]="o.value" [selected]="o.value === period()">{{ o.label }}</option> }
        </select>
      </label>
      <label class="field"><span class="ndw-paragraph-bold-sm">Gebied</span>
        <select ndwInput [value]="area()" (change)="area.set($any($event.target).value)">
          @for (o of areas; track o.value) { <option [value]="o.value" [selected]="o.value === area()">{{ o.label }}</option> }
        </select>
      </label>
      <label class="field"><span class="ndw-paragraph-bold-sm">Bron</span>
        <select ndwInput [value]="source()" (change)="source.set($any($event.target).value)">
          @for (o of sources; track o.value) { <option [value]="o.value" [selected]="o.value === source()">{{ o.label }}</option> }
        </select>
      </label>
      <label class="check ndw-paragraph-md">
        <input type="checkbox" [checked]="compare()" (change)="compare.set($any($event.target).checked)" /> Vergelijk met vorige periode
      </label>
      <p class="hint ndw-paragraph-sm">{{ hint() }}</p>
    </form>
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
      align-items: flex-end;
      gap: var(--ndw-spacing-sm) var(--ndw-spacing-md);
      padding: var(--ndw-spacing-sm) var(--ndw-spacing-md);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: var(--ndw-spacing-3xs);
      min-width: 0;
    }
    .check {
      display: inline-flex;
      align-items: center;
      gap: var(--ndw-spacing-xs);
      min-height: 2.5rem;
    }
    .hint {
      margin: 0 0 0 auto;
      color: var(--ndw-color-grey-600);
    }
  `,
})
export class AnalysisScopeComponent {
  readonly period = model.required<string>();
  readonly area = model.required<string>();
  readonly source = model.required<string>();
  readonly compare = model(false);
  readonly hint = input('');
  protected readonly periods = PERIODS;
  protected readonly areas = AREA_OPTIONS;
  protected readonly sources = SOURCES;
}
