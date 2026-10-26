import { GEBIEDEN } from './lab-data';

export interface Option {
  value: string;
  label: string;
}

/** Global scope of T3 and T6: it applies to every indicator, chart, map and table on the page. */
export const PERIODS: (Option & { factor: number; seed: number })[] = [
  { value: 'september-2026', label: 'September 2026', factor: 1, seed: 3 },
  { value: 'augustus-2026', label: 'Augustus 2026', factor: 0.92, seed: 5 },
  { value: 'laatste-7-dagen', label: 'Laatste 7 dagen', factor: 0.24, seed: 7 },
];

export const AREA_OPTIONS: Option[] = [{ value: 'alle', label: 'Alle gebieden' }, ...GEBIEDEN.map((g) => ({ value: g, label: g }))];

export const SOURCES: (Option & { factor: number })[] = [
  { value: 'registratie', label: 'Laadnet-registratie', factor: 1 },
  { value: 'meting', label: 'Belastingmeting', factor: 0.93 },
];

export const periodOf = (value: string) => PERIODS.find((p) => p.value === value) ?? PERIODS[0];
export const sourceOf = (value: string) => SOURCES.find((s) => s.value === value) ?? SOURCES[0];
export const labelOf = (options: readonly Option[], value: string) => options.find((o) => o.value === value)?.label ?? value;

const hash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Deterministic demo series (same scope → same line), `points` days ending today. */
export function series(key: string, base: number, points = 14, amplitude = 0.16): number[] {
  const h = hash(key);
  return Array.from({ length: points }, (_, i) => {
    const wave = Math.sin(i * 0.85 + (h % 7)) * amplitude;
    const noise = ((((h >> (i % 11)) + i * 17) % 13) / 13 - 0.5) * 0.08;
    return Math.max(0, base * (1 + wave + noise + i * 0.004));
  });
}

export const dayLabels = (points = 14) =>
  Array.from({ length: points }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (points - 1 - i));
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  });

export const percent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;
export const number = (value: number) => Math.round(value).toLocaleString('nl-NL');
