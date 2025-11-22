import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// D3LineChart: expects data = [{ date|period|fullDate, aqi }, ...]
const D3LineChart = ({ data = [], darkMode = false, color = '#e74c3c', height = 250 }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const w = containerRef.current.getBoundingClientRect().width;
      setWidth(w || 600);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!data || data.length === 0) return;

    const margin = { top: 14, right: 16, bottom: 40, left: 40 };
    const w = Math.max(200, width) - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // parse dates
    const parseDatum = (d) => {
      if (d.fullDate) return new Date(d.fullDate);
      const iso = Date.parse(d.date || d.period || '');
      if (!isNaN(iso)) return new Date(iso);
      const p = d3.timeParse('%b %d')(d.date || d.period);
      return p || new Date();
    };

    const xVals = data.map(parseDatum);
    const plotWidth = Math.max(120, Math.floor(w * 0.8));
    const plotTranslateX = Math.floor((w - plotWidth) / 2);

    const x = d3.scaleTime().domain(d3.extent(xVals)).range([0, plotWidth]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => +d.aqi) * 1.1 || 100]).nice().range([h, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const plot = g.append('g').attr('transform', `translate(${plotTranslateX},0)`);

    // grid lines
    plot.append('g')
      .call(d3.axisLeft(y).ticks(6).tickSize(-plotWidth).tickFormat(''))
      .selectAll('line')
      .attr('stroke', darkMode ? '#0f3460' : '#eee');

    // y axis
    const yAxisGroup = plot.append('g')
      .call(d3.axisLeft(y).ticks(6));
    yAxisGroup.selectAll('text').attr('fill', darkMode ? '#ffffff' : '#2c3e50').style('font-size', '12px');
    yAxisGroup.select('.domain').attr('stroke', darkMode ? '#0f3460' : '#ccc');
    yAxisGroup.selectAll('line').attr('stroke', darkMode ? '#0f3460' : '#ccc');

    // line drawn inside the smaller plot group
    const line = d3.line().x((d, i) => x(xVals[i])).y(d => y(+d.aqi)).curve(d3.curveMonotoneX);

    plot.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.6)
      .attr('d', line);

    plot.selectAll('.pt')
      .data(data)
      .enter().append('circle')
      .attr('class', 'pt')
      .attr('cx', (d, i) => x(xVals[i]))
      .attr('cy', d => y(+d.aqi))
      .attr('r', 4)
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.2);

    g.select('.x-axis')?.remove();
    const maxTicks = Math.max(3, Math.floor(plotWidth / 70));
    let tickValues;
    if (xVals.length <= maxTicks) {
      tickValues = xVals;
    } else {
      const step = Math.ceil(xVals.length / maxTicks);
      tickValues = xVals.filter((_, i) => i % step === 0);
      const last = xVals[xVals.length - 1];
      if (tickValues[tickValues.length - 1] !== last) tickValues.push(last);
    }

    plot.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(tickValues).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
      .attr('fill', darkMode ? '#ffffff' : '#2c3e50')
      .style('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dx', '0')
      .attr('dy', '1.1em');

    // focus tooltip elements 
    const focus = plot.append('g').attr('class', 'focus').attr('display', 'none');
    focus.append('line').attr('class', 'hover-line').attr('y1', 0).attr('y2', h).attr('stroke', darkMode ? '#999' : '#666').attr('stroke-dasharray', '3 3');
    focus.append('circle').attr('r', 5).attr('fill', color).attr('stroke', '#fff');
    const tooltipBg = focus.append('rect').attr('class', 'tooltip-bg').attr('x', 8).attr('y', -30).attr('rx', 4).attr('ry', 4).attr('width', 80).attr('height', 28).attr('fill', darkMode ? '#111827' : '#fff').attr('stroke', darkMode ? '#333' : '#ddd').attr('opacity', 0.95);
    const tooltipText = focus.append('text').attr('x', 12).attr('y', -12).attr('fill', darkMode ? '#eee' : '#000').style('font-size', '12px');

    // overlay for mouse events 
    plot.append('rect')
      .attr('class', 'overlay')
      .attr('width', plotWidth)
      .attr('height', h)
      .attr('fill', 'transparent')
      .on('mouseenter', () => focus.attr('display', null))
      .on('mouseleave', () => focus.attr('display', 'none'))
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event, this);
        const xm = x.invert(mx);
        // find nearest index
        const idx = d3.scan(xVals, (a, b) => Math.abs(a - xm) - Math.abs(b - xm));
        const i = Math.max(0, Math.min(idx, xVals.length - 1));
        const d = data[i];
        const px = x(xVals[i]);
        const py = y(+d.aqi);

        focus.select('.hover-line').attr('x1', px).attr('x2', px);
        focus.select('circle').attr('cx', px).attr('cy', py);

        const text = `AQI: ${(+d.aqi).toFixed(2)}`;
        tooltipText.text(text);
        const tw = Math.max(60, text.length * 7);
        tooltipBg.attr('x', px + 10).attr('y', py - 28).attr('width', tw).attr('height', 28);
        tooltipText.attr('x', px + 14).attr('y', py - 10);
      });

  }, [data, width, darkMode, color, height]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg ref={svgRef} width="100%" height={height} style={{ display: 'block' }} />
    </div>
  );
};

export default D3LineChart;