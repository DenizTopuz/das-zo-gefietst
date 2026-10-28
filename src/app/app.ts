import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ButtonDirective, IconComponent, LayoutComponent, MenuItem, RouterBreadcrumbsComponent } from '@ndwnu/design-system';
import { filter, map } from 'rxjs';
import { observeTooltipPlacement } from './shared/tooltip-placement';

const TOP_MENU: MenuItem[] = [
  { label: 'Kaartweergave', icon: 'map', path: ['/template-1'] },
  { label: 'Werkruimte', icon: 'view_sidebar', path: ['/template-2'] },
  { label: 'Werkruimte (kopie)', icon: 'view_sidebar', path: ['/werkruimte-kopie'] },
  { label: 'Template 3', icon: 'map', path: ['/layout-lab/t1'] },
  { label: 'Template 4', icon: 'table_view', path: ['/layout-lab/t2'] },
  { label: 'Template 5', icon: 'analytics', path: ['/layout-lab/t3'] },
  { label: 'Template 6', icon: 'edit_note', path: ['/layout-lab/t4'] },
  { label: 'Template 7', icon: 'view_list', path: ['/layout-lab/t5'] },
  { label: 'Template 8', icon: 'monitoring', path: ['/layout-lab/t6'] },
];

const WIDTH_KEY = 'ndw-menu-width:v1';
const readWidth = () => {
  try {
    const stored = Number(localStorage.getItem(WIDTH_KEY));
    return stored >= 200 && stored <= 480 ? stored : 200;
  } catch {
    return 200;
  }
};

const noop = () => {};

// Dummy content to mirror the NDW menu: submenus (children), a notification badge and a user item.
const BOTTOM_MENU: MenuItem[] = [
  { label: 'Beheer', icon: 'group', children: [{ label: 'Gebruikers', callback: noop }, { label: 'Instellingen', callback: noop }] },
  { label: 'Updates', icon: 'notifications', notifications: 1, callback: noop },
  { label: 'Hulp', icon: 'help', children: [{ label: 'Kennisbank', callback: noop }, { label: 'Veelgestelde vragen', callback: noop }, { label: 'Feedback geven', callback: noop }] },
  { label: 'Jan Janssen', icon: 'person', children: [{ label: 'Profiel', callback: noop }, { label: 'Uitloggen', callback: noop }] },
];

@Component({
  selector: 'app-root',
  imports: [ButtonDirective, IconComponent, LayoutComponent, RouterBreadcrumbsComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ndw-layout
      applicationName="Template"
      environment="Local"
      version="Versie 20240326.17"
      [menuFooterTexts]="footerTexts"
      [topMenuItems]="menu()"
      [bottomMenuItems]="bottomMenu"
      [isCollapsible]="false"
      [isExpanded]="menuOpen()"
      [style.--menu-width.px]="menuWidth()"
    >
      <div class="app-frame">
        <header class="app-topbar">
          <button ndwButton tertiary extra-small type="button" class="menu-toggle" [class.menu-toggle--in-menu]="menuOpen()" [attr.aria-expanded]="menuOpen()" aria-label="Menu in- of uitklappen" (click)="menuOpen.set(!menuOpen())">
            <ndw-icon>view_sidebar</ndw-icon>
          </button>
          <nav aria-label="Kruimelpad"><ndw-router-breadcrumbs></ndw-router-breadcrumbs></nav>
        </header>
        @if (menuOpen()) {
          <div
            class="menu-resizer"
            [class.menu-resizer--active]="dragging()"
            role="separator"
            aria-orientation="vertical"
            aria-label="Breedte van het menu"
            tabindex="0"
            [attr.aria-valuemin]="minWidth"
            [attr.aria-valuemax]="maxWidth"
            [attr.aria-valuenow]="menuWidth()"
            (pointerdown)="startDrag($event)"
            (pointermove)="drag($event)"
            (pointerup)="endDrag($event)"
            (pointercancel)="endDrag($event)"
            (keydown)="resizeByKey($event)"
            (dblclick)="setWidth(200)"
          ></div>
        }
        <router-outlet></router-outlet>
      </div>
    </ndw-layout>
  `,
})
export class App {
  constructor() {
    observeTooltipPlacement();
  }

  /** The menu is folded in and out from the top bar, not from the foot of the menu. */
  protected readonly menuOpen = signal(true);
  protected readonly minWidth = 200;
  protected readonly maxWidth = 480;
  protected readonly menuWidth = signal(readWidth());
  protected readonly dragging = signal(false);

  protected setWidth(value: number) {
    const width = Math.round(Math.min(this.maxWidth, Math.max(this.minWidth, value)));
    this.menuWidth.set(width);
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      /* the width just is not remembered */
    }
  }

  protected startDrag(event: PointerEvent) {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(true);
  }

  protected drag(event: PointerEvent) {
    if (this.dragging()) this.setWidth(event.clientX);
  }

  protected endDrag(event: PointerEvent) {
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    this.dragging.set(false);
  }

  protected resizeByKey(event: KeyboardEvent) {
    const step = event.shiftKey ? 48 : 16;
    if (event.key === 'ArrowLeft') this.setWidth(this.menuWidth() - step);
    else if (event.key === 'ArrowRight') this.setWidth(this.menuWidth() + step);
    else return;
    event.preventDefault();
  }

  protected readonly footerTexts = ['Dit is een beta versie', 'Ingelogd onder Nationaal Dataportaal Wegverkeer'];

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
  protected readonly bottomMenu = BOTTOM_MENU;

  #withActive(items: MenuItem[]): MenuItem[] {
    const url = this.#url();
    return items.map((item) => ({ ...item, active: !!item.path && (url === item.path[0] || url.startsWith(`${item.path[0]}/`) || url.startsWith(`${item.path[0]}?`)) }));
  }
}
