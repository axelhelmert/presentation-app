'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Slide } from '@/lib/markdown';
import SlidePreview from './SlidePreview';

interface PresentationModeProps {
  slides: Slide[];
  onExit: () => void;
  initialSlide?: number;
}

export default function PresentationMode({
  slides,
  onExit,
  initialSlide = 0,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(initialSlide);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExit = useCallback(() => {
    // Exit fullscreen if currently in fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    // Exit presentation mode
    onExit();
  }, [onExit]);

  // Cleanup: exit fullscreen when component unmounts
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          setCurrentSlide((prev) => Math.max(prev - 1, 0));
          break;
        case 'Home':
          e.preventDefault();
          setCurrentSlide(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentSlide(slides.length - 1);
          break;
        case 'Escape':
          e.preventDefault();
          handleExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, handleExit]);

  if (slides.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Keine Folien vorhanden</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-gray-900 flex items-center justify-center relative"
    >
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-colors opacity-50 hover:opacity-100"
        title="Präsentation beenden (ESC)"
      >
        ✕ Beenden
      </button>

      {/* Slide navigation indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
          className="px-3 py-1 text-white disabled:opacity-30 hover:bg-gray-700 rounded transition-colors"
          title="Vorherige Folie (←)"
        >
          ←
        </button>
        <span className="text-white text-sm px-2">
          {currentSlide + 1} / {slides.length}
        </span>
        <button
          onClick={() =>
            setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
          }
          disabled={currentSlide === slides.length - 1}
          className="px-3 py-1 text-white disabled:opacity-30 hover:bg-gray-700 rounded transition-colors"
          title="Nächste Folie (→)"
        >
          →
        </button>
      </div>

      {/* Slide content */}
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="w-full max-w-6xl h-full">
          <SlidePreview
            markdown={slides[currentSlide].rawMarkdown}
            slideNumber={currentSlide + 1}
            totalSlides={slides.length}
          />
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute top-4 left-4 z-50 text-white text-xs bg-gray-800 rounded-lg p-3 opacity-30 hover:opacity-100 transition-opacity">
        <div className="font-semibold mb-1">Tastenkürzel:</div>
        <div>← / → : Navigation</div>
        <div>Leertaste : Nächste Folie</div>
        <div>ESC : Beenden</div>
      </div>
    </div>
  );
}
