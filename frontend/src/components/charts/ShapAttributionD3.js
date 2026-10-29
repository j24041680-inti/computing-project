/**
 * ShapAttributionD3.js
 * ============================================================================
 * Chart 3 (D3.js): Minimalist TreeSHAP Feature Attribution Bar Chart
 * Unit: COS30049 Computing Technology Innovation Project (Group 7 - SchoolAir)
 *
 * Fix: Full cleanup on unmount to prevent stale D3 listeners blocking navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';

const ShapAttributionD3 = ({ attributions = [] }) => {
  const svgRef = useRef(null);
  const [viewMode, setViewMode] = useState('percentage');
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !attributions || attributions.length === 0) return;

    const data = attributions.slice(0, 6);
    const width = 520;
    const rowHeight = 36;
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
        .attr('fill', '#f1f5f9');

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
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('opacity', 0.8);
          setHoveredItem(d);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 1);
          setHoveredItem(null);
        })
        .attr('width', 0)
        .transition()
        .duration(600)
        .attr('width', (d) => Math.max(4, xScale(d.percentage)));

      g.selectAll('.val')
        .data(data)
        .enter()
        .append('text')
        .attr('x', (d) => xScale(d.percentage) + 8)
        .attr('y', (d) => yScale(d.feature) + yScale.bandwidth() / 2 + 4)
        .attr('font-size', '11.5px')
        .attr('font-weight', '700')
        .attr('fill', '#334155')
        .text((d) => `${d.percentage.toFixed(1)}%`);
    } else {
      const maxAbs = Math.max(d3.max(data, (d) => Math.abs(d.shap_value)) || 5, 2);
      const xScale = d3.scaleLinear().domain([-maxAbs * 1.15, maxAbs * 1.15]).range([0, innerW]);
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
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('opacity', 0.8);
          setHoveredItem(d);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 1);
          setHoveredItem(null);
        })
        .attr('x', zeroX)
        .attr('width', 0)
        .transition()
        .duration(600)
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
        .attr('fill', '#334155')
        .text((d) => `${d.shap_value >= 0 ? '+' : ''}${d.shap_value.toFixed(1)}`);
    }

    const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll('text').attr('font-size', '11.5px').attr('font-weight', '600').attr('fill', '#334155');

    // ✅ CLEANUP
    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
      svg.on('.brush', null);
      svg.on('.zoom', null);
    };
  }, [attributions, viewMode]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Top 6 Predictive Factors (XGBoost TreeSHAP)
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

      <svg
        ref={svgRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="D3 SHAP Bar Chart"
      />

      <Box sx={{ minHeight: 26, mt: 1, textAlign: 'right' }}>
        {hoveredItem ? (
          <Chip
            size="small"
            label={`${hoveredItem.feature}: ${hoveredItem.percentage}% (${hoveredItem.shap_value >= 0 ? '+' : ''}${hoveredItem.shap_value.toFixed(2)} API)`}
            sx={{ fontWeight: 600, bgcolor: '#eff6ff', color: '#1d4ed8' }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Hover any bar for exact API attribution
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ShapAttributionD3;