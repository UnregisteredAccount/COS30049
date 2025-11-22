import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3BarChart = ({ data, darkMode, color, height = 300 }) => {
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();
        
        // Dimensions
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = svgRef.current.clientWidth;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.period))
            .range([0, chartWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.aqi) * 1.1])
            .range([chartHeight, 0]);

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .selectAll('line')
            .data(yScale.ticks(5))
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .style('stroke', darkMode ? '#0f3460' : '#e0e0e0')
            .style('stroke-dasharray', '3,3')
            .style('stroke-width', 1);

        // X Axis
        const xAxis = g.append('g')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(xScale));

        xAxis.selectAll('text')
            .style('fill', darkMode ? '#eee' : '#2c3e50')
            .style('font-size', '12px');

        xAxis.select('.domain')
            .style('stroke', darkMode ? '#0f3460' : '#ccc');

        xAxis.selectAll('line')
            .style('stroke', darkMode ? '#0f3460' : '#ccc');

        // Y Axis
        const yAxis = g.append('g')
            .call(d3.axisLeft(yScale).ticks(5));

        yAxis.selectAll('text')
            .style('fill', darkMode ? '#eee' : '#2c3e50')
            .style('font-size', '12px');

        yAxis.select('.domain')
            .style('stroke', darkMode ? '#0f3460' : '#ccc');

        yAxis.selectAll('line')
            .style('stroke', darkMode ? '#0f3460' : '#ccc');

        // Y Axis Label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 15)
            .attr('x', -chartHeight / 2)
            .attr('text-anchor', 'middle')
            .style('fill', darkMode ? '#eee' : '#2c3e50')
            .style('font-size', '12px')
            .text('AQI Value');

        // Tooltip
        const tooltip = d3.select(tooltipRef.current)
            .style('position', 'absolute')
            .style('background-color', darkMode ? '#16213e' : 'white')
            .style('border', `1px solid ${darkMode ? '#0f3460' : '#ddd'}`)
            .style('border-radius', '4px')
            .style('padding', '10px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('color', darkMode ? '#eee' : '#2c3e50')
            .style('font-size', '13px')
            .style('z-index', 1000)
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.2)');

        // Bars
        const bars = g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.period))
            .attr('width', xScale.bandwidth())
            .attr('y', chartHeight)
            .attr('height', 0)
            .style('fill', color || '#3498db')
            .style('cursor', 'pointer');

        // Animate bars
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(d.aqi))
            .attr('height', d => chartHeight - yScale(d.aqi));

        // Add value labels on top of bars
        const labels = g.selectAll('.label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => xScale(d.period) + xScale.bandwidth() / 2)
            .attr('y', chartHeight)
            .attr('text-anchor', 'middle')
            .style('fill', darkMode ? '#eee' : '#2c3e50')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('opacity', 0)
            .text(d => d.aqi);

        // Animate labels
        labels.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(d.aqi) - 5)
            .style('opacity', 1);

        // Hover effects
        bars
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('fill', d3.color(color || '#3498db').darker(0.5))
                    .style('opacity', 0.8);

                tooltip
                    .style('opacity', 1)
                    .html(`
                        <strong>${d.period}</strong><br/>
                        <strong>AQI:</strong> ${d.aqi}<br/>
                        <strong>Pollutant:</strong> ${d.pollutant}
                    `);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('fill', color || '#3498db')
                    .style('opacity', 1);

                tooltip.style('opacity', 0);
            });

    }, [data, darkMode, color, height]);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <svg ref={svgRef} style={{ width: '100%', height: height }}></svg>
            <div ref={tooltipRef}></div>
        </div>
    );
};

export default D3BarChart;