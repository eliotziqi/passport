import React, { useState, useEffect } from 'react';
import MapViz from './components/MapViz';
import UIOverlay from './components/UIOverlay';
import { ACTIVITIES, MEMORY_ANCHORS, BOOKMARKS } from './services/mockData';
import { MemoryAnchor } from './types';

const App: React.FC = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [selectedAnchor, setSelectedAnchor] = useState<MemoryAnchor | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <MapViz
        activities={ACTIVITIES}
        anchors={MEMORY_ANCHORS}
        onAnchorClick={setSelectedAnchor}
        width={windowSize.width}
        height={windowSize.height}
      />
      <UIOverlay
        selectedAnchor={selectedAnchor}
        onCloseAnchor={() => setSelectedAnchor(null)}
        bookmarks={BOOKMARKS}
      />
    </div>
  );
};

export default App;
