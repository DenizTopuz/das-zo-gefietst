import type { Feature, FeatureCollection } from 'geojson';
import { LngLat, MapKind } from '../../data/models';

const MIN = 60_000;
const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * MIN);

/** Common shape of every record shown in results, on the map and in the detail. */
export interface LabRecord {
  id: string;
  title: string;
  type: string;
  status: string;
  location: string;
  area: string;
  owner: string;
  updatedAt: Date;
  description: string;
  coordinates: LngLat;
}

export interface Melding extends LabRecord {
  priority: 'Hoog' | 'Normaal' | 'Laag';
}

export interface Laadpunt extends LabRecord {
  occupancy: number; // 0..1
  sessions: number;
  powerKw: number;
}

export interface Locatierecord extends LabRecord {
  direction: string;
  latitude: string;
  longitude: string;
}

export const GEBIEDEN = ['Flevoland', 'Utrecht', 'Noord-Holland'] as const;

// ───────────────────────── Meldingen (T1, T2, T6) ─────────────────────────
const melding = (
  id: string,
  title: string,
  type: string,
  status: string,
  location: string,
  area: string,
  owner: string,
  minutesAgo: number,
  description: string,
  coordinates: LngLat,
  priority: Melding['priority'] = 'Normaal',
): Melding => ({ id, title, type, status, location, area, owner, updatedAt: ago(minutesAgo), description, coordinates, priority });

export const MELDINGEN: Melding[] = [
  melding('M-102', 'Wegwerkzaamheden', 'Wegwerkzaamheden', 'Actief', 'A6 · Almere', 'Flevoland', 'Wegbeheerder', 8, 'Asfaltonderhoud op de rechterrijstrook; de linkerrijstrook blijft open.', [5.2417, 52.3702]),
  melding('M-103', 'Afsluiting', 'Afsluiting', 'In behandeling', 'A1 · Muiden', 'Noord-Holland', 'Wegbeheerder', 11, 'Werkzaamheden op de rijbaan. Beide rijstroken zijn afgesloten; omleiding via de N236.', [5.0731, 52.3312], 'Hoog'),
  melding('M-104', 'Melding', 'Melding', 'Nieuw', 'N305 · Zeewolde', 'Flevoland', 'Verkeersleider regio Midden', 19, 'Voertuig met pech op de vluchtstrook, geen hinder voor het verkeer.', [5.5412, 52.3321], 'Laag'),
  melding('M-105', 'Verkeerssituatie', 'Verkeerssituatie', 'Actief', 'A27 · Huizen', 'Noord-Holland', 'Verkeersleider regio Midden', 25, 'Drukte door een evenement; matrixborden tonen een lagere snelheid.', [5.2412, 52.2981]),
  melding('M-106', 'Controle', 'Controle', 'Gepland', 'N702 · Almere', 'Flevoland', 'Inspecteur', 36, '', [5.3002, 52.4008], 'Laag'),
  melding('M-107', 'Werkvak', 'Werkvak', 'Actief', 'A6 · Lelystad', 'Flevoland', 'Wegbeheerder', 48, 'Vervangen van geleiderail tussen afrit 9 en 10.', [5.4721, 52.5012]),
  melding('M-108', 'Storing matrixbord boven rijbaan richting knooppunt Almere-Stad en Almere-Haven', 'Storing', 'Nieuw', 'A6 · Almere-Stad', 'Flevoland', 'Technisch beheer', 3, 'Bord toont geen informatie. Een monteur is gevraagd; tot die tijd geldt de maximumsnelheid zonder aanduiding.', [5.2217, 52.3601], 'Hoog'),
  melding('M-109', 'Gladheid', 'Gladheid', 'In behandeling', 'A28 · Amersfoort', 'Utrecht', 'Strooidienst', 14, 'Strooiwagens zijn onderweg naar het traject. Verwacht effect binnen 30 minuten.', [5.3721, 52.1802], 'Hoog'),
  melding('M-110', 'Afsluiting rijstrook', 'Afsluiting', 'Actief', 'A12 · Utrecht', 'Utrecht', 'Wegbeheerder', 62, 'Rechterrijstrook dicht voor onderhoud aan een viaduct.', [5.1112, 52.0912]),
  melding('M-111', 'Controle brugdek', 'Controle', 'Afgehandeld', 'A9 · Alkmaar', 'Noord-Holland', 'Inspecteur', 120, 'Controle afgerond; geen bijzonderheden.', [4.7412, 52.6312], 'Laag'),
  melding('M-112', 'Melding vallende lading', 'Melding', 'Nieuw', 'A2 · Breukelen', 'Utrecht', 'Verkeersleider regio West', 5, 'Lading op de linkerrijstrook. Berging is gealarmeerd.', [5.0042, 52.1702], 'Hoog'),
  melding('M-113', 'Werkvak nachtonderhoud', 'Werkvak', 'Gepland', 'A1 · Hilversum', 'Noord-Holland', 'Wegbeheerder', 180, '', [5.1822, 52.2212]),
  melding('M-114', 'Verkeerssituatie na evenement', 'Verkeerssituatie', 'Afgehandeld', 'A6 · Almere', 'Flevoland', 'Verkeersleider regio Midden', 240, 'Verkeer is weer vloeiend verlopen.', [5.2717, 52.3902], 'Laag'),
];

export const MELDING_STATUSSEN = ['Nieuw', 'Actief', 'In behandeling', 'Gepland', 'Afgehandeld'];
export const MELDING_TYPEN = ['Afsluiting', 'Controle', 'Gladheid', 'Melding', 'Storing', 'Verkeerssituatie', 'Wegwerkzaamheden', 'Werkvak'];

// ───────────────────────── Laadpunten (T3) ─────────────────────────
const laadpunt = (
  id: string,
  title: string,
  status: string,
  location: string,
  area: string,
  owner: string,
  occupancy: number,
  sessions: number,
  powerKw: number,
  minutesAgo: number,
  coordinates: LngLat,
): Laadpunt => ({
  id,
  title,
  type: powerKw >= 50 ? 'Snellader' : 'Normaal',
  status,
  location,
  area,
  owner,
  updatedAt: ago(minutesAgo),
  description: `${powerKw} kW · ${sessions} sessies in de gekozen periode`,
  coordinates,
  occupancy,
  sessions,
  powerKw,
});

export const LAADPUNTEN: Laadpunt[] = [
  laadpunt('LP-101', 'Almere Centrum', 'Beschikbaar', 'Stadhuisplein, Almere', 'Flevoland', 'Laadnet Flevoland', 0.38, 212, 22, 2, [5.2144, 52.3722]),
  laadpunt('LP-102', 'Almere Station Poort', 'Beschikbaar', 'Stationsplein, Almere', 'Flevoland', 'Laadnet Flevoland', 0.54, 301, 50, 2, [5.2522, 52.3752]),
  laadpunt('LP-103', 'Nobelhorst', 'Bezet', 'Nobelhorst, Almere', 'Flevoland', 'Laadnet Flevoland', 0.71, 188, 22, 1, [5.3222, 52.3552]),
  laadpunt('LP-104', 'Station Lelystad', 'Beschikbaar', 'Stationsplein, Lelystad', 'Flevoland', 'Laadnet Flevoland', 0.29, 96, 22, 4, [5.4752, 52.5052]),
  laadpunt('LP-105', 'Utrecht Centraal, kantoorzijde met overdekte laadplaatsen', 'Bezet', 'Jaarbeursplein, Utrecht', 'Utrecht', 'Laadnet Midden', 0.88, 412, 150, 1, [5.1052, 52.0902]),
  laadpunt('LP-106', 'Leidsche Rijn', 'Storing', 'Hoge Weide, Utrecht', 'Utrecht', 'Laadnet Midden', 0, 0, 22, 12, [5.0322, 52.0852]),
  laadpunt('LP-107', 'Amersfoort Vathorst', 'Beschikbaar', 'Vathorst, Amersfoort', 'Utrecht', 'Laadnet Midden', 0.33, 140, 22, 3, [5.4052, 52.2002]),
  laadpunt('LP-108', 'De Uithof', 'Gereserveerd', 'Heidelberglaan, Utrecht', 'Utrecht', 'Laadnet Midden', 0.62, 251, 50, 6, [5.1722, 52.0852]),
  laadpunt('LP-109', 'Zaandam Inverdan', 'Beschikbaar', 'Inverdan, Zaandam', 'Noord-Holland', 'Laadnet Noord', 0.41, 177, 22, 2, [4.8222, 52.4352]),
  laadpunt('LP-110', 'Alkmaar Station', 'Bezet', 'Stationsweg, Alkmaar', 'Noord-Holland', 'Laadnet Noord', 0.79, 266, 50, 1, [4.7402, 52.6372]),
  laadpunt('LP-111', 'Hilversum Mediapark', 'Beschikbaar', 'Mediapark, Hilversum', 'Noord-Holland', 'Laadnet Noord', 0.22, 88, 22, 9, [5.1722, 52.2352]),
  laadpunt('LP-112', 'Schiphol Plaza', 'Storing', 'Schiphol Plaza, Haarlemmermeer', 'Noord-Holland', 'Laadnet Noord', 0, 0, 150, 25, [4.7622, 52.3092]),
];

export const LAADPUNT_STATUSSEN = ['Beschikbaar', 'Bezet', 'Gereserveerd', 'Storing'];

// ───────────────────────── Locatierecords (T4, T5) ─────────────────────────
const locatie = (
  id: string,
  title: string,
  type: string,
  location: string,
  area: string,
  owner: string,
  direction: string,
  latitude: string,
  longitude: string,
  minutesAgo: number,
  coordinates: LngLat,
): Locatierecord => ({
  id,
  title,
  type,
  status: 'Geldig',
  location,
  area,
  owner,
  updatedAt: ago(minutesAgo),
  description: '',
  coordinates,
  direction,
  latitude,
  longitude,
});

export const LOCATIERECORDS: Locatierecord[] = [
  locatie('VILD-32186', 'Aansluiting Almere', 'Aansluiting', '', 'Flevoland', 'Wegbeheerder', 'Oost', '', '', 15, [5.2417, 52.3702]),
  locatie('VILD-32187', 'Knp', 'Knooppunt', 'A6 / A27, Almere', 'Flevoland', 'Wegbeheerder', '', '52.3790', '5.2910', 22, [5.291, 52.379]),
  locatie('VILD-32188', 'Kruising Zeewolde-Zuid', 'Kruising', 'N305, Zeewolde', 'Flevoland', 'Provincie Flevoland', 'Noord', '52.3321', '5.5412', 44, [5.5412, 52.3321]),
  locatie('VILD-32189', 'Afrit Muiden', 'Afrit', 'A1, Muiden', 'Noord-Holland', 'Wegbeheerder', 'West', '52.3312', '5.0731', 61, [5.0731, 52.3312]),
  locatie('VILD-32190', 'Aansluiting Huizen', 'Aansluiting', 'A27, Huizen', 'Noord-Holland', 'Wegbeheerder', 'Zuid', '52.2981', '5.2412', 75, [5.2412, 52.2981]),
  locatie('VILD-32191', 'Knooppunt Hoevelaken met lange aanduiding voor de verbindingsbogen', 'Knooppunt', 'A1 / A28, Hoevelaken', 'Utrecht', 'Wegbeheerder', 'Zuid', '52.1702', '5.4452', 120, [5.4452, 52.1702]),
  locatie('VILD-32192', 'Kruising Lelystad-Noord', 'Kruising', 'N302, Lelystad', 'Flevoland', 'Provincie Flevoland', 'Oost', '52.5012', '5.4721', 130, [5.4721, 52.5012]),
  locatie('VILD-32193', 'Afrit Utrecht-Centrum', 'Afrit', 'A12, Utrecht', 'Utrecht', 'Wegbeheerder', 'West', '52.0912', '5.1112', 160, [5.1112, 52.0912]),
  locatie('VILD-32194', 'Aansluiting Alkmaar-Zuid', 'Aansluiting', 'A9, Alkmaar', 'Noord-Holland', 'Wegbeheerder', 'Noord', '52.6312', '4.7412', 200, [4.7412, 52.6312]),
  locatie('VILD-32195', 'Kruising Breukelen', 'Kruising', 'A2, Breukelen', 'Utrecht', 'Wegbeheerder', 'Zuid', '52.1702', '5.0042', 240, [5.0042, 52.1702]),
  locatie('VILD-32196', 'Afrit Hilversum', 'Afrit', 'A1, Hilversum', 'Noord-Holland', 'Wegbeheerder', 'Oost', '52.2212', '5.1822', 300, [5.1822, 52.2212]),
  locatie('VILD-32197', 'Aansluiting Zaandam', 'Aansluiting', 'A8, Zaandam', 'Noord-Holland', 'Wegbeheerder', '', '52.4352', '4.8222', 360, [4.8222, 52.4352]),
];

export const LOCATIE_TYPEN = ['Aansluiting', 'Afrit', 'Knooppunt', 'Kruising'];
export const RICHTINGEN = ['Noord', 'Oost', 'Zuid', 'West'];

// ───────────────────────── Kaartdata ─────────────────────────
export function pointFeatures(records: readonly LabRecord[], kind: MapKind, extra?: (r: LabRecord) => Record<string, unknown>): FeatureCollection {
  const features: Feature[] = records.map((r) => ({
    type: 'Feature',
    properties: { id: r.id, kind, label: `${r.id} ${r.title}`, ...(extra?.(r) ?? {}) },
    geometry: { type: 'Point', coordinates: r.coordinates },
  }));
  return { type: 'FeatureCollection', features };
}

/** Time of the last update, as in the wireframes ("10:42"), or "x min geleden" for the most recent ones. */
export function updatedLabel(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / MIN);
  if (minutes < 60) return `${Math.max(minutes, 1)} min geleden`;
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}
