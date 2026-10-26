import { Routes } from '@angular/router';
import { MapKind } from './data/models';
import { LabShellComponent } from './layout-lab/lab-shell.component';
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
  {
    path: 'layout-lab',
    component: LabShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 't2' },
      { path: 't2', title: 'T2 Werkvoorraad + kaart · Template', loadComponent: () => import('./layout-lab/templates/t2.page').then((m) => m.T2Page) },
      { path: '**', redirectTo: 't2' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
