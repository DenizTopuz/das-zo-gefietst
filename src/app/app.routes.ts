import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage) },
  { path: 'incidenten', data: { breadcrumb: 'Incidenten' }, loadComponent: () => import('./pages/incidents/incidents.page').then((m) => m.IncidentsPage) },
  {
    path: 'wegwerkzaamheden',
    data: { breadcrumb: 'Wegwerkzaamheden' },
    children: [
      { path: '', loadComponent: () => import('./pages/roadworks/roadworks.page').then((m) => m.RoadworksPage) },
      { path: ':id', data: { breadcrumb: 'Detail' }, loadComponent: () => import('./pages/roadworks/roadwork-detail.page').then((m) => m.RoadworkDetailPage) },
    ],
  },
  { path: 'kaart', data: { breadcrumb: 'Verkeerskaart' }, loadComponent: () => import('./pages/traffic-map/traffic-map.page').then((m) => m.TrafficMapPage) },
  { path: 'maatregelen', data: { breadcrumb: 'Maatregelen' }, loadComponent: () => import('./pages/measures/measures.page').then((m) => m.MeasuresPage) },
  { path: 'layout-lab', data: { breadcrumb: 'Layout lab' }, loadComponent: () => import('./pages/layout-lab/layout-lab.page').then((m) => m.LayoutLabPage) },
  { path: '**', redirectTo: 'dashboard' },
];
