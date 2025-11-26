import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Activity, MemoryAnchor } from '../types';

interface MapVizProps {
  activities: Activity[];
  anchors: MemoryAnchor[];
  onAnchorClick: (anchor: MemoryAnchor) => void;
  width: number;
  height: number;
}

const MapViz: React.FC<MapVizProps> = ({ activities, anchors, onAnchorClick, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countries, setCountries] = useState<any>(null);
  const [transform, setTransform] = useState<{ k: number; x: number; y: number }>({ k: 1, x: 0, y: 0 });
  const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);

  // Load GeoJSON data
  useEffect(() => {
    const fetchData = async () => {
      const [world, admin1] = await Promise.all([
      fetch('/data/ne_10m_admin_0_countries.json').then(r => r.json()),
      fetch('/data/ne_10m_admin_1_states_provinces.json').then(r => r.json()),
      ]);
      setWorldData(world);
      
      try {
        const worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        setCountries((worldData as any));
      } catch (error) {
        console.error("Failed to load map data", error);
      }
    };
    fetchData();
  }, []);

  // Setup D3 Zoom behavior
  useEffect(() => {
    const canvas = d3.select(canvasRef.current);
    
    const zoom = d3.zoom()
      .scaleExtent([1, 20])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    canvas.call(zoom as any);
  }, []);

  // Main Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !countries) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // INFINITE PANNING LOGIC
    // We convert the X translation (px) into rotation degrees.
    // Standard Mercator projection width is related to scale.
    // lambda (rotation) = (x / width) * 360
    const lambda = (transform.x / width) * 360; 
    
    const projection = d3.geoMercator()
      .scale((width / (2 * Math.PI)) * transform.k)
      .translate([width / 2, height / 2 + transform.y])
      .rotate([lambda, 0]);

    const path = d3.geoPath(projection, context);

    // Clear Canvas
    context.clearRect(0, 0, width, height);
    context.lineJoin = 'round';
    context.lineCap = 'round';

    // 1. Draw Countries (Admin-0)
    context.beginPath();
    const countryFeatures = topojson.feature(countries, countries.objects.countries);
    path(countryFeatures);
    context.fillStyle = '#ffffff';
    context.fill();
    context.lineWidth = 0.5;
    context.strokeStyle = '#e5e7eb'; // Tailwind gray-200
    context.stroke();

    // 2. Draw Activities (Heatmap Effect)
    // We use 'multiply' blend mode to create darker areas where paths overlap
    context.globalCompositeOperation = 'multiply';
    
    activities.forEach(activity => {
      context.beginPath();
      const geometry: any = {
        type: 'LineString',
        coordinates: activity.coordinates
      };
      path(geometry);

      // Keep lines relatively thin but visible
      context.lineWidth = Math.max(0.5, 1.5 / Math.sqrt(transform.k));

      switch(activity.type) {
        case 'Run': context.strokeStyle = '#3b82f6'; break; // blue-500
        case 'Ride': context.strokeStyle = '#f97316'; break; // orange-500
        case 'Hike': context.strokeStyle = '#22c55e'; break; // green-500
        default: context.strokeStyle = '#3b82f6';
      }
      
      context.globalAlpha = 0.3; // Low opacity for accumulation
      context.stroke();
    });

    // Reset composite operation for UI elements
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1.0;

    // 3. Draw Memory Anchors
    anchors.forEach(anchor => {
      const [lon, lat] = anchor.coordinate;
      const pos = projection([lon, lat]);
      
      if (pos) {
        const [x, y] = pos;
        
        // Skip if point is clipped (though Mercator usually shows all)
        // Draw Anchor Point
        const isHovered = hoveredAnchor === anchor.id;
        const radius = isHovered ? 8 : 5;
        
        // Inner Dot
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fillStyle = '#3b82f6';
        context.fill();
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.stroke();
        
        // Breathing Ring effect
        context.beginPath();
        context.arc(x, y, radius + 6, 0, 2 * Math.PI);
        context.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        context.lineWidth = 2;
        context.stroke();
      }
    });

  }, [countries, activities, anchors, transform, width, height, hoveredAnchor]);

  // Handle Interaction (Click & Hover)
  // We need to recreate the projection state to calculate distance from mouse to anchors
  const getProjection = () => {
    return d3.geoMercator()
      .scale((width / (2 * Math.PI)) * transform.k)
      .translate([width / 2, height / 2 + transform.y])
      .rotate([(transform.x / width) * 360, 0]);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const projection = getProjection();

    for (const anchor of anchors) {
      const pos = projection(anchor.coordinate);
      if (pos) {
        const [px, py] = pos;
        const dist = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
        if (dist < 20) {
          onAnchorClick(anchor);
          return;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const projection = getProjection();

    let found = null;
    for (const anchor of anchors) {
      const pos = projection(anchor.coordinate);
      if (pos) {
        const [px, py] = pos;
        const dist = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
        if (dist < 20) {
          found = anchor.id;
          break;
        }
      }
    }
    setHoveredAnchor(found);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = found ? 'pointer' : 'move';
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      className="block bg-white outline-none"
    />
  );
};

export default MapViz;
