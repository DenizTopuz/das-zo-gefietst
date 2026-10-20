import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ButtonDirective, CardComponent, CardContentComponent, CardHeaderComponent, IconComponent, KeyValueListComponent, ListComponent, ListItemComponent, PillComponent, SwitcherComponent, SwitcherOption } from '@ndwnu/design-system';
import { TrafficDataService } from '../../data/traffic-data.service';
import { NdwMapComponent } from '../../map/ndw-map.component';
import { minutesAgo, severityColor, statusColor } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/page-header.component';

type Filter = 'alle' | 'hoog' | 'middel' | 'laag';

@Component({
  selector: 'app-incidents',
  imports: [DatePipe, ButtonDirective, CardComponent, CardHeaderComponent, CardContentComponent, IconComponent, KeyValueListComponent, ListComponent, ListItemComponent, PillComponent, SwitcherComponent, NdwMapComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incidents.page.html',
  styleUrl: './incidents.page.scss',
})
export class IncidentsPage {
  protected readonly data = inject(TrafficDataService);
  /** Bound from the `?id=` query parameter. */
  readonly id = input<string>();

  protected readonly filter = signal<Filter>('alle');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly filterOptions: SwitcherOption[] = [
    { value: 'alle', label: 'Alle' },
    { value: 'hoog', label: 'Hoog' },
    { value: 'middel', label: 'Middel' },
    { value: 'laag', label: 'Laag' },
  ];

  protected readonly severityColor = severityColor;
  protected readonly statusColor = statusColor;
  protected readonly minutesAgo = minutesAgo;

  protected readonly incidents = computed(() =>
    this.data.incidents().filter((i) => this.filter() === 'alle' || i.severity === this.filter()),
  );
  protected readonly selected = computed(() => (this.selectedId() ? this.data.incident(this.selectedId()!) : undefined));
  protected readonly features = computed(() => this.data.featuresFor(['incident', 'jam']));
  protected readonly details = computed(() => {
    const i = this.selected();
    return i
      ? [
          { key: 'Weg', value: `${i.road} richting ${i.direction}` },
          { key: 'Locatie', value: i.location },
          { key: 'Afgesloten rijstroken', value: String(i.lanesBlocked) },
          { key: 'Vertraging', value: `${i.delayMinutes} minuten` },
        ]
      : [];
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) this.selectedId.set(id);
    });
  }

  protected setFilter(value: unknown) {
    this.filter.set(value as Filter);
  }
}
