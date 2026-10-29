/**
 * DiurnalTrendD3.js — Clean Multi-Day Brush-Zoom Chart (No Summary Panel)
 * Unit: COS30049 Group 7
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Chip, Stack,
} from '@mui/material';

const DiurnalTrendD3 = ({
  mode = 'diurnal24h',
  diurnalSeries = [],
  multidaySeries = [],
  selectedStartHour = 8,
  durationHours = 2,
  safestDaytimeHour = 7,
  thresholds = { safe_max: 50, caution_max: 100, indoors_max: 200 },
  onSelectHour = null,
}) => {
  const svgRef = useRef(null);
  const [overlayMetric, setOverlayMetric] = useState('both_regimes');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [brushStats, setBrushStats] = useState(null);
  const [showBands, setShowBands] = useState(true);

  // ═══════════════════════════════════════════════════════════════
  // DIURNAL 24-HOUR MODE
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mode !== 'diurnal24h') return;
    const svgEl = svgRef.current;
    if (!svgEl || !diurnalSeries || diurnalSeries.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();

    const width = 720;
    const height = 340;
    const margin = { top: 24, right: 58, bottom: 48, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 23]).range([0, innerW]);

    const peakValue = d3.max(diurnalSeries, (d) => Math.max(d.predicted_api, d.peak_haze_api || 0));
    const safeMax = thresholds?.safe_max || 50;
    const cautionMax = thresholds?.caution_max || 100;
    const indoorsMax = thresholds?.indoors_max || 200;
    const yMax = Math.max(peakValue * 1.15, indoorsMax * 1.1, 220);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Background threshold bands
    if (showBands) {
      const bands = [
        { min: 0, max: safeMax, color: 'rgba(34, 197, 94, 0.10)' },
        { min: safeMax, max: cautionMax, color: 'rgba(234, 179, 8, 0.10)' },
        { min: cautionMax, max: indoorsMax, color: 'rgba(249, 115, 22, 0.10)' },
        { min: indoorsMax, max: yMax, color: 'rgba(239, 68, 68, 0.10)' },
      ];
      bands.forEach((b) => {
        g.append('rect')
          .attr('x', 0).attr('width', innerW)
          .attr('y', yScale(b.max))
          .attr('height', Math.max(0, yScale(b.min) - yScale(b.max)))
          .attr('fill', b.color);
      });

      [safeMax, cautionMax, indoorsMax].forEach((v) => {
        if (v <= yMax) {
          const color = v === safeMax ? '#16a34a' : v === cautionMax ? '#ca8a04' : '#f97316';
          g.append('line')
            .attr('x1', 0).attr('x2', innerW)
            .attr('y1', yScale(v)).attr('y2', yScale(v))
            .attr('stroke', color).attr('stroke-width', 1.2)
            .attr('stroke-dasharray', '5,4').attr('opacity', 0.6);
        }
      });
    }

    // Y Axis
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(''))
      .selectAll('line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '2,3');
    g.append('g').call(d3.axisLeft(yScale).ticks(5)).select('.domain').remove();
    g.selectAll('.tick text').attr('font-size', '10.5px').attr('fill', '#64748b');

    // Event Window Highlight
    const endHour = Math.min(23, selectedStartHour + durationHours - 1);
    const winX1 = xScale(selectedStartHour);
    const winX2 = xScale(endHour);
    g.append('rect')
      .attr('x', Math.max(0, winX1 - 8)).attr('y', 0)
      .attr('width', Math.max(18, winX2 - winX1 + 16)).attr('height', innerH)
      .attr('fill', '#eff6ff').attr('opacity', 0.7).attr('rx', 6);

    // Area
    const areaGen = d3.area()
      .x((d) => xScale(d.hour)).y0(innerH).y1((d) => yScale(d.predicted_api))
      .curve(d3.curveMonotoneX);
    g.append('path').datum(diurnalSeries).attr('fill', 'rgba(37, 99, 235, 0.12)').attr('d', areaGen);

    // Haze Overlay
    if (overlayMetric === 'both_regimes') {
      const peakLine = d3.line()
        .x((d) => xScale(d.hour)).y((d) => yScale(d.peak_haze_api || 0))
        .curve(d3.curveMonotoneX);
      g.append('path').datum(diurnalSeries).attr('fill', 'none')
        .attr('stroke', '#f97316').attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '5,4').attr('opacity', 0.75).attr('d', peakLine);
    }

    // Main Line
    const mainLine = d3.line()
      .x((d) => xScale(d.hour)).y((d) => yScale(d.predicted_api))
      .curve(d3.curveMonotoneX);
    g.append('path').datum(diurnalSeries).attr('fill', 'none')
      .attr('stroke', '#2563eb').attr('stroke-width', 2.8).attr('d', mainLine);

    // Peak Marker
    const peakPoint = d3.max(diurnalSeries, (d) => d.predicted_api);
    const peakHour = diurnalSeries.find((d) => d.predicted_api === peakPoint)?.hour ?? 14;
    g.append('line')
      .attr('x1', xScale(peakHour)).attr('x2', xScale(peakHour))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#dc2626').attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,3').attr('opacity', 0.5);

    // Dots
    g.selectAll('.dot').data(diurnalSeries).enter().append('circle')
      .attr('cx', (d) => xScale(d.hour)).attr('cy', (d) => yScale(d.predicted_api))
      .attr('r', (d) => d.hour === safestDaytimeHour || d.hour === selectedStartHour || d.hour === peakHour ? 5.5 : 3)
      .attr('fill', (d) => d.hour === safestDaytimeHour ? '#16a34a' : d.hour === peakHour ? '#dc2626' : d.hour === selectedStartHour ? '#2563eb' : '#ffffff')
      .attr('stroke', (d) => d.hour === safestDaytimeHour ? '#15803d' : d.hour === peakHour ? '#b91c1c' : '#2563eb')
      .attr('stroke-width', 1.8).style('cursor', 'pointer')
      .on('mouseenter', function (event, d) { d3.select(this).attr('r', 7); setHoveredPoint(d); })
      .on('mouseleave', function (event, d) { d3.select(this).attr('r', 5); setHoveredPoint(null); })
      .on('click', (_, d) => onSelectHour && onSelectHour(d.hour));

    // X Axis
    const xAxis = g.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(xScale).tickValues([0, 3, 6, 9, 12, 15, 18, 21, 23]).tickFormat((h) => `${String(h).padStart(2, '0')}:00`));
    xAxis.select('.domain').attr('stroke', '#cbd5e1');
    xAxis.selectAll('text').attr('font-size', '10.5px').attr('fill', '#64748b');

    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
    };
  }, [mode, diurnalSeries, selectedStartHour, durationHours, safestDaytimeHour, thresholds, overlayMetric, showBands, onSelectHour]);

  // ═══════════════════════════════════════════════════════════════
  // MULTI-DAY BRUSH-ZOOM MODE
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mode !== 'multidayBrush') return;
    const svgEl = svgRef.current;
    if (!svgEl || !multidaySeries || multidaySeries.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();
    svg.on('.brush', null);

    const parsedData = multidaySeries.map((d, idx) => ({
      ...d, idx,
      dt: new Date(d.datetime.replace(' ', 'T')),
      actual_api: Number(d.API),
      pred_api: Number(d.predicted_api_24h),
    }));

    const width = 760;
    const height = 380;
    const marginFocus = { top: 24, right: 28, bottom: 90, left: 52 };
    const marginContext = { top: 290, right: 28, bottom: 26, left: 52 };

    const innerW = width - marginFocus.left - marginFocus.right;
    const focusH = height - marginFocus.top - marginFocus.bottom;
    const contextH = height - marginContext.top - marginContext.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.append('defs').append('clipPath').attr('id', 'focus-clip').append('rect').attr('width', innerW).attr('height', focusH);

    const xFocus = d3.scaleTime().domain(d3.extent(parsedData, (d) => d.dt)).range([0, innerW]);
    const xContext = d3.scaleTime().domain(xFocus.domain()).range([0, innerW]);

    const safeMax = thresholds?.safe_max || 50;
    const cautionMax = thresholds?.caution_max || 100;
    const indoorsMax = thresholds?.indoors_max || 200;
    const yMax = Math.max(d3.max(parsedData, (d) => Math.max(d.actual_api, d.pred_api)) * 1.1, indoorsMax * 0.6, 140);
    const yFocus = d3.scaleLinear().domain([0, yMax]).range([focusH, 0]);
    const yContext = d3.scaleLinear().domain([0, yMax]).range([contextH, 0]);

    const focus = svg.append('g').attr('transform', `translate(${marginFocus.left}, ${marginFocus.top})`);
    const context = svg.append('g').attr('transform', `translate(${marginContext.left}, ${marginContext.top})`);

    // Bands
    if (showBands) {
      [
        { min: 0, max: safeMax, color: 'rgba(34, 197, 94, 0.08)' },
        { min: safeMax, max: cautionMax, color: 'rgba(234, 179, 8, 0.08)' },
        { min: cautionMax, max: indoorsMax, color: 'rgba(249, 115, 22, 0.08)' },
        { min: indoorsMax, max: yMax, color: 'rgba(239, 68, 68, 0.08)' },
      ].forEach((b) => {
        focus.append('rect').attr('x', 0).attr('width', innerW)
          .attr('y', yFocus(b.max)).attr('height', Math.max(0, yFocus(b.min) - yFocus(b.max))).attr('fill', b.color);
      });
      [safeMax, cautionMax, indoorsMax].forEach((v) => {
        if (v <= yMax) focus.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', yFocus(v)).attr('y2', yFocus(v))
          .attr('stroke', v === safeMax ? '#16a34a' : v === cautionMax ? '#ca8a04' : '#f97316')
          .attr('stroke-width', 1).attr('stroke-dasharray', '4,4').attr('opacity', 0.55);
      });
    }

    focus.append('g').call(d3.axisLeft(yFocus).ticks(5).tickSize(-innerW).tickFormat(''))
      .selectAll('line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '2,3');
    focus.append('g').call(d3.axisLeft(yFocus).ticks(5)).select('.domain').remove();

    const lineActualFocus = d3.line().x((d) => xFocus(d.dt)).y((d) => yFocus(d.actual_api)).curve(d3.curveMonotoneX);
    const linePredFocus = d3.line().x((d) => xFocus(d.dt)).y((d) => yFocus(d.pred_api)).curve(d3.curveMonotoneX);
    const chartBody = focus.append('g').attr('clip-path', 'url(#focus-clip)');

    const pathActual = chartBody.append('path').datum(parsedData).attr('fill', 'none').attr('stroke', '#0f172a').attr('stroke-width', 2).attr('d', lineActualFocus);
    const pathPred = chartBody.append('path').datum(parsedData).attr('fill', 'none').attr('stroke', '#2563eb').attr('stroke-width', 2.3).attr('stroke-dasharray', '6,3').attr('d', linePredFocus);

    const xAxisFocusG = focus.append('g').attr('transform', `translate(0, ${focusH})`).call(d3.axisBottom(xFocus).ticks(6));
    xAxisFocusG.selectAll('text').attr('font-size', '10px').attr('fill', '#64748b');

    // Context Mini Chart
    const areaContext = d3.area().x((d) => xContext(d.dt)).y0(contextH).y1((d) => yContext(d.pred_api)).curve(d3.curveMonotoneX);
    context.append('path').datum(parsedData).attr('fill', '#dbeafe').attr('stroke', '#2563eb').attr('stroke-width', 1.2).attr('d', areaContext);
    context.append('g').attr('transform', `translate(0, ${contextH})`).call(d3.axisBottom(xContext).ticks(6));

    // Brush with Click-Through Fix
    const brushed = (event) => {
      const selection = event.selection;
      if (!selection) {
        xFocus.domain(xContext.domain());
      } else {
        const [d0, d1] = selection.map(xContext.invert, xContext);
        xFocus.domain([d0, d1]);
        const sub = parsedData.filter((d) => d.dt >= d0 && d.dt <= d1);
        if (sub.length > 0) {
          setBrushStats({
            start: d3.timeFormat('%d %b %H:%M')(d0),
            end: d3.timeFormat('%d %b %H:%M')(d1),
            hours: sub.length,
            peakActual: d3.max(sub, (d) => d.actual_api)?.toFixed(1),
            avgActual: d3.mean(sub, (d) => d.actual_api)?.toFixed(1),
          });
        }
      }
      pathActual.attr('d', lineActualFocus);
      pathPred.attr('d', linePredFocus);
      xAxisFocusG.call(d3.axisBottom(xFocus).ticks(6));
    };

    const brush = d3.brushX().extent([[0, 0], [innerW, contextH]]).on('brush end', brushed);
    const brushG = context.append('g').attr('class', 'brush').call(brush);
    brushG.call(brush.move, [innerW * 0.15, innerW * 0.85]);

    brushG.selectAll('.overlay').style('pointer-events', 'none');
    brushG.selectAll('.selection').style('pointer-events', 'all').style('cursor', 'grab');
    brushG.selectAll('.handle').style('pointer-events', 'all').style('cursor', 'ew-resize');

    return () => {
      brushG.on('.brush', null);
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
    };
  }, [mode, multidaySeries, thresholds, showBands]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        {mode === 'diurnal24h' ? (
          <>
            <Typography variant="caption" color="text.secondary">
              Click any dot to change start hour • <strong style={{ color: '#16a34a' }}>Green</strong> = Cleanest • <strong style={{ color: '#dc2626' }}>Red</strong> = Peak
            </Typography>
            <Stack direction="row" spacing={1}>
              <ToggleButtonGroup size="small" value={overlayMetric} exclusive onChange={(_, v) => v && setOverlayMetric(v)}
                sx={{ '& .MuiToggleButton-root': { py: 0.3, px: 1.25, fontSize: '0.72rem', textTransform: 'none' } }}>
                <ToggleButton value="both_regimes">Haze Overlay</ToggleButton>
                <ToggleButton value="temperature">Temp (°C)</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup size="small" value={showBands} exclusive onChange={(_, v) => v !== null && setShowBands(v)}
                sx={{ '& .MuiToggleButton-root': { py: 0.3, px: 1.25, fontSize: '0.72rem', textTransform: 'none' } }}>
                <ToggleButton value={true}>Bands</ToggleButton>
                <ToggleButton value={false}>No Bands</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary">
              Drag the <strong>grab handles</strong> below to zoom into a specific period
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>● Actual API</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb' }}>--- XGBoost 24h Forecast</Typography>
            </Stack>
          </>
        )}
      </Box>

      <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="D3 Chart" />

      <Box sx={{ minHeight: 28, mt: 1 }}>
        {mode === 'diurnal24h' && hoveredPoint && (
          <Chip size="small" label={`${hoveredPoint.time_label} • ${hoveredPoint.predicted_api} API • ${hoveredPoint.temperature}°C`}
            sx={{ fontWeight: 600, bgcolor: '#eff6ff', color: '#1d4ed8' }} />
        )}
        {mode === 'multidayBrush' && brushStats && (
          <Chip size="small" label={`Zoomed: ${brushStats.start} – ${brushStats.end} (${brushStats.hours}h) • Peak: ${brushStats.peakActual} API • Avg: ${brushStats.avgActual} API`}
            sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} />
        )}
      </Box>
    </Box>
  );
};

export default DiurnalTrendD3;