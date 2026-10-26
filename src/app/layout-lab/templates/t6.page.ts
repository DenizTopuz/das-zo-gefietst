import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, Injector, signal, Signal, untracked, viewChild } from '@angular/core';
import { ButtonDirective, IconComponent, ToastService } from '@ndwnu/design-system';
import { AREA_OPTIONS, number } from '../data/analysis';
import { LabRecord, Melding, MELDINGEN, updatedLabel } from '../data/lab-data';
import { bindUrlState, LabStore } from '../lab-store';
import { AnalysisBodyComponent } from '../shared/analysis-body.component';
import { createAnalysis, MELDING_INDICATORS } from '../shared/analysis-model';
import { AnalysisScopeComponent } from '../shared/analysis-scope.component';
import { DetailData, ObjectDetailComponent } from '../shared/object-detail.component';
import { createResults } from '../shared/results-model';
import { ResultsTableComponent, TableColumn } from '../shared/results-table.component';
import { ScreenHeaderComponent } from '../shared/screen-header.component';

const COLUMNS: TableColumn<Melding>[] = [
  { key: 'title', label: 'ID / onderwerp', sortable: true, kind: 'primary', text: (r) => `${r.id} · ${r.title}` },
  { key: 'status', label: 'Status', sortable: true, kind: 'status', text: (r) => r.status },
  { key: 'area', label: 'Gebied', sortable: true, text: (r) => r.area, hideBelow: 520 },
  { key: 'updatedAt', label: 'Bijgewerkt', sortable: true, text: (r) => updatedLabel(r.updatedAt), hideBelow: 640 },
];

/** T6 · Dashboard zonder kaart: globale scope, indicatoren, trend, vergelijking per gebied en onderliggende resultaten als verdieping. */
@Component({
  selector: 'app-t6',
  imports: [AnalysisBodyComponent, AnalysisScopeComponent, ButtonDirective, IconComponent, ObjectDetailComponent, ResultsTableComponent, ScreenHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-header title="Meldingen: stuurinformatie" />
    <app-analysis-scope [(period)]="state.period" [(area)]="state.area" [(source)]="state.source" [(compare)]="state.compare" hint="Periode, gebied en bron gelden voor alle indicatoren en voor de onderliggende resultaten." />

    <div class="workspace">
      <div class="analysis analysis--full" role="region" aria-label="Dashboard">
        <app-analysis-body [analysis]="analysis" [state]="state" [kind]="statusKind()" (retry)="retry()" (clear)="resetScope()">
          <section aria-labelledby="compare-heading" class="deepen">
            <h2 id="compare-heading" class="ndw-heading-sm">Vergelijking per gebied: {{ analysis.active().label }}</h2>
            <table class="bars ndw-paragraph-md">
              <caption class="sr-only">{{ analysis.active().label }} per gebied, periode {{ analysis.period().label }}</caption>
              <thead>
                <tr><th scope="col">Gebied</th><th scope="col">Waarde</th><th scope="col"><span class="sr-only">Verhouding</span></th></tr>
              </thead>
              <tbody>
                @for (row of byArea(); track row.area) {
                  <tr>
                    <th scope="row"><button type="button" class="area-button" [attr.aria-pressed]="state.area() === row.area" (click)="state.area.set(state.area() === row.area ? 'alle' : row.area)">{{ row.area }}</button></th>
                    <td>{{ row.label }}</td>
                    <td aria-hidden="true"><span class="track"><span class="fill" [style.width.%]="row.share"></span></span></td>
                  </tr>
                }
              </tbody>
            </table>
          </section>

          <section class="deepen" aria-labelledby="deepen-heading">
            <h2 id="deepen-heading" class="ndw-heading-sm">Onderliggende resultaten</h2>
            <button ndwButton secondary type="button" [attr.aria-expanded]="state.deepen()" aria-controls="deepen-body" (click)="state.deepen.set(!state.deepen())">
              <ndw-icon>{{ state.deepen() ? 'expand_less' : 'expand_more' }}</ndw-icon> {{ state.deepen() ? 'Verberg resultaten' : 'Bekijk resultaten (' + results.filtered().length + ')' }}
            </button>
            @if (state.deepen()) {
              <div id="deepen-body" class="deepen">
                <p class="note ndw-paragraph-sm">Meldingen achter "{{ analysis.active().label }}" · {{ analysis.scopeText() }}</p>
                <app-results-table [rows]="results.filtered()" [columns]="columns" [selectedId]="state.selectedId()" [sort]="state.sort()" (sortChange)="state.sort.set($event)" caption="Meldingen in de huidige scope" (rowSelected)="select($event)" />
              </div>
            }
          </section>
          @if (detail(); as d) {
            <section aria-label="Details van geselecteerde melding">
              <app-object-detail [data]="d" mode="dock" (closed)="closeDetail()" />
            </section>
          }
        </app-analysis-body>
      </div>
    </div>
  `,
  styleUrl: './analysis.scss',
})
export class T6Page {
  readonly #store = inject(LabStore);
  readonly #toast = inject(ToastService);
  readonly #injector = inject(Injector);
  protected readonly state = this.#store.state('t6');
  protected readonly columns = COLUMNS;
  private readonly all = signal<readonly LabRecord[]>(MELDINGEN);
  protected readonly analysis = createAnalysis(this.state, this.all, MELDING_INDICATORS);
  protected readonly results = createResults<Melding>(this.analysis.scoped as unknown as Signal<readonly Melding[]>, this.state);
  private readonly table = viewChild(ResultsTableComponent);

  protected readonly statusKind = computed<'loading' | 'error' | 'empty' | 'no-data' | null>(() => {
    switch (this.state.demo()) {
      case 'laden':
        return 'loading';
      case 'fout':
        return 'error';
      case 'geen-data':
        return 'no-data';
    }
    return this.analysis.scoped().length === 0 ? 'empty' : null;
  });

  /** The active indicator for every area (the area filter itself is not applied, so areas can be compared). */
  protected readonly byArea = computed(() => {
    const ind = this.analysis.active();
    const f = this.analysis.factor();
    const rows = AREA_OPTIONS.filter((o) => o.value !== 'alle').map((o) => ({ area: o.value, value: ind.value(this.all().filter((r) => r.area === o.value), f) }));
    const max = Math.max(1, ...rows.map((r) => r.value));
    return rows.map((r) => ({ area: r.area, label: ind.format(r.value), share: (r.value / max) * 100 }));
  });

  protected readonly detail = computed<DetailData | null>(() => {
    const r = this.results.selected() as Melding | null;
    if (!r || !this.state.detailOpen()) return null;
    return {
      id: r.id,
      title: r.title,
      status: r.status,
      fields: [
        { key: 'Type', value: r.type },
        { key: 'Locatie', value: r.location },
        { key: 'Gebied', value: r.area },
        { key: 'Prioriteit', value: r.priority },
        { key: 'Verantwoordelijke', value: r.owner },
        { key: 'Bijgewerkt', value: updatedLabel(r.updatedAt) },
        { key: 'Omschrijving', value: r.description },
      ],
    };
  });

  constructor() {
    bindUrlState('t6', ['id', 'verdieping', 'periode', 'gebied', 'bron', 'indicator']);

    effect(() => {
      const id = this.state.selectedId();
      const visible = this.results.filtered().some((r) => r.id === id);
      untracked(() => {
        if (id && !visible && !this.statusKind()) {
          this.state.setSelection(null, false);
          this.#toast.open(`${id} valt buiten de huidige scope. Het detail is gesloten.`);
        }
      });
    });
  }

  protected select(id: string) {
    this.state.setSelection(id, true);
  }

  protected closeDetail() {
    const id = this.state.selectedId();
    this.state.detailOpen.set(false);
    afterNextRender(() => this.table()?.focusRow(id), { injector: this.#injector });
  }

  protected resetScope() {
    this.state.period.set('september-2026');
    this.state.area.set('alle');
    this.state.source.set('registratie');
  }

  protected retry() {
    this.state.demo.set('laden');
    setTimeout(() => this.state.demo.set('normaal'), 700);
  }

  protected readonly number = number;
}
