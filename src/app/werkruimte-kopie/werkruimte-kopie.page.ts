import { afterNextRender, ChangeDetectionStrategy, DestroyRef, TemplateRef, Component, computed, effect, inject, Injector, signal, Signal, untracked, viewChild } from '@angular/core';
import { ButtonDirective, IconComponent, ToastService } from '@ndwnu/design-system';
import { TopbarSlot } from '../shared/topbar-slot.service';
import { MapViewChange, NdwMapComponent } from '../map/ndw-map.component';
import { LabRecord, Melding, MELDINGEN, MELDING_STATUSSEN, MELDING_TYPEN, pointFeatures, updatedLabel } from '../layout-lab/data/lab-data';
import { bindUrlState, EMPTY_FILTERS, hostWidth, LabStore } from '../layout-lab/lab-store';
import { AnalysisBodyComponent } from '../layout-lab/shared/analysis-body.component';
import { createAnalysis, MELDING_INDICATORS } from '../layout-lab/shared/analysis-model';
import { AnalysisScopeComponent } from '../layout-lab/shared/analysis-scope.component';
import { FilterGroup, FilterPanelComponent } from '../layout-lab/shared/filter-panel.component';
import { DetailData, ObjectDetailComponent } from '../layout-lab/shared/object-detail.component';
import { createResults } from '../layout-lab/shared/results-model';
import { ResultsTableComponent, TableColumn } from '../layout-lab/shared/results-table.component';
import { ScopeToolbarComponent } from '../layout-lab/shared/scope-toolbar.component';
import { ScreenHeaderComponent } from '../layout-lab/shared/screen-header.component';
import { SplitWorkspaceComponent } from '../layout-lab/shared/split-workspace.component';

export type PaneId = 'filters' | 'analyse' | 'map' | 'results' | 'detail';
type PaneFlags = Record<PaneId, boolean>;
type SideId = 'filters' | 'analyse' | 'detail';
type Mode = 'off' | 'dock' | 'overlay' | 'full';

const PANES: { id: PaneId; label: string; icon: string; hint: string }[] = [
  { id: 'filters', label: 'Filters', icon: 'tune', hint: 'Filters voor kaart en resultaten' },
  { id: 'analyse', label: 'Analyse', icon: 'monitoring', hint: 'Indicatoren en trend' },
  { id: 'map', label: 'Kaart', icon: 'map', hint: 'Kaart met meldingen' },
  { id: 'results', label: 'Resultaten', icon: 'table_rows', hint: 'Tabel met meldingen' },
  { id: 'detail', label: 'Details', icon: 'info', hint: 'Details van de gekozen melding' },
];

const flags = (...on: PaneId[]): PaneFlags => ({
  filters: on.includes('filters'),
  analyse: on.includes('analyse'),
  map: on.includes('map'),
  results: on.includes('results'),
  detail: on.includes('detail'),
});

const PRESETS: { value: string; label: string; panes: PaneFlags }[] = [
  { value: 'verkennen', label: 'Kaart verkennen', panes: flags('map', 'detail') },
  { value: 'werkvoorraad', label: 'Werkvoorraad', panes: flags('map', 'results', 'detail') },
  { value: 'lijst', label: 'Lijst met filters', panes: flags('filters', 'results', 'detail') },
  { value: 'analyse', label: 'Analyse met kaart', panes: flags('analyse', 'map') },
  { value: 'dashboard', label: 'Dashboard', panes: flags('analyse') },
];

/** Width (px) a docked side panel needs; the centre (kaart/resultaten) needs its own minimum. */
const DOCK: Record<SideId, number> = { filters: 320, analyse: 440, detail: 400 };
/** When space runs out, the first panel in this list becomes an overlay first. */
const DEMOTE_ORDER: SideId[] = ['filters', 'analyse', 'detail'];
const NARROW = 760;
const GAP = 16;
const STORAGE = 'ndw-ws-kopie:v1';

const COLUMNS: TableColumn<Melding>[] = [
  { key: 'title', label: 'ID / onderwerp', sortable: true, kind: 'primary', text: (r) => `${r.id} · ${r.title}` },
  { key: 'status', label: 'Status', sortable: true, kind: 'status', text: (r) => r.status },
  { key: 'location', label: 'Locatie', sortable: true, text: (r) => r.location, hideBelow: 620 },
  { key: 'updatedAt', label: 'Bijgewerkt', sortable: true, text: (r) => updatedLabel(r.updatedAt), hideBelow: 520 },
];

const FILTER_GROUPS: FilterGroup[] = [
  { key: 'status', label: 'Status', options: MELDING_STATUSSEN },
  { key: 'type', label: 'Type melding', options: MELDING_TYPEN },
];

function readStored(): { panes: PaneFlags; arrangement: 'onder' | 'naast' } {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) ?? 'null');
    if (raw?.panes) return { panes: { ...PRESETS[1].panes, ...raw.panes }, arrangement: raw.arrangement === 'naast' ? 'naast' : 'onder' };
  } catch {
    /* storage unavailable */
  }
  return { panes: { ...PRESETS[1].panes }, arrangement: 'onder' };
}

/**
 * Werkruimte: one workspace whose panels (filters, analyse, kaart, resultaten, details) the user switches on and off
 * with the icon bar. The workspace decides per panel whether it is docked, an overlay or the only panel (narrow).
 * The six templates of the Layout lab are presets of this arrangement.
 */
@Component({
  selector: 'app-werkruimte-kopie',
  imports: [AnalysisBodyComponent, AnalysisScopeComponent, ButtonDirective, FilterPanelComponent, IconComponent, NdwMapComponent, ObjectDetailComponent, ResultsTableComponent, ScopeToolbarComponent, ScreenHeaderComponent, SplitWorkspaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeViewMenuOutside($event)', '(keydown.escape)': 'viewMenuOpen.set(false)' },
  templateUrl: './werkruimte-kopie.page.html',
  styleUrl: './werkruimte-kopie.page.scss',
})
export class WerkruimteKopiePage {
  readonly #store = inject(LabStore);
  readonly #toast = inject(ToastService);
  readonly #injector = inject(Injector);
  protected readonly state = this.#store.state('werkruimte-kopie');
  protected readonly width = hostWidth();
  protected readonly panesList = PANES;
  protected readonly presets = PRESETS;
  protected readonly columns = COLUMNS;
  protected readonly filterGroups = FILTER_GROUPS;
  protected readonly dock = DOCK;

  readonly #stored = readStored();
  protected readonly panes = signal<PaneFlags>(this.#stored.panes);
  protected readonly arrangement = signal<'onder' | 'naast'>(this.#stored.arrangement);
  /** Narrow screens show one panel at a time. */
  protected readonly solo = signal<PaneId>('results');
  protected readonly ratio = signal(0.5);
  /** The panel the user opened last: when several would be overlays, only this one shows. */
  readonly #lastOpened = signal<PaneId>('detail');

  private readonly table = viewChild(ResultsTableComponent);
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');
  readonly #topbar = inject(TopbarSlot);
  /** The "Weergave" menu in the right half of the top bar. */
  protected readonly viewMenuOpen = signal(false);
  protected readonly arrangements = [
    { value: 'onder' as const, label: 'Onder elkaar', hint: 'Kaart boven, resultaten eronder', icon: 'horizontal_split' },
    { value: 'naast' as const, label: 'Naast elkaar', hint: 'Kaart en resultaten naast elkaar', icon: 'vertical_split' },
  ];
  /** The arrangement only applies while both the map and the results are on and there is room for both. */
  protected readonly canArrange = computed(() => !this.narrow() && this.panes().map && this.panes().results);

  protected closeViewMenuOutside(event: Event) {
    if (!(event.target as HTMLElement).closest('.view-menu')) this.viewMenuOpen.set(false);
  }

  protected pickArrangement(value: 'onder' | 'naast') {
    this.arrangement.set(value);
    this.viewMenuOpen.set(false);
  }

  private readonly all = signal<readonly LabRecord[]>(MELDINGEN);
  protected readonly results = createResults<Melding>(this.all as unknown as Signal<readonly Melding[]>, this.state);
  protected readonly analysis = createAnalysis(this.state, this.all, MELDING_INDICATORS);
  protected readonly features = computed(() => pointFeatures(this.results.filtered(), 'melding'));

  protected readonly narrow = computed(() => this.width() < NARROW);

  /** Where every panel goes, given the panels the user switched on and the available width. */
  protected readonly layout = computed(() => {
    const on = this.panes();
    const w = this.width();
    const mode: Record<SideId, Mode> = { filters: 'off', analyse: 'off', detail: 'off' };
    const centerOn = on.map || on.results;

    if (this.narrow()) {
      const solo = this.solo();
      for (const k of DEMOTE_ORDER) mode[k] = solo === k ? 'full' : 'off';
      const centerShow: 'first' | 'second' = solo === 'map' ? 'first' : 'second';
      return { mode, centerVisible: solo === 'map' || solo === 'results', centerShow: centerShow as 'both' | 'first' | 'second', direction: 'column' as 'row' | 'column', arrangement: 'onder' as 'onder' | 'naast', forced: false, demoted: [] as string[], hidden: [] as string[] };
    }

    for (const k of DEMOTE_ORDER) mode[k] = on[k] ? 'dock' : 'off';
    const both = on.map && on.results;
    const centerMin = !centerOn ? 0 : both && this.arrangement() === 'naast' ? 760 : on.map ? 400 : 360;
    const used = () => DEMOTE_ORDER.filter((k) => mode[k] === 'dock').reduce((sum, k) => sum + DOCK[k] + GAP, 0);
    const demoted: string[] = [];
    const hidden: string[] = [];
    if (centerOn) {
      for (const k of DEMOTE_ORDER) {
        if (2 * GAP + used() + centerMin <= w) break;
        if (mode[k] === 'dock') {
          mode[k] = 'overlay';
          demoted.push(PANES.find((p) => p.id === k)!.label);
        }
      }
    }
    const overlays = DEMOTE_ORDER.filter((k) => mode[k] === 'overlay');
    if (overlays.length > 1) {
      const keep = overlays.includes(this.#lastOpened() as SideId) ? this.#lastOpened() : overlays[overlays.length - 1];
      for (const k of overlays) {
        if (k !== keep) {
          mode[k] = 'off';
          hidden.push(PANES.find((p) => p.id === k)!.label);
        }
      }
    }
    const centerWidth = w - 2 * GAP - used();
    const forced = both && this.arrangement() === 'naast' && centerWidth < 760;
    const arrangement: 'onder' | 'naast' = forced ? 'onder' : this.arrangement();
    const centerShow: 'both' | 'first' | 'second' = both ? 'both' : on.map ? 'first' : 'second';
    const direction: 'row' | 'column' = arrangement === 'onder' ? 'column' : 'row';
    return { mode, centerVisible: centerOn, centerShow, direction, arrangement, forced, demoted, hidden };
  });

  protected readonly pressed = (id: PaneId) => (this.narrow() ? this.solo() === id : this.panes()[id]);

  protected readonly presetValue = computed(() => {
    const p = this.panes();
    return PRESETS.find((x) => (Object.keys(x.panes) as PaneId[]).every((k) => x.panes[k] === p[k]))?.value ?? 'eigen';
  });

  protected readonly notice = computed(() => {
    const l = this.layout();
    const parts: string[] = [];
    if (l.demoted.length) parts.push(`${l.demoted.join(' en ')} ${l.demoted.length > 1 ? 'staan' : 'staat'} als overlay: te weinig ruimte om te docken.`);
    if (l.hidden.length) parts.push(`${l.hidden.join(' en ')} ${l.hidden.length > 1 ? 'zijn' : 'is'} tijdelijk verborgen: er past maar één overlay. Klik op het icoon om te wisselen.`);
    if (l.forced) parts.push('Kaart en resultaten staan onder elkaar: naast elkaar past niet.');
    return parts.join(' ');
  });

  protected readonly countText = computed(() => {
    const shown = this.results.filtered().length;
    const total = this.results.total();
    return shown === total ? `${total} meldingen` : `${shown} van ${total} meldingen`;
  });

  protected readonly detail = computed<DetailData | null>(() => {
    const r = this.results.selected() as Melding | null;
    if (!r) return null;
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
    bindUrlState('werkruimte-kopie', ['id']);

    effect(() => this.#topbar.template.set(this.topbarActions() ?? null));
    inject(DestroyRef).onDestroy(() => this.#topbar.template.set(null));

    effect(() => {
      const stored = { panes: this.panes(), arrangement: this.arrangement() };
      try {
        localStorage.setItem(STORAGE, JSON.stringify(stored));
      } catch {
        /* ignore */
      }
    });

    // A deep link with ?id= opens the details panel.
    effect(() => {
      if (this.state.selectedId() && this.state.detailOpen()) untracked(() => this.panes.update((p) => (p.detail ? p : { ...p, detail: true })));
    });

    effect(() => {
      const id = this.state.selectedId();
      const visible = this.results.filtered().some((r) => r.id === id);
      untracked(() => {
        if (id && !visible) {
          this.state.setSelection(null, false);
          this.#toast.open(`${id} valt buiten de huidige filters. De selectie is gewist.`);
        }
      });
    });
  }

  protected toggle(id: PaneId) {
    if (this.narrow()) {
      this.solo.set(id);
      this.panes.update((p) => ({ ...p, [id]: true }));
      return;
    }
    // A panel that is switched on but hidden behind another overlay comes forward instead of switching off.
    if (this.panes()[id] && id !== 'map' && id !== 'results' && this.layout().mode[id] === 'off') {
      this.#lastOpened.set(id);
      return;
    }
    this.#lastOpened.set(id);
    this.panes.update((p) => ({ ...p, [id]: !p[id] }));
  }

  protected close(id: PaneId) {
    if (this.narrow()) this.solo.set(this.panes().results ? 'results' : 'map');
    else this.panes.update((p) => ({ ...p, [id]: false }));
    afterNextRender(() => document.querySelector<HTMLElement>(`[data-pane-toggle="${id}"]`)?.focus(), { injector: this.#injector });
  }

  protected applyPreset(value: string) {
    const preset = PRESETS.find((p) => p.value === value);
    if (!preset) return;
    this.panes.set({ ...preset.panes });
    if (this.narrow()) this.solo.set((['map', 'results', 'analyse', 'filters'] as PaneId[]).find((k) => preset.panes[k]) ?? 'results');
  }

  protected resetLayout() {
    this.applyPreset('werkvoorraad');
    this.arrangement.set('onder');
    this.ratio.set(0.5);
  }

  protected select(id: string) {
    this.state.setSelection(id, true);
    this.#lastOpened.set('detail');
    this.panes.update((p) => ({ ...p, detail: true }));
    if (this.narrow()) this.solo.set('detail');
  }

  protected closeDetail() {
    const id = this.state.selectedId();
    if (this.narrow()) {
      this.solo.set(this.panes().results ? 'results' : 'map');
      afterNextRender(() => this.table()?.focusRow(id), { injector: this.#injector });
    } else {
      this.close('detail');
    }
  }

  protected onView(change: MapViewChange) {
    this.state.mapView.set({ center: change.center, zoom: change.zoom });
    this.state.mapBounds.set(change.bounds);
  }

  protected clearAll() {
    this.state.search.set('');
    this.state.filters.set({ ...EMPTY_FILTERS });
  }
}
