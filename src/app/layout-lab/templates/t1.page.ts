import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, Injector, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonDirective, IconComponent, PillComponent, SwitcherComponent, SwitcherOption, ToastService } from '@ndwnu/design-system';
import { MapViewChange, NdwMapComponent } from '../../map/ndw-map.component';
import { MELDINGEN, Melding, MELDING_STATUSSEN, MELDING_TYPEN, pointFeatures, updatedLabel } from '../data/lab-data';
import { bindUrlState, EMPTY_FILTERS, hostWidth, LabStore } from '../lab-store';
import { LabDialogs } from '../shared/dialogs';
import { FilterGroup, FilterPanelComponent } from '../shared/filter-panel.component';
import { DetailData, ObjectDetailComponent } from '../shared/object-detail.component';
import { createResults } from '../shared/results-model';
import { ScopeToolbarComponent } from '../shared/scope-toolbar.component';
import { ScreenHeaderComponent } from '../shared/screen-header.component';
import { statusColor } from '../shared/status';
import { StatusMessageComponent } from '../shared/status-message.component';

const NARROW = 760;
const MIN_MAIN = 480;
const DOCK_FILTERS = 320;
const GAP = 16;

const FILTER_GROUPS: FilterGroup[] = [
  { key: 'status', label: 'Status', options: MELDING_STATUSSEN },
  { key: 'type', label: 'Type melding', options: MELDING_TYPEN },
];

/** T1 · Kaart verkennen: de kaart is de werkruimte; filters en details verschijnen wanneer nodig. */
@Component({
  selector: 'app-t1',
  imports: [ButtonDirective, FilterPanelComponent, IconComponent, NdwMapComponent, ObjectDetailComponent, PillComponent, ScopeToolbarComponent, ScreenHeaderComponent, StatusMessageComponent, SwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-header title="Meldingen op de kaart" />

    <app-scope-toolbar
      [(search)]="state.search"
      searchLabel="Zoek op de kaart"
      placeholder="Zoek op naam of ID"
      [filterCount]="results.activeFilterCount()"
      [filtersOpen]="panelMode() !== 'none'"
      filtersId="t1-panel"
      scope="Midden-Nederland"
      (filtersToggle)="togglePanel()"
    >
      @if (narrow()) {
        <div role="group" aria-label="Weergave">
          <ndw-switcher [options]="viewOptions" [selectedValue]="state.view() === 'lijst' ? 'lijst' : 'kaart'" (selectionChange)="state.view.set($any($event))"></ndw-switcher>
        </div>
      }
      <button ndwButton secondary type="button" (click)="showResults()"><ndw-icon>table_rows</ndw-icon> Resultaten tonen</button>
    </app-scope-toolbar>

    <p class="sr-only" role="status" aria-live="polite">{{ countText() }}</p>

    <div class="workspace">
      @if (panelMode() !== 'none') {
        <aside id="t1-panel" [class]="panelMode() === 'dock' ? 'dock dock--filters' : 'overlay'" aria-label="Filters en lagen" (keydown.escape)="state.filtersOpen.set(false)">
          <app-filter-panel
            [mode]="panelMode() === 'dock' ? 'dock' : 'overlay'"
            title="Filters & lagen"
            [groups]="filterGroups"
            [filters]="state.filters()"
            scopeText="Deze filters gelden voor de kaart en de lijst met objecten. Kaartlagen en legenda staan in de knoppen op de kaart."
            (filtersChange)="state.filters.set($event)"
            (closed)="state.filtersOpen.set(false)"
          />
          <section class="objects" aria-labelledby="t1-objects">
            <h3 id="t1-objects" class="ndw-heading-sm">Objecten ({{ results.filtered().length }})</h3>
            <p class="ndw-paragraph-sm hint">Kies een object hier of op de kaart.</p>
            <ul>
              @for (r of results.filtered(); track r.id) {
                <li>
                  <button type="button" class="object" [attr.aria-current]="r.id === state.selectedId() ? 'true' : null" [class.object--selected]="r.id === state.selectedId()" (click)="openDetail(r.id)">
                    <span class="ndw-paragraph-bold-md">{{ r.id }} · {{ r.title }}</span>
                    <span class="ndw-paragraph-sm">{{ r.status }} · {{ r.location }}</span>
                  </button>
                </li>
              }
            </ul>
          </section>
        </aside>
      }

      <div class="main" [hidden]="detailMode() === 'view'">
        <div class="map-pane" [hidden]="narrow() && state.view() === 'lijst'">
          <app-ndw-map
            [features]="features()"
            [kinds]="['melding']"
            [defaultVisibleKinds]="['melding']"
            [selectedId]="state.selectedId()"
            [initialView]="state.mapView()"
            ariaLabel="Kaart met meldingen"
            (featureSelected)="onMarker($event)"
            (viewChanged)="onView($event)"
          />

          @if (statusKind(); as kind) {
            <div class="overlay-message">
              <app-status-message [kind]="kind" [text]="kind === 'empty' ? 'Pas de filters aan of beweeg de kaart.' : ''" (retry)="retry()" (clear)="clearAll()" />
            </div>
          }

          @if (preview(); as p) {
            <section class="preview" aria-label="Voorbeeld van geselecteerd object">
              <header>
                <h3 class="ndw-paragraph-bold-lg">{{ p.id }} · {{ p.title }}</h3>
                <button ndwButton tertiary extra-small type="button" aria-label="Sluit voorbeeld" (click)="previewId.set(null)"><ndw-icon>close</ndw-icon></button>
              </header>
              <ndw-pill [color]="color(p.status)">{{ p.status }}</ndw-pill>
              <p class="ndw-paragraph-md">{{ p.location }} · bijgewerkt {{ updated(p) }}</p>
              <button ndwButton type="button" (click)="openDetail(p.id)">Bekijk details</button>
            </section>
          }
        </div>

        @if (narrow() && state.view() === 'lijst') {
          <div class="pane">
            <ul class="cards" aria-label="Objecten">
              @for (r of results.filtered(); track r.id) {
                <li>
                  <button type="button" class="card" [attr.data-card-id]="r.id" [attr.aria-current]="r.id === state.selectedId() ? 'true' : null" [class.card--selected]="r.id === state.selectedId()" (click)="openDetail(r.id)">
                    <strong class="ndw-paragraph-bold-lg">{{ r.id }} · {{ r.title }}</strong>
                    <span class="ndw-paragraph-md">{{ r.location }}</span>
                    <ndw-pill [color]="color(r.status)">{{ r.status }}</ndw-pill>
                  </button>
                </li>
              }
            </ul>
          </div>
        }
      </div>

      @if (detailMode() !== 'none' && detail(); as d) {
        <aside [class]="detailMode() === 'dock' ? 'dock dock--detail' : 'detail-view'" [class.dock--wide]="state.detailWide() && detailMode() === 'dock'" aria-label="Details van geselecteerd object">
          <app-object-detail [data]="d" [mode]="detailMode() === 'dock' ? 'dock' : 'view'" backLabel="kaart" (closed)="closeDetail()">
            <ng-container actions>
              <button ndwButton secondary type="button" (click)="showResults()">Resultaten tonen</button>
            </ng-container>
          </app-object-detail>
        </aside>
      }
    </div>
  `,
  styleUrl: './list-templates.scss',
  styles: `
    .preview {
      position: absolute;
      z-index: 2;
      left: var(--ndw-spacing-md);
      bottom: var(--ndw-spacing-lg);
      width: min(20rem, calc(100% - 2 * var(--ndw-spacing-md)));
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ndw-spacing-xs);
      padding: var(--ndw-spacing-md);
      background: var(--ndw-color-white);
      border: var(--ndw-border-size-sm) solid var(--ndw-color-grey-200);
      border-radius: var(--ndw-border-radius-md);
      box-shadow: var(--ndw-elevation-popover);

      header {
        display: flex;
        width: 100%;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--ndw-spacing-xs);
      }

      h3,
      p {
        margin: 0;
      }
    }

    .overlay-message {
      position: absolute;
      z-index: 3;
      inset: var(--ndw-spacing-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;

      app-status-message {
        pointer-events: auto;
        max-width: 28rem;
        background: var(--ndw-color-white);
        border-radius: var(--ndw-border-radius-md);
        box-shadow: var(--ndw-elevation-popover);
      }
    }

    .objects {
      padding: 0 var(--ndw-spacing-md) var(--ndw-spacing-md);

      h3,
      p {
        margin: 0 0 var(--ndw-spacing-xs);
      }

      .hint {
        color: var(--ndw-color-grey-600);
      }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--ndw-spacing-2xs);
      }
    }

    .object {
      all: unset;
      box-sizing: border-box;
      width: 100%;
      display: flex;
      flex-direction: column;
      padding: var(--ndw-spacing-xs) var(--ndw-spacing-sm);
      border-radius: var(--ndw-border-radius-sm);
      cursor: pointer;

      &:hover {
        background: var(--ndw-color-grey-100);
      }

      &--selected {
        background: var(--ndw-color-info-100);
      }

      &:focus-visible {
        outline: var(--ndw-border-size-md) solid var(--ndw-color-warning-500);
        outline-offset: calc(var(--ndw-border-size-md) * -1);
      }
    }
  `,
})
export class T1Page {
  readonly #store = inject(LabStore);
  readonly #dialogs = inject(LabDialogs);
  readonly #router = inject(Router);
  readonly #toast = inject(ToastService);
  readonly #injector = inject(Injector);
  protected readonly state = this.#store.state('t1');
  protected readonly width = hostWidth();

  protected readonly records = signal<Melding[]>([...MELDINGEN]);
  protected readonly results = createResults(this.records, this.state);
  protected readonly filterGroups = FILTER_GROUPS;
  protected readonly color = statusColor;
  protected readonly updated = (r: Melding) => updatedLabel(r.updatedAt);
  protected readonly viewOptions: SwitcherOption[] = [
    { value: 'kaart', label: 'Kaart', icon: 'map' },
    { value: 'lijst', label: 'Lijst', icon: 'list' },
  ];
  /** A marker click first shows a short preview; the full detail opens from there. */
  protected readonly previewId = signal<string | null>(null);

  protected readonly narrow = computed(() => this.width() < NARROW);
  protected readonly detailWidth = computed(() => (this.state.detailWide() ? 560 : 400));
  protected readonly hasDetail = computed(() => this.state.detailOpen() && !!this.results.selected());
  protected readonly detailMode = computed<'none' | 'dock' | 'view'>(() => {
    if (!this.hasDetail()) return 'none';
    return this.narrow() || this.width() < MIN_MAIN + this.detailWidth() + 2 * GAP ? 'view' : 'dock';
  });
  /** The filters & objects panel: docked if map, panel and detail all fit, an overlay when tight; a dialog on narrow screens. */
  protected readonly panelMode = computed<'none' | 'dock' | 'overlay'>(() => {
    if (!this.state.filtersOpen() || this.narrow()) return 'none';
    const detail = this.detailMode() === 'dock' ? this.detailWidth() + GAP : 0;
    return this.width() >= MIN_MAIN + DOCK_FILTERS + detail + 2 * GAP ? 'dock' : 'overlay';
  });
  protected readonly statusKind = computed<'loading' | 'error' | 'empty' | 'no-data' | null>(() => {
    switch (this.state.demo()) {
      case 'laden':
        return 'loading';
      case 'fout':
        return 'error';
      case 'geen-data':
        return 'no-data';
    }
    return this.results.filtered().length === 0 ? 'empty' : null;
  });
  protected readonly features = computed(() => pointFeatures(this.statusKind() ? [] : this.results.filtered(), 'melding'));
  protected readonly preview = computed(() => (this.detailMode() === 'none' ? this.results.filtered().find((r) => r.id === this.previewId()) : undefined));
  protected readonly countText = computed(() => {
    const shown = this.results.filtered().length;
    const total = this.results.total();
    return shown === total ? `${total} objecten op de kaart` : `${shown} van ${total} objecten op de kaart`;
  });

  protected readonly detail = computed<DetailData | null>(() => {
    const r = this.results.selected();
    return r
      ? {
          id: r.id,
          title: r.title,
          status: r.status,
          fields: [
            { key: 'Locatie', value: r.location },
            { key: 'Gebied', value: r.area },
            { key: 'Verantwoordelijke', value: r.owner },
            { key: 'Bijgewerkt', value: updatedLabel(r.updatedAt) },
            { key: 'Omschrijving', value: r.description },
          ],
        }
      : null;
  });

  constructor() {
    bindUrlState('t1', ['id', 'breedte']);

    effect(() => {
      const id = this.state.selectedId();
      const visible = this.results.filtered().some((r) => r.id === id);
      untracked(() => {
        if (id && !visible && !this.statusKind()?.match(/loading|error|no-data/)) {
          this.state.setSelection(null, false);
          this.previewId.set(null);
          this.#toast.open(`${id} valt buiten de huidige resultaten. Het detail is gesloten.`);
        }
      });
    });
  }

  protected onMarker(id: string) {
    this.state.selectedId.set(id);
    if (this.detailMode() === 'dock') this.state.detailOpen.set(true); // detail is already open: switch to this record
    else this.previewId.set(id);
  }

  protected openDetail(id: string) {
    this.previewId.set(null);
    this.state.setSelection(id, true);
  }

  protected closeDetail() {
    const id = this.state.selectedId();
    this.state.detailOpen.set(false);
    afterNextRender(() => document.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(id ?? '')}"], .object[aria-current="true"]`)?.focus(), { injector: this.#injector });
  }

  /** Open the same results in T2, carrying search, filters and selection (they mean the same there). */
  protected showResults() {
    const t2 = this.#store.state('t2');
    t2.search.set(this.state.search());
    t2.filters.set({ ...this.state.filters() });
    t2.view.set('beide');
    t2.setSelection(this.state.selectedId(), false);
    void this.#router.navigate(['/layout-lab', 't2']);
  }

  protected async togglePanel() {
    if (this.narrow()) {
      const trigger = document.querySelector<HTMLElement>('[aria-controls="t1-panel"]');
      const result = await this.#dialogs.filters({ groups: FILTER_GROUPS, filters: this.state.filters(), inViewAvailable: true });
      if (result) this.state.filters.set(result);
      trigger?.focus();
      return;
    }
    this.state.filtersOpen.update((open) => !open);
  }

  protected onView(change: MapViewChange) {
    this.state.mapView.set({ center: change.center, zoom: change.zoom });
    this.state.mapBounds.set(change.bounds);
  }

  protected clearAll() {
    this.state.search.set('');
    this.state.filters.set({ ...EMPTY_FILTERS });
  }

  protected retry() {
    this.state.demo.set('laden');
    setTimeout(() => this.state.demo.set('normaal'), 700);
  }
}
