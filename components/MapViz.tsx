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
  const [worldTopo, setWorldTopo] = useState<any>(null);
  const [admin1Topo, setAdmin1Topo] = useState<any>(null);
  // Show admin1 (states/provinces) only when zoom scale >= this threshold
  const ADMIN1_ZOOM_THRESHOLD = 4;
  const [transform, setTransform] = useState<{ k: number; x: number; y: number }>({ k: 1, x: 0, y: 0 });
  const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);

  // Load GeoJSON data
  useEffect(() => {
    const fetchData = async () => {
      const [world, admin1] = await Promise.all([
        fetch('/data/ne_10m_admin_0_countries.json').then(r => r.json()),
        fetch('/data/ne_10m_admin_1_states_provinces.json').then(r => r.json()),
      ]);

      setWorldTopo(world);
      setAdmin1Topo(admin1);
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
    if (!canvas || !worldTopo) return;

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
    const countryObjKey = Object.keys(worldTopo.objects)[0];
    const countryFeatures = topojson.feature(worldTopo, worldTopo.objects[countryObjKey]);
    path(countryFeatures as any);
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

    // 3. Draw admin1 (states/provinces) when zoomed in enough
    if (admin1Topo && transform.k >= ADMIN1_ZOOM_THRESHOLD) {
      try {
        const admin1Key = Object.keys(admin1Topo.objects)[0];
        const admin1Features = topojson.feature(admin1Topo, admin1Topo.objects[admin1Key]);
        context.beginPath();
        path(admin1Features as any);
        context.fillStyle = 'rgba(100,116,139,0.02)'; // subtle fill (slate-500 @ low alpha)
        context.fill();
        context.lineWidth = 0.4;
        context.strokeStyle = 'rgba(100,116,139,0.4)';
        context.stroke();
      } catch (err) {
        // If topojson structure unexpected, fail gracefully
        console.warn('Could not render admin1 features', err);
      }
    }

    // 4. Draw Memory Anchors
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

  }, [worldTopo, admin1Topo, activities, anchors, transform, width, height, hoveredAnchor]);

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
