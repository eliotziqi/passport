import React, { useState } from 'react';
import MapViz from './components/MapViz';
import StartPageOverlay from './components/StartPageOverlay';
import { APP_DATA } from './services/mockData';
import { MemoryAnchor } from './types';

const App: React.FC = () => {
  const [selectedAnchor, setSelectedAnchor] = useState<MemoryAnchor | null>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Background Layer: Map */}
      <div className="absolute inset-0 z-0">
        <MapViz 
          activities={APP_DATA.activities} 
          anchors={APP_DATA.anchors}
          onAnchorClick={setSelectedAnchor}
        />
      </div>

      {/* Foreground Layer: Start Page Overlay */}
      <StartPageOverlay bookmarks={APP_DATA.bookmarks} />

      {/* Modal Layer: Memory Detail */}
      {selectedAnchor && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedAnchor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
            {selectedAnchor.imageUrl && (
              <div className="h-48 w-full bg-gray-100 relative">
                 <img src={selectedAnchor.imageUrl} alt={selectedAnchor.title} className="w-full h-full object-cover" />
                 <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/50 to-transparent"></div>
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="text-xl font-bold text-gray-900">{selectedAnchor.title}</h3>
                   <p className="text-sm text-blue-500 font-medium">{selectedAnchor.date}</p>
                </div>
                <button onClick={() => setSelectedAnchor(null)} className="text-gray-400 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                {selectedAnchor.note}
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-3 text-right">
               <span className="text-xs text-gray-400 font-mono">
                  {selectedAnchor.coordinate[1].toFixed(4)}, {selectedAnchor.coordinate[0].toFixed(4)}
               </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;