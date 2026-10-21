import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, ModuleRegistry, RowClickedEvent, themeQuartz, ValueFormatterParams } from 'ag-grid-community';
import { FormFieldComponent, IconComponent, InputDirective, InputIconComponent, ndwAgGridTheme, SwitcherComponent, SwitcherOption } from '@ndwnu/design-system';
import { Roadwork } from '../../data/models';
import { TrafficDataService } from '../../data/traffic-data.service';
import { NdwMapComponent } from '../../map/ndw-map.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

ModuleRegistry.registerModules([AllCommunityModule]);

const formatDate = (params: ValueFormatterParams) => (params.value as Date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

@Component({
  selector: 'app-roadworks',
  imports: [FormsModule, AgGridAngular, FormFieldComponent, IconComponent, InputDirective, InputIconComponent, SwitcherComponent, NdwMapComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roadworks.page.html',
  styleUrl: './roadworks.page.scss',
})
export class RoadworksPage {
  readonly #router = inject(Router);
  readonly #data = inject(TrafficDataService);

  protected readonly theme = themeQuartz.withParams(ndwAgGridTheme);
  protected readonly autoSize = { type: "fitGridWidth" as const };
  protected readonly view = signal<'tabel' | 'kaart'>('tabel');
  protected readonly status = signal('alle');
  protected readonly query = signal('');

  protected readonly viewOptions: SwitcherOption[] = [
    { value: 'tabel', label: 'Tabel', icon: 'table_rows' },
    { value: 'kaart', label: 'Kaart', icon: 'map' },
  ];
  protected readonly statusOptions: SwitcherOption[] = [
    { value: 'alle', label: 'Alle' },
    { value: 'Actief', label: 'Actief' },
    { value: 'Gepland', label: 'Gepland' },
    { value: 'Afgerond', label: 'Afgerond' },
  ];

  protected readonly columns: ColDef<Roadwork>[] = [
    { field: 'id', headerName: 'Nummer', width: 110 },
    { field: 'title', headerName: 'Werkzaamheid', flex: 2, minWidth: 260 },
    { field: 'road', headerName: 'Weg', width: 90 },
    { field: 'type', headerName: 'Type', width: 150 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'impact', headerName: 'Hinder', width: 170 },
    { field: 'start', headerName: 'Start', width: 120, valueFormatter: formatDate },
    { field: 'end', headerName: 'Einde', width: 120, valueFormatter: formatDate },
    { field: 'authority', headerName: 'Wegbeheerder', flex: 1, minWidth: 160 },
  ];

  protected readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.#data.roadworks().filter(
      (r) =>
        (this.status() === 'alle' || r.status === this.status()) &&
        (!query || `${r.title} ${r.road} ${r.id}`.toLowerCase().includes(query)),
    );
  });
  protected readonly features = computed(() => {
    const ids = new Set(this.rows().map((r) => r.id));
    const all = this.#data.featuresFor(['roadwork']);
    return { ...all, features: all.features.filter((f) => ids.has(f.properties?.['id'])) };
  });

  protected openDetail(event: RowClickedEvent<Roadwork>) {
    if (event.data) this.#router.navigate(['/wegwerkzaamheden', event.data.id]);
  }

  protected openOnEnter(event: CellKeyDownEvent<Roadwork> | FullWidthCellKeyDownEvent<Roadwork>) {
    if ((event.event as KeyboardEvent | null)?.key === 'Enter' && event.data) this.openById(event.data.id);
  }

  protected openById(id: string) {
    this.#router.navigate(['/wegwerkzaamheden', id]);
  }
}
