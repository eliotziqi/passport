import React, { useEffect, useState } from 'react';
import type { MemoryAnchor, Activity } from '../types';

interface AnchorModalProps {
  anchor: MemoryAnchor;
  onClose: () => void;

  onPrev?: () => void;
  onNext?: () => void;

  onViewActivities?: (anchor: MemoryAnchor) => void;
}

const AnchorModal: React.FC<AnchorModalProps> = ({
  anchor,
  onClose,
  onPrev,
  onNext,
  onViewActivities
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center 
      bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out
      ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden
        transform transition-all duration-300 ease-out
        ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部图片区 */}
        {anchor.imageUrl && (
          <div className="h-52 w-full bg-gray-100 relative">
            <img
              src={anchor.imageUrl}
              alt={anchor.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />

            {/* 关闭按钮 */}
            <button
              className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={onClose}
            >
              ✕
            </button>

            {/* 左右按钮 */}
            {onPrev && (
              <button
                onClick={onPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded-lg hover:bg-black/60"
              >
                ‹
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded-lg hover:bg-black/60"
              >
                ›
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {anchor.title}
            </h2>
            <p className="text-sm text-blue-500 font-medium">
              {anchor.date}
            </p>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">
            {anchor.note}
          </p>

          {/* 跳转按钮 */}
          {onViewActivities && (
            <button
              onClick={() => onViewActivities(anchor)}
              className="w-full mt-4 py-2 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              查看相关活动
            </button>
          )}
        </div>

        {/* 底部坐标 */}
        <div className="bg-gray-50 px-6 py-3 text-right">
          <span className="text-xs text-gray-400 font-mono">
            {anchor.coordinate[1].toFixed(4)}, {anchor.coordinate[0].toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnchorModal;
