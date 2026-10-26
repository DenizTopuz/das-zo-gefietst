import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, Injector, signal, untracked, viewChild } from '@angular/core';
import { AlertComponent, ButtonDirective, PillComponent, SwitcherComponent, SwitcherOption, ToastService } from '@ndwnu/design-system';
import { NdwMapComponent, MapViewChange } from '../../map/ndw-map.component';
import { LabRecord, Melding, MELDINGEN, MELDING_STATUSSEN, MELDING_TYPEN, pointFeatures, updatedLabel } from '../data/lab-data';
import { bindUrlState, EMPTY_FILTERS, hostWidth, LabStore, Sort } from '../lab-store';
import { LabDialogs } from '../shared/dialogs';
import { FilterGroup, FilterPanelComponent } from '../shared/filter-panel.component';
import { DetailData, ObjectDetailComponent } from '../shared/object-detail.component';
import { createResults } from '../shared/results-model';
import { ResultsTableComponent, TableColumn } from '../shared/results-table.component';
import { ScopeToolbarComponent } from '../shared/scope-toolbar.component';
import { ScreenHeaderComponent } from '../shared/screen-header.component';
import { SplitWorkspaceComponent } from '../shared/split-workspace.component';
import { statusColor } from '../shared/status';
import { StatusMessageComponent } from '../shared/status-message.component';

/** Narrower than this: one main plane at a time and a full-screen detail. */
const NARROW = 760;
const MIN_MAIN = 560;
/** Map and results side by side need more room, otherwise the map becomes unusably narrow. */
const MIN_MAIN_SIDE_BY_SIDE = 800;
const DOCK_FILTERS = 320;
const GAP = 16;

const COLUMNS: TableColumn<Melding>[] = [
  { key: 'title', label: 'ID / onderwerp', sortable: true, kind: 'primary', text: (r) => `${r.id} · ${r.title}` },
  { key: 'status', label: 'Status', sortable: true, kind: 'status', text: (r) => r.status },
  { key: 'location', label: 'Locatie', sortable: true, text: (r) => r.location, hideBelow: 700 },
  { key: 'owner', label: 'Verantwoordelijke', sortable: true, text: (r) => r.owner, hideBelow: 1000 },
  { key: 'updatedAt', label: 'Bijgewerkt', sortable: true, text: (r) => updatedLabel(r.updatedAt), hideBelow: 560 },
];

const FILTER_GROUPS: FilterGroup[] = [
  { key: 'status', label: 'Status', options: MELDING_STATUSSEN },
  { key: 'type', label: 'Type melding', options: MELDING_TYPEN },
];

const SPLIT_PRESETS: SwitcherOption[] = [
  { value: 'kaart', label: 'Kaart groot' },
  { value: 'gelijk', label: 'Gelijk' },
  { value: 'lijst', label: 'Lijst groot' },
];

@Component({
  selector: 'app-t2',
  imports: [
    AlertComponent, ButtonDirective, FilterPanelComponent, NdwMapComponent, ObjectDetailComponent, PillComponent,
    ResultsTableComponent, ScopeToolbarComponent, ScreenHeaderComponent, SplitWorkspaceComponent, StatusMessageComponent, SwitcherComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './t2.page.html',
  styleUrl: './t2.page.scss',
})
export class T2Page {
  readonly #store = inject(LabStore);
  readonly #dialogs = inject(LabDialogs);
  readonly #toast = inject(ToastService);
  readonly #injector = inject(Injector);
  protected readonly state = this.#store.state('t2');
  protected readonly width = hostWidth();

  protected readonly records = signal<Melding[]>([...MELDINGEN]);
  protected readonly results = createResults(this.records, this.state);
  protected readonly columns = COLUMNS;
  protected readonly filterGroups = FILTER_GROUPS;
  protected readonly color = statusColor;
  protected readonly updatedLabel = updatedLabel;
  protected readonly liveNew = signal(false);

  private readonly table = viewChild(ResultsTableComponent);

  protected readonly narrow = computed(() => this.width() < NARROW);
  /** A narrow screen shows one plane; "Beide" falls back to the results. */
  protected readonly effView = computed(() => (this.narrow() && this.state.view() === 'beide' ? 'lijst' : this.state.view()));
  protected readonly viewOptions = computed<SwitcherOption[]>(() => [
    { value: 'kaart', label: 'Kaart', icon: 'map' },
    { value: 'lijst', label: 'Lijst', icon: 'list' },
    ...(this.narrow() ? [] : [{ value: 'beide', label: 'Beide', icon: 'view_agenda' }]),
  ]);
  protected readonly arrangementOptions: SwitcherOption[] = [
    { value: 'onder', label: 'Onder elkaar' },
    { value: 'naast', label: 'Naast elkaar' },
  ];
  protected readonly splitPresets = SPLIT_PRESETS;
  protected readonly presetValue = computed(() => {
    const r = this.state.ratio();
    return r >= 0.6 ? 'kaart' : r <= 0.4 ? 'lijst' : 'gelijk';
  });
  protected readonly splitShow = computed(() => (this.effView() === 'kaart' ? 'first' : this.effView() === 'lijst' ? 'second' : 'both'));

  protected readonly detailWidth = computed(() => (this.state.detailWide() ? 560 : 400));
  protected readonly minMain = computed(() => (this.effView() === 'beide' && this.state.arrangement() === 'naast' ? MIN_MAIN_SIDE_BY_SIDE : MIN_MAIN));
  protected readonly hasDetail = computed(() => this.state.detailOpen() && !!this.results.selected());
  /** Docked next to the results when it fits, otherwise its own view with "Terug naar resultaten". */
  protected readonly detailMode = computed<'none' | 'dock' | 'view'>(() => {
    if (!this.hasDetail()) return 'none';
    return this.narrow() || this.width() < this.minMain() + this.detailWidth() + 2 * GAP ? 'view' : 'dock';
  });
  /** Filters: dialog on a narrow screen; docked if everything fits, otherwise an overlay. */
  protected readonly filtersMode = computed<'none' | 'dock' | 'overlay'>(() => {
    if (!this.state.filtersOpen() || this.narrow()) return 'none';
    const detail = this.detailMode() === 'dock' ? this.detailWidth() + GAP : 0;
    return this.width() >= this.minMain() + DOCK_FILTERS + detail + 2 * GAP ? 'dock' : 'overlay';
  });

  /**
   * Side by side, the map keeps at least 400px and the results 360px, whatever panels are open.
   * (The splitter clamps to these bounds, also for the stored ratio.)
   */
  protected readonly splitBounds = computed(() => {
    if (this.state.arrangement() !== 'naast') return { min: 20, max: 80 };
    const main =
      this.width() - 2 * GAP - (this.detailMode() === 'dock' ? this.detailWidth() + GAP : 0) - (this.filtersMode() === 'dock' ? DOCK_FILTERS + GAP : 0);
    const min = Math.min(70, Math.max(20, Math.ceil((400 / main) * 100)));
    const max = Math.max(min, Math.min(80, Math.floor(100 - (360 / main) * 100)));
    return { min, max };
  });

  protected readonly statusKind = computed<'loading' | 'error' | 'empty' | 'no-data' | null>(() => {
    switch (this.state.demo()) {
      case 'laden':
        return 'loading';
      case 'fout':
        return 'error';
      case 'geen-data':
        return 'no-data';
    }
    return this.results.filtered().length === 0 ? 'empty' : null;
  });
  protected readonly features = computed(() => pointFeatures(this.statusKind() ? [] : this.results.filtered(), 'melding'));
  protected readonly countText = computed(() => {
    const shown = this.results.filtered().length;
    const total = this.results.total();
    if (this.statusKind() === 'loading') return 'Resultaten worden geladen';
    return shown === total ? `${total} resultaten` : `${shown} van ${total} resultaten`;
  });
  protected readonly emptyText = computed(() => {
    const f = this.state.filters();
    const parts = [...f.status.map((s) => `status ${s}`), ...f.type.map((t) => `type ${t}`), ...(f.inView ? ['alleen binnen kaartbeeld'] : []), ...(this.state.search().trim() ? [`zoekopdracht “${this.state.search().trim()}”`] : [])];
    return parts.length ? `Actief: ${parts.join(', ')}.` : 'Pas de filters aan.';
  });

  protected readonly detail = computed<DetailData | null>(() => {
    const r = this.results.selected();
    return r
      ? {
          id: r.id,
          title: r.title,
          status: r.status,
          fields: [
            { key: 'Locatie', value: r.location },
            { key: 'Gebied', value: r.area },
            { key: 'Verantwoordelijke', value: r.owner },
            { key: 'Prioriteit', value: r.priority },
            { key: 'Bijgewerkt', value: updatedLabel(r.updatedAt) },
            { key: 'Omschrijving', value: r.description },
          ],
        }
      : null;
  });

  constructor() {
    bindUrlState('t2', ['weergave', 'indeling', 'id', 'breedte']);

    // A record that drops out of the filtered results closes its detail, with a short message.
    effect(() => {
      const id = this.state.selectedId();
      const visible = this.results.filtered().some((r) => r.id === id);
      untracked(() => {
        if (id && !visible && this.statusKind() !== 'loading' && this.statusKind() !== 'error' && this.statusKind() !== 'no-data') {
          this.state.setSelection(null, false);
          this.#toast.open(`${id} valt buiten de huidige resultaten. Het detail is gesloten.`);
        }
      });
    });

    // The "live update" demo state shows an indicator instead of silently moving the list.
    effect(() => {
      const live = this.state.demo() === 'live';
      untracked(() => this.liveNew.set(live));
    });
  }

  protected select(id: string) {
    this.state.setSelection(id, true);
  }

  protected closeDetail() {
    const id = this.state.selectedId();
    this.state.detailOpen.set(false);
    // Return focus to where the user came from (the row or card), so keyboard users keep their place.
    // Wait for the results to be visible again before focusing.
    afterNextRender(
      () => {
        this.table()?.focusRow(id);
        document.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(id ?? '')}"]`)?.focus();
      },
      { injector: this.#injector },
    );
  }

  protected showOnMap() {
    if (this.state.view() === 'lijst' || (this.narrow() && this.state.view() !== 'kaart')) this.state.view.set(this.narrow() ? 'kaart' : 'beide');
    this.state.detailOpen.set(this.detailMode() === 'dock');
  }

  protected markDone() {
    const id = this.state.selectedId();
    if (!id) return;
    this.records.update((list) => list.map((r) => (r.id === id ? { ...r, status: 'Afgehandeld', updatedAt: new Date() } : r)));
    this.#toast.open(`${id} is gemarkeerd als afgehandeld.`);
  }

  protected setView(value: unknown) {
    this.state.view.set(value as 'kaart' | 'lijst' | 'beide');
  }

  protected setArrangement(value: unknown) {
    this.state.arrangement.set(value as 'onder' | 'naast');
  }

  protected applyPreset(value: unknown) {
    this.state.ratio.set(value === 'kaart' ? 0.65 : value === 'lijst' ? 0.35 : 0.5);
  }

  protected setSort(sort: Sort) {
    this.state.sort.set(sort);
  }

  protected async toggleFilters() {
    if (this.narrow()) {
      const trigger = document.querySelector<HTMLElement>('[aria-controls="t2-filters"]');
      const result = await this.#dialogs.filters({ groups: FILTER_GROUPS, filters: this.state.filters(), inViewAvailable: this.effView() !== 'lijst' });
      if (result) this.state.filters.set(result);
      trigger?.focus();
      return;
    }
    this.state.filtersOpen.update((open) => !open);
  }

  protected clearAll() {
    this.state.search.set('');
    this.state.filters.set({ ...EMPTY_FILTERS });
  }

  protected retry() {
    this.state.demo.set('laden');
    setTimeout(() => this.state.demo.set('normaal'), 700);
  }

  protected refreshLive() {
    this.records.update((list) => [
      { id: 'M-115', title: 'Nieuwe melding', type: 'Melding', status: 'Nieuw', location: 'A6 · Almere-Haven', area: 'Flevoland', owner: 'Verkeersleider regio Midden', updatedAt: new Date(), description: 'Zojuist binnengekomen. De selectie en je positie in de lijst zijn niet verschoven.', coordinates: [5.2917, 52.3402], priority: 'Normaal' } as Melding,
      ...list.filter((r) => r.id !== 'M-115'),
    ]);
    this.liveNew.set(false);
    this.state.demo.set('normaal');
    this.#toast.open('Gegevens vernieuwd: 1 nieuwe melding.');
  }

  protected onView(change: MapViewChange) {
    this.state.mapView.set({ center: change.center, zoom: change.zoom });
    this.state.mapBounds.set(change.bounds);
  }

  protected asRecord(r: LabRecord) {
    return r as Melding;
  }
}
