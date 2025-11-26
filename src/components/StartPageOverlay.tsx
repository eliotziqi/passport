import React, { useState } from 'react';
import type { Bookmark } from '../types';

type SearchEngine = 'google' | 'github' | 'chatgpt';

interface StartPageOverlayProps {
  bookmarks: Bookmark[];
}

const StartPageOverlay: React.FC<StartPageOverlayProps> = ({ bookmarks }) => {
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState<SearchEngine>('chatgpt');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    let url: string;
    switch (engine) {
      case 'google':
        url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
        break;
      case 'github':
        url = `https://github.com/search?q=${encodeURIComponent(q)}`;
        break;
      case 'chatgpt':
      default:
        // ChatGPT 当前不保证完全支持 query 参数，但可作为起点
        url = `https://chatgpt.com/?q=${encodeURIComponent(q)}`;
        break;
    }

    // 你可以选择在当前页跳转或新标签页打开
    window.location.href = url;
    // 或者：
    // window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 循环切换三个引擎
  const cycleEngine = () => {
    const order: SearchEngine[] = ['chatgpt', 'google', 'github'];
    const currentIndex = order.indexOf(engine);
    const next = order[(currentIndex + 1) % order.length];
    setEngine(next);
  };

  const engineLabel =
    engine === 'google' ? 'Google' :
    engine === 'github' ? 'GitHub' :
    'ChatGPT';

  const placeholder =
    engine === 'google'
      ? 'Search Google...'
      : engine === 'github'
      ? 'Search GitHub...'
      : 'Ask ChatGPT...';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 p-4">
      {/* Search Container (Pointer events enabled) */}
      <div className="w-full max-w-xl pointer-events-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Eliot&apos;s Passport
          </h1>
          <p className="text-gray-400 text-sm font-light">
            Digital footprint &amp; browser start page
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          {/* 左侧图标：根据 engine 切换 */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {engine === 'google' && (
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.053-1.147 8.16-2.933 2.173-1.853 3.027-4.52 3.027-6.933 0-.68-.067-1.333-.187-1.933h-11z" />
              </svg>
            )}
            {engine === 'github' && (
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            {engine === 'chatgpt' && (
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M8 12a4 4 0 1 1 4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <input
            type="text"
            className="w-full pl-12 pr-20 py-4 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-lg"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              {engineLabel}
            </span>
            <button
              type="button"
              onClick={cycleEngine}
              className="px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-700 border border-gray-200 rounded-full bg-white/70 hover:bg-gray-50 uppercase tracking-wide transition-colors"
            >
              Switch
            </button>
          </div>
        </form>

        {/* Bookmarks */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {bookmarks.map((bm) => (
            <a
              key={bm.title}
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm text-sm text-gray-600 hover:text-blue-500 hover:border-blue-200 transition-all transform hover:-translate-y-0.5"
            >
              {bm.title}
            </a>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 pointer-events-auto">
        <div className="flex space-x-4 text-xs font-medium text-gray-400">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span> Ride
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Run
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Hike
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPageOverlay;
