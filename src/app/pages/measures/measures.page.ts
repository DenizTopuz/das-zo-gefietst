import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AlertComponent, CardComponent, CardContentComponent, CardHeaderComponent, CheckboxComponent, PillComponent, TabComponent, TabGroupComponent } from '@ndwnu/design-system';
import { SignDisplay } from '../../data/models';
import { TrafficDataService } from '../../data/traffic-data.service';
import { NdwMapComponent } from '../../map/ndw-map.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

@Component({
  selector: 'app-measures',
  imports: [DatePipe, AlertComponent, CardComponent, CardHeaderComponent, CardContentComponent, CheckboxComponent, PillComponent, TabComponent, TabGroupComponent, NdwMapComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './measures.page.html',
  styleUrl: './measures.page.scss',
})
export class MeasuresPage {
  protected readonly data = inject(TrafficDataService);
  protected readonly activeTab = signal<string | number>('borden');
  protected readonly features = computed(() => this.data.featuresFor(['matrix']));
  protected readonly offline = computed(() => this.data.matrixSigns().filter((s) => !s.online));

  protected signLabel(display: SignDisplay): string {
    return { X: '✕', 'pijl-links': '←', 'pijl-rechts': '→', leeg: '' }[display as string] ?? display;
  }

  protected toggle(id: string, active: boolean) {
    this.data.measures.update((list) => list.map((m) => (m.id === id ? { ...m, active, since: active ? new Date() : undefined, activatedBy: active ? 'Prototype' : '-' } : m)));
  }
}
