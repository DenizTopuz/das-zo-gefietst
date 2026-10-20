import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent, MenuItem } from '@ndwnu/design-system';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ndw-layout
      applicationName="Verkeersprototype"
      environment="Local"
      version="0.1.0"
      [topMenuItems]="menu"
      [bottomMenuItems]="bottomMenu"
    >
      <router-outlet></router-outlet>
    </ndw-layout>
  `,
})
export class App {
  protected readonly menu: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: ['/dashboard'] },
    { label: 'Incidenten', icon: 'warning', path: ['/incidenten'] },
    { label: 'Wegwerkzaamheden', icon: 'construction', path: ['/wegwerkzaamheden'] },
    { label: 'Verkeerskaart', icon: 'map', path: ['/kaart'] },
    { label: 'Maatregelen', icon: 'signpost', path: ['/maatregelen'] },
  ];

  protected readonly bottomMenu: MenuItem[] = [
    { label: 'Layout lab', icon: 'dashboard_customize', path: ['/layout-lab'] },
  ];
}
