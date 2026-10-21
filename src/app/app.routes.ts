import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'Dashboard · Verkeersprototype', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage) },
  { path: 'incidenten', title: 'Incidenten · Verkeersprototype', data: { breadcrumb: 'Incidenten' }, loadComponent: () => import('./pages/incidents/incidents.page').then((m) => m.IncidentsPage) },
  {
    path: 'wegwerkzaamheden',
    title: 'Wegwerkzaamheden · Verkeersprototype',
    data: { breadcrumb: 'Wegwerkzaamheden' },
    children: [
      { path: '', loadComponent: () => import('./pages/roadworks/roadworks.page').then((m) => m.RoadworksPage) },
      { path: ':id', title: 'Wegwerkzaamheid · Verkeersprototype', data: { breadcrumb: 'Detail' }, loadComponent: () => import('./pages/roadworks/roadwork-detail.page').then((m) => m.RoadworkDetailPage) },
    ],
  },
  { path: 'kaart', title: 'Verkeerskaart · Verkeersprototype', data: { breadcrumb: 'Verkeerskaart' }, loadComponent: () => import('./pages/traffic-map/traffic-map.page').then((m) => m.TrafficMapPage) },
  { path: 'maatregelen', title: 'Maatregelen · Verkeersprototype', data: { breadcrumb: 'Maatregelen' }, loadComponent: () => import('./pages/measures/measures.page').then((m) => m.MeasuresPage) },
  { path: 'layout-lab', title: 'Layout lab · Verkeersprototype', data: { breadcrumb: 'Layout lab' }, loadComponent: () => import('./pages/layout-lab/layout-lab.page').then((m) => m.LayoutLabPage) },
  { path: '**', redirectTo: 'dashboard' },
];
