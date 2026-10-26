import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Small inline-SVG line chart. The image has a text alternative and the same data is available as a
 * table ("Toon gegevens als tabel"); a comparison line (previous period) is drawn dashed.
 */
@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <svg viewBox="0 0 600 200" role="img" [attr.aria-label]="summary()" preserveAspectRatio="none">
        <title>{{ title() }}</title>
        @for (y of gridLines(); track y) {
          <line class="grid" x1="0" x2="600" [attr.y1]="y" [attr.y2]="y" />
        }
        @if (comparePath()) {
          <path class="compare" [attr.d]="comparePath()" />
        }
        <path class="line" [attr.d]="path()" />
        @for (p of points(); track $index) {
          <circle class="dot" [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" />
        }
      </svg>
      <figcaption class="ndw-paragraph-sm">
        <span class="legend"><span class="swatch swatch--line"></span> {{ title() }}</span>
        @if (comparison().length) {
          <span class="legend"><span class="swatch swatch--dashed"></span> Vorige periode</span>
        }
      </figcaption>
    </figure>
    <details>
      <summary class="ndw-paragraph-md">Toon gegevens als tabel</summary>
      <table class="ndw-paragraph-md">
        <caption class="sr-only">{{ title() }} per dag</caption>
        <thead>
          <tr>
            <th scope="col">Dag</th>
            <th scope="col">{{ title() }} ({{ unit() }})</th>
            @if (comparison().length) {
              <th scope="col">Vorige periode ({{ unit() }})</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (label of labels(); track $index) {
            <tr>
              <th scope="row">{{ label }}</th>
              <td>{{ format(values()[$index]) }}</td>
              @if (comparison().length) {
                <td>{{ format(comparison()[$index]) }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </details>
  `,
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  readonly title = input.required<string>();
  readonly values = input.required<readonly number[]>();
  readonly comparison = input<readonly number[]>([]);
  readonly labels = input<readonly string[]>([]);
  readonly unit = input('');
  readonly decimals = input(1);

  private readonly max = computed(() => Math.max(1, ...this.values(), ...this.comparison()) * 1.1);
  protected readonly gridLines = computed(() => [20, 70, 120, 170]);
  protected readonly points = computed(() => this.toPoints(this.values()));
  protected readonly path = computed(() => this.toPath(this.points()));
  protected readonly comparePath = computed(() => (this.comparison().length ? this.toPath(this.toPoints(this.comparison())) : ''));
  protected readonly summary = computed(() => {
    const v = this.values();
    const first = v[0];
    const last = v[v.length - 1];
    return `${this.title()}: van ${this.format(first)} naar ${this.format(last)} ${this.unit()} over ${v.length} dagen, laagste ${this.format(Math.min(...v))}, hoogste ${this.format(Math.max(...v))}.`;
  });

  protected format(value: number | undefined) {
    return value === undefined ? '' : value.toLocaleString('nl-NL', { minimumFractionDigits: this.decimals(), maximumFractionDigits: this.decimals() });
  }

  private toPoints(values: readonly number[]) {
    const step = values.length > 1 ? 560 / (values.length - 1) : 0;
    return values.map((v, i) => ({ x: 20 + i * step, y: 185 - (v / this.max()) * 165 }));
  }

  private toPath(points: { x: number; y: number }[]) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }
}
