/**
 * `ndw-tooltip` (design system) does not tell on which side of its trigger it is shown, nor where
 * the trigger is, so the arrow cannot be styled in CSS alone. This watches for tooltips being added
 * to the DOM and sets, on the tooltip:
 *  - `data-placement="top|bottom|left|right"`: where the tooltip is relative to its trigger;
 *  - `--tooltip-shift`: horizontal shift (top/bottom) that centres the tooltip on its trigger while
 *    keeping it inside the viewport;
 *  - `--tooltip-arrow-x` / `--tooltip-arrow-y`: where the arrow must sit so it points at the
 *    trigger's centre, also when the tooltip had to move aside (e.g. next to the screen edge).
 * See CC-039 and the `ndw-tooltip` rules in `src/styles.scss`.
 */
const VIEWPORT_MARGIN = 8;
const ARROW_INSET = 12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

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
        const tolerance = 2;
        const placement =
          t.left >= r.right - tolerance ? 'right' : t.right <= r.left + tolerance ? 'left' : t.bottom <= r.top + tolerance ? 'top' : 'bottom';
        tooltip.dataset['placement'] = placement;

        if (placement === 'top' || placement === 'bottom') {
          const viewportWidth = document.documentElement.clientWidth;
          const triggerCenter = r.left + r.width / 2;
          const left = clamp(triggerCenter - t.width / 2, VIEWPORT_MARGIN, viewportWidth - t.width - VIEWPORT_MARGIN);
          tooltip.style.setProperty('--tooltip-shift', `${left - t.left}px`);
          tooltip.style.setProperty('--tooltip-arrow-x', `${clamp(triggerCenter - left, ARROW_INSET, t.width - ARROW_INSET)}px`);
        } else {
          const triggerMiddle = r.top + r.height / 2;
          tooltip.style.setProperty('--tooltip-arrow-y', `${clamp(triggerMiddle - t.top, ARROW_INSET, t.height - ARROW_INSET)}px`);
        }
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
