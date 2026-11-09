import ChartPointReadout from './ChartPointReadout';
import { bindChartTargets } from '../../utils/chartInteraction';
import { useTheme } from '@mui/material/styles';
import { revealLine } from '../../utils/chartMotion';
import useReducedMotion from '../../hooks/useReducedMotion';
import { formatApi } from '../../utils/formatApi';
/**
 * DiurnalTrendD3.js — Clean Multi-Day Brush-Zoom Chart (No Summary Panel)
 * Unit: COS30049 Group 7
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  const reducedMotion = useReducedMotion();
  const { palette } = useTheme();
  const dark = palette.mode === 'dark';
  const hazeColor = dark ? '#fdba74' : '#c2410c';
  const tempColor = dark ? '#fcd34d' : '#92400e';
  const cleanestColor = dark ? '#86efac' : '#15803d';
  const peakColor = dark ? '#fca5a5' : '#b91c1c';
  const svgRef = useRef(null);
  const focusedHour = useRef(null);
  const previousWindow = useRef(null);
  const previousOverlay = useRef(null);
  const overlayClipId = `diurnal-overlay-${useId()}`;
  const [overlayMetric, setOverlayMetric] = useState('both_regimes');
  const [inspectedPoint, setInspectedPoint] = useState(null);
  const [brushStats, setBrushStats] = useState(null);
  const [showBands, setShowBands] = useState(true);

  const describePoint = useCallback((point) => {
    const overlay = overlayMetric === 'both_regimes'
      ? ` · Peak haze ${formatApi(point.peak_haze_api)} API`
      : '';
    return `${point.time_label} · ${formatApi(point.predicted_api)} API · ${formatApi(point.temperature)}°C${overlay}`;
  }, [overlayMetric]);

  // ═══════════════════════════════════════════════════════════════
  // DIURNAL 24-HOUR MODE
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mode !== 'diurnal24h') return;
    const svgEl = svgRef.current;
    if (!svgEl || !diurnalSeries || diurnalSeries.length === 0) return;

    setInspectedPoint(null);
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

    const showReadout = (label, dot) => {
      setInspectedPoint({
        label,
        open: true,
        anchor: {
          getBoundingClientRect: () => dot.getBoundingClientRect(),
          contextElement: svgEl,
        },
      });
    };
    const hideReadout = () => {
      setInspectedPoint((previous) => previous && { ...previous, open: false });
    };

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
      .selectAll('line').attr('stroke', (dark ? '#475569' : '#e2e8f0')).attr('stroke-dasharray', '2,3');
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(formatApi)).select('.domain').remove();
    g.selectAll('.tick text').attr('font-size', '10.5px').attr('fill', palette.text.secondary);

    // Event Window Highlight
    const endHour = Math.min(23, selectedStartHour + durationHours - 1);
    const winX1 = xScale(selectedStartHour);
    const winX2 = xScale(endHour);
    const windowX = Math.max(0, winX1 - 8);
    const windowWidth = Math.min(innerW - windowX, Math.max(18, winX2 - winX1 + 16));
    const priorWindow = previousWindow.current;
    const windowBand = g.append('rect')
      .attr('x', windowX).attr('y', 0)
      .attr('width', windowWidth).attr('height', innerH)
      .attr('fill', (dark ? '#243858' : '#eff6ff')).attr('opacity', 0.7).attr('rx', 6);
    if (!reducedMotion && priorWindow && (priorWindow.x !== windowX || priorWindow.width !== windowWidth)) {
      windowBand.attr('x', priorWindow.x).attr('width', priorWindow.width)
        .transition().duration(260).ease(d3.easeCubicOut)
        .attr('x', windowX).attr('width', windowWidth);
    }

    // Area
    const areaGen = d3.area()
      .x((d) => xScale(d.hour)).y0(innerH).y1((d) => yScale(d.predicted_api))
      .curve(d3.curveMonotoneX);
    g.append('path').datum(diurnalSeries).attr('fill', 'rgba(37, 99, 235, 0.12)').attr('d', areaGen);

    const overlayChanged = previousOverlay.current !== null && previousOverlay.current !== overlayMetric;
    previousOverlay.current = overlayMetric;
    const overlayClip = overlayChanged && !reducedMotion ? `url(#${overlayClipId})` : null;
    if (overlayClip) {
      // Reveal the overlay from left to right while preserving its dashed stroke.
      svg.append('defs').append('clipPath').attr('id', overlayClipId)
        .append('rect').attr('x', -8).attr('y', -8).attr('height', innerH + 16).attr('width', 0)
        .transition().duration(450).ease(d3.easeCubicOut).attr('width', innerW + 16);
    }

    // Haze Overlay
    if (overlayMetric === 'both_regimes') {
      const peakLine = d3.line()
        .x((d) => xScale(d.hour)).y((d) => yScale(d.peak_haze_api || 0))
        .curve(d3.curveMonotoneX);
      g.append('path').datum(diurnalSeries).attr('fill', 'none')
        .attr('stroke', hazeColor).attr('stroke-width', 1.8)
        .attr('clip-path', overlayClip)
        .attr('stroke-dasharray', '5,4').attr('opacity', 0.75).attr('d', peakLine);
    }

    let hottestMarker;
    if (overlayMetric === 'temperature') {
      const hasTemperature = (d) => d.temperature != null && Number.isFinite(d.temperature);
      const [minTemp, maxTemp] = d3.extent(diurnalSeries.filter(hasTemperature), (d) => d.temperature);

      if (minTemp !== undefined) {
        const padding = Math.max(2, (maxTemp - minTemp) * 0.1);
        const tempScale = d3.scaleLinear()
          .domain([minTemp - padding, maxTemp + padding]).nice().range([innerH, 0]);
        const tempLine = d3.line().defined(hasTemperature)
          .x((d) => xScale(d.hour)).y((d) => tempScale(d.temperature))
          .curve(d3.curveMonotoneX);

        g.append('path').datum(diurnalSeries).attr('fill', 'none')
          .attr('stroke', tempColor).attr('stroke-width', 2)
          .attr('clip-path', overlayClip)
          .attr('stroke-dasharray', '5,4').attr('d', tempLine);

        const tempAxis = g.append('g').attr('transform', `translate(${innerW}, 0)`)
          .attr('color', tempColor).call(d3.axisRight(tempScale).ticks(5));
        tempAxis.selectAll('text').attr('font-size', '10.5px');
        tempAxis.append('text').attr('x', 8).attr('y', -9)
          .attr('fill', tempColor).attr('text-anchor', 'start').text('°C');

        const hottest = diurnalSeries.find((d) => d.temperature === maxTemp);
        const label = `Highest temperature · ${hottest.time_label} · ${formatApi(maxTemp)}°C`;
        hottestMarker = g.append('circle')
          .attr('clip-path', overlayClip)
          .attr('cx', xScale(hottest.hour)).attr('cy', tempScale(maxTemp))
          .attr('r', 6).attr('fill', tempColor)
          .attr('stroke', palette.background.paper).attr('stroke-width', 2)
          .attr('role', 'img').attr('aria-label', label).attr('tabindex', 0)
          .on('pointerenter focus click', function () { showReadout(label, this); })
          .on('pointerleave', function () {
            if (svgEl.ownerDocument.activeElement !== this) hideReadout();
          })
          .on('blur', hideReadout);
      }
    }

    // Main Line
    const mainLine = d3.line()
      .x((d) => xScale(d.hour)).y((d) => yScale(d.predicted_api))
      .curve(d3.curveMonotoneX);
    g.append('path').datum(diurnalSeries).attr('fill', 'none')
      .attr('stroke', palette.primary.main).attr('stroke-width', 2.8).attr('d', mainLine)
      .call(revealLine, reducedMotion || Boolean(priorWindow));

    // Peak Marker
    const peakPoint = d3.max(diurnalSeries, (d) => d.predicted_api);
    const peakHour = diurnalSeries.find((d) => d.predicted_api === peakPoint)?.hour ?? 14;
    g.append('line')
      .attr('x1', xScale(peakHour)).attr('x2', xScale(peakHour))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', peakColor).attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,3').attr('opacity', 0.5);

    // A transparent target around each dot makes the curve easier to tap.
    const points = g.selectAll('.chart-target').data(diurnalSeries).join('g')
      .attr('transform', (d) => `translate(${xScale(d.hour)}, ${yScale(d.predicted_api)})`)
      .style('cursor', 'pointer');

    points.append('circle').attr('r', 12).attr('fill', 'transparent');
    points.append('circle')
      .attr('r', (d) => d.hour === safestDaytimeHour || d.hour === selectedStartHour || d.hour === peakHour ? 5.5 : 3)
      .attr('fill', (d) => d.hour === safestDaytimeHour ? cleanestColor : d.hour === peakHour ? peakColor : d.hour === selectedStartHour ? palette.primary.main : palette.background.paper)
      .attr('stroke', (d) => d.hour === safestDaytimeHour || d.hour === peakHour ? palette.background.paper : palette.primary.main)
      .attr('stroke-width', 1.8);

    bindChartTargets(points, {
      describe: (d) => `${describePoint(d)}. Set start hour`,
      inspect: (point) => {
        if (!point) {
          hideReadout();
          return;
        }

        const dot = points.filter((d) => d === point).select('circle:last-child').node();
        showReadout(describePoint(point), dot);
      },
      activate: (d) => onSelectHour?.(d.hour),
    });
    hottestMarker?.raise();

    // X Axis
    const xAxis = g.append('g').attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(xScale).tickValues([0, 3, 6, 9, 12, 15, 18, 21, 23]).tickFormat((h) => `${String(h).padStart(2, '0')}:00`));
    xAxis.select('.domain').attr('stroke', palette.text.secondary);
    xAxis.selectAll('text').attr('font-size', '10.5px').attr('fill', palette.text.secondary);

    if (focusedHour.current !== null) {
      points.filter((d) => d.hour === focusedHour.current).node()?.focus();
      focusedHour.current = null;
    }

    return () => {
      previousWindow.current = { x: Number(windowBand.attr('x')), width: Number(windowBand.attr('width')) };
      const active = svgEl.ownerDocument.activeElement;
      focusedHour.current = points.filter(function () { return this === active; }).nodes().length
        ? d3.select(active).datum().hour
        : null;
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
    };
  }, [mode, diurnalSeries, selectedStartHour, durationHours, safestDaytimeHour, thresholds, overlayMetric, showBands, onSelectHour, reducedMotion, palette, dark, describePoint, hazeColor, tempColor, cleanestColor, peakColor, overlayClipId]);

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
    const height = 408;
    const marginFocus = { top: 28, right: 28, bottom: 118, left: 56 };
    const marginContext = { top: 318, right: 28, bottom: 26, left: 56 };

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

    const maxDataVal = d3.max(parsedData, (d) => Math.max(d.actual_api, d.pred_api)) || 100;
    const computedMax = Math.max(Math.ceil((maxDataVal * 1.15) / 50) * 50, indoorsMax * 1.1, 200);
    const yFocus = d3.scaleLinear().domain([0, computedMax]).range([focusH, 0]).nice();
    const domainCeiling = yFocus.domain()[1];
    const yContext = d3.scaleLinear().domain([0, domainCeiling]).range([contextH, 0]);

    const focus = svg.append('g').attr('transform', `translate(${marginFocus.left}, ${marginFocus.top})`);
    const context = svg.append('g').attr('transform', `translate(${marginContext.left}, ${marginContext.top})`);

    // Bands (fill continuous vertical space from y=0 to y=focusH with zero top gap)
    if (showBands) {
      const bands = [];
      if (safeMax > 0 && domainCeiling > 0) {
        bands.push({ min: 0, max: Math.min(safeMax, domainCeiling), color: 'rgba(34, 197, 94, 0.08)' });
      }
      if (cautionMax > safeMax && domainCeiling > safeMax) {
        bands.push({ min: safeMax, max: Math.min(cautionMax, domainCeiling), color: 'rgba(234, 179, 8, 0.08)' });
      }
      if (indoorsMax > cautionMax && domainCeiling > cautionMax) {
        bands.push({ min: cautionMax, max: Math.min(indoorsMax, domainCeiling), color: 'rgba(249, 115, 22, 0.08)' });
      }
      if (domainCeiling > indoorsMax) {
        bands.push({ min: indoorsMax, max: domainCeiling, color: 'rgba(239, 68, 68, 0.08)' });
      }

      bands.forEach((b) => {
        focus.append('rect')
          .attr('x', 0)
          .attr('width', innerW)
          .attr('y', yFocus(b.max))
          .attr('height', Math.max(0, yFocus(b.min) - yFocus(b.max)))
          .attr('fill', b.color);
      });

      [safeMax, cautionMax, indoorsMax].forEach((v) => {
        if (v < domainCeiling) {
          focus.append('line')
            .attr('x1', 0)
            .attr('x2', innerW)
            .attr('y1', yFocus(v))
            .attr('y2', yFocus(v))
            .attr('stroke', v === safeMax ? '#16a34a' : v === cautionMax ? '#ca8a04' : '#f97316')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.55);
        }
      });
    }

    focus.append('g').call(d3.axisLeft(yFocus).ticks(5).tickSize(-innerW).tickFormat(''))
      .selectAll('line').attr('stroke', (dark ? '#475569' : '#e2e8f0')).attr('stroke-dasharray', '2,3');
    focus.append('g').call(d3.axisLeft(yFocus).ticks(5).tickFormat(formatApi)).select('.domain').remove();

    const lineActualFocus = d3.line().x((d) => xFocus(d.dt)).y((d) => yFocus(d.actual_api)).curve(d3.curveMonotoneX);
    const linePredFocus = d3.line().x((d) => xFocus(d.dt)).y((d) => yFocus(d.pred_api)).curve(d3.curveMonotoneX);
    const chartBody = focus.append('g').attr('clip-path', 'url(#focus-clip)');

    const pathActual = chartBody.append('path').datum(parsedData).attr('fill', 'none').attr('stroke', palette.text.primary).attr('stroke-width', 2).attr('d', lineActualFocus);
    const pathPred = chartBody.append('path').datum(parsedData).attr('fill', 'none').attr('stroke', palette.primary.main).attr('stroke-width', 2.3).attr('stroke-dasharray', '6,3').attr('d', linePredFocus);

    const xAxisFocusG = focus.append('g').attr('transform', `translate(0, ${focusH})`).call(d3.axisBottom(xFocus).ticks(4).tickFormat(d3.timeFormat('%d/%m/%Y')));
    xAxisFocusG.selectAll('text').attr('font-size', '10px').attr('fill', palette.text.secondary);

    // Context Mini Chart
    const areaContext = d3.area().x((d) => xContext(d.dt)).y0(contextH).y1((d) => yContext(d.pred_api)).curve(d3.curveMonotoneX);
    context.append('path').datum(parsedData).attr('fill', (dark ? '#243858' : '#eff6ff')).attr('stroke', palette.primary.main).attr('stroke-width', 1.2).attr('d', areaContext);
    context.append('g').attr('transform', `translate(0, ${contextH})`).call(d3.axisBottom(xContext).ticks(4).tickFormat(d3.timeFormat('%d/%m/%Y')));

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
            start: d3.timeFormat('%d/%m/%Y %H:%M')(d0),
            end: d3.timeFormat('%d/%m/%Y %H:%M')(d1),
            hours: sub.length,
            peakActual: d3.max(sub, (d) => d.actual_api)?.toFixed(1),
            avgActual: d3.mean(sub, (d) => d.actual_api)?.toFixed(1),
          });
        }
      }
      pathActual.interrupt().attr('stroke-dasharray', null).attr('stroke-dashoffset', null).attr('d', lineActualFocus);
      pathPred.attr('d', linePredFocus);
      xAxisFocusG.call(d3.axisBottom(xFocus).ticks(4).tickFormat(d3.timeFormat('%d/%m/%Y')));
    };

    const brush = d3.brushX().extent([[0, 0], [innerW, contextH]]).on('brush end', brushed);
    const brushG = context.append('g').attr('class', 'brush').call(brush);
    brushG.call(brush.move, [innerW * 0.15, innerW * 0.85]);

    pathActual.call(revealLine, reducedMotion);
    if (!reducedMotion) pathPred.attr('opacity', 0).transition().duration(400).attr('opacity', 1);

    brushG.selectAll('.overlay').style('pointer-events', 'none');
    brushG.selectAll('.selection').style('pointer-events', 'all').style('cursor', 'grab');
    brushG.selectAll('.handle').style('pointer-events', 'all').style('cursor', 'ew-resize');

    return () => {
      brushG.on('.brush', null);
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
    };
  }, [mode, multidaySeries, thresholds, showBands, reducedMotion, palette, dark]);

  return (
    <Box sx={mode === 'diurnal24h' ? { flex: '1 0 auto', display: 'flex', flexDirection: 'column' } : undefined}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        {mode === 'diurnal24h' ? (
          <>
            <Typography variant="caption" color="text.secondary">
              Focus or hover over a dot to see readings. Click or press Enter to set the start hour. On touchscreens, tap twice to set it.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
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
            </Box>
          </>
        ) : (
          <>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', fontSize: '0.82rem' }}>
                Severe Haze in September 2019 (12–18 Sept)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                <strong>Why these seven days?</strong> Smoke haze affected parts of Malaysia during this period, giving us a real example to compare the 24-hour forecast with measured air pollution.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Drag either end of the highlighted area below to zoom in on a shorter time period.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: palette.text.primary }}>● Measured API</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: palette.primary.main }}>--- Forecast API</Typography>
            </Stack>
          </>
        )}
      </Box>

      {mode === 'diurnal24h' && (
        <Box
          role="group"
          aria-label="24-hour curve legend"
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 0.5, mb: 2 }}
        >
          {[
            { label: 'Predicted API', color: palette.primary.main, style: 'solid' },
            overlayMetric === 'both_regimes'
              ? { label: 'Peak haze API', color: hazeColor, style: 'dashed' }
              : { label: 'Temperature (right axis)', color: tempColor, style: 'dashed' },
            { label: 'Cleanest hour', color: cleanestColor },
            { label: 'Peak hour', color: peakColor },
            ...(overlayMetric === 'temperature' ? [{ label: 'Highest temperature', color: tempColor }] : []),
          ].map(({ label, color, style }) => (
            <Box key={label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Box aria-hidden="true" sx={style
                ? { width: 16, borderTop: `2px ${style} ${color}` }
                : { width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {mode === 'diurnal24h' && (
        <ChartPointReadout
          anchor={inspectedPoint?.anchor}
          open={inspectedPoint?.open}
          reducedMotion={reducedMotion}
        >
          {inspectedPoint?.label}
        </ChartPointReadout>
      )}

      <Box sx={mode === 'diurnal24h' ? { flex: '1 0 auto', display: 'flex', alignItems: 'center' } : undefined}>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} role={mode === 'diurnal24h' ? 'group' : 'img'} aria-label={mode === 'diurnal24h' ? '24-hour curve. Use arrow keys to explore hours.' : 'Multi-day haze chart'} />
      </Box>

      {mode === 'multidayBrush' && (
        <Box sx={{ minHeight: 28, mt: 1 }}>
          {brushStats && (
            <Chip size="small" label={`Zoomed: ${brushStats.start} – ${brushStats.end} (${brushStats.hours}h) • Peak: ${brushStats.peakActual} API • Avg: ${brushStats.avgActual} API`}
              sx={{ fontWeight: 600, bgcolor: dark ? '#243858' : '#f1f5f9', color: 'text.primary' }} />
          )}
        </Box>
      )}
    </Box>
  );
};

export default DiurnalTrendD3;
