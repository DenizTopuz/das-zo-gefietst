import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective, CardComponent, CardContentComponent, CardHeaderComponent, KeyValueListComponent, PillComponent } from '@ndwnu/design-system';
import { TrafficDataService } from '../../data/traffic-data.service';
import { NdwMapComponent } from '../../map/ndw-map.component';
import { impactColor, severityColor } from '../../shared/format';

@Component({
  selector: 'app-traffic-map',
  imports: [RouterLink, ButtonDirective, CardComponent, CardHeaderComponent, CardContentComponent, KeyValueListComponent, PillComponent, NdwMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './traffic-map.page.html',
  styleUrl: './traffic-map.page.scss',
})
export class TrafficMapPage {
  protected readonly data = inject(TrafficDataService);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly severityColor = severityColor;
  protected readonly impactColor = impactColor;

  protected readonly features = this.data.allFeatures;
  protected readonly incident = computed(() => this.data.incident(this.selectedId() ?? ''));
  protected readonly roadwork = computed(() => this.data.roadwork(this.selectedId() ?? ''));
  protected readonly jam = computed(() => this.data.jams().find((j) => j.id === this.selectedId()));
  protected readonly sign = computed(() => this.data.matrixSigns().find((m) => m.id === this.selectedId()));
}
