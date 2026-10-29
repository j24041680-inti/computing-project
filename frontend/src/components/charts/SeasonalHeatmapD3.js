/**
 * SeasonalHeatmapD3.js
 * ============================================================================
 * Chart 4 (D3.js): Minimalist 12-Month Station Risk & Correlation Matrix
 * Unit: COS30049 Computing Technology Innovation Project (Group 7 - SchoolAir)
 *
 * Fix: Full cleanup on unmount to prevent stale D3 listeners blocking navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, ToggleButton, ToggleButtonGroup, Chip, Typography } from '@mui/material';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SeasonalHeatmapD3 = ({
  seasonalCells = [],
  correlationData = null,
  onSelectStationMonth = null,
}) => {
  const svgRef = useRef(null);
  const [heatmapMode, setHeatmapMode] = useState('seasonal');
  const [metricField, setMetricField] = useState('planning_risk_index');
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();
    svg.on('.brush', null);
    svg.on('.zoom', null);

    if (heatmapMode === 'seasonal') {
      if (!seasonalCells || seasonalCells.length === 0) return;

      const districts = Array.from(new Set(seasonalCells.map((d) => d.district)));
      const rowH = 26;
      const margin = { top: 28, right: 16, bottom: 20, left: 125 };
      const width = 660;
      const height = margin.top + margin.bottom + districts.length * rowH;

      svg.attr('viewBox', `0 0 ${width} ${height}`);
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

      const xScale = d3.scaleBand().domain(MONTH_SHORT).range([0, innerW]).padding(0.08);
      const yScale = d3.scaleBand().domain(districts).range([0, innerH]).padding(0.12);

      const getColor = (val) => {
        if (metricField === 'mean_temp') return d3.interpolateYlOrRd((val - 24) / 10);
        if (val <= 50) return '#dcfce7';
        if (val <= 80) return '#fef9c3';
        if (val <= 100) return '#fde047';
        if (val <= 160) return '#fdba74';
        return '#fca5a5';
      };

      const getTextColor = (val) => {
        if (metricField === 'mean_temp') return val > 30 ? '#ffffff' : '#0f172a';
        if (val <= 50) return '#166534';
        if (val <= 100) return '#854d0e';
        if (val <= 160) return '#9a3412';
        return '#991b1b';
      };

      const cellGroups = g
        .selectAll('.cell-g')
        .data(seasonalCells)
        .enter()
        .append('g')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          d3.select(this).select('rect').attr('stroke', '#0f172a').attr('stroke-width', 1.8);
          setHoveredCell(d);
        })
        .on('mouseleave', function () {
          d3.select(this).select('rect').attr('stroke', 'none');
          setHoveredCell(null);
        })
        .on('click', (_, d) => onSelectStationMonth && onSelectStationMonth(d.district, d.month));

      cellGroups
        .append('rect')
        .attr('x', (d) => xScale(d.month_short))
        .attr('y', (d) => yScale(d.district))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('rx', 4)
        .attr('fill', (d) => getColor(d[metricField]));

      cellGroups
        .append('text')
        .attr('x', (d) => xScale(d.month_short) + xScale.bandwidth() / 2)
        .attr('y', (d) => yScale(d.district) + yScale.bandwidth() / 2 + 3.5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9.5px')
        .attr('font-weight', '700')
        .attr('fill', (d) => getTextColor(d[metricField]))
        .text((d) => Number(d[metricField]).toFixed(0));

      const xAxis = g.append('g').call(d3.axisTop(xScale).tickSize(0));
      xAxis.select('.domain').remove();
      xAxis.selectAll('text').attr('font-size', '10.5px').attr('font-weight', '700').attr('fill', '#334155');

      const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
      yAxis.select('.domain').remove();
      yAxis.selectAll('text').attr('font-size', '10.5px').attr('font-weight', '600').attr('fill', '#475569');
    } else {
      if (!correlationData || !correlationData.matrix) return;

      const labels = correlationData.labels || [];
      const matrix = correlationData.matrix || [];
      const width = 540;
      const height = 360;
      const margin = { top: 32, right: 20, bottom: 20, left: 120 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      svg.attr('viewBox', `0 0 ${width} ${height}`);
      const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

      const xScale = d3.scaleBand().domain(labels).range([0, innerW]).padding(0.08);
      const yScale = d3.scaleBand().domain(labels).range([0, innerH]).padding(0.08);
      const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([1, -1]);

      const flatCells = [];
      for (let i = 0; i < labels.length; i += 1) {
        for (let j = 0; j < labels.length; j += 1) {
          flatCells.push({ rowLabel: labels[i], colLabel: labels[j], r: matrix[i][j] });
        }
      }

      const cellG = g
        .selectAll('.corr-g')
        .data(flatCells)
        .enter()
        .append('g')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          d3.select(this).select('rect').attr('stroke', '#0f172a').attr('stroke-width', 1.8);
          setHoveredCell(d);
        })
        .on('mouseleave', function () {
          d3.select(this).select('rect').attr('stroke', 'none');
          setHoveredCell(null);
        });

      cellG
        .append('rect')
        .attr('x', (d) => xScale(d.colLabel))
        .attr('y', (d) => yScale(d.rowLabel))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('rx', 5)
        .attr('fill', (d) => colorScale(d.r));

      cellG
        .append('text')
        .attr('x', (d) => xScale(d.colLabel) + xScale.bandwidth() / 2)
        .attr('y', (d) => yScale(d.rowLabel) + yScale.bandwidth() / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10.5px')
        .attr('font-weight', '700')
        .attr('fill', (d) => (Math.abs(d.r) > 0.5 ? '#ffffff' : '#0f172a'))
        .text((d) => d.r.toFixed(2));

      const xAxis = g.append('g').call(d3.axisTop(xScale).tickSize(0));
      xAxis.select('.domain').remove();
      xAxis.selectAll('text').attr('font-size', '10px').attr('font-weight', '700').attr('fill', '#334155');

      const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
      yAxis.select('.domain').remove();
      yAxis.selectAll('text').attr('font-size', '10.5px').attr('font-weight', '600').attr('fill', '#334155');
    }

    // ✅ CLEANUP
    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
      svg.on('.brush', null);
      svg.on('.zoom', null);
    };
  }, [seasonalCells, correlationData, heatmapMode, metricField, onSelectStationMonth]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <ToggleButtonGroup
          size="small"
          value={heatmapMode}
          exclusive
          onChange={(_, val) => val && setHeatmapMode(val)}
          sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.5, fontSize: '0.75rem', textTransform: 'none' } }}
        >
          <ToggleButton value="seasonal">12-Month Risk Matrix</ToggleButton>
          <ToggleButton value="correlation">Feature Correlation (r)</ToggleButton>
        </ToggleButtonGroup>

        {heatmapMode === 'seasonal' && (
          <ToggleButtonGroup
            size="small"
            value={metricField}
            exclusive
            onChange={(_, val) => val && setMetricField(val)}
            sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.25, fontSize: '0.72rem', textTransform: 'none' } }}
          >
            <ToggleButton value="planning_risk_index">Risk Index</ToggleButton>
            <ToggleButton value="pred_mean_api">Typical API</ToggleButton>
            <ToggleButton value="mean_temp">Temp (°C)</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      <svg
        ref={svgRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="D3 Heatmap"
      />

      <Box sx={{ minHeight: 26, mt: 1, textAlign: 'right' }}>
        {hoveredCell ? (
          <Chip
            size="small"
            label={
              heatmapMode === 'seasonal'
                ? `${hoveredCell.district} (${hoveredCell.month_short}): ${hoveredCell.planning_risk_index} Risk • ${hoveredCell.mean_temp}°C (Click to inspect)`
                : `${hoveredCell.rowLabel} × ${hoveredCell.colLabel}: r = ${hoveredCell.r.toFixed(3)}`
            }
            sx={{ fontWeight: 600, bgcolor: '#eff6ff', color: '#1d4ed8' }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            {heatmapMode === 'seasonal' ? 'Click any station-month cell to open in Safety Checker' : 'Hover any cell for Pearson correlation'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SeasonalHeatmapD3;