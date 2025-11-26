import React, { useState } from 'react';
import { Search, MapPin, X, Globe, Calendar, Mail, Github, Youtube, Activity, Dribbble, ArrowRight } from 'lucide-react';
import { MemoryAnchor, Bookmark } from '../types';

interface UIOverlayProps {
  selectedAnchor: MemoryAnchor | null;
  onCloseAnchor: () => void;
  bookmarks: Bookmark[];
}

const UIOverlay: React.FC<UIOverlayProps> = ({ selectedAnchor, onCloseAnchor, bookmarks }) => {
  const [searchEngine, setSearchEngine] = useState<'google' | 'github' | 'chatgpt'>('chatgpt');
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    let url = '';
    switch (searchEngine) {
      case 'google': url = `https://www.google.com/search?q=${encodeURIComponent(query)}`; break;
      case 'github': url = `https://github.com/search?q=${encodeURIComponent(query)}`; break;
      case 'chatgpt': url = `https://chat.openai.com/?q=${encodeURIComponent(query)}`; break;
    }
    window.location.href = url;
  };

  const getIcon = (title: string) => {
      const t = title.toLowerCase();
      if(t.includes('calendar')) return <Calendar size={14} />;
      if(t.includes('mail')) return <Mail size={14} />;
      if(t.includes('git')) return <Github size={14} />;
      if(t.includes('tube')) return <Youtube size={14} />;
      if(t.includes('strava')) return <Activity size={14} />;
      if(t.includes('dribbble')) return <Dribbble size={14} />;
      return <Globe size={14} />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center pt-[15vh]">
      
      {/* Header */}
      <div className="text-center mb-8 pointer-events-auto">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Eliot's Passport</h1>
        <p className="text-gray-400 text-sm font-light tracking-wide">Digital footprint & browser start page</p>
      </div>

      {/* Search Widget */}
      <div className="w-full max-w-xl px-4 pointer-events-auto mb-8 z-10">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none select-none">
            {searchEngine === 'google' && <span className="text-xl text-gray-400 font-bold">G</span>}
            {searchEngine === 'github' && <Github className="text-gray-400" size={20} />}
            {searchEngine === 'chatgpt' && <span className="text-xl text-emerald-500 font-bold">AI</span>}
          </div>
          <input
            type="text"
            className="w-full bg-white/80 backdrop-blur-md border border-gray-200 text-gray-900 text-lg rounded-2xl py-4 pl-12 pr-24 shadow-sm hover:shadow-md focus:shadow-lg focus:outline-none focus:border-blue-400 transition-all duration-300 placeholder:text-gray-300"
            placeholder={`Search ${searchEngine === 'chatgpt' ? 'ChatGPT' : searchEngine.charAt(0).toUpperCase() + searchEngine.slice(1)}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 px-3 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider cursor-pointer"
            onClick={() => {
              if(searchEngine === 'google') setSearchEngine('github');
              else if(searchEngine === 'github') setSearchEngine('chatgpt');
              else setSearchEngine('google');
            }}
          >
            SWITCH
          </button>
        </form>
      </div>

      {/* Bookmarks */}
      <div className="flex flex-wrap justify-center gap-3 pointer-events-auto z-10 max-w-2xl px-4">
        {bookmarks.map((bm, i) => (
          <a
            key={i}
            href={bm.url}
            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-full text-sm text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-white transition-all shadow-sm"
          >
            {getIcon(bm.title)}
            {bm.title}
          </a>
        ))}
      </div>

      {/* Anchor Detail Modal */}
      {selectedAnchor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto bg-black/5 backdrop-blur-[2px]" onClick={onCloseAnchor}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {selectedAnchor.imageUrl && (
              <div className="h-48 w-full overflow-hidden relative">
                 <img src={selectedAnchor.imageUrl} alt={selectedAnchor.title} className="w-full h-full object-cover" />
                 <div className="absolute top-2 right-2">
                   <button onClick={onCloseAnchor} className="p-1 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors">
                     <X size={16} />
                   </button>
                 </div>
              </div>
            )}
            <div className="p-6">
              {!selectedAnchor.imageUrl && (
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                    <MapPin size={24} />
                  </div>
                  <button onClick={onCloseAnchor} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedAnchor.title}</h3>
              <p className="text-sm text-blue-500 font-medium mb-3 flex items-center gap-1">
                 <MapPin size={12} /> {selectedAnchor.locationName}
              </p>
              
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 border-b border-gray-100 pb-2">
                {selectedAnchor.date}
              </div>
              
              <p className="text-gray-600 leading-relaxed text-sm">
                {selectedAnchor.note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-8 flex gap-6 text-xs font-medium text-gray-400 pointer-events-none select-none">
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Ride</div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Run</div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Hike</div>
      </div>

    </div>
  );
};

export default UIOverlay;
