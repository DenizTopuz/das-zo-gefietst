import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ButtonDirective, IconComponent, InputDirective, SwitcherComponent, SwitcherOption, ToastService } from '@ndwnu/design-system';
import { filter, map } from 'rxjs';
import { DemoState, LabStore, TEMPLATES, TemplateId, templateInfo } from './lab-store';

interface Variant {
  options: SwitcherOption[];
  label: string;
}

const DEMO_STATES: { value: DemoState; label: string }[] = [
  { value: 'normaal', label: 'Normaal' },
  { value: 'laden', label: 'Laden' },
  { value: 'fout', label: 'Herstelbare fout' },
  { value: 'geen-data', label: 'Geen brondata' },
  { value: 'live', label: 'Live-update beschikbaar' },
];

const DETAIL_VARIANT: Variant = {
  label: 'Detailbreedte',
  options: [
    { value: 'compact', label: 'Compact 400' },
    { value: 'ruim', label: 'Ruim 560' },
  ],
};

/**
 * Layout lab: a fixed, compact prototype toolbar above the application screen that is being
 * demonstrated. Everything in this toolbar is prototype control; the screen below is the "product".
 */
@Component({
  selector: 'app-lab-shell',
  imports: [ButtonDirective, IconComponent, InputDirective, RouterOutlet, SwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="toolbar" aria-label="Layout lab: prototypebediening">
      <div class="row">
        <span class="tag"><ndw-icon>dashboard_customize</ndw-icon> Layout lab · prototype</span>
        <div class="group" role="group" aria-label="Template kiezen">
          <ndw-switcher [options]="templateOptions" [selectedValue]="activeId()" (selectionChange)="open($event)"></ndw-switcher>
        </div>
        <p class="name" aria-live="polite"><strong>{{ info().code }}</strong> {{ info().name }}</p>
        <button ndwButton tertiary extra-small type="button" class="notes-toggle" [attr.aria-expanded]="notes()" aria-controls="lab-notes" (click)="notes.set(!notes())">
          <ndw-icon>{{ notes() ? 'expand_less' : 'expand_more' }}</ndw-icon> Toelichting
        </button>
      </div>

      <div class="row row--controls">
        @if (variant(); as v) {
          <div class="group" role="group" [attr.aria-label]="'Variant: ' + v.label">
            <span class="label">{{ v.label }}</span>
            <ndw-switcher [options]="v.options" [selectedValue]="variantValue()" (selectionChange)="setVariant($event)"></ndw-switcher>
          </div>
        }

        <label class="group">
          <span class="label">Toestand</span>
          <select ndwInput aria-label="Demo-toestand" [value]="demo()" (change)="setDemo($any($event.target).value)">
            @for (s of demoStates; track s.value) {
              <option [value]="s.value" [selected]="s.value === demo()">{{ s.label }}</option>
            }
          </select>
        </label>

        <button ndwButton secondary extra-small type="button" (click)="resetLayout()"><ndw-icon>restart_alt</ndw-icon> Herstel indeling</button>
      </div>

      @if (notes()) {
        <div id="lab-notes" class="notes">
          <p class="ndw-paragraph-md"><strong>{{ info().code }} · {{ info().name }}.</strong> {{ info().summary }}</p>
          <dl>
            <dt class="ndw-paragraph-bold-md">Kies dit wanneer</dt>
            <dd class="ndw-paragraph-md">{{ info().useWhen }}</dd>
            <dt class="ndw-paragraph-bold-md">Niet de eerste keuze wanneer</dt>
            <dd class="ndw-paragraph-md">{{ info().notWhen }}</dd>
            <dt class="ndw-paragraph-bold-md">Onderbouwing</dt>
            <dd class="ndw-paragraph-md">{{ info().evidence }} Alle gegevens zijn fictief.</dd>
          </dl>
        </div>
      }
    </section>

    <div class="screen" role="region" [attr.aria-label]="'Applicatiescherm: ' + info().name">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './lab-shell.component.scss',
})
export class LabShellComponent {
  readonly #store = inject(LabStore);
  readonly #router = inject(Router);
  readonly #toast = inject(ToastService);

  protected readonly templateOptions: SwitcherOption[] = TEMPLATES.map((t) => ({ value: t.id, label: t.code }));
  protected readonly demoStates = DEMO_STATES;
  protected readonly notes = signal(false);

  readonly #url = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#router.url),
    ),
    { initialValue: this.#router.url },
  );

  protected readonly activeId = computed<TemplateId>(() => {
    const segment = this.#url().split('?')[0].split('/')[2];
    return (templateInfo(segment)?.id ?? 't2') as TemplateId;
  });
  protected readonly info = computed(() => templateInfo(this.activeId()) ?? TEMPLATES[1]);
  readonly #state = computed(() => this.#store.state(this.activeId()));
  protected readonly demo = computed(() => this.#state().demo());

  /** Variants differ per template; the chooser only shows when there is more than one layout. */
  protected readonly variant = computed<Variant | null>(() => {
    switch (this.activeId()) {
      case 't1':
      case 't5':
        return DETAIL_VARIANT;
      case 't2':
        return {
          label: 'Weergave',
          options: [
            { value: 'onder', label: 'Onder elkaar' },
            { value: 'naast', label: 'Naast elkaar' },
            { value: 'kaart', label: 'Alleen kaart' },
            { value: 'lijst', label: 'Alleen resultaten' },
          ],
        };
      case 't3':
        return { label: 'Verdieping', options: [{ value: 'dicht', label: 'Zonder resultaten' }, { value: 'open', label: 'Met resultaten' }] };
      case 't4':
        return { label: 'Kaartcontext', options: [{ value: 'aan', label: 'Met kaart' }, { value: 'uit', label: 'Zonder kaart' }] };
      default:
        return null;
    }
  });

  protected readonly variantValue = computed(() => {
    const s = this.#state();
    switch (this.activeId()) {
      case 't1':
      case 't5':
        return s.detailWide() ? 'ruim' : 'compact';
      case 't2':
        return s.view() === 'kaart' ? 'kaart' : s.view() === 'lijst' ? 'lijst' : s.arrangement();
      case 't3':
        return s.deepen() ? 'open' : 'dicht';
      case 't4':
        return s.withMap() ? 'aan' : 'uit';
      default:
        return '';
    }
  });

  protected open(id: unknown) {
    void this.#store.open(id as TemplateId);
  }

  protected setVariant(value: unknown) {
    const s = this.#state();
    switch (this.activeId()) {
      case 't1':
      case 't5':
        s.detailWide.set(value === 'ruim');
        break;
      case 't2':
        if (value === 'kaart' || value === 'lijst') s.view.set(value);
        else {
          s.view.set('beide');
          s.arrangement.set(value === 'naast' ? 'naast' : 'onder');
        }
        break;
      case 't3':
        s.deepen.set(value === 'open');
        break;
      case 't4':
        s.withMap.set(value === 'aan');
        break;
    }
  }

  protected setDemo(value: string) {
    this.#state().demo.set(value as DemoState);
  }

  protected resetLayout() {
    this.#state().resetLayout();
    this.#toast.open('Indeling hersteld. Filters, selectie en gegevens zijn behouden.');
  }
}
