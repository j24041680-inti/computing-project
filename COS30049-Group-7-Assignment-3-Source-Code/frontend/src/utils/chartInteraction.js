// Keep one tab stop per chart and let arrow keys move between its data points.
export function bindChartTargets(targets, { describe, inspect, activate, columns }) {
  const nodes = targets.nodes();
  let lastPointerType;
  let touchTarget;

  targets
    .attr('class', 'chart-target')
    .attr('role', 'button')
    .attr('tabindex', (_, index) => index === 0 ? 0 : -1)
    .attr('aria-label', describe)
    .on('focus', function (_, datum) {
      targets.attr('tabindex', -1);
      this.setAttribute('tabindex', '0');
      inspect(datum);
    })
    .on('blur', function () {
      if (touchTarget !== this) inspect(null);
    })
    .on('pointerenter', (event, datum) => {
      if (event.pointerType !== 'touch') inspect(datum);
    })
    .on('pointerleave', function () {
      if (touchTarget !== this) {
        const focused = nodes.find((node) => node === node.ownerDocument.activeElement);
        inspect(focused ? targets.filter((_, index) => nodes[index] === focused).datum() : null);
      }
    })
    .on('pointerdown', (event) => {
      lastPointerType = event.pointerType;
    })
    .on('click', function (event, datum) {
      if (event.detail > 0 && lastPointerType === 'touch' && touchTarget !== this) {
        touchTarget = this;
        inspect(datum);
        return;
      }
      touchTarget = null;
      activate(datum);
    })
    .on('keydown', function (event, datum) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate(datum);
        return;
      }

      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -(columns || 1), ArrowDown: columns || 1 };
      const offset = offsets[event.key];
      if (offset === undefined) return;

      event.preventDefault();
      const nextIndex = Math.max(0, Math.min(nodes.length - 1, nodes.indexOf(this) + offset));
      nodes[nextIndex].focus();
    });
}
