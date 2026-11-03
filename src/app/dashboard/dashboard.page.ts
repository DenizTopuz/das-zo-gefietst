import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AlertComponent, AutosuggestDirective, AutosuggestOption, AutosuggestOptionComponent, AutosuggestPanelComponent, ButtonDirective, FormFieldComponent, IconComponent, InputDirective, MapLegendComponent, MapLegendOptionGroup, PillComponent } from '@ndwnu/design-system';
import type { FeatureCollection } from 'geojson';
import { ScreenHeaderComponent } from '../layout-lab/shared/screen-header.component';
import {
  accentRamp,
  DATA_END,
  DATA_START,
  DirectionFilter,
  dataAvailable,
  dateLabel,
  hourLabel,
  hourly,
  neutralColors,
  nl,
  rangeLabel,
  EXAMPLES,
  RoadProps,
  Segment,
  segmentFromRoad,
  summarize,
  TYPE_LABELS,
} from './fiets-data';
import { FietsFilterbarComponent } from './fiets-filterbar.component';
import { FietsTourService } from './fiets-tour.service';
import { FietsMapComponent, MapFocus, MapHover } from './fiets-map.component';

type Status = 'start' | 'geen-data' | 'nul' | 'ok';

const SPEED_AXIS: [number, number] = [12, 26];

@Component({
  selector: 'app-dashboard',
  imports: [AlertComponent, AutosuggestDirective, AutosuggestOptionComponent, AutosuggestPanelComponent, ButtonDirective, FietsFilterbarComponent, FietsMapComponent, FormFieldComponent, IconComponent, InputDirective, MapLegendComponent, PillComponent, ReactiveFormsModule, ScreenHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'onEscape()' },
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly examples = EXAMPLES;
  protected readonly dataStart = DATA_START;
  protected readonly dataEnd = DATA_END;
  protected readonly typeLabels = TYPE_LABELS;
  protected readonly nl = nl;
  protected readonly hourLabel = hourLabel;
  protected readonly dateLabel = dateLabel;
  protected readonly speedAxis = SPEED_AXIS;
  protected readonly pct = pct;
  readonly #ramp = accentRamp();
  readonly #neutral = neutralColors();
  protected readonly ramp = this.#ramp;

  protected readonly date = signal('2026-10-27');
  protected readonly hour0 = signal(8);
  protected readonly hour1 = signal(8);
  protected readonly hourMode = signal<'uur' | 'reeks'>('uur');
  protected readonly segment = signal<Segment | null>(null);
  protected readonly selectedId = computed(() => this.segment()?.id ?? null);
  protected readonly focus = signal<MapFocus | null>(null);
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly query = signal('');
  protected readonly notFound = signal(false);
  protected readonly searching = signal(false);
  protected readonly suggestions = signal<Suggestion[]>([]);
  /** Of de zoekdienst heeft geantwoord op de huidige zoektekst; pas dan hoort 'geen resultaten' te verschijnen. */
  protected readonly searchSettled = signal(false);
  /** Opties voor de autosuggest van het ontwerpsysteem; de suggesties zijn al gefilterd door de zoekdienst. */
  protected readonly options = computed<AutosuggestOption[]>(() => this.suggestions().map((s) => ({ label: s.label, value: s.id, icon: s.type === 'Straat' ? 'route' : 'location_city' })));
  protected readonly anyMatch = () => true;
  #chosenAt = 0;
  #suggestTimer?: ReturnType<typeof setTimeout>;
  #suggestRun = 0;
  #chosen = '';
  private readonly map = viewChild(FietsMapComponent);
  protected readonly tour = inject(FietsTourService);
  protected readonly hover = signal<MapHover | null>(null);
  /** Eerste klik van een reeks in een grafiek; de tweede klik sluit de reeks. */
  readonly #anchor = signal<number | null>(null);

  constructor() {
    document.body.classList.add('fiets-active');
    // Rondleiding: de eerste keer vanzelf, nadat kaart en paneel er staan.
    // De eerste stap kiest zelf een wegvak, zodat een nieuwe gebruiker meteen ziet wat selecteren doet.
    this.tour.prepare = async () => {
      this.selectExample(EXAMPLES[0]);
      await new Promise((resolve) => setTimeout(resolve, 2200));
    };
    const tourTimer = setTimeout(() => this.tour.startTour(), 1200);
    inject(DestroyRef).onDestroy(() => {
      document.body.classList.remove('fiets-active', 'fiets-search-idle');
      clearTimeout(this.#suggestTimer);
      clearTimeout(tourTimer);
    });
    this.searchControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.query.set(value ?? '');
      this.notFound.set(false);
    });
    effect(() => document.body.classList.toggle('fiets-search-idle', !this.searchSettled()));
    // Suggesties bij het typen: kort wachten tot de gebruiker even stopt.
    effect(() => {
      const query = this.query().trim();
      clearTimeout(this.#suggestTimer);
      const run = ++this.#suggestRun;
      this.searchSettled.set(false);
      if (query.length < 3 || query === this.#chosen) return this.suggestions.set([]);
      this.#suggestTimer = setTimeout(async () => {
        const found = await suggestPlaces(query, 6);
        if (run === this.#suggestRun) {
          this.suggestions.set(found);
          this.searchSettled.set(true);
        }
      }, 250);
    });
  }

  // ------------------------------------------------------------------ afgeleide waarden

  protected readonly nHours = computed(() => this.hour1() - this.hour0() + 1);
  protected readonly selection = computed(() => rangeLabel(this.hour0(), this.hour1()));
  protected readonly dateText = computed(() => dateLabel(this.date()));
  protected readonly directionLabel = computed(() => ({ beide: 'Beide richtingen', a: 'Richting A (heen)', b: 'Richting B (terug)' })[this.direction()]);
  protected readonly direction = signal<DirectionFilter>('beide');
  protected readonly summary = computed(() => {
    const seg = this.segment();
    return seg ? summarize(seg, this.date(), this.hour0(), this.hour1(), this.direction()) : null;
  });
  /** Verdeling over de twee richtingen in de gekozen uren, altijd beide zichtbaar. */
  protected readonly split = computed(() => {
    const seg = this.segment();
    if (!seg) return null;
    return { a: summarize(seg, this.date(), this.hour0(), this.hour1(), 'a'), b: summarize(seg, this.date(), this.hour0(), this.hour1(), 'b') };
  });
  protected readonly series = computed(() => {
    const seg = this.segment();
    return seg && dataAvailable(seg, this.date()) ? hourly(seg, this.date(), this.direction()) : null;
  });

  protected readonly status = computed<Status>(() => {
    const sum = this.summary();
    if (!sum) return 'start';
    if (!sum.available) return 'geen-data';
    if (sum.total === 0) return 'nul';
    return 'ok';
  });

  protected readonly noDataText = computed(() => {
    const seg = this.segment();
    if (seg && !seg.hasData) return 'Voor dit wegvak ontbreken meetgegevens (demo: sensor niet beschikbaar).';
    return `Geen data voor ${this.dateText()}. Demodata is beschikbaar van ${dateLabel(DATA_START)} t/m ${dateLabel(DATA_END)}.`;
  });

  protected readonly legendGroups = computed<MapLegendOptionGroup[]>(() => {
    const c = this.#neutral;
    return [
      {
        options: [
          { type: 'line', color: c.road, fillMode: 'solid', label: 'Wegvak' },
          { type: 'line', color: this.#ramp[1], fillMode: 'solid', label: 'Geselecteerd wegvak', outline: true },
        ],
      },
    ] as MapLegendOptionGroup[];
  });

  protected readonly tooltip = computed(() => {
    const h = this.hover();
    if (!h) return null;
    const seg = segmentFromRoad(h.props);
    const entry = { seg, sum: summarize(seg, this.date(), this.hour0(), this.hour1()) };
    const text = !entry.sum.available ? 'Geen data' : `${nl(entry.sum.total)} fietsers${entry.sum.avgSpeed ? ` · ${nl(entry.sum.avgSpeed, 1)} km/u` : ''}`;
    return { x: h.x, y: h.y, title: entry.seg.name, text };
  });

  // ------------------------------------------------------------------ grafieken

  protected inSelection(h: number) {
    return h >= this.hour0() && h <= this.hour1();
  }

  protected readonly intensityChart = computed(() => {
    const s = this.series();
    if (!s) return null;
    const max = Math.max(...s.counts, 1);
    const top = niceMax(max);
    return { top, bars: s.counts.map((count, h) => ({ h, count, x: h * 12 + 2, y: 84 - (count / top) * 76, height: (count / top) * 76 })) };
  });

  protected readonly speedChart = computed(() => {
    const s = this.series();
    if (!s) return null;
    const [lo, hi] = SPEED_AXIS;
    const points = s.speeds.map((v, h) => (v === null ? null : { h, v, x: h * 12 + 6, y: 84 - ((v - lo) / (hi - lo)) * 76 }));
    let path = '';
    let pen = false;
    for (const p of points) {
      if (!p) pen = false;
      else {
        path += `${pen ? 'L' : 'M'}${p.x} ${p.y.toFixed(1)} `;
        pen = true;
      }
    }
    return { path, points: points.filter((p): p is NonNullable<typeof p> => !!p) };
  });

  /** Staaf met een halfronde bovenkant (straal = halve breedte). */
  protected barPath(b: { x: number; y: number; height: number }): string {
    const w = 8;
    const r = Math.min(w / 2, b.height);
    if (b.height <= 0) return '';
    const bottom = b.y + b.height;
    return `M${b.x} ${bottom} V${b.y + r} A${r} ${r} 0 0 1 ${b.x + w} ${b.y + r} V${bottom} Z`;
  }

  protected selectionBand(): { x: number; width: number } {
    return { x: this.hour0() * 12, width: this.nHours() * 12 };
  }

  // ------------------------------------------------------------------ acties

  protected selectRoad(props: RoadProps) {
    this.segment.set(segmentFromRoad(props));
  }

  /**
   * Zoekt op naam of NWB-nummer. Eerst in het deel van de kaart dat al geladen is; anders zoekt de open
   * PDOK-zoekdienst de straat of plaats op, vliegt de kaart ernaartoe en kiest daar het wegvak met die naam.
   */
  protected async search() {
    const query = this.query().trim();
    // Enter op een gekozen suggestie wordt al door de autosuggest afgehandeld.
    if (!query || Date.now() - this.#chosenAt < 400) return;
    this.suggestions.set([]);
    this.notFound.set(false);
    this.searching.set(true);
    try {
      if (this.#pick(this.map()?.findRoad(query))) return;
      const place = await resolvePlace((await suggestPlaces(query, 1))[0]);
      if (place) await this.goTo(place);
      else this.notFound.set(true);
    } finally {
      this.searching.set(false);
    }
  }

  protected async goTo(place: Place) {
    this.focus.set({ lng: place.lng, lat: place.lat, zoom: place.street ? 16 : 14, n: (this.focus()?.n ?? 0) + 1 });
    if (!place.street) return;
    await this.map()?.whenIdle();
    this.#pick(this.map()?.findRoad(place.street));
  }

  protected onType(value: string | null) {
    this.query.set(value ?? '');
    this.notFound.set(false);
  }

  protected async chooseOption(option: AutosuggestOption | null) {
    const suggestion = this.suggestions().find((s) => s.id === option?.value);
    if (!suggestion) return;
    this.#chosenAt = Date.now();
    this.#chosen = suggestion.label;
    this.suggestions.set([]);
    this.searchSettled.set(false);
    this.notFound.set(false);
    const place = await resolvePlace(suggestion);
    if (place) await this.goTo(place);
    else this.notFound.set(true);
  }

  #pick(found: { props: RoadProps; lng: number; lat: number } | null | undefined): boolean {
    if (!found) return false;
    this.selectRoad(found.props);
    this.focus.set({ lng: found.lng, lat: found.lat, zoom: 16, n: (this.focus()?.n ?? 0) + 1 });
    return true;
  }

  protected selectExample(example: (typeof EXAMPLES)[number]) {
    this.selectRoad({ roadSectionId: example.id, roadName: example.name, townName: 'Utrecht', functionalRoadClass: '7' });
    this.focus.set({ lng: example.lng, lat: example.lat, zoom: 15, n: (this.focus()?.n ?? 0) + 1 });
  }

  protected clearSelection() {
    this.segment.set(null);
    this.hover.set(null);
  }

  protected onEscape() {
    this.clearSelection();
  }

  protected onHover(h: MapHover | null) {
    this.hover.set(h);
  }

  /** Grafieken: klik kiest één uur; in de modus Reeks (of met Shift) vormen twee klikken een reeks. */
  protected pickHour(h: number, event: MouseEvent) {
    if (event.shiftKey && this.hourMode() === 'uur') {
      this.hourMode.set('reeks');
      this.#anchor.set(null);
      this.hour0.set(Math.min(this.hour0(), h));
      this.hour1.set(Math.max(this.hour1(), h));
      return;
    }
    if (this.hourMode() === 'uur') {
      this.hour0.set(h);
      this.hour1.set(h);
      return;
    }
    const anchor = this.#anchor();
    if (anchor === null) {
      this.#anchor.set(h);
      this.hour0.set(h);
      this.hour1.set(h);
    } else {
      this.hour0.set(Math.min(anchor, h));
      this.hour1.set(Math.max(anchor, h));
      this.#anchor.set(null);
    }
  }
}

function pct(share: number): string {
  const p = share * 100;
  return `${p < 1 ? '<1' : nl(p, p < 10 ? 1 : 0)}%`;
}

function niceMax(value: number): number {
  const steps = [50, 100, 200, 250, 400, 500, 800, 1000];
  return steps.find((s) => s >= value) ?? Math.ceil(value / 100) * 100;
}

/** Een suggestie uit de zoekdienst: nog zonder positie. */
export interface Suggestion {
  id: string;
  label: string;
  type: string;
}

/** Een zoekresultaat: een straat of plaats met positie. */
export interface Place {
  label: string;
  lng: number;
  lat: number;
  /** Straatnaam, alleen bij een straat; daarmee kiest de pagina het wegvak. */
  street: string | null;
}

const LOCATIESERVER = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1';
const TYPE_NAMES: Record<string, string> = { weg: 'Straat', woonplaats: 'Plaats', gemeente: 'Gemeente', postcode: 'Postcode' };

/** Suggesties voor straten en plaatsen in Nederland via de Locatieserver van PDOK (open data, geen sleutel nodig). */
async function suggestPlaces(query: string, rows: number): Promise<Suggestion[]> {
  try {
    const url = `${LOCATIESERVER}/suggest?rows=${rows}&fq=type:(weg OR woonplaats OR gemeente)&q=${encodeURIComponent(query)}`;
    const docs: { id: string; weergavenaam: string; type: string }[] = (await (await fetch(url)).json())?.response?.docs ?? [];
    return docs.map((doc) => ({ id: doc.id, label: doc.weergavenaam, type: TYPE_NAMES[doc.type] ?? doc.type }));
  } catch {
    return [];
  }
}

/** Haalt de positie van een suggestie op. */
async function resolvePlace(suggestion: Suggestion | undefined): Promise<Place | null> {
  if (!suggestion) return null;
  try {
    const url = `${LOCATIESERVER}/lookup?id=${encodeURIComponent(suggestion.id)}&fl=weergavenaam,type,straatnaam,centroide_ll`;
    const doc = (await (await fetch(url)).json())?.response?.docs?.[0];
    const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(doc?.centroide_ll ?? '');
    if (!match) return null;
    return { label: suggestion.label, lng: Number(match[1]), lat: Number(match[2]), street: doc.type === 'weg' ? (doc.straatnaam ?? null) : null };
  } catch {
    return null;
  }
}
