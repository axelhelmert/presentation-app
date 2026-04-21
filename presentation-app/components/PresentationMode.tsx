'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Slide } from '@/lib/markdown';
import SlidePreview from './SlidePreview';
import { type StoredImage } from '@/lib/imageStorage';
import { useRemoteControl } from '@/hooks/useRemoteControl';
import type { RemoteCommandPayload } from '@/lib/socket';
import { QRCodeSVG } from 'qrcode.react';

interface PresentationModeProps {
  slides: Slide[];
  onExit: () => void;
  initialSlide?: number;
  themeId?: string;
  fontSizeId?: string;
  uploadedImages?: StoredImage[];
  author?: string;
}

// Generate a unique session ID for this presentation
function generateSessionId(): string {
  return `pres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  const [showRemoteInfo, setShowRemoteInfo] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => generateSessionId());
  const [networkHost, setNetworkHost] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const wasFullscreenRef = useRef<boolean>(false);
  const presenterWindowRef = useRef<Window | null>(null);

  // Handle remote control commands
  const handleRemoteCommand = useCallback(
    (command: RemoteCommandPayload) => {
      switch (command.command) {
        case 'next':
          setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
          break;
        case 'prev':
          setCurrentSlide((prev) => Math.max(prev - 1, 0));
          break;
        case 'goto':
          if (
            command.slideIndex !== undefined &&
            command.slideIndex >= 0 &&
            command.slideIndex < slides.length
          ) {
            setCurrentSlide(command.slideIndex);
          }
          break;
        case 'first':
          setCurrentSlide(0);
          break;
        case 'last':
          setCurrentSlide(slides.length - 1);
          break;
      }
    },
    [slides.length]
  );

  // Initialize remote control
  const { isConnected, broadcastSlideUpdate } = useRemoteControl({
    sessionId,
    onRemoteCommand: handleRemoteCommand,
  });

  // Fetch network information on mount
  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => res.json())
      .then((data) => {
        setNetworkHost(data.host);
      })
      .catch((err) => {
        console.error('Failed to fetch network info:', err);
        // Fallback to window.location.host
        if (typeof window !== 'undefined') {
          setNetworkHost(window.location.host);
        }
      });
  }, []);

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

  // Sync currentSlide to LocalStorage and broadcast via WebSocket whenever it changes
  useEffect(() => {
    updateCurrentSlideStorage(currentSlide);
    broadcastSlideUpdate(currentSlide, slides.length);
  }, [currentSlide, slides.length, updateCurrentSlideStorage, broadcastSlideUpdate]);

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

      {/* Remote control info overlay */}
      {showRemoteInfo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 text-white p-8 rounded-lg shadow-2xl max-w-lg">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold">Fernsteuerung</h3>
            <button
              onClick={() => setShowRemoteInfo(false)}
              className="text-gray-400 hover:text-white font-bold text-xl"
            >
              ✕
            </button>
          </div>
          <div className="space-y-6">
            {/* QR Code */}
            {networkHost && (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-300 mb-3">
                  Scannen Sie diesen QR-Code mit Ihrem Smartphone:
                </p>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`http://${networkHost}/remote.html?session=${sessionId}`}
                    size={200}
                    level="M"
                  />
                </div>
              </div>
            )}

            {/* URL fallback */}
            <div>
              <p className="text-sm text-gray-300 mb-2">
                Oder öffnen Sie diese URL manuell:
              </p>
              <div className="bg-gray-900 p-3 rounded font-mono text-xs break-all">
                {networkHost
                  ? `http://${networkHost}/remote.html?session=${sessionId}`
                  : typeof window !== 'undefined' &&
                    `${window.location.protocol}//${window.location.host}/remote.html?session=${sessionId}`}
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm">
                  {isConnected ? 'Verbunden' : 'Nicht verbunden'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Session: {sessionId.split('-').pop()}
              </p>
            </div>
          </div>
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
          {slides[currentSlide]?.chapterTitle && (
            <span className="ml-3 text-gray-300 text-xs">
              {slides[currentSlide].chapterTitle}
            </span>
          )}
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
          onClick={() => setShowRemoteInfo(!showRemoteInfo)}
          className={`px-3 py-1 text-white hover:bg-gray-700 rounded transition-colors text-sm ${
            isConnected ? 'bg-green-600' : ''
          }`}
          title="Fernsteuerung anzeigen"
        >
          📱 Remote
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
