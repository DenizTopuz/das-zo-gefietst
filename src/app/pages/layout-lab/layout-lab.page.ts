import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CardComponent, CardContentComponent, CardHeaderComponent, ListComponent, ListItemComponent, SplitterComponent, SwitcherComponent, SwitcherOption, TabComponent, TabGroupComponent } from '@ndwnu/design-system';
import { TrafficDataService } from '../../data/traffic-data.service';
import { NdwMapComponent } from '../../map/ndw-map.component';
import { severityColor } from '../../shared/format';
import { PageHeaderComponent } from '../../shared/page-header.component';

type Variant = 'sidebar' | 'floating' | 'stacked' | 'tabs';

/** Sandbox to compare layout variants with the same data. Copy a variant into a new page to start prototyping. */
@Component({
  selector: 'app-layout-lab',
  imports: [NgTemplateOutlet, CardComponent, CardHeaderComponent, CardContentComponent, ListComponent, ListItemComponent, SplitterComponent, SwitcherComponent, TabComponent, TabGroupComponent, NdwMapComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-lab.page.html',
  styleUrl: './layout-lab.page.scss',
})
export class LayoutLabPage {
  protected readonly data = inject(TrafficDataService);
  protected readonly variant = signal<Variant>('sidebar');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly severityColor = severityColor;
  protected readonly features = computed(() => this.data.featuresFor(['incident', 'roadwork', 'jam']));
  protected readonly options: SwitcherOption[] = [
    { value: 'sidebar', label: 'Lijst + kaart', icon: 'view_sidebar' },
    { value: 'floating', label: 'Zwevend paneel', icon: 'picture_in_picture' },
    { value: 'stacked', label: 'Kaart boven, lijst onder', icon: 'horizontal_split' },
    { value: 'tabs', label: 'Tabs', icon: 'tab' },
  ];
  protected readonly activeTab = signal<string | number>('kaart');
}
