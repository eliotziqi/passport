// src/components/ActivityModal.tsx
import React from 'react';
import type { Activity } from '../types';

interface ActivityModalProps {
  activities: Activity[];
  onClose: () => void;
  lat?: number;
  lon?: number;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ activities, onClose, lat, lon }) => {
  if (!activities.length) return null;

  const title =
    activities.length === 1
      ? activities[0].name
      : `${activities.length} activities here`;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {lat != null && lon != null && (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 内容列表 */}
        <div className="max-h-96 overflow-y-auto px-6 py-4 space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="border border-slate-100 rounded-2xl px-4 py-3 flex items-start justify-between hover:border-slate-200 hover:shadow-sm transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex h-6 px-2 items-center rounded-full text-[11px] font-medium text-white
                    bg-orange-500"
                  >
                    {act.type}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {act.date}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {act.name}
                </p>
              </div>
              <div className="ml-4 text-right text-xs text-slate-500 shrink-0">
                {'distance' in act && act.distance != null && (
                  <div className="font-semibold text-slate-700">
                    {act.distance.toFixed ? act.distance.toFixed(1) : act.distance} km
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
          <span>Click anywhere outside to close</span>
          <span>Eliot&apos;s Passport</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
