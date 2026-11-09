import { useTheme } from '@mui/material/styles';
import useReducedMotion from '../../hooks/useReducedMotion';
/**
 SafetyGaugeD3.js

 Chart 1 (D3.js): Minimalist Semicircle Air Pollutant Index (API) Safety Gauge
 **/

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Typography, Chip } from '@mui/material';

const SafetyGaugeD3 = ({
  predictedApi = 45.0,
  peakWindowApi = 47.0,
  badgeColor = '#16a34a',
  thresholds = { safe_max: 50, caution_max: 100, indoors_max: 200 },
}) => {
  const reducedMotion = useReducedMotion();
  const { palette } = useTheme();
  const dark = palette.mode === 'dark';
  const svgRef = useRef(null);
  const needleAngle = useRef(-90);
  const displayedApi = useRef(Number(predictedApi));
  const [hoveredZone, setHoveredZone] = useState(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = 340;
    const height = 195;
    const centerX = width / 2;
    const centerY = height - 24;
    const outerRadius = 126;
    const innerRadius = 102;
    const maxScaleApi = 250;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const angleScale = d3
      .scaleLinear()
      .domain([0, maxScaleApi])
      .range([-Math.PI / 2, Math.PI / 2])
      .clamp(true);

    const safeMax = thresholds?.safe_max || 50;
    const cautionMax = thresholds?.caution_max || 100;
    const indoorsMax = thresholds?.indoors_max || 200;

    const zones = [
      { name: 'Safe', min: 0, max: safeMax, color: '#22c55e' },
      { name: 'Caution', min: safeMax, max: cautionMax, color: '#eab308' },
      { name: 'Move Indoors', min: cautionMax, max: indoorsMax, color: '#f97316' },
      { name: 'Suspend', min: indoorsMax, max: maxScaleApi, color: '#ef4444' },
    ];

    const g = svg.append('g').attr('transform', `translate(${centerX}, ${centerY})`);

    const arcGen = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle((d) => angleScale(d.min))
      .endAngle((d) => angleScale(d.max))
      .padAngle(0.02)
      .cornerRadius(5);

    g.selectAll('.zone-arc')
      .data(zones)
      .enter()
      .append('path')
      .attr('class', 'zone-arc')
      .attr('d', arcGen)
      .attr('fill', (d) => d.color)
      .attr('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(reducedMotion ? 0 : 150).attr('opacity', 1).attr('transform', 'scale(1.03)');
        setHoveredZone(d);
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(reducedMotion ? 0 : 150).attr('opacity', 0.85).attr('transform', 'scale(1)');
        setHoveredZone(null);
      });

    [0, safeMax, cautionMax, indoorsMax, maxScaleApi].forEach((val) => {
      const a = angleScale(val) - Math.PI / 2;
      const r = outerRadius + 15;
      g.append('text')
        .attr('x', Math.cos(a) * r)
        .attr('y', Math.sin(a) * r + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10.5px')
        .attr('font-weight', '600')
        .attr('fill', palette.text.secondary)
        .text(val === maxScaleApi ? '250+' : Math.round(val));
    });

    const needleLen = 80;
    const targetDeg = (angleScale(predictedApi) * 180) / Math.PI;

    const needle = g.append('path')
      .attr('d', `M -3.5 0 L 0 -${needleLen} L 3.5 0 Z`)
      .attr('fill', palette.text.primary)
      .attr('transform', `rotate(${reducedMotion ? targetDeg : needleAngle.current})`);

    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', palette.text.primary)
      .attr('stroke', palette.background.paper)
      .attr('stroke-width', 2);

    const reading = g.append('text')
      .attr('x', 0)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '28px')
      .attr('font-weight', '800')
      .attr('fill', dark ? palette.text.primary : badgeColor)
      .text((reducedMotion ? Number(predictedApi) : displayedApi.current).toFixed(1));

    if (reducedMotion) {
      needleAngle.current = targetDeg;
      displayedApi.current = Number(predictedApi);
    } else {
      const angle = d3.interpolateNumber(needleAngle.current, targetDeg);
      const api = d3.interpolateNumber(displayedApi.current, Number(predictedApi));
      needle.transition().duration(300).ease(d3.easeCubicOut).tween('reading', () => (progress) => {
        needleAngle.current = angle(progress);
        displayedApi.current = api(progress);
        needle.attr('transform', `rotate(${needleAngle.current})`);
        reading.text(displayedApi.current.toFixed(1));
      });
    }

    g.append('text')
      .attr('x', 0)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', palette.text.secondary)
      .attr('letter-spacing', '0.8px')
      .text('PREDICTED API');

    // Kill transitions & wipe SVG so unmount is safe
    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
      svg.on('.brush', null);
      svg.on('.zoom', null);
    };
  }, [predictedApi, peakWindowApi, badgeColor, thresholds, reducedMotion, palette, dark]);

  return (
    <Box sx={{ width: '100%', textAlign: 'center', py: 0.5 }}>
      <Box sx={{ width: { xs: '90%', lg: '100%' }, maxWidth: { xs: 340, sm: 540, lg: 'none' }, mx: 'auto' }}>
        <svg
          ref={svgRef}
          style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          role="img"
          aria-label="Safety Dial Gauge"
        />
      </Box>
      <Box sx={{ minHeight: 28, mt: 0.5 }}>
        {hoveredZone ? (
          <Chip
            size="small"
            label={`${hoveredZone.name}: ${hoveredZone.min}–${hoveredZone.max} API`}
            sx={{ fontWeight: 600, bgcolor: dark ? '#243858' : '#f1f5f9', color: 'text.primary' }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Hover gauge zones for cohort limits • Peak: {Number(peakWindowApi).toFixed(1)} API
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SafetyGaugeD3;
