'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SlideInfo {
  index: number;
  title: string;
  position: number;
}

interface GoToSlideDialogProps {
  slides: SlideInfo[];
  onClose: () => void;
  onSlideSelect: (index: number, position: number) => void;
}

export default function GoToSlideDialog({
  slides,
  onClose,
  onSlideSelect,
}: GoToSlideDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter slides based on search query
  const filteredSlides = slides.filter((slide) => {
    const query = searchQuery.toLowerCase();
    const slideNumber = (slide.index + 1).toString();
    const title = slide.title.toLowerCase();
    return slideNumber.includes(query) || title.includes(query);
  });

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredSlides.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSlides[selectedIndex]) {
          const slide = filteredSlides[selectedIndex];
          onSlideSelect(slide.index, slide.position);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSlides, selectedIndex, onSlideSelect, onClose]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleSlideClick = (slide: SlideInfo) => {
    onSlideSelect(slide.index, slide.position);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
          <h2 className="text-white text-lg font-semibold">Gehe zu Slide</h2>
          <p className="text-gray-400 text-sm mt-1">
            Suche nach Slide-Nummer oder Titel
          </p>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-700">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen..."
            className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Slide List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredSlides.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">
              Keine Slides gefunden
            </div>
          ) : (
            <div className="py-2">
              {filteredSlides.map((slide, idx) => (
                <button
                  key={slide.index}
                  onClick={() => handleSlideClick(slide)}
                  className={`w-full text-left px-6 py-3 hover:bg-gray-700 transition-colors ${
                    idx === selectedIndex ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-mono text-sm mt-0.5 flex-shrink-0">
                      {slide.index + 1}
                    </span>
                    <span className="text-white text-sm flex-1">
                      {slide.title || 'Untitled Slide'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 px-6 py-3 border-t border-gray-700 flex justify-between items-center text-xs text-gray-400">
          <div className="flex gap-4">
            <span>↑↓ Navigation</span>
            <span>Enter Auswählen</span>
            <span>Esc Schließen</span>
          </div>
          <span>{filteredSlides.length} von {slides.length}</span>
        </div>
      </div>
    </div>
  );
}
