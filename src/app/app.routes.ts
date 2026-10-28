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
  { path: '', pathMatch: 'full', redirectTo: 'template-1' },
  mapPage('template-1', 'Kaartweergave'),
  { path: 'template-2', title: 'Werkruimte · Template', loadComponent: () => import('./workspace/workspace.page').then((m) => m.WorkspacePage) },
  { path: 'werkruimte-kopie', title: 'Werkruimte (kopie) · Template', loadComponent: () => import('./werkruimte-kopie/werkruimte-kopie.page').then((m) => m.WerkruimteKopiePage) },
  {
    path: 'layout-lab',
    component: LabShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 't2' },
      { path: 't1', title: 'Template 3 · Template', loadComponent: () => import('./layout-lab/templates/t1.page').then((m) => m.T1Page) },
      { path: 't2', title: 'Template 4 · Template', loadComponent: () => import('./layout-lab/templates/t2.page').then((m) => m.T2Page) },
      { path: 't4', title: 'Template 6 · Template', canDeactivate: [(c: unknown) => import('./layout-lab/templates/t4.page').then((m) => m.t4LeaveGuard(c as never, null as never, null as never, null as never))], loadComponent: () => import('./layout-lab/templates/t4.page').then((m) => m.T4Page) },
      { path: 't5', title: 'Template 7 · Template', loadComponent: () => import('./layout-lab/templates/t5.page').then((m) => m.T5Page) },
      { path: 't3', title: 'Template 5 · Template', loadComponent: () => import('./layout-lab/templates/t3.page').then((m) => m.T3Page) },
      { path: 't6', title: 'Template 8 · Template', loadComponent: () => import('./layout-lab/templates/t6.page').then((m) => m.T6Page) },
      { path: '**', redirectTo: 't2' },
    ],
  },
  { path: '**', redirectTo: 'template-1' },
];
