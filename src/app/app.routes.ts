import { Routes } from '@angular/router';
import { MapKind } from './data/models';
import { MapPageComponent } from './shared/map-page.component';

const mapPage = (path: string, title: string, kinds?: MapKind[]) => ({
  path,
  title: `${title} · Template`,
  component: MapPageComponent,
  data: kinds ? { title, kinds } : { title },
});

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  mapPage('dashboard', 'Dashboard', ['incident', 'jam']),
  mapPage('incidenten', 'Incidenten', ['incident', 'jam']),
  mapPage('wegwerkzaamheden', 'Wegwerkzaamheden', ['roadwork']),
  mapPage('wegwerkzaamheden/:id', 'Wegwerkzaamheid', ['roadwork']),
  mapPage('kaart', 'Verkeerskaart'),
  mapPage('maatregelen', 'Maatregelen', ['matrix']),
  mapPage('layout-lab', 'Layout lab'),
  { path: '**', redirectTo: 'dashboard' },
];
