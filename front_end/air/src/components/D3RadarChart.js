import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3RadarChart = ({ data, darkMode, maxAQI, height = 300 }) => {
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();
        
        // Dimensions
        const margin = { top: 40, right: 80, bottom: 40, left: 80 };
        const width = svgRef.current.clientWidth;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        const radius = Math.min(chartWidth, chartHeight) / 2;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Scales
        const angleScale = d3.scaleLinear()
            .domain([0, data.length])
            .range([0, 2 * Math.PI]);

        const radiusScale = d3.scaleLinear()
            .domain([0, Math.ceil(maxAQI / 50) * 50 || 200])
            .range([0, radius]);

        // Draw circular grid
        const levels = 5;
        const levelStep = radiusScale.domain()[1] / levels;

        // Grid circles
        for (let i = 1; i <= levels; i++) {
            g.append('circle')
                .attr('r', radiusScale(levelStep * i))
                .style('fill', 'none')
                .style('stroke', darkMode ? '#0f3460' : '#ccc')
                .style('stroke-width', 1)
                .style('stroke-dasharray', '3,3');
        }

        // Grid labels
        for (let i = 1; i <= levels; i++) {
            g.append('text')
                .attr('x', 5)
                .attr('y', -radiusScale(levelStep * i))
                .text((levelStep * i).toFixed(0))
                .style('font-size', '10px')
                .style('fill', darkMode ? '#999' : '#666');
        }

        // Draw axes
        data.forEach((d, i) => {
            const angle = angleScale(i) - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Axis line
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', y)
                .style('stroke', darkMode ? '#0f3460' : '#ddd')
                .style('stroke-width', 1);

            // Axis label
            const labelRadius = radius + 20;
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = Math.sin(angle) * labelRadius;

            g.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .text(d.pollutant)
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', darkMode ? '#eee' : '#2c3e50');
        });

        // Create radar area path
        const radarLine = d3.lineRadial()
            .angle((d, i) => angleScale(i))
            .radius(d => radiusScale(d.aqi))
            .curve(d3.curveLinearClosed);

        // Draw the radar area
        const radarArea = g.append('path')
            .datum(data)
            .attr('d', radarLine)
            .style('fill', '#8884d8')
            .style('fill-opacity', 0.3)
            .style('stroke', '#8884d8')
            .style('stroke-width', 2);

        // Add animated entrance
        const totalLength = radarArea.node().getTotalLength();
        radarArea
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

        // Add data points
        const points = g.selectAll('.data-point')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', (d, i) => {
                const angle = angleScale(i) - Math.PI / 2;
                return Math.cos(angle) * radiusScale(d.aqi);
            })
            .attr('cy', (d, i) => {
                const angle = angleScale(i) - Math.PI / 2;
                return Math.sin(angle) * radiusScale(d.aqi);
            })
            .attr('r', 0)
            .style('fill', '#8884d8')
            .style('stroke', '#fff')
            .style('stroke-width', 2)
            .style('cursor', 'pointer');

        // Animate points
        points.transition()
            .delay(1000)
            .duration(500)
            .attr('r', 5);

        // Tooltip
        const tooltip = d3.select(tooltipRef.current)
            .style('position', 'absolute')
            .style('background-color', darkMode ? '#16213e' : 'white')
            .style('border', `1px solid ${darkMode ? '#0f3460' : '#ddd'}`)
            .style('border-radius', '4px')
            .style('padding', '8px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('color', darkMode ? '#eee' : '#2c3e50')
            .style('font-size', '12px')
            .style('z-index', 1000);

        // Add hover effects
        points
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 8);

                tooltip
                    .style('opacity', 1)
                    .html(`<strong>${d.pollutant}</strong><br/>AQI: ${d.aqi.toFixed(2)}`);
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
                    .attr('r', 5);

                tooltip.style('opacity', 0);
            });

    }, [data, darkMode, maxAQI, height]);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <svg ref={svgRef} style={{ width: '100%', height: height }}></svg>
            <div ref={tooltipRef}></div>
        </div>
    );
};

export default D3RadarChart;