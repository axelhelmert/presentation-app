'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Slide } from '@/lib/markdown';
import SlidePreview from './SlidePreview';
import { type StoredImage } from '@/lib/imageStorage';

interface PresentationModeProps {
  slides: Slide[];
  onExit: () => void;
  initialSlide?: number;
  themeId?: string;
  fontSizeId?: string;
  uploadedImages?: StoredImage[];
}

export default function PresentationMode({
  slides,
  onExit,
  initialSlide = 0,
  themeId = 'default',
  fontSizeId = 'large',
  uploadedImages = [],
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(initialSlide);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasFullscreenRef = useRef<boolean>(false);

  const handleExit = useCallback(() => {
    // Exit fullscreen if currently in fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    } else {
      // If not in fullscreen, exit presentation mode directly
      onExit();
    }
  }, [onExit]);

  // Handle fullscreen changes - exit presentation when fullscreen is exited
  useEffect(() => {
    // Check if we're already in fullscreen when component mounts
    if (document.fullscreenElement) {
      wasFullscreenRef.current = true;
    }

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        // We entered fullscreen
        wasFullscreenRef.current = true;
      } else if (wasFullscreenRef.current) {
        // Fullscreen was exited (and we were previously in fullscreen)
        // Exit presentation mode
        onExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Cleanup: exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [onExit]);

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
        // Note: ESC handling is done by the browser's fullscreen API
        // When ESC is pressed, browser exits fullscreen automatically
        // and fullscreenchange event will trigger handleExit
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

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
      <div className="w-full h-full flex items-center justify-center px-8 py-8">
        <div className="w-full h-full">
          <SlidePreview
            markdown={slides[currentSlide].rawMarkdown}
            slideNumber={currentSlide + 1}
            totalSlides={slides.length}
            themeId={themeId}
            fontSizeId={fontSizeId}
            uploadedImages={uploadedImages}
          />
        </div>
      </div>
    </div>
  );
}
