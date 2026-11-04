import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output, signal } from '@angular/core';
import { MapButtonComponent } from '@ndwnu/design-system';
import { MapComponent, NDWMapStyle } from '@ndwnu/map';
import type { ExpressionSpecification } from 'maplibre-gl';
import { accentRamp, neutralColors, ROAD_CLASSES, RoadProps } from './fiets-data';

/** Aanwijzing op de kaart: een wegvak, met de pixelpositie binnen de kaart. */
export interface MapHover {
  props: RoadProps;
  x: number;
  y: number;
}

/** Kaartpositie waar de kaart naartoe vliegt; `n` maakt dezelfde positie opnieuw te kiezen. */
export interface MapFocus {
  lng: number;
  lat: number;
  zoom: number;
  n: number;
}

const SOURCE = 'ndw-nwb-road-sections';
const SOURCE_LAYER = 'roadSections';
/**
 * Kaart voor de fietsdata-verkenner. Alle wegvakken van het Nationaal Wegenbestand (NWB) uit de NDW-basiskaart
 * zijn klikbaar en blijven neutraal grijs; het gekozen wegvak wordt lichtblauw.
 */
@Component({
  selector: 'app-fiets-map',
  imports: [MapButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #mapContainer class="map" role="application" [attr.aria-label]="ariaLabel()"></div>
    <div class="zoom" data-tooltip-side="left">
      <div class="map-control-group" role="group" aria-label="Zoom">
        <ndw-map-button icon="zoom-in" ariaLabel="Inzoomen" (clicked)="map.zoomIn()"></ndw-map-button>
        <ndw-map-button icon="zoom-out" ariaLabel="Uitzoomen" (clicked)="map.zoomOut()"></ndw-map-button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      height: 100%;
      min-height: 320px;
      overflow: hidden;
    }
    .map {
      position: absolute;
      inset: 0;
    }
    .zoom {
      position: absolute;
      right: var(--ndw-spacing-md);
      bottom: var(--ndw-spacing-md);
      z-index: 1;
    }
    .map-control-group {
      display: inline-flex;
      flex-direction: column;
      gap: var(--ndw-border-size-sm);
      overflow: hidden;
      background-color: var(--ndw-color-grey-200);
      border: var(--ndw-border-size-sm) solid var(--ndw-color-grey-200);
      border-radius: var(--ndw-border-radius-sm);
      box-shadow: var(--ndw-elevation-content);
    }
  `,
})
export class FietsMapComponent extends MapComponent {
  readonly selectedRoadId = input<string | null>(null);
  readonly focus = input<MapFocus | null>(null);
  readonly ariaLabel = input('Kaart met wegvakken');

  readonly roadSelected = output<RoadProps>();
  readonly hovered = output<MapHover | null>();

  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #styleReady = signal(false);
  #observer?: ResizeObserver;
  #positioned = false;
  #hoverInterval: ReturnType<typeof setInterval> | null = null;
  #dashStep = 0;
  readonly #dashSeq = [
    [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2],
    [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  ];

  constructor() {
    super();
    effect(() => {
      this.selectedRoadId();
      if (this.#styleReady()) this.#sync();
    });
    effect(() => {
      const focus = this.focus();
      if (focus && this.#styleReady()) this.map.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom, duration: 900 });
    });
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.#observer = new ResizeObserver(() => {
      const { width, height } = this.#host.nativeElement.getBoundingClientRect();
      if (width > 0 && height > 0) this.map?.resize();
    });
    this.#observer.observe(this.#host.nativeElement);
  }

  override ngOnDestroy(): void {
    this.#stopHoverAnim();
    this.#observer?.disconnect();
    super.ngOnDestroy();
  }

  protected onLoadMap() {
    this.map.on('style.load', () => this.#install());
    this.map.setStyle(NDWMapStyle, { diff: false });
  }

  protected onRemoveMap() {
    this.#styleReady.set(false);
  }

  protected onIdle() {}

  #install() {
    const map = this.map;
    const colors = neutralColors();
    const ramp = accentRamp();
    const before = map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id;
    const filter: ExpressionSpecification = ['in', ['get', 'functionalRoadClass'], ['literal', ROAD_CLASSES]];
    const round = { 'line-cap': 'round', 'line-join': 'round' } as const;
    const width = (min: number, mid: number, max: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 9, min, 14, mid, 18, max];

    // Lichte sluier over de basiskaart: de data valt op, de kaart blijft herkenbaar (wireframe-stijl).
    map.addSource('fiets-veil', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] } } });
    map.addLayer({ id: 'veil', type: 'fill', source: 'fiets-veil', paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.55 } }, before);

    map.addLayer({ id: 'roads-halo', type: 'line', source: SOURCE, 'source-layer': SOURCE_LAYER, minzoom: 9, filter, layout: round, paint: { 'line-color': colors.road, 'line-width': width(2, 5, 10) } }, before);
    map.addLayer({
      id: 'roads-line',
      type: 'line',
      source: SOURCE,
      'source-layer': SOURCE_LAYER,
      minzoom: 9,
      filter,
      layout: round,
      paint: { 'line-color': '#ffffff', 'line-width': width(0.6, 3, 7.5) },
    }, before);
    map.addLayer({ id: 'roads-casing', type: 'line', source: SOURCE, 'source-layer': SOURCE_LAYER, minzoom: 9, filter: ['==', ['get', 'roadSectionId'], -1], layout: round, paint: { 'line-color': ramp[3], 'line-width': width(6, 10, 16) } }, before);
    map.addLayer({
      id: 'roads-selected',
      type: 'line',
      source: SOURCE,
      'source-layer': SOURCE_LAYER,
      minzoom: 9,
      filter: ['==', ['get', 'roadSectionId'], -1],
      layout: round,
      paint: { 'line-color': ramp[1], 'line-width': width(3, 6, 11) },
    }, before);
    map.addLayer({ id: 'roads-hit', type: 'line', source: SOURCE, 'source-layer': SOURCE_LAYER, minzoom: 9, filter, layout: round, paint: { 'line-color': '#000000', 'line-opacity': 0, 'line-width': 20 } }, before);

    // Pijlpictogram via canvas zodat het lettertype geen rol speelt
    const dpr = window.devicePixelRatio || 1;
    const sz = Math.round(24 * dpr);
    const c = document.createElement('canvas');
    c.width = sz; c.height = sz;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(7, 5); ctx.lineTo(17, 12); ctx.lineTo(7, 19);
    ctx.stroke();
    map.addImage('fiets-arrow', ctx.getImageData(0, 0, sz, sz), { pixelRatio: dpr });

    // Geselecteerd: vaste pijltjes richting A (NWB geometrierichting)
    map.addLayer({
      id: 'roads-arrows',
      type: 'symbol',
      source: SOURCE,
      'source-layer': SOURCE_LAYER,
      minzoom: 12,
      filter: ['==', ['get', 'roadSectionId'], -1] as ExpressionSpecification,
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 50,
        'icon-image': 'fiets-arrow',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 18, 1.2] as ExpressionSpecification,
        'icon-keep-upright': false,
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: { 'icon-opacity': 0.9 },
    }, before);

    map.on('click', 'roads-hit', (event) => {
      const props = event.features?.[0]?.properties as RoadProps | undefined;
      if (props?.roadSectionId) this.roadSelected.emit(props);
    });
    map.on('mousemove', 'roads-hit', (event) => {
      map.getCanvas().style.cursor = 'pointer';
      const props = event.features?.[0]?.properties as RoadProps | undefined;
      if (props?.roadSectionId) this.hovered.emit({ props, x: event.point.x, y: event.point.y });
    });
    map.on('mouseleave', 'roads-hit', () => {
      map.getCanvas().style.cursor = '';
      this.hovered.emit(null);
    });

    this.#styleReady.set(true);
    this.#sync();
    if (!this.#positioned) {
      this.#positioned = true;
      map.jumpTo({ center: [5.13, 52.083], zoom: 13 });
    }
  }

  #sync() {
    const map = this.map;
    if (!map.getLayer('roads-selected')) return;
    const id = Number(this.selectedRoadId() ?? -1);
    const filter: ExpressionSpecification = ['==', ['get', 'roadSectionId'], id];
    map.setFilter('roads-selected', filter);
    map.setFilter('roads-casing', filter);
    if (map.getLayer('roads-arrows')) map.setFilter('roads-arrows', filter);
  }

  #stopHoverAnim() {
    if (this.#hoverInterval !== null) {
      clearInterval(this.#hoverInterval);
      this.#hoverInterval = null;
    }
    this.#dashStep = 0;
  }

  /** Wacht tot de kaart na een beweging klaar is met laden. */
  whenIdle(): Promise<void> {
    return new Promise((resolve) => {
      const done = () => resolve();
      setTimeout(() => this.map.once('idle', done), 400);
      setTimeout(done, 6000);
    });
  }

  /** Zoekt in de geladen kaartdelen een wegvak op naam of NWB-nummer. Geeft het eerste treffer met een positie terug. */
  findRoad(query: string): { props: RoadProps; lng: number; lat: number } | null {
    const q = query.trim().toLowerCase();
    if (!q || !this.#styleReady()) return null;
    const features = this.map.querySourceFeatures(SOURCE, { sourceLayer: SOURCE_LAYER, filter: ['in', ['get', 'functionalRoadClass'], ['literal', ROAD_CLASSES]] });
    const hit = features.find((f) => String(f.properties?.['roadSectionId']) === q) ?? features.find((f) => String(f.properties?.['roadName'] ?? '').toLowerCase().includes(q));
    if (!hit) return null;
    const g = hit.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
    const line = g.type === 'LineString' ? g.coordinates : g.coordinates[0];
    const [lng, lat] = line[Math.floor(line.length / 2)];
    return { props: hit.properties as RoadProps, lng, lat };
  }
}
