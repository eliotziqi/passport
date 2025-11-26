import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import * as turf from '@turf/turf';
import type { Activity, MemoryAnchor } from '../types';

interface MapVizProps {
  activities: Activity[];
  anchors: MemoryAnchor[];
  onAnchorClick: (anchor: MemoryAnchor) => void;
  onActivitiesAtPoint?: (activities: Activity[], lat: number, lon: number) => void;
}

const MapViz: React.FC<MapVizProps> = ({ activities, anchors, onAnchorClick, onActivitiesAtPoint }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [worldData, setWorldData] = useState<any>(null);
  const [usStateData, setUsStateData] = useState<any>(null);
  const [subdivData, setSubdivData] = useState<any>(null); // global admin-1

  // A/B 双源加载函数
  async function fetchWithFallback(primary: string, fallback: string) {
    try {
      const res = await fetch(primary);
      if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
      return await res.json();
    } catch {
      const res2 = await fetch(fallback);
      if (!res2.ok) throw new Error(`Fallback failed: ${res2.status}`);
      return await res2.json();
    }
  }

  // 1) 加载 topojson：世界 + US + 全局 admin-1（A/B fallback）
  useEffect(() => {
    const loadTopo = async () => {
      const [world, admin1] = await Promise.all([
      fetch('/data/ne_10m_admin_0_countries.json').then(r => r.json()),
      fetch('/data/ne_10m_admin_1_states_provinces.json').then(r => r.json()),
      // const [world, usStates, admin1] = await Promise.all([
        // fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()),
        // fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(r => r.json()),
        // fetchWithFallback(
        //   'https://cdn.jsdelivr.net/npm/world-atlas@2/subdivisions-50m.json',
        //   '/world-admin1.json'             // 你自己转好的本地 admin-1
        // )
      ]);
      setWorldData(world);
      // setUsStateData(usStates);
      setSubdivData(admin1);
    };
    loadTopo().catch(err => console.error('Failed to load topo', err));
  }, []);

  // 2) D3 渲染
  useEffect(() => {
    if (!worldData || !usStateData || !subdivData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = d3.geoMercator()
      .scale(150)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // 图层
    const gBase = svg.append('g').attr('class', 'base-layer');
    const gAdmin1 = svg.append('g').attr('class', 'admin1-layer').attr('opacity', 0);
    const gStates = svg.append('g').attr('class', 'states-layer').attr('opacity', 0);
    const gActivities = svg.append('g').attr('class', 'activities-layer');
    const gAnchors = svg.append('g').attr('class', 'anchors-layer');

    // 世界国家
    const worldFC: any = topojson.feature(
      worldData as any,
      worldData.objects.countries
    );
    
    gBase.selectAll('path')
      .data(worldFC.features)
      .join('path')
      .attr('d', path as any)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 0.5);

    // 全局 admin-1
    const adminObj = subdivData.objects.subdivisions || subdivData.objects.admin1;
    if (adminObj) {
      const admin1FC: any = topojson.feature(
        subdivData as any,
        adminObj
      );
      
      gAdmin1.selectAll('path')
        .data(admin1FC.features)
        .join('path')
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 0.5);
    }

    // US 州界（高 zoom 下更细）
    const usStatesFC: any = topojson.feature(
      usStateData as any,
      usStateData.objects.states
    );

    gStates.selectAll('path')
      .data(usStatesFC.features)
      .join('path')
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 0.5);

    // 活动轨迹（线条热图）
    const colorMap: Record<string, string> = {
      Ride: '#f97316',
      Run: '#3b82f6',
      Hike: '#22c55e'
    };
    activities.forEach(activity => {
      const feature = { type: 'Feature', geometry: { type: 'LineString', coordinates: activity.coordinates } };
      gActivities.append('path')
        .datum(feature)
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', colorMap[activity.type] || '#999')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-linecap', 'round');
    });

    // 蓝点 anchors
    const anchorGroup = gAnchors.selectAll('g.anchor')
      .data(anchors)
      .join('g')
      .attr('class', 'anchor cursor-pointer')
      .attr('transform', d => {
        const p = projection(d.coordinate);
        return p ? `translate(${p[0]},${p[1]})` : null;
      })
      .on('click', (evt, d) => {
        evt.stopPropagation();
        onAnchorClick(d);
      });

    anchorGroup.append('circle')
      .attr('r', 8)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.4);

    anchorGroup.append('circle')
      .attr('r', 4)
      .attr('fill', '#2563eb')
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // zoom + LOD
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 1000])
      .on('zoom', (event) => {
        const { transform } = event;

        [gBase, gAdmin1, gStates, gActivities, gAnchors].forEach(g => g.attr('transform', transform.toString()));

        const w = 1 / transform.k;
        gBase.selectAll('path').attr('stroke-width', Math.min(0.5, w));
        gAdmin1.selectAll('path').attr('stroke-width', Math.min(0.5, w));
        gStates.selectAll('path').attr('stroke-width', Math.min(0.5, w));
        gActivities.selectAll('path').attr('stroke-width', Math.max(1 / transform.k, 3 / transform.k));

        gAnchors.selectAll('circle').attr('transform', `scale(${1 / transform.k})`);

        // admin-1 LOD
        gAdmin1.transition().duration(200).attr('opacity', transform.k > 2 ? 1 : 0);
        gStates.transition().duration(200).attr('opacity', transform.k > 5 ? 1 : 0);
      });

    svg.call(zoom as any);

    // 点击地图 → 查附近活动
    if (onActivitiesAtPoint) {
      svg.on('click', (event) => {
        const [x, y] = d3.pointer(event);
        // projection.invert 是 optional + 可能返回 null
        const inverted = projection.invert?.([x, y]);
        if (!inverted) return; // 投影外 or invert 不存在
        const [lon, lat] = inverted;
        const pt = turf.point([lon, lat]);

        const hits = activities.filter(act => {
          const line = turf.lineString(act.coordinates);
          const dist = turf.pointToLineDistance(pt, line, { units: 'kilometers' });
          return dist < 0.15; // 150m 内算经过
        });

        if (hits.length > 0) onActivitiesAtPoint(hits, lat, lon);
      });
    }

  }, [worldData, usStateData, subdivData, activities, anchors, onAnchorClick, onActivitiesAtPoint]);

  return (
    <div ref={containerRef} className="w-full h-full bg-white relative">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};

export default MapViz;
