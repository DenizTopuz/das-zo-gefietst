import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertComponent, BreadcrumbComponent, BreadcrumbGroupComponent, ButtonDirective, CardComponent, CardContentComponent, CardHeaderComponent, IconComponent, KeyValueListComponent, PillComponent, TabComponent, TabGroupComponent } from '@ndwnu/design-system';
import { TrafficDataService } from '../../data/traffic-data.service';
import { NdwMapComponent } from '../../map/ndw-map.component';
import { impactColor, statusColor } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/page-header.component';

@Component({
  selector: 'app-roadwork-detail',
  imports: [DatePipe, RouterLink, AlertComponent, BreadcrumbComponent, BreadcrumbGroupComponent, ButtonDirective, CardComponent, CardHeaderComponent, CardContentComponent, IconComponent, KeyValueListComponent, PillComponent, TabComponent, TabGroupComponent, NdwMapComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roadwork-detail.page.html',
  styleUrl: './roadwork-detail.page.scss',
})
export class RoadworkDetailPage {
  readonly #data = inject(TrafficDataService);
  /** Route parameter `:id` (component input binding). */
  readonly id = input.required<string>();

  protected readonly statusColor = statusColor;
  protected readonly impactColor = impactColor;
  protected readonly roadwork = computed(() => this.#data.roadwork(this.id()));
  protected readonly features = computed(() => {
    const all = this.#data.featuresFor(['roadwork', 'incident', 'matrix']);
    const work = this.roadwork();
    return { ...all, features: all.features.filter((f) => f.properties?.['id'] === work?.id || f.properties?.['kind'] !== 'roadwork') };
  });
  protected readonly facts = computed(() => {
    const w = this.roadwork();
    return w
      ? [
          { key: 'Nummer', value: w.id },
          { key: 'Weg', value: w.road },
          { key: 'Traject', value: `${w.from} – ${w.to}` },
          { key: 'Type', value: w.type },
          { key: 'Getroffen rijstroken', value: w.lanesAffected },
          { key: 'Wegbeheerder', value: w.authority },
        ]
      : [];
  });
}
