export type Severity = 'laag' | 'middel' | 'hoog';
export type LngLat = [number, number];

export type IncidentType = 'Ongeval' | 'Pechgeval' | 'Obstakel' | 'Gevaarlijke stof' | 'Brand';
export type IncidentStatus = 'Gemeld' | 'In behandeling' | 'Opgelost';

export interface Incident {
  id: string;
  type: IncidentType;
  road: string;
  direction: string;
  location: string;
  severity: Severity;
  status: IncidentStatus;
  startedAt: Date;
  lanesBlocked: number;
  delayMinutes: number;
  description: string;
  coordinates: LngLat;
}

export type RoadworkStatus = 'Gepland' | 'Actief' | 'Afgerond';
export type RoadworkImpact = 'Afsluiting' | 'Rijstrookbeperking' | 'Beperkte hinder';
export type RoadworkType = 'Onderhoud' | 'Verbreding' | 'Brugrenovatie' | 'Tunnelonderhoud' | 'Asfaltering';

export interface Roadwork {
  id: string;
  title: string;
  type: RoadworkType;
  road: string;
  from: string;
  to: string;
  status: RoadworkStatus;
  impact: RoadworkImpact;
  authority: string;
  start: Date;
  end: Date;
  description: string;
  lanesAffected: string;
  coordinates: LngLat[];
}

export interface TrafficJam {
  id: string;
  road: string;
  direction: string;
  lengthKm: number;
  delayMinutes: number;
  cause: string;
  coordinates: LngLat[];
}

export type SignDisplay = '100' | '90' | '80' | '70' | '50' | 'X' | 'pijl-links' | 'pijl-rechts' | 'leeg';

export interface MatrixSign {
  id: string;
  road: string;
  hectometer: string;
  display: SignDisplay;
  online: boolean;
  coordinates: LngLat;
}

export interface TrafficMeasure {
  id: string;
  name: string;
  type: 'Dynamische snelheid' | 'Spitsstrook' | 'Omleiding' | 'Rijstrooksluiting' | 'Brugbediening';
  roads: string[];
  active: boolean;
  activatedBy: string;
  since?: Date;
  description: string;
}

export type MapKind = 'incident' | 'roadwork' | 'jam' | 'matrix' | 'melding' | 'laadpunt' | 'locatie';
