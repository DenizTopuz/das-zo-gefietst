import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonDirective, DatepickerComponent, FormFieldComponent, OptionComponent, OptionGroupComponent, SwitcherComponent } from '@ndwnu/design-system';
import { DATA_END, DATA_START, DirectionFilter, dateLabel, hourLabel, rangeLabel } from './fiets-data';

type Panel = 'datum' | 'tijd' | 'richting';

const DIRECTIONS: { value: DirectionFilter; label: string; option: string }[] = [
  { value: 'beide', label: 'Beide richtingen', option: 'Beide' },
  { value: 'a', label: 'Richting A (heen)', option: 'A (heen)' },
  { value: 'b', label: 'Richting B (terug)', option: 'B (terug)' },
];

/**
 * Filterbalk in de vorm van een zoekpil (experiment): datum, tijd en richting als segmenten in één ronde balk.
 * Een segment opent een rond paneel eronder, met een kalender van twee maanden, een uurkeuze of de richtingen.
 */
@Component({
  selector: 'app-fiets-filterbar',
  imports: [ButtonDirective, DatepickerComponent, FormFieldComponent, OptionComponent, OptionGroupComponent, ReactiveFormsModule, SwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeOutside($event)', '(keydown.escape)': 'open.set(null)' },
  template: `
    <div class="pill" [class.pill--open]="open()" role="group" aria-label="Filters">
      @for (s of segments(); track s.id) {
        <div class="seg" [class.seg--active]="open() === s.id">
          <button type="button" class="seg__btn" [attr.aria-expanded]="open() === s.id" [attr.aria-controls]="'pop-' + s.id" (click)="toggle(s.id)">
            <span class="seg__label">{{ s.label }}</span>
            <span class="seg__value">{{ s.value }}</span>
          </button>

          @if (open() === s.id) {
            <div class="pop" [class]="'pop pop--' + s.id" [id]="'pop-' + s.id" role="dialog" [attr.aria-label]="s.label">
              @switch (s.id) {
                @case ('datum') {
                  <ndw-form-field label="Datum">
                    <ndw-datepicker [formControl]="calendarControl" [minDate]="minDate" [maxDate]="maxDate" [dateEnabledFilter]="hasData" placeholder="Kies een datum"></ndw-datepicker>
                  </ndw-form-field>
                  <div class="chips">
                    <button ndwButton secondary large type="button" (click)="shiftDay(-1)">Vorige dag</button>
                    <button ndwButton secondary large type="button" (click)="shiftDay(1)">Volgende dag</button>
                    <button ndwButton secondary large type="button" (click)="pickDate(dataEnd)">Laatste dag met data</button>
                  </div>
                  <p class="hint">Demodata van {{ label(dataStart) }} t/m {{ label(dataEnd) }}. Dagen buiten deze periode zijn niet te kiezen.</p>
                }
                @case ('tijd') {
                  <ndw-switcher class="toggle" [options]="hourModes" [selectedValue]="hourMode()" (selectionChange)="setMode($any($event))"></ndw-switcher>
                  <div class="hours" role="group" aria-label="Uren van de dag">
                    @for (h of hoursList; track h) {
                      <button type="button" class="hour" [class.hour--in]="h >= hour0() && h <= hour1()" [class.hour--end]="h === hour0() || h === hour1()" [attr.aria-pressed]="h >= hour0() && h <= hour1()" [attr.title]="rangeLabel(h, h)" (click)="pickHour(h)">{{ hourLabel(h).slice(0, 2) }}</button>
                    }
                  </div>
                  <p class="hint">{{ hourMode() === 'reeks' ? (anchor() === null ? 'Kies het eerste uur en daarna het laatste uur van de reeks.' : 'Kies nu het laatste uur van de reeks.') : 'Kies één uur van de dag.' }} Geselecteerd: {{ rangeLabel(hour0(), hour1()) }}.</p>
                }
                @case ('richting') {
                  <ndw-option-group mode="single" [fluid]="true" [checkedValues]="[direction()]" (checkedValuesChange)="pickDirection($any($event)[0])">
                    @for (d of directions; track d.value) {
                      <ndw-option [value]="d.value" [label]="d.option"></ndw-option>
                    }
                  </ndw-option-group>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 20;
    }
    .pill {
      display: inline-flex;
      align-items: stretch;
      background: var(--ndw-color-white);
      border: var(--ndw-border-size-sm) solid var(--ndw-color-grey-200);
      border-radius: var(--ndw-border-radius-sm);
      box-shadow: var(--ndw-elevation-content);
    }
    .pill--open {
      background: var(--ndw-color-grey-100);
    }
    .seg {
      position: relative;
      display: flex;
    }
    .seg + .seg::before {
      content: '';
      position: absolute;
      left: 0;
      top: 28%;
      bottom: 28%;
      width: 1px;
      background: var(--ndw-color-grey-200);
    }
    .pill--open .seg--active::before,
    .pill--open .seg--active + .seg::before {
      opacity: 0;
    }
    .seg__btn {
      all: unset;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
      min-width: 9rem;
      padding: 10px 24px;
      border-radius: var(--ndw-border-radius-sm);
      cursor: pointer;
    }
    .seg__btn:hover {
      background: var(--ndw-color-grey-200);
    }
    .seg--active .seg__btn,
    .seg--active .seg__btn:hover {
      background: var(--ndw-color-white);
      box-shadow: inset 0 0 0 var(--ndw-border-size-sm) var(--ndw-color-primary-500);
    }
    .seg__btn:focus-visible {
      outline: var(--ndw-border-size-md) solid var(--ndw-color-warning-500);
    }
    .seg__label {
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1rem;
      color: var(--ndw-color-grey-700);
    }
    .seg__value {
      font-size: 0.875rem;
      line-height: 1.125rem;
      color: var(--ndw-color-grey-500);
      white-space: nowrap;
    }
    .pop {
      position: absolute;
      z-index: 30;
      top: calc(100% + 10px);
      left: 0;
      padding: var(--ndw-spacing-md);
      background: var(--ndw-color-white);
      border: var(--ndw-border-size-sm) solid var(--ndw-color-grey-200);
      border-radius: var(--ndw-border-radius-sm);
      box-shadow: var(--ndw-elevation-popover);
    }
    .pop--datum {
      width: 24rem;
      max-width: calc(100vw - 2rem);
    }
    .pop--tijd {
      width: 24rem;
    }
    .pop--richting {
      width: 22rem;
    }

    /* Kalender van het ontwerpsysteem */
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ndw-spacing-xs);
      margin-top: var(--ndw-spacing-sm);
    }
    .hint {
      margin: var(--ndw-spacing-sm) 0 0;
      font-size: 0.8125rem;
      color: var(--ndw-color-grey-500);
    }

    /* Tijd */
    .toggle {
      margin-bottom: var(--ndw-spacing-md);
    }
    .hours {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--ndw-spacing-2xs);
    }
    .hour {
      all: unset;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      height: 2.5rem;
      font-size: 0.875rem;
      border: var(--ndw-border-size-sm) solid transparent;
      border-radius: var(--ndw-border-radius-sm);
      cursor: pointer;
    }
    .hour:hover {
      border-color: var(--ndw-color-primary-500);
    }
    .hour--in {
      background: var(--ndw-color-primary-100);
    }
    .hour--end,
    .hour--end:hover {
      color: var(--ndw-color-white);
      background: var(--ndw-color-primary-500);
    }
    .hour:focus-visible {
      outline: var(--ndw-border-size-md) solid var(--ndw-color-warning-500);
    }
  `,
})
export class FietsFilterbarComponent {
  readonly date = model.required<string>();
  readonly hour0 = model.required<number>();
  readonly hour1 = model.required<number>();
  readonly hourMode = model.required<'uur' | 'reeks'>();
  readonly direction = model.required<DirectionFilter>();

  protected readonly open = signal<Panel | null>(null);
  protected readonly anchor = signal<number | null>(null);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly directions = DIRECTIONS;
  protected readonly hourModes = [{ value: 'uur', label: 'Eén uur' }, { value: 'reeks', label: 'Reeks' }];
  protected readonly minDate = toDate(DATA_START);
  protected readonly maxDate = toDate(DATA_END);
  protected readonly hasData = (d: Date | null) => !!d && toIso(d) >= DATA_START && toIso(d) <= DATA_END;
  protected readonly calendarControl = new FormControl<Date | null>(null);
  protected readonly hoursList = Array.from({ length: 24 }, (_, h) => h);
  protected readonly dataStart = DATA_START;
  protected readonly dataEnd = DATA_END;
  protected readonly hourLabel = hourLabel;
  protected readonly rangeLabel = rangeLabel;
  protected readonly label = dateLabel;

  protected readonly segments = computed(() => [
    { id: 'datum' as Panel, label: 'Datum', value: dateLabel(this.date()) },
    { id: 'tijd' as Panel, label: 'Tijd', value: rangeLabel(this.hour0(), this.hour1()) },
    { id: 'richting' as Panel, label: 'Richting', value: DIRECTIONS.find((d) => d.value === this.direction())?.label ?? '' },
  ]);

  constructor() {
    this.calendarControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((d) => {
      if (d && toIso(d) !== this.date()) this.pickDate(toIso(d));
    });
    effect(() => this.calendarControl.setValue(toDate(this.date()), { emitEvent: false }));
  }

  protected toggle(panel: Panel) {
    const next = this.open() === panel ? null : panel;
    this.open.set(next);
    this.anchor.set(null);
  }

  protected closeOutside(event: Event) {
    const target = event.target as HTMLElement;
    // De kalender van de datepicker opent in een overlay buiten dit component; klikken daarin sluit het paneel niet.
    if (!this.#host.nativeElement.contains(target) && !target.closest('.cdk-overlay-container')) this.open.set(null);
  }

  protected pickDate(iso: string) {
    this.date.set(iso);
    this.open.set(null);
  }

  protected shiftDay(days: number) {
    const d = new Date(`${this.date()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    const iso = d.toISOString().slice(0, 10);
    if (iso >= DATA_START && iso <= DATA_END) this.date.set(iso);
  }

  protected setMode(mode: 'uur' | 'reeks') {
    this.hourMode.set(mode);
    this.anchor.set(null);
    if (mode === 'uur') this.hour1.set(this.hour0());
    else if (this.hour1() === this.hour0()) this.hour1.set(Math.min(23, this.hour0() + 2));
  }

  protected pickHour(h: number) {
    if (this.hourMode() === 'uur') {
      this.hour0.set(h);
      this.hour1.set(h);
      this.open.set(null);
      return;
    }
    const anchor = this.anchor();
    if (anchor === null) {
      this.anchor.set(h);
      this.hour0.set(h);
      this.hour1.set(h);
    } else {
      this.hour0.set(Math.min(anchor, h));
      this.hour1.set(Math.max(anchor, h));
      this.anchor.set(null);
      this.open.set(null);
    }
  }

  protected pickDirection(direction: DirectionFilter | undefined) {
    if (!direction) return;
    this.direction.set(direction);
    this.open.set(null);
  }
}

// ---------------------------------------------------------------- datumhulpen

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
