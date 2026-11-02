import * as d3 from 'd3';

// Reveal solid data curves without changing the styling of dashed forecast lines.
export function revealLine(selection, reduced) {
  if (reduced) return;
  selection.each(function () {
    const path = d3.select(this);
    const length = this.getTotalLength();
    if (!length) return;
    path.attr('stroke-dasharray', `${length} ${length}`).attr('stroke-dashoffset', length)
      .transition().duration(650).ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)
      .on('end', () => path.attr('stroke-dasharray', null).attr('stroke-dashoffset', null));
  });
}
