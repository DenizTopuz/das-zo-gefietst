import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, Injector, signal, Signal, untracked, viewChild } from '@angular/core';
import { ButtonDirective, IconComponent, ToastService } from '@ndwnu/design-system';
import { MapViewChange, NdwMapComponent } from '../../map/ndw-map.component';
import { Laadpunt, LAADPUNTEN, pointFeatures, updatedLabel } from '../data/lab-data';
import { percent } from '../data/analysis';
import { bindUrlState, hostWidth, LabStore } from '../lab-store';
import { AnalysisBodyComponent } from '../shared/analysis-body.component';
import { createAnalysis, LAADPUNT_INDICATORS } from '../shared/analysis-model';
import { AnalysisScopeComponent } from '../shared/analysis-scope.component';
import { DetailData, ObjectDetailComponent } from '../shared/object-detail.component';
import { createResults } from '../shared/results-model';
import { ResultsTableComponent, TableColumn } from '../shared/results-table.component';
import { ScreenHeaderComponent } from '../shared/screen-header.component';

const NARROW = 760;

const COLUMNS: TableColumn<Laadpunt>[] = [
  { key: 'title', label: 'ID / naam', sortable: true, kind: 'primary', text: (r) => `${r.id} · ${r.title}` },
  { key: 'status', label: 'Status', sortable: true, kind: 'status', text: (r) => r.status },
  { key: 'area', label: 'Gebied', sortable: true, text: (r) => r.area, hideBelow: 520 },
  { key: 'updatedAt', label: 'Bijgewerkt', sortable: true, text: (r) => updatedLabel(r.updatedAt), hideBelow: 640 },
];

/** T3 · Analyse + kaart: indicatoren, periode en gebied vormen één context; de kaart is gekoppeld, resultaten zijn verdieping. */
@Component({
  selector: 'app-t3',
  imports: [AnalysisBodyComponent, AnalysisScopeComponent, ButtonDirective, IconComponent, NdwMapComponent, ObjectDetailComponent, ResultsTableComponent, ScreenHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-header title="Laadinfrastructuur analyseren" />
    <app-analysis-scope [(period)]="state.period" [(area)]="state.area" [(source)]="state.source" [(compare)]="state.compare" hint="Periode, gebied en bron gelden voor alles op deze pagina, ook voor de kaart." />

    <div class="workspace" [class.workspace--stack]="narrow()">
      <div class="analysis" role="region" aria-label="Analyse">
        <app-analysis-body [analysis]="analysis" [state]="state" [kind]="statusKind()" (retry)="retry()" (clear)="resetScope()">
          <section class="deepen" aria-labelledby="deepen-heading">
            <h2 id="deepen-heading" class="ndw-heading-sm">Resultaten</h2>
            <button ndwButton secondary type="button" [attr.aria-expanded]="state.deepen()" aria-controls="deepen-body" (click)="state.deepen.set(!state.deepen())">
              <ndw-icon>{{ state.deepen() ? 'expand_less' : 'expand_more' }}</ndw-icon> {{ state.deepen() ? 'Verberg resultaten' : 'Toon resultaten (' + results.filtered().length + ')' }}
            </button>
            @if (state.deepen()) {
              <div id="deepen-body" class="deepen">
                <p class="note ndw-paragraph-sm">Laadpunten bij "{{ analysis.active().label }}" · {{ analysis.scopeText() }}. De punten op de kaart zijn dezelfde laadpunten; de grootte volgt de gekozen indicator.</p>
                <app-results-table [rows]="results.filtered()" [columns]="columns" [selectedId]="state.selectedId()" [sort]="state.sort()" (sortChange)="state.sort.set($event)" caption="Laadpunten in de huidige scope" (rowSelected)="select($event)" />
              </div>
            }
          </section>
          @if (detail(); as d) {
            <section aria-label="Details van geselecteerd laadpunt">
              <app-object-detail [data]="d" mode="dock" (closed)="closeDetail()" />
            </section>
          }
        </app-analysis-body>
      </div>

      <div class="map-pane">
        <app-ndw-map
          [features]="features()"
          [kinds]="['laadpunt']"
          [defaultVisibleKinds]="['laadpunt']"
          [selectedId]="state.selectedId()"
          [initialView]="state.mapView()"
          ariaLabel="Kaart met laadpunten; de grootte van een punt volgt de gekozen indicator"
          (featureSelected)="select($event)"
          (viewChanged)="onView($event)"
        />
      </div>
    </div>
  `,
  styleUrl: './analysis.scss',
})
export class T3Page {
  readonly #store = inject(LabStore);
  readonly #toast = inject(ToastService);
  readonly #injector = inject(Injector);
  protected readonly state = this.#store.state('t3');
  protected readonly width = hostWidth();
  protected readonly narrow = computed(() => this.width() < NARROW);
  protected readonly columns = COLUMNS;

  private readonly all = signal<readonly Laadpunt[]>(LAADPUNTEN);
  protected readonly analysis = createAnalysis(this.state, this.all, LAADPUNT_INDICATORS);
  protected readonly results = createResults<Laadpunt>(this.analysis.scoped as unknown as Signal<readonly Laadpunt[]>, this.state);
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

  protected readonly features = computed(() =>
    this.statusKind() ? pointFeatures([], 'laadpunt') : pointFeatures(this.results.filtered(), 'laadpunt', (r) => ({ intensity: this.analysis.intensity(r) })),
  );

  protected readonly detail = computed<DetailData | null>(() => {
    const r = this.results.selected() as Laadpunt | null;
    if (!r || !this.state.detailOpen()) return null;
    return {
      id: r.id,
      title: r.title,
      status: r.status,
      fields: [
        { key: 'Locatie', value: r.location },
        { key: 'Gebied', value: r.area },
        { key: 'Beheerder', value: r.owner },
        { key: 'Bezettingsgraad', value: percent(r.occupancy * 100) },
        { key: 'Sessies', value: String(r.sessions) },
        { key: 'Vermogen', value: `${r.powerKw} kW` },
        { key: 'Bijgewerkt', value: updatedLabel(r.updatedAt) },
      ],
    };
  });

  constructor() {
    bindUrlState('t3', ['id', 'verdieping', 'periode', 'gebied', 'bron', 'indicator']);

    // A record that leaves the scope cannot stay selected.
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

  protected onView(change: MapViewChange) {
    this.state.mapView.set({ center: change.center, zoom: change.zoom });
    this.state.mapBounds.set(change.bounds);
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
}
