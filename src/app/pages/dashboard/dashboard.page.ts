import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective, CardComponent, CardContentComponent, CardHeaderComponent, IconComponent, ListComponent, ListItemComponent, PillComponent } from '@ndwnu/design-system';
import { DAILY_INCIDENTS } from '../../data/mock-data';
import { TrafficDataService } from '../../data/traffic-data.service';
import { NdwMapComponent } from '../../map/ndw-map.component';
import { impactColor, minutesAgo, severityColor } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/page-header.component';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, ButtonDirective, CardComponent, CardHeaderComponent, CardContentComponent, IconComponent, ListComponent, ListItemComponent, PillComponent, NdwMapComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly data = inject(TrafficDataService);
  readonly #router = inject(Router);

  protected readonly severityColor = severityColor;
  protected readonly impactColor = impactColor;
  protected readonly minutesAgo = minutesAgo;

  protected readonly kpis = computed(() => [
    { label: 'Open incidenten', value: this.data.openIncidents().length, icon: 'warning', hint: `${this.data.incidents().filter((i) => i.severity === 'hoog').length} met hoge ernst` },
    { label: 'Totale filelengte', value: `${this.data.totalJamKm()} km`, icon: 'traffic', hint: `${this.data.jams().length} files` },
    { label: 'Actieve werkzaamheden', value: this.data.activeRoadworks().length, icon: 'construction', hint: `${this.data.roadworks().filter((r) => r.status === 'Gepland').length} gepland` },
    { label: 'Actieve maatregelen', value: this.data.activeMeasures().length, icon: 'signpost', hint: `${this.data.matrixSigns().filter((m) => !m.online).length} bord offline` },
  ]);

  protected readonly latestIncidents = computed(() => [...this.data.openIncidents()].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, 5));
  protected readonly upcomingRoadworks = computed(() => this.data.roadworks().filter((r) => r.status !== 'Afgerond').sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 4));
  protected readonly features = computed(() => this.data.featuresFor(['incident', 'jam']));

  protected readonly daily = DAILY_INCIDENTS;
  protected readonly dailyMax = Math.max(...DAILY_INCIDENTS.map((d) => d.value));

  protected openIncident(id: string) {
    this.#router.navigate(['/incidenten'], { queryParams: { id } });
  }
}
