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
  // Dark mode (persisted)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('map:darkMode') === '1';
    } catch (e) {
      return false;
    }
  });

  // Base scale / world width (fixed baseline used for wrapping that does NOT depend on zoom k)
  const baseScaleRef = React.useRef<number>((width / (2 * Math.PI)));
  const baseWorldWidthRef = React.useRef<number>(2 * Math.PI * baseScaleRef.current);

  // If the container width changes (resize), update the base references —
  // they are still independent of the current zoom `k`.
  useEffect(() => {
    baseScaleRef.current = (width / (2 * Math.PI));
    baseWorldWidthRef.current = 2 * Math.PI * baseScaleRef.current;
  }, [width]);

  // Load GeoJSON data
  useEffect(() => {
    const fetchData = async () => {    
      try {
        const worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'); // also 10, 50m
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

    // INFINITE PANNING LOGIC (world-coordinate wrapping)
    // Use a fixed base world width (based on initial/base scale) and wrap in
    // world coordinates (x / k) so wrapping does NOT jump when k changes.
    const baseScale = baseScaleRef.current; // fixed baseline scale
    const baseWorldWidth = baseWorldWidthRef.current; // fixed baseline world width

    const { x, y, k } = transform;

    // Convert current pixel translation into world units (decoupled from k)
    const worldX = x / k;

    // Wrap inside the fixed world width (this does not depend on k)
    const wrappedWorldX = ((worldX % baseWorldWidth) + baseWorldWidth) % baseWorldWidth;

    // Convert back to pixel space for the current zoom
    const renderX = wrappedWorldX * k;

    // Projection scale respects zoom but baseScale is the fixed baseline
    const projectionScale = baseScale * k;

    // Compute rotation from the wrapped world position (normalized [0..1) * 360)
    const lambda = (wrappedWorldX / baseWorldWidth) * 360;

    const projection = d3.geoMercator()
      .scale(projectionScale)
      .translate([width / 2, height / 2 + transform.y])
      .rotate([lambda, 0]);

    const path = d3.geoPath(projection, context);

    // Clear Canvas + theme background
    context.clearRect(0, 0, width, height);
    // Slightly off-white background in light mode for better contrast
    const bgColor = darkMode ? '#0b1220' : '#f3f4f6';
    context.fillStyle = bgColor;
    context.fillRect(0, 0, width, height);
    context.lineJoin = 'round';
    context.lineCap = 'round';

    // 1. Draw Countries (Admin-0)
    context.beginPath();
    const countryFeatures = topojson.feature(countries, countries.objects.countries);
    path(countryFeatures);
    context.fillStyle = darkMode ? '#071426' : '#f8fafc';
    context.fill();
    context.lineWidth = 0.6;
    context.strokeStyle = darkMode ? 'rgba(148,163,184,0.35)' : '#d1d5db'; // adjust for theme
    context.stroke();

    // 2. Draw Activities (Heatmap Effect)
    // We use 'multiply' blend mode to create darker areas where paths overlap
    context.globalCompositeOperation = 'multiply';

    const activityColors: Record<string, string> = {
      Run: darkMode ? '#60a5fa' : '#3b82f6',
      Ride: darkMode ? '#fb923c' : '#f97316',
      Hike: darkMode ? '#4ade80' : '#22c55e',
    };

    activities.forEach(activity => {
      context.beginPath();
      const geometry: any = {
        type: 'LineString',
        coordinates: activity.coordinates
      };
      path(geometry);

      // Keep lines relatively thin but visible
      context.lineWidth = Math.max(0.5, 1.5 / Math.sqrt(transform.k));

      context.strokeStyle = activityColors[activity.type] ?? (darkMode ? '#60a5fa' : '#3b82f6');
      
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
        context.fillStyle = darkMode ? '#60a5fa' : '#3b82f6';
        context.fill();
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.stroke();
        
        // Breathing Ring effect
        context.beginPath();
        context.arc(x, y, radius + 6, 0, 2 * Math.PI);
        context.strokeStyle = darkMode ? 'rgba(96,165,250,0.18)' : 'rgba(59, 130, 246, 0.2)';
        context.lineWidth = 2;
        context.stroke();
      }
    });

  }, [countries, activities, anchors, transform, width, height, hoveredAnchor, darkMode]);

  // Toggle dark mode and persist
  const toggleDarkMode = () => {
    try {
      const next = !darkMode;
      setDarkMode(next);
      localStorage.setItem('map:darkMode', next ? '1' : '0');
      // Notify other components in the same page about the theme change
      try {
        window.dispatchEvent(new CustomEvent('map:darkModeChanged', { detail: next }));
      } catch (e) {
        // ignore
      }
    } catch (e) {
      setDarkMode(v => !v);
    }
  };

  // Handle Interaction (Click & Hover)
  // We need to recreate the projection state to calculate distance from mouse to anchors
  const getProjection = () => {
    // Mirror the renderer's world-coordinate wrapping so hit-testing matches
    // what is drawn on screen.
    const baseScale = baseScaleRef.current;
    const baseWorldWidth = baseWorldWidthRef.current;
    const { x, y, k } = transform;

    const worldX = x / k;
    const wrappedWorldX = ((worldX % baseWorldWidth) + baseWorldWidth) % baseWorldWidth;
    const projectionScale = baseScale * k;
    const lambda = (wrappedWorldX / baseWorldWidth) * 360;

    return d3.geoMercator()
      .scale(projectionScale)
      .translate([width / 2, height / 2 + transform.y])
      .rotate([lambda, 0]);
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
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={toggleDarkMode}
          className={`px-2 py-1 rounded text-sm shadow-sm ${darkMode ? 'bg-white/6 text-white' : 'bg-white/90 text-gray-800'}`}
          aria-pressed={darkMode}
          title="Toggle dark mode"
        >
          {darkMode ? '🌙' : '🌞'}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className={`block outline-none ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}
      />
    </div>
  );
};

export default MapViz;
