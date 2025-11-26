import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Activity, MemoryAnchor } from '../types';

interface MapVizProps {
  activities: Activity[];
  anchors: MemoryAnchor[];
  onAnchorClick: (anchor: MemoryAnchor) => void;
}

const MapViz: React.FC<MapVizProps> = ({ activities, anchors, onAnchorClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [usStateData, setUsStateData] = useState<any>(null);

  // Load Data
  useEffect(() => {
    Promise.all([
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()),
      fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(r => r.json())
    ]).then(([world, states]) => {
      setWorldData(world);
      setUsStateData(states);
    }).catch(err => console.error("Failed to load map topology", err));
  }, []);

  // D3 Rendering Logic
  useEffect(() => {
    if (!worldData || !usStateData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Select SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear

    // Define Projection (Mercator for global context, but centered nicely)
    // We start zoomed out to show the world, or at least the US
    const projection = d3.geoMercator()
      .scale(150)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Create Groups for Layers (Ordering matters)
    const gBase = svg.append("g").attr("class", "base-layer");
    const gStates = svg.append("g").attr("class", "states-layer").attr("opacity", 0); // Hidden initially
    const gActivities = svg.append("g").attr("class", "activities-layer");
    const gAnchors = svg.append("g").attr("class", "anchors-layer");

    // 1. Draw World Countries (Base)
    gBase.selectAll("path")
      .data(topojson.feature(worldData, worldData.objects.countries).features)
      .join("path")
      .attr("d", path as any)
      .attr("fill", "white")
      .attr("stroke", "#e5e7eb") // map-stroke
      .attr("stroke-width", 0.5);

    // 2. Draw US States (Detail Layer) - Loaded but hidden via opacity until zoom
    gStates.selectAll("path")
      .data(topojson.feature(usStateData, usStateData.objects.states).features)
      .join("path")
      .attr("d", path as any)
      .attr("fill", "none")
      .attr("stroke", "#d1d5db") // slightly darker gray
      .attr("stroke-width", 0.5);

    // 3. Draw Activities (Lines)
    // Map activity types to colors
    const colorMap: Record<string, string> = {
      'Ride': '#f97316',
      'Run': '#3b82f6',
      'Hike': '#22c55e'
    };

    activities.forEach(activity => {
      // Convert coordinates to GeoJSON LineString format for D3
      const feature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: activity.coordinates
        }
      };
      
      gActivities.append("path")
        .datum(feature)
        .attr("d", path as any)
        .attr("fill", "none")
        .attr("stroke", colorMap[activity.type] || "#999")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.4) // Alpha blending for heatmap effect
        .attr("stroke-linecap", "round");
    });

    // 4. Draw Memory Anchors (Points)
    const anchorGroup = gAnchors.selectAll("g.anchor")
      .data(anchors)
      .join("g")
      .attr("class", "anchor cursor-pointer")
      .attr("transform", d => {
        const coords = projection(d.coordinate);
        return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        onAnchorClick(d);
      });

    // Breathing effect circle
    anchorGroup.append("circle")
      .attr("r", 8)
      .attr("fill", "#3b82f6")
      .attr("opacity", 0.4)
      .append("animate") // native SVG animation as fallback/complement to CSS
      .attr("attributeName", "r")
      .attr("values", "4;12;4")
      .attr("dur", "2s")
      .attr("repeatCount", "indefinite");

    // Core solid circle
    anchorGroup.append("circle")
      .attr("r", 4)
      .attr("fill", "#2563eb")
      .attr("stroke", "white")
      .attr("stroke-width", 1);


    // Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 1000]) // Allow deep zoom
      .on("zoom", (event) => {
        const { transform } = event;
        
        // Apply transform to all layers
        gBase.attr("transform", transform.toString());
        gStates.attr("transform", transform.toString());
        gActivities.attr("transform", transform.toString());
        gAnchors.attr("transform", transform.toString());

        // Semantic Zoom (LOD)
        // Adjust stroke width so it doesn't get too thick
        const strokeWidth = 1 / transform.k;
        gBase.selectAll("path").attr("stroke-width", Math.min(0.5, strokeWidth));
        gStates.selectAll("path").attr("stroke-width", Math.min(0.5, strokeWidth));
        gActivities.selectAll("path").attr("stroke-width", Math.max(1 / transform.k, 3 / transform.k)); // Keep lines visible

        // Anchor scale correction (keep dots same visual size)
        gAnchors.selectAll("circle").attr("transform", `scale(${1/transform.k})`);

        // LOD: Show States only when zoomed in
        if (transform.k > 3) {
            gStates.transition().duration(200).attr("opacity", 1);
        } else {
            gStates.transition().duration(200).attr("opacity", 0);
        }
      });

    svg.call(zoom);

  }, [worldData, usStateData, activities, anchors]);

  return (
    <div ref={containerRef} className="w-full h-full bg-white relative">
      <svg 
        ref={svgRef} 
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
      {!worldData && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm font-light">
          Loading Cartography...
        </div>
      )}
    </div>
  );
};

export default MapViz;