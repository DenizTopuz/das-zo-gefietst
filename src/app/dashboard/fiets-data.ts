/**
 * Demodata voor de fietsdata-verkenner. Alles hier is fictief en deterministisch (geen backend):
 * dezelfde datum, uur en wegvak geven altijd dezelfde cijfers, zodat kaart, grafieken en paneel kloppen.
 */

export type RoadType = 'forens' | 'stad' | 'recreatief';

export interface Segment {
  /** roadSectionId uit het Nationaal Wegenbestand (NWB). */
  id: string;
  name: string;
  place: string;
  type: RoadType;
  /** Passages per uur op het drukste uur van een werkdag. */
  base: number;
  /** Gemiddelde snelheid in km/u buiten de spits. */
  speed: number;
  hasData: boolean;
}

/** Eigenschappen van een wegvak in de NWB-kaartlaag (`roadSections`). */
export interface RoadProps {
  roadSectionId: number;
  roadName?: string;
  townName?: string;
  functionalRoadClass?: string;
}

export function dateRangeLabel(date0: string, date1: string): string {
  if (date0 === date1) return dateLabel(date0);
  const fmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });
  return `${fmt.format(new Date(`${date0}T12:00:00Z`))} – ${fmt.format(new Date(`${date1}T12:00:00Z`))}`;
}

export const TYPE_LABELS: Record<RoadType, string> = {
  forens: 'Forensenroute',
  stad: 'Stedelijk fietspad',
  recreatief: 'Recreatieve route',
};

/** Wegvakklassen uit het NWB waarop de verkenner werkt: geen snelwegen en doorgaande autowegen (0–2). */
export const ROAD_CLASSES = ['3', '4', '5', '6', '7'];

/** Vaste voorbeelden voor de voorbeeldtoestanden (echte wegvakken rond Utrecht). */
export const EXAMPLES: { id: number; name: string; lng: number; lat: number; type: RoadType; base: number; hasData: boolean }[] = [
  { id: 274310053, name: 'Park Oosterspoorbaan', lng: 5.1307, lat: 52.08346, type: 'forens', base: 720, hasData: true },
  { id: 600649596, name: 'Venuslaan', lng: 5.13062, lat: 52.07951, type: 'stad', base: 540, hasData: true },
  { id: 601006439, name: 'Parallelweg', lng: 5.13052, lat: 52.08397, type: 'recreatief', base: 140, hasData: true },
  { id: 274310056, name: 'Abstederhof', lng: 5.13044, lat: 52.083, type: 'stad', base: 300, hasData: false },
];

const segmentCache = new Map<number, Segment>();

/** Maakt voor elk wegvak in Nederland deterministische demodata: hetzelfde wegvak geeft altijd dezelfde cijfers. */
export function segmentFromRoad(p: RoadProps): Segment {
  const cached = segmentCache.get(p.roadSectionId);
  if (cached) return cached;
  const key = String(p.roadSectionId);
  const r = hash01(key);
  const bike = p.functionalRoadClass === '7';
  const example = EXAMPLES.find((e) => e.id === p.roadSectionId);
  const type: RoadType = example?.type ?? (r < 0.5 ? 'stad' : r < 0.8 ? 'forens' : 'recreatief');
  const seg: Segment = {
    id: key,
    name: p.roadName || 'Wegvak zonder naam',
    place: p.townName || '',
    type,
    base: example?.base ?? Math.round((bike ? 60 : 30) + hash01(`${key}|b`) ** 2 * (bike ? 640 : 380)),
    speed: Math.round((16.5 + hash01(`${key}|s`) * 5) * 10) / 10,
    hasData: example ? example.hasData : hash01(`${key}|d`) > 0.07,
  };
  segmentCache.set(p.roadSectionId, seg);
  return seg;
}

/** Periode waarvoor demodata bestaat; daarbuiten is er geen data. */
export const DATA_START = '2026-09-01';
export const DATA_END = '2026-10-28';

const pad = (n: number) => String(n).padStart(2, '0');
export const hourLabel = (h: number) => `${pad(h)}:00`;
export const rangeLabel = (h0: number, h1: number) => (h0 === h1 ? `${hourLabel(h0)}–${hourLabel(h0 + 1)}` : `${hourLabel(h0)}–${hourLabel(h1 + 1)}`);
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00Z`));
export const nl = (n: number, digits = 0) => n.toLocaleString('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- Intensiteit en snelheid

const PROFILES: Record<RoadType, { week: number[]; weekend: number[] }> = {
  forens: {
    week: [0.02, 0.01, 0.01, 0.01, 0.03, 0.1, 0.3, 0.75, 1, 0.55, 0.35, 0.35, 0.4, 0.38, 0.4, 0.55, 0.8, 0.95, 0.6, 0.3, 0.18, 0.12, 0.07, 0.04],
    weekend: [0.04, 0.02, 0.01, 0.01, 0.01, 0.03, 0.06, 0.1, 0.18, 0.28, 0.35, 0.4, 0.42, 0.4, 0.38, 0.34, 0.28, 0.22, 0.16, 0.12, 0.08, 0.06, 0.05, 0.04],
  },
  stad: {
    week: [0.04, 0.02, 0.01, 0.01, 0.02, 0.06, 0.2, 0.55, 0.85, 0.7, 0.6, 0.65, 0.8, 0.75, 0.7, 0.75, 0.9, 1, 0.75, 0.5, 0.4, 0.3, 0.18, 0.1],
    weekend: [0.1, 0.06, 0.04, 0.02, 0.02, 0.03, 0.06, 0.12, 0.25, 0.45, 0.65, 0.8, 0.9, 0.9, 0.85, 0.8, 0.7, 0.55, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12],
  },
  recreatief: {
    week: [0.01, 0.01, 0, 0, 0.02, 0.02, 0.06, 0.15, 0.2, 0.2, 0.25, 0.3, 0.35, 0.35, 0.35, 0.3, 0.3, 0.25, 0.15, 0.08, 0.03, 0.02, 0.01, 0.01],
    weekend: [0.01, 0.01, 0, 0, 0.02, 0.03, 0.04, 0.1, 0.25, 0.5, 0.8, 1, 1, 1, 0.95, 0.85, 0.6, 0.4, 0.2, 0.1, 0.04, 0.02, 0.01, 0.01],
  },
};

/** Richting van het wegvak: A is heen, B is terug (`road_section_direction` true/false in de brondata). */
export type RoadDirection = 'a' | 'b';
export type DirectionFilter = 'beide' | RoadDirection;

export interface HourlySeries {
  /** Fietsers per uur (alle fietstypen, ook e-bikes), voor de gekozen richting(en). */
  counts: number[];
  /** Harmonisch gemiddelde snelheid in km/u per uur; null bij nul fietsers. */
  speeds: (number | null)[];
}

export function dataAvailable(seg: Segment, date: string): boolean {
  return seg.hasData && date >= DATA_START && date <= DATA_END;
}

const hourlyCache = new Map<string, Record<DirectionFilter, HourlySeries>>();

/** Harmonisch gemiddelde van twee snelheden, gewogen naar het aantal fietsers (som n / som n/v). */
function harmonic(parts: { n: number; v: number | null }[]): number | null {
  const n = parts.reduce((sum, p) => sum + (p.v ? p.n : 0), 0);
  const time = parts.reduce((sum, p) => sum + (p.v ? p.n / p.v : 0), 0);
  return n && time ? Math.round((n / time) * 10) / 10 : null;
}

/** Fietsers en harmonisch gemiddelde snelheid per uur (24 waarden) voor één wegvak op één dag, per richting. */
export function hourly(seg: Segment, date: string, direction: DirectionFilter = 'beide'): HourlySeries {
  const key = `${seg.id}|${date}`;
  let all = hourlyCache.get(key);
  if (!all) {
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const profile = PROFILES[seg.type][weekend ? 'weekend' : 'week'];
    const dayFactor = 0.85 + 0.3 * hash01(date);
    const baseShare = 0.5 + (hash01(`${seg.id}|share`) - 0.5) * 0.2;
    const tilt = seg.type === 'forens' ? 0.15 : seg.type === 'stad' ? 0.05 : 0;
    const a: HourlySeries = { counts: [], speeds: [] };
    const b: HourlySeries = { counts: [], speeds: [] };
    const both: HourlySeries = { counts: [], speeds: [] };
    for (let h = 0; h < 24; h++) {
      const total = Math.round(seg.base * profile[h] * dayFactor * (0.92 + 0.16 * hash01(`${key}|${h}`)));
      // Forensen: 's ochtends vooral richting A, 's avonds vooral richting B.
      const lean = h >= 6 && h <= 9 ? tilt : h >= 15 && h <= 18 ? -tilt : 0;
      const nA = Math.round(total * Math.min(0.9, Math.max(0.1, baseShare + lean)));
      const nB = total - nA;
      const speed = (side: number) => Math.round((seg.speed * (0.9 + 0.1 * profile[h]) + (hash01(`${key}|v${h}|${side}`) - 0.5) * 1.2 + (side ? -0.3 : 0.3)) * 10) / 10;
      const vA = nA ? speed(0) : null;
      const vB = nB ? speed(1) : null;
      a.counts.push(nA);
      a.speeds.push(vA);
      b.counts.push(nB);
      b.speeds.push(vB);
      both.counts.push(total);
      both.speeds.push(harmonic([{ n: nA, v: vA }, { n: nB, v: vB }]));
    }
    all = { a, b, beide: both };
    hourlyCache.set(key, all);
  }
  return all[direction];
}

export interface Summary {
  available: boolean;
  total: number;
  /** Harmonisch gemiddelde snelheid, gewogen naar aantallen; null bij nul fietsers. */
  avgSpeed: number | null;
}

/** Totaal aantal fietsers en harmonisch gemiddelde snelheid voor uur h0 t/m h1 (voorlopige ontwerpkeuze). */
export function summarize(seg: Segment, date: string, h0: number, h1: number, direction: DirectionFilter = 'beide'): Summary {
  if (!dataAvailable(seg, date)) return { available: false, total: 0, avgSpeed: null };
  const { counts, speeds } = hourly(seg, date, direction);
  const parts: { n: number; v: number | null }[] = [];
  let total = 0;
  for (let h = h0; h <= h1; h++) {
    total += counts[h];
    parts.push({ n: counts[h], v: speeds[h] });
  }
  return { available: true, total, avgSpeed: harmonic(parts) };
}

/** Gemiddelde uurreeks over een datumbereik (date0 t/m date1); bij één dag identiek aan hourly(). */
export function hourlySeries(seg: Segment, date0: string, date1: string, direction: DirectionFilter = 'beide'): HourlySeries | null {
  if (!seg.hasData) return null;
  if (date0 === date1) return dataAvailable(seg, date0) ? hourly(seg, date0, direction) : null;
  const countsByHour: number[][] = Array.from({ length: 24 }, () => []);
  const speedParts: { n: number; v: number | null }[][] = Array.from({ length: 24 }, () => []);
  let cur = new Date(`${date0}T12:00:00Z`);
  const end = new Date(`${date1}T12:00:00Z`);
  while (cur <= end) {
    const dateStr = cur.toISOString().slice(0, 10);
    if (dataAvailable(seg, dateStr)) {
      const { counts, speeds } = hourly(seg, dateStr, direction);
      for (let h = 0; h < 24; h++) {
        countsByHour[h].push(counts[h]);
        speedParts[h].push({ n: counts[h], v: speeds[h] });
      }
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  if (!countsByHour[0].length) return null;
  return {
    counts: countsByHour.map((vals) => Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)),
    speeds: speedParts.map((parts) => harmonic(parts)),
  };
}

/** Totaal fietsers en harmonisch gemiddelde snelheid over een datumbereik. */
export function summarizeRange(seg: Segment, date0: string, date1: string, h0: number, h1: number, direction: DirectionFilter = 'beide'): Summary {
  if (!seg.hasData) return { available: false, total: 0, avgSpeed: null };
  const parts: { n: number; v: number | null }[] = [];
  let total = 0;
  let cur = new Date(`${date0}T12:00:00Z`);
  const end = new Date(`${date1}T12:00:00Z`);
  while (cur <= end) {
    const dateStr = cur.toISOString().slice(0, 10);
    if (dataAvailable(seg, dateStr)) {
      const { counts, speeds } = hourly(seg, dateStr, direction);
      for (let h = h0; h <= h1; h++) {
        total += counts[h];
        parts.push({ n: counts[h], v: speeds[h] });
      }
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return { available: parts.length > 0, total, avgSpeed: harmonic(parts) };
}

// ---------------------------------------------------------------- Kleuren

/** Zet een CSS-kleur (ook hsl met regeleinden) om naar [r, g, b]. */
function toRgb(css: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return [0, 104, 209];
  ctx.fillStyle = '#0068d1';
  ctx.fillStyle = css.replace(/\s+/g, ' ');
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const hex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Vijf stappen van licht naar donker in de ene accentkleur van het ontwerpsysteem. */
export function accentRamp(): string[] {
  const token = getComputedStyle(document.documentElement).getPropertyValue('--ndw-color-secondary-500').trim();
  const accent = toRgb(token || 'hsl(208, 100%, 41%)');
  const mix = (t: number) => accent.map((c) => 255 - (255 - c) * t);
  return [hex(mix(0.14)), hex(mix(0.36)), hex(mix(0.62)), hex(mix(1)), hex(accent.map((c) => c * 0.62))];
}

export function neutralColors() {
  return { road: '#aeb8bd', noData: '#cdd3d7', selected: '#00212e' };
}
