import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LayoutComponent, MenuItem } from '@ndwnu/design-system';
import { filter, map } from 'rxjs';

const TOP_MENU: MenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: ['/dashboard'] },
  { label: 'Incidenten', icon: 'warning', path: ['/incidenten'] },
  { label: 'Wegwerkzaamheden', icon: 'construction', path: ['/wegwerkzaamheden'] },
  { label: 'Verkeerskaart', icon: 'map', path: ['/kaart'] },
  { label: 'Maatregelen', icon: 'signpost', path: ['/maatregelen'] },
];

const BOTTOM_MENU: MenuItem[] = [{ label: 'Layout lab', icon: 'dashboard_customize', path: ['/layout-lab'] }];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ndw-layout
      applicationName="Template"
      environment="Local"
      version="0.1.0"
      [topMenuItems]="menu()"
      [bottomMenuItems]="bottomMenu()"
    >
      <router-outlet></router-outlet>
    </ndw-layout>
  `,
})
export class App {
  readonly #router = inject(Router);
  /** The design system shows the active state from `MenuItem.active`, so derive it from the current URL. */
  readonly #url = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#router.url),
    ),
    { initialValue: this.#router.url },
  );

  protected readonly menu = computed(() => this.#withActive(TOP_MENU));
  protected readonly bottomMenu = computed(() => this.#withActive(BOTTOM_MENU));

  #withActive(items: MenuItem[]): MenuItem[] {
    const url = this.#url();
    return items.map((item) => ({ ...item, active: !!item.path && (url === item.path[0] || url.startsWith(`${item.path[0]}/`) || url.startsWith(`${item.path[0]}?`)) }));
  }
}
