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
 *
 * The CDK overlay may (re)position the tooltip after it was attached, so the placement is computed
 * again whenever the overlay's position changes, always starting from the tooltip's natural
 * (unshifted) position. See CC-039 and the `ndw-tooltip` rules in `src/styles.scss`.
 */
type Side = 'top' | 'bottom' | 'left' | 'right';

const VIEWPORT_MARGIN = 8;
const ARROW_INSET = 12;
const GAP = 8;
const TRIGGER_SELECTOR =
  // `ndwTooltip` sets `aria-hidden="false"` and a `tabindex` on its host; menu items also carry `ndwtooltipposition`.
  ':is([aria-describedby], [ndwtooltipposition], [aria-hidden="false"][tabindex]):is(:hover, :focus)';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
const isSide = (value: string | undefined): value is Side => value === 'top' || value === 'bottom' || value === 'left' || value === 'right';
const cssPx = (tooltip: HTMLElement, name: string) => parseFloat(tooltip.style.getPropertyValue(name)) || 0;

function placeTooltip(tooltip: HTMLElement): void {
  const triggers = document.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR);
  const trigger = triggers[triggers.length - 1];
  if (!trigger) return;

  const rect = tooltip.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  // Natural position: where the CDK put the tooltip, without our own translation.
  const naturalLeft = rect.left - cssPx(tooltip, '--tooltip-shift');
  const naturalTop = rect.top - cssPx(tooltip, '--tooltip-shift-y');
  const { width, height } = rect;
  const r = trigger.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const requested = trigger.closest<HTMLElement>('[data-tooltip-side]')?.dataset['tooltipSide'];

  const tolerance = 2;
  const current: Side =
    naturalLeft >= r.right - tolerance
      ? 'right'
      : naturalLeft + width <= r.left + tolerance
        ? 'left'
        : naturalTop + height <= r.top + tolerance
          ? 'top'
          : 'bottom';
  const placement: Side = isSide(requested) ? requested : current;
  tooltip.dataset['placement'] = placement;

  const triggerCenterX = r.left + r.width / 2;
  const triggerCenterY = r.top + r.height / 2;
  let left = naturalLeft;
  let top = naturalTop;

  if (placement === 'top' || placement === 'bottom') {
    left = clamp(triggerCenterX - width / 2, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN);
    if (placement !== current) top = placement === 'top' ? r.top - GAP - height : r.bottom + GAP;
    tooltip.style.setProperty('--tooltip-arrow-x', `${clamp(triggerCenterX - left, ARROW_INSET, width - ARROW_INSET)}px`);
  } else {
    top = clamp(triggerCenterY - height / 2, VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN);
    if (placement !== current) left = placement === 'left' ? r.left - GAP - width : r.right + GAP;
    tooltip.style.setProperty('--tooltip-arrow-y', `${clamp(triggerCenterY - top, ARROW_INSET, height - ARROW_INSET)}px`);
  }

  tooltip.style.setProperty('--tooltip-shift', `${left - naturalLeft}px`);
  tooltip.style.setProperty('--tooltip-shift-y', `${top - naturalTop}px`);
}

function watchTooltip(tooltip: HTMLElement): void {
  const pane = tooltip.closest('.cdk-overlay-pane');
  const boundingBox = pane?.parentElement;
  let frame = 0;

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const update = () => {
    frame = 0;
    if (!tooltip.isConnected) {
      mutations.disconnect();
      resize.disconnect();
      return;
    }
    placeTooltip(tooltip);
  };

  // Our own changes only touch the tooltip's `style`, which is not observed, so this cannot loop.
  const mutations = new MutationObserver(schedule);
  for (const node of [pane, boundingBox]) {
    if (node) mutations.observe(node, { attributes: true, attributeFilter: ['style', 'class'] });
  }
  const resize = new ResizeObserver(schedule);
  resize.observe(tooltip);

  schedule();
  // The overlay is positioned asynchronously; a few late passes cover slow frames.
  for (const delay of [50, 150, 400]) setTimeout(schedule, delay);
}

export function observeTooltipPlacement(): void {
  new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const tooltip = node.matches('ndw-tooltip') ? node : node.querySelector<HTMLElement>('ndw-tooltip');
        if (tooltip) watchTooltip(tooltip);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
