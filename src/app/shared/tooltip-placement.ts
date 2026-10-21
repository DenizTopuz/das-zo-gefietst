/**
 * `ndw-tooltip` (design system) does not tell on which side of its trigger it is shown, so the
 * arrow cannot be styled in CSS alone. This watches for tooltips being added to the DOM and sets
 * `data-placement="top|bottom|left|right"` (where the tooltip is relative to its trigger).
 * See CC-039 and the `ndw-tooltip` rules in `src/styles.scss`.
 */
export function observeTooltipPlacement(): void {
  const placeTooltip = (tooltip: HTMLElement) => {
    // CDK positions the overlay after attaching it, so measure on the next frames.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const triggers = document.querySelectorAll<HTMLElement>(
          ':is([aria-describedby], [ndwtooltipposition], [ndwtooltip]):is(:hover, :focus)',
        );
        const trigger = triggers[triggers.length - 1];
        if (!trigger) return;

        const t = tooltip.getBoundingClientRect();
        const r = trigger.getBoundingClientRect();
        const tolerance = 2;
        const placement =
          t.left >= r.right - tolerance ? 'right' : t.right <= r.left + tolerance ? 'left' : t.bottom <= r.top + tolerance ? 'top' : 'bottom';
        tooltip.dataset['placement'] = placement;
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
