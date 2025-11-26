import React, { useState, useEffect } from 'react';
import MapViz from './components/MapViz';
import StartPageOverlay from './components/StartPageOverlay';
import ActivityModal from './components/ActivityModal';
import AnchorModal from './components/AnchorModal';
import { APP_DATA } from './services/mockData';
import type { MemoryAnchor, Activity } from './types';

const { activities: mockActivities, anchors: mockAnchors, bookmarks: mockBookmarks } = APP_DATA;

// 放在组件外也可以，避免每次 render 重新创建
function distance(p1: [number, number], p2: [number, number]) {
  const dx = p1[1] - p2[1]; // lat 差
  const dy = p1[0] - p2[0]; // lng 差
  return Math.sqrt(dx * dx + dy * dy);
}

function distancePointToPath(
  point: [number, number],
  path: [number, number][]
): number {
  let min = Infinity;

  for (const coord of path) {
    const d = distance(point, coord);
    if (d < min) min = d;
  }

  return min;
}

const App: React.FC = () => {
  const [selectedAnchor, setSelectedAnchor] = useState<MemoryAnchor | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<Activity[] | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);

  const handleViewAnchorActivities = (anchor: MemoryAnchor) => {
    const RADIUS = 0.05; // 粗略范围，可自己调

    const related = mockActivities.filter((act) => {
      const dist = distancePointToPath(anchor.coordinate, act.coordinates);
      return dist < RADIUS;
    });

    setSelectedActivities(related);
    setSelectedCoord({
      lat: anchor.coordinate[1],
      lon: anchor.coordinate[0],
    });

    setSelectedAnchor(null);
    setAnchorIndex(null);
  };

  const goToPrevAnchor = () => {
    if (anchorIndex === null) return;

    const newIndex = (anchorIndex - 1 + mockAnchors.length) % mockAnchors.length;
    setAnchorIndex(newIndex);
    setSelectedAnchor(mockAnchors[newIndex]);
  };

  const goToNextAnchor = () => {
    if (anchorIndex === null) return;

    const newIndex = (anchorIndex + 1) % mockAnchors.length;
    setAnchorIndex(newIndex);
    setSelectedAnchor(mockAnchors[newIndex]);
  };

  useEffect(() => {
    if (!selectedAnchor || selectedActivities) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft') {
        goToPrevAnchor();
      } else if (e.key === 'ArrowRight') {
        goToNextAnchor();
      } else if (e.key === 'Escape') {
        setSelectedAnchor(null);
        setAnchorIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnchor, selectedActivities, goToPrevAnchor, goToNextAnchor]);

  return (
    <div className="w-screen h-screen relative bg-white">
      <MapViz
        activities={mockActivities}
        anchors={mockAnchors}
        onAnchorClick={(anchor) => {
          const idx = mockAnchors.findIndex((a) => a.id === anchor.id);
          if (idx !== -1) {
            setAnchorIndex(idx);
          }
          setSelectedAnchor(anchor);
          setSelectedActivities(null);
          setSelectedCoord(null);
        }}
        onActivitiesAtPoint={(acts, lat, lon) => {
          setSelectedActivities(acts);
          setSelectedCoord({ lat, lon });
          setSelectedAnchor(null);
          setAnchorIndex(null);
        }}
      />

      <StartPageOverlay bookmarks={mockBookmarks} />

      {/* 点击地图 → 活动列表 Modal */}
      {selectedActivities && (
        <ActivityModal
          activities={selectedActivities}
          lat={selectedCoord?.lat}
          lon={selectedCoord?.lon}
          onClose={() => {
            setSelectedActivities(null);
            setSelectedCoord(null);
          }}
        />
      )}

      {/* 点击 Anchor → Anchor 详情 Modal */}
      {selectedAnchor && (
        <AnchorModal
          anchor={selectedAnchor}
          onClose={() => {
            setSelectedAnchor(null);
            setAnchorIndex(null);
          }}
          onPrev={goToPrevAnchor}
          onNext={goToNextAnchor}
          onViewActivities={handleViewAnchorActivities}
        />
      )}
    </div>
  );
};

export default App;
