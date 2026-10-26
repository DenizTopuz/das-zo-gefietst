import { Locatierecord } from './lab-data';

export type LocatieField = 'title' | 'type' | 'location' | 'direction' | 'latitude' | 'longitude';

export interface Finding {
  field: LocatieField;
  message: string;
  /** "Fout" blocks saving; "Aandachtspunt" does not. */
  severity: 'Fout' | 'Aandachtspunt';
}

export type LocatieDraft = Pick<Locatierecord, 'title' | 'type' | 'location' | 'direction' | 'latitude' | 'longitude'>;

const inRange = (value: string, min: number, max: number) => {
  const n = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(n) && n >= min && n <= max;
};

/** Field validation shared by the editor (T4) and the overview (T5). */
export function validateLocatie(d: LocatieDraft): Finding[] {
  const findings: Finding[] = [];
  if (!d.title.trim()) findings.push({ field: 'title', message: 'Naam is verplicht.', severity: 'Fout' });
  else if (d.title.trim().length < 5) findings.push({ field: 'title', message: 'Naam controleren: gebruik minimaal 5 tekens.', severity: 'Aandachtspunt' });
  if (!d.type) findings.push({ field: 'type', message: 'Type is verplicht.', severity: 'Fout' });
  if (!d.location.trim()) findings.push({ field: 'location', message: 'Locatie ontbreekt. Vul een omschrijving in of kies een punt op de kaart.', severity: 'Fout' });
  if (!d.direction) findings.push({ field: 'direction', message: 'Richting controleren: kies een richting.', severity: 'Aandachtspunt' });
  if (!inRange(d.latitude, 50.5, 53.7)) findings.push({ field: 'latitude', message: 'Breedtegraad moet een getal tussen 50,5 en 53,7 zijn.', severity: 'Fout' });
  if (!inRange(d.longitude, 3.0, 7.3)) findings.push({ field: 'longitude', message: 'Lengtegraad moet een getal tussen 3,0 en 7,3 zijn.', severity: 'Fout' });
  return findings;
}

export function statusOf(findings: Finding[]): 'Geldig' | 'Aandachtspunt' | 'Fout' {
  return findings.some((f) => f.severity === 'Fout') ? 'Fout' : findings.length ? 'Aandachtspunt' : 'Geldig';
}

export const FIELD_LABEL: Record<LocatieField, string> = {
  title: 'Naam',
  type: 'Type',
  location: 'Locatie',
  direction: 'Richting',
  latitude: 'Breedtegraad',
  longitude: 'Lengtegraad',
};

/** Records with their validation status filled in. */
export function withStatus(records: readonly Locatierecord[]): Locatierecord[] {
  return records.map((r) => ({ ...r, status: statusOf(validateLocatie(r)) }));
}
