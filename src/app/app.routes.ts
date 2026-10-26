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
      { path: 't1', title: 'T1 Kaart verkennen · Template', loadComponent: () => import('./layout-lab/templates/t1.page').then((m) => m.T1Page) },
      { path: 't2', title: 'T2 Werkvoorraad + kaart · Template', loadComponent: () => import('./layout-lab/templates/t2.page').then((m) => m.T2Page) },
      { path: 't4', title: 'T4 Bewerken + context · Template', canDeactivate: [(c: unknown) => import('./layout-lab/templates/t4.page').then((m) => m.t4LeaveGuard(c as never, null as never, null as never, null as never))], loadComponent: () => import('./layout-lab/templates/t4.page').then((m) => m.T4Page) },
      { path: 't5', title: 'T5 Overzicht + detail · Template', loadComponent: () => import('./layout-lab/templates/t5.page').then((m) => m.T5Page) },
      { path: 't3', title: 'T3 Analyse + kaart · Template', data: { template: 't3' }, loadComponent: () => import('./layout-lab/templates/not-built.page').then((m) => m.NotBuiltPage) },
      { path: 't6', title: 'T6 Dashboard zonder kaart · Template', data: { template: 't6' }, loadComponent: () => import('./layout-lab/templates/not-built.page').then((m) => m.NotBuiltPage) },
      { path: '**', redirectTo: 't2' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
