import { computed, Injectable, signal } from '@angular/core';
import type { Feature, FeatureCollection } from 'geojson';
import { INCIDENTS, MATRIX_SIGNS, MEASURES, ROADWORKS, TRAFFIC_JAMS } from './mock-data';
import { MapKind } from './models';

@Injectable({ providedIn: 'root' })
export class TrafficDataService {
  readonly incidents = signal(INCIDENTS);
  readonly roadworks = signal(ROADWORKS);
  readonly jams = signal(TRAFFIC_JAMS);
  readonly matrixSigns = signal(MATRIX_SIGNS);
  readonly measures = signal(MEASURES);

  readonly openIncidents = computed(() => this.incidents().filter((i) => i.status !== 'Opgelost'));
  readonly activeRoadworks = computed(() => this.roadworks().filter((r) => r.status === 'Actief'));
  readonly activeMeasures = computed(() => this.measures().filter((m) => m.active));
  readonly totalJamKm = computed(() => this.jams().reduce((sum, j) => sum + j.lengthKm, 0));
  readonly totalDelay = computed(() => this.jams().reduce((sum, j) => sum + j.delayMinutes, 0));

  incident(id: string) {
    return this.incidents().find((i) => i.id === id);
  }

  roadwork(id: string) {
    return this.roadworks().find((r) => r.id === id);
  }

  /** All map data as one GeoJSON collection; `kind` + `id` properties drive styling and selection. */
  readonly allFeatures = computed<FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: [
      ...this.jams().map((j) => line(j.id, 'jam', j.coordinates, { label: `${j.road} richting ${j.direction}` })),
      ...this.roadworks()
        .filter((r) => r.status !== 'Afgerond')
        .map((r) => line(r.id, 'roadwork', r.coordinates, { label: r.title, status: r.status })),
      ...this.incidents()
        .filter((i) => i.status !== 'Opgelost')
        .map((i) => point(i.id, 'incident', i.coordinates, { label: `${i.type} ${i.road}`, severity: i.severity })),
      ...this.matrixSigns().map((m) => point(m.id, 'matrix', m.coordinates, { label: `${m.road} ${m.hectometer}`, display: m.display })),
    ],
  }));

  featuresFor(kinds: MapKind[]): FeatureCollection {
    return { type: 'FeatureCollection', features: this.allFeatures().features.filter((f) => kinds.includes(f.properties?.['kind'])) };
  }
}

const line = (id: string, kind: MapKind, coordinates: number[][], props: object = {}): Feature => ({
  type: 'Feature',
  properties: { id, kind, ...props },
  geometry: { type: 'LineString', coordinates },
});

const point = (id: string, kind: MapKind, coordinates: number[], props: object = {}): Feature => ({
  type: 'Feature',
  properties: { id, kind, ...props },
  geometry: { type: 'Point', coordinates },
});
