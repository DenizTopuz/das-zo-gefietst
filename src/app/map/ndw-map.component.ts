import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { MapButtonComponent, MapBackgroundOption, MapDisplayComponent, MapDisplayOption, MapLegendComponent, MapLegendOptionGroup } from '@ndwnu/design-system';
import { MapComponent, NDWMapStyle, NDWOSMMapStyle } from '@ndwnu/map';
import type { FeatureCollection } from 'geojson';
import { ExpressionSpecification, GeoJSONSource, LngLatBounds } from 'maplibre-gl';
import { MapKind } from '../data/models';

type BackgroundStyle = 'nwb' | 'osm';

const SOURCE_ID = 'app-data';

const KIND_LABELS: Record<MapKind, { name: string; icon: string }> = {
  incident: { name: 'Incidenten', icon: 'warning' },
  roadwork: { name: 'Wegwerkzaamheden', icon: 'construction' },
  jam: { name: 'Files', icon: 'traffic' },
  matrix: { name: 'Matrixborden', icon: 'signpost' },
};

const BACKGROUNDS: MapBackgroundOption<BackgroundStyle>[] = [
  { id: 'nwb', name: 'NWB-kaart', style: 'nwb', active: true, imageLink: 'images/map-backgrounds/osm-default-with-nwb-roads.webp', description: 'Basiskaart met NWB-wegen' },
  { id: 'osm', name: 'OSM-kaart', style: 'osm', imageLink: 'images/map-backgrounds/osm-default.webp', description: 'Basiskaart met OpenStreetMap-wegen' },
];

/**
 * Reusable map for all prototype pages. Extends the `@ndwnu/map` MapComponent, always shows the
 * `ndw-map-display` button to switch between the NWB and OSM style and draws the supplied GeoJSON.
 */
@Component({
  selector: 'app-ndw-map',
  imports: [MapButtonComponent, MapDisplayComponent, MapLegendComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #mapContainer class="map" role="application" aria-label="Verkeerskaart"></div>

    <div class="controls" data-tooltip-side="left">
      @if (showLegend() && activeKinds().length) {
        <ndw-map-legend [groups]="legend()"></ndw-map-legend>
      }
      <ndw-map-display
        [backgroundOptions]="backgrounds"
        [layerOptions]="layerOptions()"
        (backgroundChange)="onBackgroundChange($event)"
        (layerChange)="onLayerChange($event)"
      ></ndw-map-display>

      <div class="zoom">
        <ndw-map-button icon="zoom-to-content" ariaLabel="Zoom naar alle data" (clicked)="fitToData()"></ndw-map-button>
        <div class="map-control-group" role="group" aria-label="Zoom">
          <ndw-map-button icon="zoom-in" ariaLabel="Inzoomen" (clicked)="map.zoomIn()"></ndw-map-button>
          <ndw-map-button icon="zoom-out" ariaLabel="Uitzoomen" (clicked)="map.zoomOut()"></ndw-map-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './ndw-map.component.scss',
})
export class NdwMapComponent extends MapComponent {
  /** GeoJSON features with `id` and `kind` properties. */
  readonly features = input.required<FeatureCollection>();
  /** Which kinds are offered in the layer selector. */
  readonly kinds = input<MapKind[]>(['incident', 'roadwork', 'jam', 'matrix']);
  /** Layers that are on until the user changes them. Default: all off. */
  readonly defaultVisibleKinds = input<MapKind[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly showLegend = input(true);
  readonly featureSelected = output<string>();

  protected readonly backgrounds = BACKGROUNDS;
  readonly #visibleKinds = signal<MapKind[] | null>(null);
  readonly #styleReady = signal(false);
  #hasFitted = false;
  #lastCentered: string | null = null;

  protected readonly activeKinds = computed(() => this.#visibleKinds() ?? this.defaultVisibleKinds());
  protected readonly layerOptions = computed<MapDisplayOption[]>(() =>
    this.kinds().map((kind) => ({ id: kind, ...KIND_LABELS[kind], active: this.activeKinds().includes(kind) })),
  );

  protected readonly legend = computed<MapLegendOptionGroup[]>(() => {
    const colors = tokenColors();
    const options = {
      incident: { type: 'circle' as const, label: 'Incident', color: colors.incident },
      roadwork: { type: 'line' as const, label: 'Wegwerkzaamheden', color: colors.roadwork, fillMode: 'dashed' as const },
      jam: { type: 'line' as const, label: 'File', color: colors.jam, fillMode: 'solid' as const },
      matrix: { type: 'circle' as const, label: 'Matrixbord', color: colors.matrix },
    };
    return [{ options: this.activeKinds().map((kind) => options[kind]) }];
  });

  constructor() {
    super();
    effect(() => {
      this.features();
      this.activeKinds();
      this.selectedId();
      if (this.#styleReady()) this.#sync();
    });
  }

  protected onLoadMap() {
    this.map.on('style.load', () => this.#installLayers());
    this.map.setStyle(NDWMapStyle, { diff: false });
  }

  protected onRemoveMap() {
    this.#styleReady.set(false);
  }

  protected onIdle() {}

  protected onBackgroundChange(option: MapBackgroundOption) {
    this.#styleReady.set(false);
    this.map.setStyle(option.style === 'osm' ? NDWOSMMapStyle : NDWMapStyle, { diff: false });
  }

  protected onLayerChange(option: MapDisplayOption) {
    const kind = option.id as MapKind;
    const current = this.activeKinds();
    this.#visibleKinds.set(current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind]);
  }

  fitToData() {
    const bounds = new LngLatBounds();
    for (const feature of this.features().features) {
      const geometry = feature.geometry;
      if (geometry.type === 'Point') bounds.extend(geometry.coordinates as [number, number]);
      if (geometry.type === 'LineString') geometry.coordinates.forEach((c) => bounds.extend(c as [number, number]));
    }
    if (!bounds.isEmpty()) this.map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 600 });
  }

  #installLayers() {
    const map = this.map;
    const colors = tokenColors();
    const kindColor = ['match', ['get', 'kind'], 'incident', colors.incident, 'matrix', colors.matrix, colors.jam];

    map.addSource(SOURCE_ID, { type: 'geojson', data: this.features() });
    map.addLayer({ id: 'app-jam-casing', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'jam'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.outline, 'line-width': 9 } });
    map.addLayer({ id: 'app-jam', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'jam'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.jam, 'line-width': 6 } });
    map.addLayer({ id: 'app-roadwork-casing', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'roadwork'], layout: { 'line-join': 'round' }, paint: { 'line-color': colors.outline, 'line-width': 8 } });
    map.addLayer({ id: 'app-roadwork', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'roadwork'], layout: { 'line-join': 'round' }, paint: { 'line-color': colors.roadwork, 'line-width': 5, 'line-dasharray': [2, 1.5] } });
    map.addLayer({ id: 'app-selected', type: 'circle', source: SOURCE_ID, filter: ['==', ['get', 'id'], ''], paint: { 'circle-radius': 18, 'circle-color': colors.selected, 'circle-opacity': 0.35 } });
    map.addLayer({
      id: 'app-points',
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': ['match', ['get', 'kind'], 'matrix', 7, 10],
        'circle-color': kindColor as never,
        'circle-stroke-color': colors.outline,
        'circle-stroke-width': 2,
      },
    });

    for (const layer of ['app-points', 'app-jam', 'app-roadwork']) {
      map.on('click', layer, (event) => {
        const id = event.features?.[0]?.properties?.['id'];
        if (id) this.featureSelected.emit(String(id));
      });
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }

    this.#styleReady.set(true);
    this.#sync();
    if (!this.#hasFitted) {
      this.#hasFitted = true;
      this.fitToData();
    }
  }

  #sync() {
    const map = this.map;
    if (!map.getSource(SOURCE_ID)) return;
    (map.getSource(SOURCE_ID) as GeoJSONSource).setData(this.features());

    const kinds = this.activeKinds();
    const inKinds = ['in', ['get', 'kind'], ['literal', kinds]] as ExpressionSpecification;
    map.setFilter('app-jam', ['all', ['==', ['get', 'kind'], 'jam'], inKinds]);
    map.setFilter('app-jam-casing', ['all', ['==', ['get', 'kind'], 'jam'], inKinds]);
    map.setFilter('app-roadwork', ['all', ['==', ['get', 'kind'], 'roadwork'], inKinds]);
    map.setFilter('app-roadwork-casing', ['all', ['==', ['get', 'kind'], 'roadwork'], inKinds]);
    map.setFilter('app-points', ['all', ['==', ['geometry-type'], 'Point'], inKinds]);

    const selected = this.selectedId();
    map.setFilter('app-selected', ['all', ['==', ['get', 'id'], selected ?? ''], inKinds, ['==', ['geometry-type'], 'Point']]);

    const target = this.features().features.find((f) => f.properties?.['id'] === selected)?.geometry;
    if (selected && selected !== this.#lastCentered && target?.type === 'Point') {
      map.easeTo({ center: target.coordinates as [number, number], zoom: Math.max(map.getZoom(), 11), duration: 600 });
    }
    this.#lastCentered = selected;
  }
}

/** MapLibre cannot read CSS variables, so resolve the NDW design tokens at runtime. */
function tokenColors() {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    incident: token('--ndw-color-critical-500'),
    jam: token('--ndw-color-critical-500'),
    roadwork: token('--ndw-color-warning-600') || token('--ndw-color-warning-500'),
    matrix: token('--ndw-color-info-500'),
    selected: token('--ndw-color-primary'),
    outline: token('--ndw-color-white'),
  };
}
