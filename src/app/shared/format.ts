import { Severity } from '../data/models';

export type PillColor = 'blue' | 'gray' | 'green' | 'purple' | 'red' | 'yellow';

export const severityColor: Record<Severity, PillColor> = { laag: 'blue', middel: 'yellow', hoog: 'red' };

export const statusColor: Record<string, PillColor> = {
  Gemeld: 'yellow',
  'In behandeling': 'blue',
  Opgelost: 'green',
  Gepland: 'blue',
  Actief: 'yellow',
  Afgerond: 'green',
};

export const impactColor: Record<string, PillColor> = { Afsluiting: 'red', Rijstrookbeperking: 'yellow', 'Beperkte hinder': 'gray' };

export function minutesAgo(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 60) return `${minutes} min geleden`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} uur geleden` : `${Math.floor(hours / 24)} dagen geleden`;
}
