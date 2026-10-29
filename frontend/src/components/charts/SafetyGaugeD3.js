/**
 * SafetyGaugeD3.js
 * ============================================================================
 * Chart 1 (D3.js): Minimalist Semicircle Air Pollutant Index (API) Safety Gauge
 * Unit: COS30049 Computing Technology Innovation Project (Group 7 - SchoolAir)
 *
 * Fix: Full cleanup on unmount to prevent stale D3 listeners blocking navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Typography, Chip } from '@mui/material';

const SafetyGaugeD3 = ({
  predictedApi = 45.0,
  peakWindowApi = 47.0,
  badgeColor = '#16a34a',
  thresholds = { safe_max: 50, caution_max: 100, indoors_max: 200 },
}) => {
  const svgRef = useRef(null);
  const [hoveredZone, setHoveredZone] = useState(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = 340;
    const height = 195;
    const centerX = width / 2;
    const centerY = height - 24;
    const outerRadius = 126;
    const innerRadius = 90;
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
        d3.select(this).transition().duration(150).attr('opacity', 1).attr('transform', 'scale(1.03)');
        setHoveredZone(d);
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(150).attr('opacity', 0.85).attr('transform', 'scale(1)');
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
        .attr('fill', '#64748b')
        .text(val === maxScaleApi ? '250+' : Math.round(val));
    });

    const needleLen = innerRadius - 10;
    const targetDeg = (angleScale(predictedApi) * 180) / Math.PI;

    g.append('path')
      .attr('d', `M -3.5 0 L 0 -${needleLen} L 3.5 0 Z`)
      .attr('fill', '#0f172a')
      .attr('transform', 'rotate(-90)')
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('transform', `rotate(${targetDeg})`);

    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', '#0f172a')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', 0)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '28px')
      .attr('font-weight', '800')
      .attr('fill', badgeColor)
      .text(Number(predictedApi).toFixed(1));

    g.append('text')
      .attr('x', 0)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#94a3b8')
      .attr('letter-spacing', '0.8px')
      .text('PREDICTED API');

    // ✅ CLEANUP: Kill transitions & wipe SVG so unmount is safe
    return () => {
      svg.selectAll('*').interrupt();
      svg.selectAll('*').remove();
      svg.on('.brush', null);
      svg.on('.zoom', null);
    };
  }, [predictedApi, peakWindowApi, badgeColor, thresholds]);

  return (
    <Box sx={{ textAlign: 'center', py: 0.5 }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', maxWidth: '320px', height: 'auto', overflow: 'visible' }}
        role="img"
        aria-label="D3 Safety Dial Gauge"
      />
      <Box sx={{ minHeight: 28, mt: 0.5 }}>
        {hoveredZone ? (
          <Chip
            size="small"
            label={`${hoveredZone.name}: ${hoveredZone.min}–${hoveredZone.max} API`}
            sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}
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