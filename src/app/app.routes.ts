import { Routes } from '@angular/router';
import { MapKind } from './data/models';
import { LabShellComponent } from './layout-lab/lab-shell.component';
import { MapPageComponent } from './shared/map-page.component';

const mapPage = (path: string, title: string, kinds?: MapKind[]) => ({
  path,
  title: `${title} · Template`,
  component: MapPageComponent,
  data: kinds ? { title, kinds, breadcrumb: title } : { title, breadcrumb: title },
});

export const routes: Routes = [
  // The empty parent supplies the first breadcrumb ('Start'); each page adds its own through `data.breadcrumb`.
  { path: '', data: { breadcrumb: 'Start' }, children: [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    mapPage('template-1', 'Kaartweergave'),
    { path: 'template-2', title: 'Werkruimte · Template', data: { breadcrumb: 'Werkruimte' }, loadComponent: () => import('./workspace/workspace.page').then((m) => m.WorkspacePage) },
    { path: 'werkruimte-kopie', title: 'Werkruimte (kopie) · Template', data: { breadcrumb: 'Werkruimte (kopie)' }, loadComponent: () => import('./werkruimte-kopie/werkruimte-kopie.page').then((m) => m.WerkruimteKopiePage) },
    { path: 'dashboard', title: 'Das zo gefietst · Template', data: { breadcrumb: 'Das zo gefietst' }, loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage) },
    {
      path: 'layout-lab',
      component: LabShellComponent,
      children: [
        { path: '', pathMatch: 'full', redirectTo: 't2' },
        { path: 't1', title: 'Template 3 · Template', data: { breadcrumb: 'Template 3' }, loadComponent: () => import('./layout-lab/templates/t1.page').then((m) => m.T1Page) },
        { path: 't2', title: 'Template 4 · Template', data: { breadcrumb: 'Template 4' }, loadComponent: () => import('./layout-lab/templates/t2.page').then((m) => m.T2Page) },
        { path: 't4', title: 'Template 6 · Template', data: { breadcrumb: 'Template 6' }, canDeactivate: [(c: unknown) => import('./layout-lab/templates/t4.page').then((m) => m.t4LeaveGuard(c as never, null as never, null as never, null as never))], loadComponent: () => import('./layout-lab/templates/t4.page').then((m) => m.T4Page) },
        { path: 't5', title: 'Template 7 · Template', data: { breadcrumb: 'Template 7' }, loadComponent: () => import('./layout-lab/templates/t5.page').then((m) => m.T5Page) },
        { path: 't3', title: 'Template 5 · Template', data: { breadcrumb: 'Template 5' }, loadComponent: () => import('./layout-lab/templates/t3.page').then((m) => m.T3Page) },
        { path: 't6', title: 'Template 8 · Template', data: { breadcrumb: 'Template 8' }, loadComponent: () => import('./layout-lab/templates/t6.page').then((m) => m.T6Page) },
        { path: '**', redirectTo: 't2' },
      ],
    },
    { path: '**', redirectTo: 'dashboard' },
  ] },
];
