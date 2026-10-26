import { ChangeDetectionStrategy, Component, computed, ElementRef, input, model, viewChild } from '@angular/core';

/**
 * Two panes with a resizable separator (WAI-ARIA window splitter): pointer drag, arrow keys, Home/End.
 * Both panes always stay in the DOM (so a map keeps its state); `show` hides one of them.
 * The design system's `ndw-splitter` is pixel based and cannot be controlled from outside, so it cannot
 * keep a shared ratio, offer presets or report percentages (see CC-044).
 */
@Component({
  selector: 'app-split-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #container class="split" [class.split--column]="direction() === 'column'" [class.split--reverse]="reverse()" [class.split--dragging]="dragging">
      <div class="pane pane--first" [id]="firstId()" [hidden]="show() === 'second'" [class.pane--only]="show() === 'first'" [style.--split-first.%]="percent()">
        <ng-content select="[first]"></ng-content>
      </div>

      @if (show() === 'both') {
        <div
          class="separator"
          role="separator"
          tabindex="0"
          [attr.aria-orientation]="direction() === 'row' ? 'vertical' : 'horizontal'"
          [attr.aria-label]="label()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="percent()"
          [attr.aria-valuetext]="valueText()"
          [attr.aria-controls]="firstId() + ' ' + secondId()"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerEnd($event)"
          (pointercancel)="onPointerEnd($event)"
          (keydown)="onKeydown($event)"
        >
          <svg viewBox="0 0 28 4" aria-hidden="true" focusable="false"><circle cx="2" cy="2" r="2" /><circle cx="14" cy="2" r="2" /><circle cx="26" cy="2" r="2" /></svg>
        </div>
      }

      <div class="pane pane--second" [id]="secondId()" [hidden]="show() === 'first'">
        <ng-content select="[second]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './split-workspace.component.scss',
})
export class SplitWorkspaceComponent {
  readonly direction = input<'row' | 'column'>('column');
  /** Size of the first pane as a fraction (0..1) of the available space. */
  readonly ratio = model(0.5);
  readonly show = input<'both' | 'first' | 'second'>('both');
  /** Show the first pane after the second one (right of / below it) while keeping the DOM order. */
  readonly reverse = input(false);
  readonly label = input('Verdeling van de werkruimte');
  readonly firstName = input('Kaart');
  readonly secondName = input('Resultaten');
  readonly firstId = input('split-first');
  readonly secondId = input('split-second');
  readonly min = input(20);
  readonly max = input(80);

  protected readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  protected dragging = false;

  protected readonly percent = computed(() => Math.min(this.max(), Math.max(this.min(), Math.round(this.ratio() * 100))));
  protected readonly valueText = computed(() => `${this.firstName()} ${this.percent()}%, ${this.secondName()} ${100 - this.percent()}%`);

  protected onPointerDown(event: PointerEvent) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging = true;
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent) {
    if (!this.dragging) return;
    const rect = this.container().nativeElement.getBoundingClientRect();
    const row = this.direction() === 'row';
    const size = row ? rect.width : rect.height;
    const offset = row ? event.clientX - rect.left : event.clientY - rect.top;
    this.set(((this.reverse() ? size - offset : offset) / size) * 100);
  }

  protected onPointerEnd(event: PointerEvent) {
    this.dragging = false;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  protected onKeydown(event: KeyboardEvent) {
    // Arrow keys move the separator in their own direction, also when the panes are reversed.
    const towardStart = this.direction() === 'row' ? 'ArrowLeft' : 'ArrowUp';
    const towardEnd = this.direction() === 'row' ? 'ArrowRight' : 'ArrowDown';
    const before = this.reverse() ? towardEnd : towardStart;
    const after = this.reverse() ? towardStart : towardEnd;
    const step = event.shiftKey ? 10 : 5;
    let next: number | null = null;
    switch (event.key) {
      case before:
        next = this.percent() - step;
        break;
      case after:
        next = this.percent() + step;
        break;
      case 'PageUp':
        next = this.percent() - 10;
        break;
      case 'PageDown':
        next = this.percent() + 10;
        break;
      case 'Home':
        next = this.min();
        break;
      case 'End':
        next = this.max();
        break;
    }
    if (next === null) return;
    event.preventDefault();
    this.set(next);
  }

  private set(percent: number) {
    this.ratio.set(Math.min(this.max(), Math.max(this.min(), Math.round(percent))) / 100);
  }
}
