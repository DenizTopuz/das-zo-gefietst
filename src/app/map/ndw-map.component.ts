import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, output, signal } from '@angular/core';
import { MapButtonComponent, MapBackgroundOption, MapDisplayComponent, MapDisplayOption, MapLegendComponent, MapLegendOptionGroup } from '@ndwnu/design-system';
import { MapComponent, NDWMapStyle, NDWOSMMapStyle } from '@ndwnu/map';
import type { FeatureCollection } from 'geojson';
import { ExpressionSpecification, GeoJSONSource, LngLatBounds } from 'maplibre-gl';
import { MapKind } from '../data/models';

type BackgroundStyle = 'nwb' | 'osm';

/** Camera of the map: kept by pages so a map keeps its position when the layout changes. */
export interface MapView {
  center: [number, number];
  zoom: number;
}

/** Emitted after every camera move; `bounds` is [west, south, east, north]. */
export interface MapViewChange extends MapView {
  bounds: [number, number, number, number];
}

const SOURCE_ID = 'app-data';

const KIND_LABELS: Record<MapKind, { name: string; icon: string }> = {
  incident: { name: 'Incidenten', icon: 'warning' },
  roadwork: { name: 'Wegwerkzaamheden', icon: 'construction' },
  jam: { name: 'Files', icon: 'traffic' },
  matrix: { name: 'Matrixborden', icon: 'signpost' },
  melding: { name: 'Meldingen', icon: 'campaign' },
  laadpunt: { name: 'Laadpunten', icon: 'ev_station' },
  locatie: { name: 'Locatierecords', icon: 'pin_drop' },
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
    <div #mapContainer class="map" role="application" [attr.aria-label]="ariaLabel()"></div>

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
  /** GeoJSON features with `id` and `kind` properties; a numeric `intensity` (0..1) scales the point size. */
  readonly features = input.required<FeatureCollection>();
  /** Which kinds are offered in the layer selector. */
  readonly kinds = input<MapKind[]>(['incident', 'roadwork', 'jam', 'matrix']);
  /** Layers that are on until the user changes them. Default: all off. */
  readonly defaultVisibleKinds = input<MapKind[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly showLegend = input(true);
  readonly ariaLabel = input('Verkeerskaart');
  /** Camera to start with. Without it the map fits all data once. */
  readonly initialView = input<MapView | null>(null);

  readonly featureSelected = output<string>();
  readonly viewChanged = output<MapViewChange>();
  /** A click on empty map (not on a feature). */
  readonly mapClicked = output<[number, number]>();

  protected readonly backgrounds = BACKGROUNDS;
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #visibleKinds = signal<MapKind[] | null>(null);
  readonly #styleReady = signal(false);
  #hasFitted = false;
  /** Camera moves are only reported once the first positioning is done (otherwise the default view would be stored). */
  #positioned = false;
  #lastEnsured: string | null = null;
  #resizeObserver?: ResizeObserver;

  protected readonly activeKinds = computed(() => this.#visibleKinds() ?? this.defaultVisibleKinds());
  protected readonly layerOptions = computed<MapDisplayOption[]>(() =>
    this.kinds().map((kind) => ({ id: kind, ...KIND_LABELS[kind], active: this.activeKinds().includes(kind) })),
  );

  protected readonly legend = computed<MapLegendOptionGroup[]>(() => {
    const colors = tokenColors();
    const options: Record<MapKind, MapLegendOptionGroup['options'][number]> = {
      incident: { type: 'circle', label: 'Incident', color: colors.incident },
      roadwork: { type: 'line', label: 'Wegwerkzaamheden', color: colors.roadwork, fillMode: 'dashed' },
      jam: { type: 'line', label: 'File', color: colors.jam, fillMode: 'solid' },
      matrix: { type: 'circle', label: 'Matrixbord', color: colors.matrix },
      melding: { type: 'circle', label: 'Melding', color: colors.melding },
      laadpunt: { type: 'circle', label: 'Laadpunt (grootte = gekozen indicator)', color: colors.laadpunt },
      locatie: { type: 'circle', label: 'Locatierecord', color: colors.locatie },
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

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    // The map must recalculate when its container changes size (docked panels, splitter, view switch).
    this.#resizeObserver = new ResizeObserver(() => {
      const { width, height } = this.#host.nativeElement.getBoundingClientRect();
      if (width > 0 && height > 0) this.map?.resize();
    });
    this.#resizeObserver.observe(this.#host.nativeElement);
  }

  override ngOnDestroy(): void {
    this.#resizeObserver?.disconnect();
    super.ngOnDestroy();
  }

  protected onLoadMap() {
    this.map.on('style.load', () => this.#installLayers());
    this.map.on('moveend', () => this.#emitView());
    this.map.on('click', (event) => {
      const hit = this.map.getLayer('app-points') ? this.map.queryRenderedFeatures(event.point, { layers: ['app-points', 'app-jam', 'app-roadwork'] }) : [];
      if (!hit.length) this.mapClicked.emit([event.lngLat.lng, event.lngLat.lat]);
    });
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

  #emitView() {
    const { width, height } = this.#host.nativeElement.getBoundingClientRect();
    if (!this.#positioned || !width || !height) return; // hidden map: its bounds are meaningless
    const center = this.map.getCenter();
    const b = this.map.getBounds();
    this.viewChanged.emit({ center: [center.lng, center.lat], zoom: this.map.getZoom(), bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] });
  }

  #installLayers() {
    const map = this.map;
    const colors = tokenColors();
    const kindColor = [
      'match',
      ['get', 'kind'],
      'incident', colors.incident,
      'matrix', colors.matrix,
      'melding', colors.melding,
      'laadpunt', colors.laadpunt,
      'locatie', colors.locatie,
      colors.jam,
    ];
    const pointRadius = [
      'match',
      ['get', 'kind'],
      'matrix', 7,
      ['case', ['has', 'intensity'], ['+', 6, ['*', 8, ['to-number', ['get', 'intensity']]]], 10],
    ];

    map.addSource(SOURCE_ID, { type: 'geojson', data: this.features() });
    map.addLayer({ id: 'app-jam-casing', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'jam'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.outline, 'line-width': 9 } });
    map.addLayer({ id: 'app-jam', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'jam'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.jam, 'line-width': 6 } });
    map.addLayer({ id: 'app-roadwork-casing', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'roadwork'], layout: { 'line-join': 'round' }, paint: { 'line-color': colors.outline, 'line-width': 8 } });
    map.addLayer({ id: 'app-roadwork', type: 'line', source: SOURCE_ID, filter: ['==', ['get', 'kind'], 'roadwork'], layout: { 'line-join': 'round' }, paint: { 'line-color': colors.roadwork, 'line-width': 5, 'line-dasharray': [2, 1.5] } });
    map.addLayer({ id: 'app-selected', type: 'circle', source: SOURCE_ID, filter: ['==', ['get', 'id'], ''], paint: { 'circle-radius': 20, 'circle-color': colors.selected, 'circle-opacity': 0.35 } });
    map.addLayer({
      id: 'app-points',
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': pointRadius as never,
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
      this.#positioned = true;
      const view = this.initialView();
      if (view) map.jumpTo({ center: view.center, zoom: view.zoom });
      else this.fitToData();
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

    // Keep the selected object visible: pan only when it is outside the view (or under the controls); never zoom.
    const target = this.features().features.find((f) => f.properties?.['id'] === selected)?.geometry;
    if (selected && selected !== this.#lastEnsured && target?.type === 'Point') {
      const point = target.coordinates as [number, number];
      const inner = this.#visibleArea();
      if (inner && !inner.contains(point)) map.easeTo({ center: point, duration: 400 });
    }
    this.#lastEnsured = selected;
  }

  /** The map bounds minus a margin, so an object right at the edge also counts as "not visible". */
  #visibleArea(): LngLatBounds | null {
    const { width, height } = this.#host.nativeElement.getBoundingClientRect();
    if (!width || !height) return null;
    const margin = 48;
    const sw = this.map.unproject([margin, height - margin]);
    const ne = this.map.unproject([width - margin, margin]);
    return new LngLatBounds(sw, ne);
  }
}

/** MapLibre cannot read CSS variables, so resolve the NDW design tokens at runtime. */
function tokenColors() {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback = '') => style.getPropertyValue(name).trim() || fallback;
  return {
    incident: token('--ndw-color-critical-500'),
    jam: token('--ndw-color-critical-500'),
    roadwork: token('--ndw-color-warning-600') || token('--ndw-color-warning-500'),
    matrix: token('--ndw-color-info-500'),
    melding: token('--ndw-color-critical-500'),
    laadpunt: token('--ndw-color-data-a-500', token('--ndw-color-info-500')),
    locatie: token('--ndw-color-grey-700'),
    selected: token('--ndw-color-primary'),
    outline: token('--ndw-color-white'),
  };
}
