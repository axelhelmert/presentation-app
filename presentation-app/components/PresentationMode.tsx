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
  author?: string;
}

export default function PresentationMode({
  slides,
  onExit,
  initialSlide = 0,
  themeId = 'default',
  fontSizeId = 'large',
  uploadedImages = [],
  author = '',
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(initialSlide);
  const [presenterBlocked, setPresenterBlocked] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasFullscreenRef = useRef<boolean>(false);
  const presenterWindowRef = useRef<Window | null>(null);

  // Write current slide to LocalStorage for Presenter-View sync
  const updateCurrentSlideStorage = useCallback((index: number) => {
    try {
      localStorage.setItem('presentation-current-slide', index.toString());
    } catch {
      // Ignore LocalStorage errors
    }
  }, []);

  const handleOpenPresenterView = useCallback(() => {
    // If window is already open, bring it to focus
    if (presenterWindowRef.current && !presenterWindowRef.current.closed) {
      presenterWindowRef.current.focus();
      return;
    }

    const win = window.open(
      '/presenter',
      'presenter-view',
      'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no'
    );

    if (win === null) {
      // Popup was blocked
      setPresenterBlocked(true);
    } else {
      presenterWindowRef.current = win;
      setPresenterBlocked(false);

      // Poll to detect when user closes the presenter window
      const checkClosed = setInterval(() => {
        if (presenterWindowRef.current?.closed === true) {
          clearInterval(checkClosed);
          presenterWindowRef.current = null;
        }
      }, 1000);
    }
  }, []);

  const handleExit = useCallback(() => {
    // Close presenter window if open
    presenterWindowRef.current?.close();
    presenterWindowRef.current = null;

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
        // Close presenter window and exit presentation mode
        presenterWindowRef.current?.close();
        presenterWindowRef.current = null;
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

  // Sync currentSlide to LocalStorage whenever it changes
  useEffect(() => {
    updateCurrentSlideStorage(currentSlide);
  }, [currentSlide, updateCurrentSlideStorage]);

  // Listen for presenter navigation events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'presentation-presenter-nav') {
        // Presenter navigated – read the new slide index from LocalStorage
        try {
          const raw = localStorage.getItem('presentation-current-slide');
          if (raw !== null) {
            const index = parseInt(raw, 10);
            if (!isNaN(index) && index >= 0 && index < slides.length) {
              setCurrentSlide(index);
            }
          }
        } catch {
          // Ignore LocalStorage errors
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [slides.length]);

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

  const handleSlideClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.shiftKey || e.button === 2) {
      // Shift+Click or Right-Click = Previous
      setCurrentSlide((prev) => Math.max(prev - 1, 0));
    } else {
      // Regular Click = Next
      setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

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
      {/* Popup blocked error overlay */}
      {presenterBlocked && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-lg">
          <span className="text-sm">
            Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite und versuchen Sie es erneut.
          </span>
          <button
            onClick={() => setPresenterBlocked(false)}
            className="ml-2 text-white hover:text-red-200 font-bold"
            title="Schließen"
          >
            ✕
          </button>
        </div>
      )}

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
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <button
          onClick={handleOpenPresenterView}
          className="px-3 py-1 text-white hover:bg-gray-700 rounded transition-colors text-sm"
          title="Presenter-View öffnen"
        >
          🖥 Presenter-View
        </button>
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <button
          onClick={handleExit}
          className="px-3 py-1 text-white hover:bg-gray-700 rounded transition-colors text-sm"
          title="Präsentation beenden"
        >
          ✕
        </button>
      </div>

      {/* Slide content */}
      <div
        className="w-full h-full flex items-center justify-center px-8 py-8 cursor-pointer"
        onClick={handleSlideClick}
        onContextMenu={handleContextMenu}
      >
        <div className="w-full h-full">
          <SlidePreview
            markdown={slides[currentSlide].content}
            slideNumber={currentSlide + 1}
            totalSlides={slides.length}
            themeId={themeId}
            fontSizeId={fontSizeId}
            uploadedImages={uploadedImages}
            author={author}
            backgroundImage={slides[currentSlide].backgroundImage}
            productLogo={slides[currentSlide].productLogo}
          />
        </div>
      </div>
    </div>
  );
}
