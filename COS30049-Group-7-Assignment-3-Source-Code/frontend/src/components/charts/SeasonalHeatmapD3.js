import ChartPointReadout from './ChartPointReadout';
import { getContrastRatio, useTheme } from '@mui/material/styles';
import { bindChartTargets } from '../../utils/chartInteraction';
import { formatApi } from '../../utils/formatApi';
import useReducedMotion from '../../hooks/useReducedMotion';

/**
 SeasonalHeatmapD3.js
 
 Chart 4 (D3.js): 12-Month Station Air Quality & Planning Risk Matrix
 **/

import React, { useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Stack } from '@mui/material';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const METRICS = {
  planning_risk_index: 'Risk Index',
  pred_mean_api: 'Typical API',
  mean_temp: 'Temperature',
};
const API_BANDS = [
  { max: 50, label: '≤ 50', light: '#dcfce7', dark: '#14532d', ink: '#166534' },
  { max: 80, label: '> 50–80', light: '#fef9c3', dark: '#504018', ink: '#854d0e' },
  { max: 100, label: '> 80–100', light: '#fde047', dark: '#614814', ink: '#854d0e' },
  { max: 160, label: '> 100–160', light: '#fdba74', dark: '#78350f', ink: '#9a3412' },
  { max: Infinity, label: '> 160', light: '#fca5a5', dark: '#7f1d1d', ink: '#991b1b' },
];

const describeCell = (cell, metric) =>
  `${cell.district} · ${cell.month_short} · ${METRICS[metric]} ${formatApi(cell[metric])}${
    metric === 'mean_temp' ? '°C' : metric === 'pred_mean_api' ? ' API' : ''
  }`;

const temperatureColor = (value, dark) => {
  const color = d3.interpolateYlOrRd((value - 24) / 10);
  return dark ? d3.interpolateRgb('#121b2c', color)(0.38) : color;
};

const SeasonalHeatmapD3 = ({
  seasonalCells = [],
  selectedDistrict = 'Petaling Jaya',
  corridorName = 'All Corridors',
  onSelectStationMonth = null,
}) => {
  const svgRef = useRef(null);
  const { palette } = useTheme();
  const dark = palette.mode === 'dark';
  const lastDrawnView = useRef(null);
  const selectStationMonth = useRef(onSelectStationMonth);
  const reducedMotion = useReducedMotion();
  const [metricField, setMetricField] = useState('planning_risk_index');
  const [stationScope, setStationScope] = useState('all');
  const [inspectedTile, setInspectedTile] = useState(null);

  useLayoutEffect(() => {
    selectStationMonth.current = onSelectStationMonth;
  }, [onSelectStationMonth]);

  // Sync stationScope when "All Stations" is explicitly chosen in the parent dropdown
  useLayoutEffect(() => {
    if (selectedDistrict === 'All Stations') {
      setStationScope('all');
    }
  }, [selectedDistrict]);

  useLayoutEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !seasonalCells || seasonalCells.length === 0) return;

    setInspectedTile(null);
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

    const cellGroups = g.selectAll('.chart-target').data(displayedCells).join('g')
      .style('cursor', 'pointer');

    const tileByCell = new Map(cellGroups.nodes().map((tile) => [d3.select(tile).datum(), tile]));
    let activeTile = null;
    bindChartTargets(cellGroups, {
      describe: (cell) => `${describeCell(cell, metricField)}. Open Safety Checker`,
      inspect: (cell) => {
        const tile = tileByCell.get(cell);
        if (tile === activeTile) return;

        activeTile?.classList.remove('heatmap-tile-inspected');
        activeTile = tile;
        if (tile) {
          tile.classList.add('heatmap-tile-inspected');
          const anchor = {
            getBoundingClientRect: () => tile.getBoundingClientRect(),
            contextElement: svgEl,
          };
          setInspectedTile({ cell, anchor, open: true });
        } else {
          setInspectedTile((previous) => previous && { ...previous, open: false });
        }
      },
      activate: (cell) => selectStationMonth.current?.(cell.district, cell.month),
      columns: MONTH_SHORT.length,
    });

    cellGroups
      .append('rect')
      .attr('x', (d) => xScale(d.month_short))
      .attr('y', (d) => yScale(d.district))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', (d) => {
        const value = d[metricField];
        if (metricField === 'mean_temp') return temperatureColor(value, dark);
        return (API_BANDS.find(({ max }) => value <= max) || API_BANDS[4])[dark ? 'dark' : 'light'];
      })
      .attr('stroke', (d) =>
        isSpecificSelected && d.district?.toLowerCase() === selectedDistrict.toLowerCase()
          ? palette.primary.main
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
      .attr('fill', (d) => {
        if (dark) return '#f8fafc';
        if (metricField === 'mean_temp') {
          const fill = temperatureColor(d[metricField], false);
          return getContrastRatio(fill, '#000000') >= 4.5 ? '#000000' : '#ffffff';
        }
        return (API_BANDS.find(({ max }) => d[metricField] <= max) || API_BANDS[4]).ink;
      })
      .text((d) => formatApi(d[metricField]));

    const scope = isSpecificSelected ? stationScope : 'all';
    const view = JSON.stringify([corridorName, selectedDistrict, scope, metricField]);
    const previousView = lastDrawnView.current;
    if (!reducedMotion && scope === 'all' && previousView === JSON.stringify([corridorName, selectedDistrict, 'selected', metricField])) {
      const station = districts.find((district) => district.toLowerCase() === selectedDistrict.toLowerCase());
      if (station) {
        g.insert('rect', ':first-child')
          .attr('x', 4 - margin.left).attr('y', yScale(station) - 2)
          .attr('width', innerW + margin.left).attr('height', yScale.bandwidth() + 4)
          .attr('rx', 5).attr('fill', palette.primary.main).attr('opacity', 0.2)
          .attr('pointer-events', 'none')
          .transition().delay(300).duration(800).attr('opacity', 0).remove();
      }
    }
    // Fade the tile backgrounds from left to right while keeping values visible.
    if (view !== previousView && !reducedMotion) {
      cellGroups.select('rect').attr('opacity', 0)
        .transition().duration(300)
        .delay((d) => MONTH_SHORT.indexOf(d.month_short) * 18)
        .attr('opacity', 1);
    }
    const firstFrame = requestAnimationFrame(() => {
      lastDrawnView.current = view;
    });

    const xAxis = g.append('g').call(d3.axisTop(xScale).tickSize(0));
    xAxis.select('.domain').remove();
    xAxis.selectAll('text').attr('font-size', '10.5px').attr('font-weight', '700').attr('fill', palette.text.primary);

    const yAxis = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll('text')
      .attr('font-size', isSingleStation ? '11.5px' : '10.5px')
      .attr('font-weight', (d) =>
        isSpecificSelected && d.toLowerCase() === selectedDistrict.toLowerCase() ? '800' : '600'
      )
      .attr('fill', (d) =>
        isSpecificSelected && d.toLowerCase() === selectedDistrict.toLowerCase() ? palette.primary.main : palette.text.secondary
      )
      .text((d) =>
        isSpecificSelected && d.toLowerCase() === selectedDistrict.toLowerCase() ? `▶ ${d}` : d
      );

    return () => {
      cancelAnimationFrame(firstFrame);
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
      svg.on('.brush', null);
      svg.on('.zoom', null);
    };
  }, [seasonalCells, metricField, stationScope, selectedDistrict, corridorName, reducedMotion, dark, palette]);

  const hasSpecificStation = Boolean(selectedDistrict && selectedDistrict !== 'All Stations');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
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
              <ToggleButton value="all">
                All Stations in {corridorName !== 'All Corridors' ? corridorName.replace(' Corridor', '') : 'Malaysia'}
              </ToggleButton>
              <ToggleButton value="selected">Focus: {selectedDistrict}</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>

        <Box
          sx={{
            position: 'relative', display: 'inline-flex', maxWidth: '100%',
            border: '1px solid', borderColor: 'divider', borderRadius: 99, bgcolor: 'action.hover',
            '&::before': {
              content: '""', position: 'absolute', top: 2, bottom: 2, left: 2,
              width: 'calc((100% - 4px) / 3)', borderRadius: 99, bgcolor: 'background.paper',
              boxShadow: 1, pointerEvents: 'none',
              transform: `translateX(${Object.keys(METRICS).indexOf(metricField) * 100}%)`,
              '@media (prefers-reduced-motion: no-preference)': { transition: 'transform 220ms ease-out' },
            },
          }}
        >
          <ToggleButtonGroup
            size="small"
            value={metricField}
            exclusive
            aria-label="Heatmap metric"
            onChange={(_, val) => val && setMetricField(val)}
            sx={{
              width: '100%', p: '2px',
              '& .MuiToggleButton-root': {
                flex: '1 1 0', minWidth: 0, m: 0, py: 0.25, px: 1.25,
                fontSize: '0.72rem', textTransform: 'none', whiteSpace: 'nowrap',
                border: 0, borderRadius: 99,
                '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'transparent', color: 'text.primary' },
                '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
              },
            }}
          >
            <ToggleButton value="planning_risk_index">Risk Index</ToggleButton>
            <ToggleButton value="pred_mean_api">Typical API</ToggleButton>
            <ToggleButton value="mean_temp">Temp (°C)</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box
        role="group"
        aria-label="Heatmap color key"
        sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{METRICS[metricField]}</Typography>
        {metricField === 'mean_temp' ? (
          <>
            <Typography variant="caption">24°C or lower</Typography>
            <Box aria-hidden="true" sx={{
              width: 100, height: 10, borderRadius: 1, border: '1px solid', borderColor: 'divider',
              background: `linear-gradient(to right, ${[24, 26, 28, 30, 32, 34].map((temp) => temperatureColor(temp, dark)).join(', ')})`,
            }} />
            <Typography variant="caption">34°C or higher</Typography>
          </>
        ) : API_BANDS.map((band) => (
          <Box key={band.label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Box aria-hidden="true" sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: dark ? band.dark : band.light, border: '1px solid', borderColor: 'divider' }} />
            <Typography variant="caption">{band.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          style={{ width: '100%', minWidth: 600, height: 'auto', display: 'block' }}
          role="group"
          aria-label="Seasonal heatmap. Use arrow keys to explore months and stations."
        />
      </Box>

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {stationScope === 'all' && hasSpecificStation ? (
            <span>
              Highlighted: <strong style={{ color: palette.primary.main }}>▶ {selectedDistrict}</strong>.{' '}
            </span>
          ) : null}
          Focus or hover over a cell for details. Click, press Enter, or tap twice to open Safety Checker.
        </Typography>
      </Box>
      <ChartPointReadout
        anchor={inspectedTile?.anchor}
        open={inspectedTile?.open}
        reducedMotion={reducedMotion}
      >
        {inspectedTile && describeCell(inspectedTile.cell, metricField)}
      </ChartPointReadout>
    </Box>
  );
};

export default SeasonalHeatmapD3;
