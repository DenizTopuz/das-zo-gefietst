import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MapKind } from '../data/models';

const ALL_KINDS: MapKind[] = ['incident', 'roadwork', 'jam', 'matrix'];
import { TrafficDataService } from '../data/traffic-data.service';
import { NdwMapComponent } from '../map/ndw-map.component';

/**
 * Page that is completely filled by the map. `title` and `kinds` come from the route `data`
 * (bound through `withComponentInputBinding`). Replace the template to start building a page.
 */
@Component({
  selector: 'app-map-page',
  imports: [NdwMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sr-only">{{ title() }}</h1>
    <app-ndw-map [features]="features()" [kinds]="activeKinds()"></app-ndw-map>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      min-height: 0;
    }

    app-ndw-map {
      flex: 1 1 0;
      min-height: 0;
      border-radius: 0;
    }
  `,
})
export class MapPageComponent {
  readonly title = input.required<string>();
  /** Route data without `kinds` binds `undefined`, so fall back to all kinds. */
  readonly kinds = input<MapKind[] | undefined>();

  readonly #data = inject(TrafficDataService);
  protected readonly activeKinds = computed(() => this.kinds() ?? ALL_KINDS);
  protected readonly features = computed(() => this.#data.featuresFor(this.activeKinds()));
}
