import useReducedMotion from '../../hooks/useReducedMotion';
import { formatApi } from '../../utils/formatApi';
/**
 * SeasonalHeatmapD3.js
 * ============================================================================
 * Chart 4 (D3.js): 12-Month Station Air Quality & Planning Risk Matrix
 * Unit: COS30049 Computing Technology Innovation Project (Group 7 - SchoolAir)
 *
 * Updates:
 *  - Removed correlation matrix mode per user request; focused entirely on 12-Month seasonal risk.
 *  - Connected station filter: Allows focusing on selectedDistrict or viewing all stations in corridor.
 *  - Clean D3 cleanup on unmount.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, ToggleButton, ToggleButtonGroup, Chip, Typography, Stack } from '@mui/material';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SeasonalHeatmapD3 = ({
  seasonalCells = [],
  selectedDistrict = 'Petaling Jaya',
  corridorName = 'All Corridors',
  onSelectStationMonth = null,
}) => {
  const reducedMotion = useReducedMotion();
  const svgRef = useRef(null);
  const [metricField, setMetricField] = useState('planning_risk_index');
  const [stationScope, setStationScope] = useState('selected');
  const [hoveredCell, setHoveredCell] = useState(null);

  // Sync stationScope when "All Stations" is explicitly chosen in the parent dropdown
  useEffect(() => {
    if (selectedDistrict === 'All Stations') {
      setStationScope('all');
    }
  }, [selectedDistrict]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !seasonalCells || seasonalCells.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();
    svg.on('.brush', null);
    svg.on('.zoom', null);

    const isSpecificSelected = Boolean(selectedDistrict && selectedDistrict !== 'All Stations');

    // Filter cells based on stationScope
    let displayedCells = seasonalCells;
    if (stationScope === 'selected' && isSpecificSelected) {
      const filtered = seasonalCells.filter(
        (d) => d.district?.toLowerCase() === selectedDistrict.toLowerCase()
      );
      if (filtered.length > 0) {
        displayedCells = filtered;
      }
    }

    const districts = Array.from(new Set(displayedCells.map((d) => d.district)));
    const isSingleStation = districts.length === 1;
    const rowH = isSingleStation ? 48 : 28;
    const margin = { top: 32, right: 18, bottom: 22, left: isSingleStation ? 145 : 135 };
    const width = 680;
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
      .data(displayedCells)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).select('rect').attr('stroke', '#0f172a').attr('stroke-width', 2);
        setHoveredCell(d);
      })
      .on('mouseleave', function (event, d) {
        const isSelected = isSpecificSelected && d.district?.toLowerCase() === selectedDistrict.toLowerCase();
        d3.select(this)
          .select('rect')
          .attr('stroke', isSelected ? 'var(--chart-blue, #2563eb)' : 'none')
          .attr('stroke-width', isSelected ? 2 : 0);
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
      .attr('fill', (d) => getColor(d[metricField]))
      .attr('stroke', (d) =>
        isSpecificSelected && d.district?.toLowerCase() === selectedDistrict.toLowerCase()
          ? 'var(--chart-blue, #2563eb)'
          : 'none'
      )
      .attr('stroke-width', (d) =>
        isSpecificSelected && d.district?.toLowerCase() === selectedDistrict.toLowerCase() ? 2 : 0
      );

    cellGroups
      .append('text')
      .attr('x', (d) => xScale(d.month_short) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.district) + yScale.bandwidth() / 2 + (isSingleStation ? 4.5 : 3.5))
      .attr('text-anchor', 'middle')
      .attr('font-size', isSingleStation ? '11px' : '9.5px')
      .attr('font-weight', '700')
      .attr('fill', (d) => getTextColor(d[metricField]))
      .text((d) => formatApi(d[metricField]));

    if (!reducedMotion) {
      g.selectAll('rect').attr('opacity', 0)
        .transition().duration(300).delay((d, i) => (i % 12) * 18).attr('opacity', 1);
    }

    const xAxis = g.append('g').call(d3.axisTop(xScale).tickSize(0));
    xAxis.select('.domain').remove();
    xAxis.selectAll('text').attr('font-size', '10.5px').attr('font-weight', '700').attr('fill', 'var(--chart-ink, #334155)');

    const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll('text')
      .attr('font-size', isSingleStation ? '11.5px' : '10.5px')
      .attr('font-weight', (d) =>
        isSpecificSelected && d.toLowerCase() === selectedDistrict.toLowerCase() ? '800' : '600'
      )
      .attr('fill', (d) =>
        isSpecificSelected && d.toLowerCase() === selectedDistrict.toLowerCase() ? 'var(--chart-blue, #1d4ed8)' : 'var(--chart-label, #475569)'
      )
      .text((d) =>
        isSpecificSelected && d.toLowerCase() === selectedDistrict.toLowerCase() ? `▶ ${d}` : d
      );

    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
      svg.on('.brush', null);
      svg.on('.zoom', null);
    };
  }, [seasonalCells, metricField, stationScope, selectedDistrict, onSelectStationMonth, reducedMotion]);

  const hasSpecificStation = Boolean(selectedDistrict && selectedDistrict !== 'All Stations');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mr: 0.5 }}>
            12-Month Regional Heatmap
          </Typography>

          {hasSpecificStation && (
            <ToggleButtonGroup
              size="small"
              value={stationScope}
              exclusive
              onChange={(_, val) => val && setStationScope(val)}
              sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.25, fontSize: '0.72rem', textTransform: 'none' } }}
            >
              <ToggleButton value="selected">Focus: {selectedDistrict}</ToggleButton>
              <ToggleButton value="all">
                All Stations in {corridorName !== 'All Corridors' ? corridorName.replace(' Corridor', '') : 'Malaysia'}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>

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
      </Box>

      <svg
        ref={svgRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="D3 Seasonal Heatmap"
      />

      <Box sx={{ minHeight: 26, mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {stationScope === 'all' && hasSpecificStation ? (
            <span>
              Highlighted: <strong style={{ color: 'var(--chart-blue, #1d4ed8)' }}>▶ {selectedDistrict}</strong> (selected station)
            </span>
          ) : (
            'Click any station-month cell to inspect in Safety Checker'
          )}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          {hoveredCell && (
            <Chip
              size="small"
              label={`${hoveredCell.district} (${hoveredCell.month_short}): ${formatApi(hoveredCell.planning_risk_index)} Risk • ${hoveredCell.mean_temp}°C (Click to inspect)`}
              sx={{ fontWeight: 600, bgcolor: '#eff6ff', color: '#1d4ed8' }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SeasonalHeatmapD3;