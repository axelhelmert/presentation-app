'use client';

import React, { useState } from 'react';

interface SlideInfo {
  index: number;
  title: string;
  position: number;
}

interface SlideNavigatorProps {
  slides: SlideInfo[];
  currentSlide: number;
  onSlideClick: (index: number, position: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SlideNavigator({
  slides,
  currentSlide,
  onSlideClick,
  isCollapsed,
  onToggleCollapse,
}: SlideNavigatorProps) {
  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-3">
        <button
          onClick={onToggleCollapse}
          className="text-white hover:bg-gray-700 p-2 rounded transition-colors"
          title="Slide-Navigator öffnen"
        >
          ▶
        </button>
        <div className="mt-4 text-gray-400 text-xs transform -rotate-90 whitespace-nowrap origin-center">
          {slides.length} Slides
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm">Slides ({slides.length})</h3>
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-white transition-colors"
          title="Navigator einklappen"
        >
          ◀
        </button>
      </div>

      {/* Slide List */}
      <div className="flex-1 overflow-y-auto">
        {slides.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm text-center">
            Keine Slides vorhanden
          </div>
        ) : (
          <div className="py-2">
            {slides.map((slide) => (
              <button
                key={slide.index}
                onClick={() => onSlideClick(slide.index, slide.position)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-l-4 ${
                  currentSlide === slide.index
                    ? 'bg-gray-700 border-blue-500 text-white'
                    : 'border-transparent text-gray-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-0.5 flex-shrink-0">
                    {slide.index + 1}.
                  </span>
                  <span className="text-sm line-clamp-2">
                    {slide.title || 'Untitled Slide'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
