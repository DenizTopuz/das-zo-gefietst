export type PillColor = 'blue' | 'gray' | 'green' | 'purple' | 'red' | 'yellow';

/** Status is always shown as text in a pill: colour is never the only signal. */
export const STATUS_COLOR: Record<string, PillColor> = {
  Nieuw: 'blue',
  Actief: 'yellow',
  'In behandeling': 'purple',
  Gepland: 'gray',
  Afgehandeld: 'green',
  Beschikbaar: 'green',
  Bezet: 'purple',
  Gereserveerd: 'blue',
  Storing: 'red',
  Geldig: 'green',
  Aandachtspunt: 'yellow',
  Fout: 'red',
};

export const statusColor = (status: string): PillColor => STATUS_COLOR[status] ?? 'gray';
