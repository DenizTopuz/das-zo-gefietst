import { DestroyRef, effect, ElementRef, inject, Injectable, Injector, runInInjectionContext, signal, untracked, Signal, WritableSignal } from '@angular/core';
import { AREA_OPTIONS, PERIODS, SOURCES } from './data/analysis';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import type { MapView } from '../map/ndw-map.component';

export type TemplateId = 't1' | 't2' | 't3' | 't4' | 't5' | 't6';
export type ViewMode = 'kaart' | 'lijst' | 'beide';
export type Arrangement = 'onder' | 'naast';
export type DemoState = 'normaal' | 'laden' | 'fout' | 'geen-data' | 'live';

export interface TemplateInfo {
  id: TemplateId;
  code: string;
  name: string;
  summary: string;
  useWhen: string;
  notWhen: string;
  evidence: string;
}

/** The six templates of the layout proposal (ANALYSE.md §4). */
export const TEMPLATES: readonly TemplateInfo[] = [
  {
    id: 't1',
    code: 'T1',
    name: 'Kaart verkennen',
    summary: 'Ruimtelijk zoeken en inspecteren; filters en details verschijnen wanneer nodig.',
    useWhen: 'De gebruiker een gebied, laag of object zoekt en ruimtelijk onderzoekt (George, Viewer, Diego-kaartpagina).',
    notWhen: 'Veel records systematisch moeten worden vergeleken of afgehandeld.',
    evidence: 'Gebaseerd op onderzoek naar zeven kaartapps.',
  },
  {
    id: 't2',
    code: 'T2',
    name: 'Werkvoorraad + kaart',
    summary: 'Eén selectie, één resultatenset, meerdere manieren om te kijken.',
    useWhen: 'De gebruiker resultaten doorloopt en afhandelt met voortdurende locatiecontext (Daisi, Melvin).',
    notWhen: 'De kaart slechts incidenteel als locatiehulp nodig is.',
    evidence: 'Gebaseerd op onderzoek naar zeven kaartapps.',
  },
  {
    id: 't3',
    code: 'T3',
    name: 'Analyse + kaart',
    summary: 'Indicatoren, periode en gebied vormen samen één onderzoekscontext.',
    useWhen: 'De gebruiker een indicator, trend of geografisch verschil wil verklaren (Linda).',
    notWhen: 'Het afhandelen van individuele meldingen het doel is.',
    evidence: 'Gebaseerd op onderzoek naar zeven kaartapps.',
  },
  {
    id: 't4',
    code: 'T4',
    name: 'Bewerken + context',
    summary: 'Een volwaardige editor met zichtbare validatie en behoud van werk.',
    useWhen: 'De gebruiker records of geometrie wijzigt en fouten moet beoordelen (Karin).',
    notWhen: 'Alleen lezen en snel inspecteren voldoende is.',
    evidence: 'Gebaseerd op onderzoek naar zeven kaartapps.',
  },
  {
    id: 't5',
    code: 'T5',
    name: 'Overzicht + detail',
    summary: 'Beheer zonder permanente kaart.',
    useWhen: 'Zoeken, vergelijken en beheren van records centraal staan en geografie incidenteel is.',
    notWhen: 'De kaart nodig is voor vrijwel iedere beslissing.',
    evidence: 'Ontwerpvoorstel (hypothese); nog niet getoetst bij Dexter.',
  },
  {
    id: 't6',
    code: 'T6',
    name: 'Dashboard zonder kaart',
    summary: 'Stuurinformatie met een gedeelde scope.',
    useWhen: 'Indicatoren en trends zonder voortdurende ruimtelijke vraag worden bekeken.',
    notWhen: 'Het scherm eigenlijk een afhandelbare werkvoorraad is.',
    evidence: 'Ontwerpvoorstel (hypothese); Power BI nog niet onderzocht.',
  },
];

export const templateInfo = (id: string | null | undefined) => TEMPLATES.find((t) => t.id === id);

export interface Filters {
  status: string[];
  type: string[];
  /** "Binnen kaartbeeld": only records inside the visible map area. */
  inView: boolean;
}

export interface Sort {
  key: string;
  dir: 'asc' | 'desc';
}

export const EMPTY_FILTERS: Filters = { status: [], type: [], inView: false };
export const filterCount = (f: Filters) => f.status.length + f.type.length + (f.inView ? 1 : 0);

const isViewMode = (v: string | null): v is ViewMode => v === 'kaart' || v === 'lijst' || v === 'beide';
const isArrangement = (v: string | null): v is Arrangement => v === 'onder' || v === 'naast';

/** Layout preferences: persisted per template (mock user) in localStorage. */
interface LayoutPrefs {
  view: ViewMode;
  arrangement: Arrangement;
  ratio: number;
  detailWide: boolean;
  filtersOpen: boolean;
  withMap: boolean;
  deepen: boolean;
}

const DEFAULT_PREFS: LayoutPrefs = { view: 'beide', arrangement: 'onder', ratio: 0.45, detailWide: false, filtersOpen: false, withMap: true, deepen: false };
const STORAGE_PREFIX = 'ndw-lab:v1:';

function readPrefs(id: TemplateId): LayoutPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<LayoutPrefs>) };
  } catch {
    /* storage unavailable: use defaults */
  }
  return { ...DEFAULT_PREFS };
}

function writePrefs(id: TemplateId, prefs: LayoutPrefs) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/**
 * All state of one template. It lives in the store, so it survives leaving and re-entering a template
 * through the Layout lab. Layout preferences (view, split, widths) are also written to localStorage.
 */
export class TemplateState {
  // Results context
  readonly search = signal('');
  readonly filters = signal<Filters>({ ...EMPTY_FILTERS });
  readonly sort = signal<Sort>({ key: 'updatedAt', dir: 'desc' });
  readonly selectedId = signal<string | null>(null);
  readonly detailOpen = signal(false);
  readonly mapView = signal<MapView | null>(null);
  readonly mapBounds = signal<[number, number, number, number] | null>(null);
  readonly demo = signal<DemoState>('normaal');
  readonly scroll = { list: 0 };

  // Layout preferences (initialised from localStorage in the constructor; never written while creating)
  readonly view: WritableSignal<ViewMode>;
  readonly arrangement: WritableSignal<Arrangement>;
  readonly ratio: WritableSignal<number>;
  readonly detailWide: WritableSignal<boolean>;
  readonly filtersOpen: WritableSignal<boolean>;
  /** T4: show the map context panel. */
  readonly withMap: WritableSignal<boolean>;
  /** T3/T6: the results "verdieping" is open. */
  readonly deepen: WritableSignal<boolean>;

  // Analysis scope (T3, T6)
  readonly period = signal('september-2026');
  readonly area = signal('alle');
  readonly source = signal('registratie');
  readonly indicator = signal('bezetting');
  readonly compare = signal(false);

  // Editor (T4)
  readonly dirty = signal(false);

  constructor(readonly id: TemplateId) {
    const prefs = readPrefs(id);
    this.view = signal(prefs.view);
    this.arrangement = signal(prefs.arrangement);
    this.ratio = signal(prefs.ratio);
    this.detailWide = signal(prefs.detailWide);
    this.filtersOpen = signal(prefs.filtersOpen);
    this.withMap = signal(prefs.withMap);
    this.deepen = signal(prefs.deepen);
  }

  prefs(): LayoutPrefs {
    return {
      view: this.view(),
      arrangement: this.arrangement(),
      ratio: this.ratio(),
      detailWide: this.detailWide(),
      filtersOpen: this.filtersOpen(),
      withMap: this.withMap(),
      deepen: this.deepen(),
    };
  }

  applyPrefs(prefs: LayoutPrefs) {
    this.view.set(prefs.view);
    this.arrangement.set(prefs.arrangement);
    this.ratio.set(prefs.ratio);
    this.detailWide.set(prefs.detailWide);
    this.filtersOpen.set(prefs.filtersOpen);
    this.withMap.set(prefs.withMap);
    this.deepen.set(prefs.deepen);
  }

  /** "Herstel indeling": layout only. Filters, search, sort, selection and edited data stay. */
  resetLayout() {
    this.applyPrefs({ ...DEFAULT_PREFS });
  }

  setSelection(id: string | null, openDetail: boolean) {
    this.selectedId.set(id);
    this.detailOpen.set(id !== null && openDetail);
  }
}

@Injectable({ providedIn: 'root' })
export class LabStore {
  readonly #states = new Map<TemplateId, TemplateState>();
  readonly #injector = inject(Injector);
  readonly #router = inject(Router);
  /** Template currently shown (set by the template pages). */
  readonly active = signal<TemplateId>('t2');
  /** Set by T4 so the toolbar can warn about unsaved changes. */
  readonly leaveGuards = new Map<TemplateId, () => Promise<boolean>>();

  state(id: TemplateId): TemplateState {
    let state = this.#states.get(id);
    if (!state) {
      state = new TemplateState(id);
      this.#states.set(id, state);
      const created = state;
      // `state()` may be called from a computed; effects cannot be created there, so register it afterwards.
      queueMicrotask(() => runInInjectionContext(this.#injector, () => effect(() => writePrefs(id, created.prefs()))));
    }
    return state;
  }

  open(id: TemplateId) {
    return this.#router.navigate(['/layout-lab', id]);
  }
}

// ───────────────────────── URL ⇄ state ─────────────────────────

type UrlKey = 'weergave' | 'indeling' | 'id' | 'breedte' | 'kaart' | 'verdieping' | 'periode' | 'gebied' | 'bron' | 'indicator';

interface Codec {
  read(s: TemplateState): string | null;
  write(s: TemplateState, value: string | null, initial: boolean): void;
}

const CODECS: Record<UrlKey, Codec> = {
  weergave: {
    read: (s) => s.view(),
    write: (s, v) => {
      if (isViewMode(v) && s.view() !== v) s.view.set(v);
    },
  },
  indeling: {
    read: (s) => s.arrangement(),
    write: (s, v) => {
      if (isArrangement(v) && s.arrangement() !== v) s.arrangement.set(v);
    },
  },
  id: {
    // `id` in the URL means: this record is selected and its detail is open.
    read: (s) => (s.detailOpen() ? s.selectedId() : null),
    write: (s, v, initial) => {
      if (v) {
        if (s.selectedId() !== v) s.selectedId.set(v);
        if (!s.detailOpen()) s.detailOpen.set(true);
      } else if (!initial && s.detailOpen()) {
        s.detailOpen.set(false); // browser-back to a URL without detail: close it, keep the selection highlighted
      }
    },
  },
  breedte: {
    read: (s) => (s.detailWide() ? 'ruim' : 'compact'),
    write: (s, v) => {
      if (v === 'ruim' || v === 'compact') s.detailWide.set(v === 'ruim');
    },
  },
  kaart: {
    read: (s) => (s.withMap() ? 'aan' : 'uit'),
    write: (s, v) => {
      if (v === 'aan' || v === 'uit') s.withMap.set(v === 'aan');
    },
  },
  periode: {
    read: (s) => s.period(),
    write: (s, v) => {
      if (v && PERIODS.some((o) => o.value === v) && s.period() !== v) s.period.set(v);
    },
  },
  gebied: {
    read: (s) => s.area(),
    write: (s, v) => {
      if (v && AREA_OPTIONS.some((o) => o.value === v) && s.area() !== v) s.area.set(v);
    },
  },
  bron: {
    read: (s) => s.source(),
    write: (s, v) => {
      if (v && SOURCES.some((o) => o.value === v) && s.source() !== v) s.source.set(v);
    },
  },
  indicator: {
    read: (s) => s.indicator(),
    write: (s, v) => {
      if (v && /^[a-z-]+$/.test(v) && s.indicator() !== v) s.indicator.set(v);
    },
  },
  verdieping: {
    read: (s) => (s.deepen() ? 'open' : 'dicht'),
    write: (s, v) => {
      if (v === 'open' || v === 'dicht') s.deepen.set(v === 'open');
    },
  },
};

/**
 * Keeps a template's state and the URL query parameters in sync: deep links, refresh and
 * browser-back work. Selecting or closing a record adds a history entry; other changes replace it.
 * Call from a component constructor.
 */
export function bindUrlState(id: TemplateId, keys: readonly UrlKey[]) {
  const store = inject(LabStore);
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const state = store.state(id);
  const params = toSignal(route.queryParamMap, { initialValue: route.snapshot.queryParamMap });
  let initial = true;

  // URL → state
  effect(() => {
    const p: ParamMap = params();
    untracked(() => {
      for (const key of keys) CODECS[key].write(state, p.get(key), initial);
      initial = false;
    });
  });

  // state → URL
  effect(() => {
    const wanted: Record<string, string | null> = {};
    for (const key of keys) wanted[key] = CODECS[key].read(state);
    untracked(() => {
      const current = route.snapshot.queryParamMap;
      const same = keys.every((k) => (wanted[k] ?? null) === current.get(k));
      if (same) return;
      const idChanged = keys.includes('id') && (wanted['id'] ?? null) !== current.get('id');
      void router.navigate([], { relativeTo: route, queryParams: wanted, queryParamsHandling: 'merge', replaceUrl: !idChanged });
    });
  });
}

/** Width of the host element, in px, kept up to date with a ResizeObserver. */
export function hostWidth(): Signal<number> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const width = signal(host.getBoundingClientRect().width);
  const observer = new ResizeObserver(() => width.set(Math.round(host.getBoundingClientRect().width)));
  observer.observe(host);
  inject(DestroyRef).onDestroy(() => observer.disconnect());
  return width;
}
