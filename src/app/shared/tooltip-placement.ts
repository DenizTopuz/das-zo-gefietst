/**
 * `ndw-tooltip` (design system) does not tell on which side of its trigger it is shown, nor where
 * the trigger is, and it only supports `top` (with a flip to below) and `right`. This watches for
 * tooltips being added to the DOM and sets, on the tooltip:
 *  - `data-placement="top|bottom|left|right"`: where the tooltip is relative to its trigger;
 *  - `--tooltip-shift` / `--tooltip-shift-y`: translation that centres the tooltip on its trigger
 *    (or moves it to a requested side) while keeping it inside the viewport;
 *  - `--tooltip-arrow-x` / `--tooltip-arrow-y`: where the arrow must sit so it points at the
 *    trigger's centre, also when the tooltip had to move aside (e.g. next to the screen edge).
 *
 * A container can ask for a side with `data-tooltip-side="top|bottom|left|right"`; its tooltips are
 * then shown on that side. Without it, the side chosen by the design system is kept.
 * See CC-039 and the `ndw-tooltip` rules in `src/styles.scss`.
 */
type Side = 'top' | 'bottom' | 'left' | 'right';

const VIEWPORT_MARGIN = 8;
const ARROW_INSET = 12;
const GAP = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
const isSide = (value: string | undefined): value is Side => value === 'top' || value === 'bottom' || value === 'left' || value === 'right';

export function observeTooltipPlacement(): void {
  const placeTooltip = (tooltip: HTMLElement) => {
    // CDK positions the overlay after attaching it, so measure on the next frames.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // Triggers: `ndwTooltip` sets `aria-hidden="false"` and a `tabindex` on its host; menu items
        // and some buttons also carry `aria-describedby` or `ndwtooltipposition`.
        const triggers = document.querySelectorAll<HTMLElement>(
          ':is([aria-describedby], [ndwtooltipposition], [aria-hidden="false"][tabindex]):is(:hover, :focus)',
        );
        const trigger = triggers[triggers.length - 1];
        if (!trigger) return;

        const t = tooltip.getBoundingClientRect();
        const r = trigger.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const requested = trigger.closest<HTMLElement>('[data-tooltip-side]')?.dataset['tooltipSide'];

        const tolerance = 2;
        const current: Side =
          t.left >= r.right - tolerance ? 'right' : t.right <= r.left + tolerance ? 'left' : t.bottom <= r.top + tolerance ? 'top' : 'bottom';
        const placement: Side = isSide(requested) ? requested : current;
        tooltip.dataset['placement'] = placement;

        const triggerCenterX = r.left + r.width / 2;
        const triggerCenterY = r.top + r.height / 2;
        let left = t.left;
        let top = t.top;

        if (placement === 'top' || placement === 'bottom') {
          left = clamp(triggerCenterX - t.width / 2, VIEWPORT_MARGIN, viewportWidth - t.width - VIEWPORT_MARGIN);
          if (placement !== current) top = placement === 'top' ? r.top - GAP - t.height : r.bottom + GAP;
          tooltip.style.setProperty('--tooltip-arrow-x', `${clamp(triggerCenterX - left, ARROW_INSET, t.width - ARROW_INSET)}px`);
        } else {
          top = clamp(triggerCenterY - t.height / 2, VIEWPORT_MARGIN, viewportHeight - t.height - VIEWPORT_MARGIN);
          if (placement !== current) left = placement === 'left' ? r.left - GAP - t.width : r.right + GAP;
          tooltip.style.setProperty('--tooltip-arrow-y', `${clamp(triggerCenterY - top, ARROW_INSET, t.height - ARROW_INSET)}px`);
        }

        tooltip.style.setProperty('--tooltip-shift', `${left - t.left}px`);
        tooltip.style.setProperty('--tooltip-shift-y', `${top - t.top}px`);
      }),
    );
  };

  new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const tooltip = node.matches('ndw-tooltip') ? node : node.querySelector<HTMLElement>('ndw-tooltip');
        if (tooltip) placeTooltip(tooltip);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
