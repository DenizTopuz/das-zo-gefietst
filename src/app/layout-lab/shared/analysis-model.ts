import { computed, Signal } from '@angular/core';
import { dayLabels, labelOf, AREA_OPTIONS, PERIODS, periodOf, series, SOURCES, sourceOf, percent, number } from '../data/analysis';
import { LabRecord } from '../data/lab-data';
import { TemplateState } from '../lab-store';

/** An indicator with its definition and actuality: shown on a KPI card and used for trend, map and the "verdieping". */
export interface Indicator {
  key: string;
  label: string;
  definition: string;
  source: string;
  updated: string;
  unit: string;
  decimals: number;
  /** Value for the records in scope; `f` scales for period and source. */
  value: (records: readonly LabRecord[], f: number) => number;
  format: (value: number) => string;
  /** Per-record weight 0..1 for the size of a map point. */
  weight?: (record: LabRecord, all: readonly LabRecord[]) => number;
}

/**
 * The global scope (period, area, source) and the indicator values derived from it. Every number,
 * chart, map point and table row on the page comes from the same scoped records.
 */
export function createAnalysis(state: TemplateState, all: Signal<readonly LabRecord[]>, indicators: readonly Indicator[]) {
  const period = computed(() => periodOf(state.period()));
  const source = computed(() => sourceOf(state.source()));
  const factor = computed(() => period().factor * source().factor);
  const scoped = computed(() => all().filter((r) => state.area() === 'alle' || r.area === state.area()));
  const scopeKey = computed(() => `${state.period()}|${state.area()}|${state.source()}`);
  const scopeText = computed(() => `${period().label} · ${labelOf(AREA_OPTIONS, state.area())} · ${source().label}`);
  const active = computed(() => indicators.find((i) => i.key === state.indicator()) ?? indicators[0]);

  const values = computed(() => indicators.map((i) => ({ indicator: i, value: i.value(scoped(), factor()) })));
  const trend = computed(() => {
    const i = active();
    const base = i.value(scoped(), factor());
    return series(`${i.key}|${scopeKey()}`, base);
  });
  const previous = computed(() => {
    const i = active();
    return series(`${i.key}|vorig|${scopeKey()}`, i.value(scoped(), factor()) * 0.93);
  });
  const labels = dayLabels();
  const delta = (i: Indicator) => {
    const base = i.value(scoped(), factor());
    const prev = series(`${i.key}|vorig|${scopeKey()}`, base * 0.93).reduce((a, b) => a + b, 0) / 14;
    if (!prev) return '';
    const d = ((base - prev) / prev) * 100;
    return `${d >= 0 ? '+' : '-'}${Math.abs(d).toFixed(1).replace('.', ',')}% t.o.v. vorige periode`;
  };
  const intensity = (r: LabRecord) => active().weight?.(r, scoped()) ?? 0.5;

  return { scoped, scopeText, active, values, trend, previous, labels, delta, intensity, factor, period, source };
}

const isStoring = (r: LabRecord) => r.status === 'Storing';

export const LAADPUNT_INDICATORS: Indicator[] = [
  {
    key: 'bezetting',
    label: 'Bezettingsgraad',
    definition: 'Gemiddeld aandeel van de tijd dat een laadpunt in gebruik is, zonder punten met storing.',
    source: 'Laadnet-registratie',
    updated: 'vandaag 10:42',
    unit: '%',
    decimals: 1,
    value: (rs) => {
      const ok = rs.filter((r) => !isStoring(r)) as unknown as { occupancy: number }[];
      return ok.length ? (ok.reduce((a, r) => a + r.occupancy, 0) / ok.length) * 100 : 0;
    },
    format: percent,
    weight: (r) => (r as unknown as { occupancy: number }).occupancy,
  },
  {
    key: 'sessies',
    label: 'Laadsessies',
    definition: 'Aantal afgeronde laadsessies in de gekozen periode.',
    source: 'Laadnet-registratie',
    updated: 'vandaag 10:42',
    unit: 'sessies',
    decimals: 0,
    value: (rs, f) => (rs as unknown as { sessions: number }[]).reduce((a, r) => a + r.sessions, 0) * f,
    format: number,
    weight: (r, all) => {
      const max = Math.max(1, ...(all as unknown as { sessions: number }[]).map((x) => x.sessions));
      return (r as unknown as { sessions: number }).sessions / max;
    },
  },
  {
    key: 'storingen',
    label: 'Laadpunten met storing',
    definition: 'Aantal laadpunten waarvan de laatste status "Storing" is.',
    source: 'Statusmelding laadpunt',
    updated: 'vandaag 10:40',
    unit: 'punten',
    decimals: 0,
    value: (rs) => rs.filter(isStoring).length,
    format: number,
    weight: (r) => (isStoring(r) ? 1 : 0.15),
  },
  {
    key: 'beschikbaarheid',
    label: 'Beschikbaarheid',
    definition: 'Aandeel laadpunten dat nu niet in storing is.',
    source: 'Statusmelding laadpunt',
    updated: 'vandaag 10:40',
    unit: '%',
    decimals: 1,
    value: (rs) => (rs.length ? (rs.filter((r) => !isStoring(r)).length / rs.length) * 100 : 0),
    format: percent,
    weight: (r) => (isStoring(r) ? 0.1 : 0.8),
  },
];

const ageMinutes = (r: LabRecord) => (Date.now() - r.updatedAt.getTime()) / 60_000;

export const MELDING_INDICATORS: Indicator[] = [
  {
    key: 'datadekking',
    label: 'Datadekking',
    definition: 'Aandeel meldingen met een ingevulde beschrijving.',
    source: 'Meldingenregister',
    updated: 'vandaag 10:42',
    unit: '%',
    decimals: 1,
    value: (rs) => (rs.length ? (rs.filter((r) => r.description.trim()).length / rs.length) * 100 : 0),
    format: percent,
  },
  {
    key: 'meldingen',
    label: 'Meldingen',
    definition: 'Aantal meldingen in de gekozen periode en het gekozen gebied.',
    source: 'Meldingenregister',
    updated: 'vandaag 10:42',
    unit: 'meldingen',
    decimals: 0,
    value: (rs, f) => rs.length * Math.max(f, 0.2) * 24,
    format: number,
  },
  {
    key: 'duur',
    label: 'Gemiddelde duur',
    definition: 'Gemiddelde tijd tussen eerste melding en laatste wijziging, in minuten.',
    source: 'Meldingenregister',
    updated: 'vandaag 10:42',
    unit: 'min',
    decimals: 0,
    value: (rs) => (rs.length ? rs.reduce((a, r) => a + ageMinutes(r), 0) / rs.length : 0),
    format: (v) => `${Math.round(v)} min`,
  },
  {
    key: 'aandacht',
    label: 'Aandachtspunten',
    definition: 'Aantal meldingen met prioriteit Hoog die nog niet zijn afgehandeld.',
    source: 'Meldingenregister',
    updated: 'vandaag 10:40',
    unit: 'meldingen',
    decimals: 0,
    value: (rs) => (rs as unknown as { priority?: string }[]).filter((r, i) => r.priority === 'Hoog' && rs[i].status !== 'Afgehandeld').length,
    format: number,
  },
];

export { PERIODS, SOURCES, AREA_OPTIONS };
