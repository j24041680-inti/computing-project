import useReducedMotion from '../../hooks/useReducedMotion';
import { formatApi } from '../../utils/formatApi';
import ChartPointReadout from './ChartPointReadout';

/**
 ShapAttributionD3.js

 Chart 3 (D3.js): Minimalist TreeSHAP Feature Attribution Bar Chart
 **/

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ShapAttributionD3 = ({ attributions = [] }) => {
  const reducedMotion = useReducedMotion();
  const labelColor = useTheme().palette.text.primary;
  const svgRef = useRef(null);
  const [viewMode, setViewMode] = useState('percentage');
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    setHoveredItem(null);
    if (!svgEl || !attributions || attributions.length === 0) return;

    function showReadout(_, item) {
      const bar = this;
      d3.select(bar).attr('opacity', 0.8);
      setHoveredItem({
        item,
        open: true,
        anchor: {
          getBoundingClientRect: () => bar.getBoundingClientRect(),
          contextElement: svgEl,
        },
      });
    }

    function hideReadout() {
      d3.select(this).attr('opacity', 1);
      setHoveredItem((previous) => previous && { ...previous, open: false });
    }

    const animateBars = !reducedMotion;
    const data = attributions.slice(0, 6);
    const width = 520;
    const rowHeight = 30;
    const margin = { top: 12, right: 64, bottom: 16, left: 165 };
    const height = margin.top + margin.bottom + data.length * rowHeight;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();
    svg.on('.brush', null);
    svg.on('.zoom', null);
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.feature))
      .range([0, innerH])
      .padding(0.32);

    const palette = ['#2563eb', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'];

    if (viewMode === 'percentage') {
      const maxPct = Math.max(d3.max(data, (d) => d.percentage) || 50, 35);
      const xScale = d3.scaleLinear().domain([0, maxPct]).range([0, innerW]);

      g.selectAll('.track')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => yScale(d.feature))
        .attr('width', innerW)
        .attr('height', yScale.bandwidth())
        .attr('rx', 6)
        .attr('fill', 'var(--chart-highlight, #f1f5f9)');

      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => yScale(d.feature))
        .attr('height', yScale.bandwidth())
        .attr('rx', 6)
        .attr('fill', (_, i) => palette[i % palette.length])
        .style('cursor', 'pointer')
        .on('mouseenter', showReadout)
        .on('mouseleave', hideReadout)
        .attr('width', (d) => animateBars ? 0 : Math.max(4, xScale(d.percentage)))
        .transition()
        .duration(animateBars ? 450 : 0)
        .attr('width', (d) => Math.max(4, xScale(d.percentage)));

      g.selectAll('.val')
        .data(data)
        .enter()
        .append('text')
        .attr('x', innerW + margin.right - 12)
        .attr('y', (d) => yScale(d.feature) + yScale.bandwidth() / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '12.5px')
        .attr('font-weight', '700')
        .attr('fill', labelColor)
        .text((d) => `${d.percentage.toFixed(1)}%`);
    } else {
      const maxAbs = Math.max(d3.max(data, (d) => Math.abs(d.shap_value)) || 5, 2);
      // Leave room for signed values beyond both ends of the bars.
      const valueLabelSpace = 48;
      const xScale = d3.scaleLinear()
        .domain([-maxAbs, maxAbs])
        .range([valueLabelSpace, innerW - valueLabelSpace]);
      const zeroX = xScale(0);

      g.append('line')
        .attr('x1', zeroX)
        .attr('x2', zeroX)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#94a3b8')
        .attr('stroke-dasharray', '3,3');

      g.selectAll('.bar-signed')
        .data(data)
        .enter()
        .append('rect')
        .attr('y', (d) => yScale(d.feature))
        .attr('height', yScale.bandwidth())
        .attr('rx', 5)
        .attr('fill', (d) => (d.shap_value >= 0 ? '#f97316' : '#10b981'))
        .style('cursor', 'pointer')
        .on('mouseenter', showReadout)
        .on('mouseleave', hideReadout)
        .attr('x', (d) => animateBars || d.shap_value >= 0 ? zeroX : xScale(d.shap_value))
        .attr('width', (d) => animateBars ? 0 : Math.max(3, Math.abs(xScale(d.shap_value) - zeroX)))
        .transition()
        .duration(animateBars ? 450 : 0)
        .attr('x', (d) => (d.shap_value >= 0 ? zeroX : xScale(d.shap_value)))
        .attr('width', (d) => Math.max(3, Math.abs(xScale(d.shap_value) - zeroX)));

      g.selectAll('.val-signed')
        .data(data)
        .enter()
        .append('text')
        .attr('x', (d) => (d.shap_value >= 0 ? xScale(d.shap_value) + 6 : xScale(d.shap_value) - 6))
        .attr('y', (d) => yScale(d.feature) + yScale.bandwidth() / 2 + 4)
        .attr('text-anchor', (d) => (d.shap_value >= 0 ? 'start' : 'end'))
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', labelColor)
        .text((d) => `${d.shap_value >= 0 ? '+' : ''}${d.shap_value.toFixed(1)}`);
    }

    const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll('text').attr('font-size', '11.5px').attr('font-weight', '600').attr('fill', labelColor);

    // ✅ CLEANUP
    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
      svg.on('.brush', null);
      svg.on('.zoom', null);
    };
  }, [attributions, viewMode, reducedMotion, labelColor]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Top 6 predictive factors. Hover over a bar for details.
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(_, val) => val && setViewMode(val)}
          sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.25, fontSize: '0.72rem', textTransform: 'none' } }}
        >
          <ToggleButton value="percentage">% Share</ToggleButton>
          <ToggleButton value="signed">± API Shift</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          style={{ width: '100%', minWidth: 460, height: 'auto', display: 'block' }}
          role="img"
          aria-label="Prediction drivers bar chart"
        />
      </Box>

      <ChartPointReadout
        anchor={hoveredItem?.anchor}
        open={hoveredItem?.open}
        reducedMotion={reducedMotion}
      >
        {hoveredItem && `${hoveredItem.item.feature} · ${hoveredItem.item.percentage}% · ${hoveredItem.item.shap_value >= 0 ? '+' : ''}${formatApi(hoveredItem.item.shap_value)} API`}
      </ChartPointReadout>
    </Box>
  );
};

export default ShapAttributionD3;
