'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { parseSlides, Slide } from '@/lib/markdown';
import SlidePreview from './SlidePreview';
import { getAllImages, type StoredImage } from '@/lib/imageStorage';

const STORAGE_KEY = 'presentation-markdown';
const STORAGE_THEME_KEY = 'presentation-theme';
const STORAGE_FONTSIZE_KEY = 'presentation-fontsize';
const STORAGE_AUTHOR_KEY = 'presentation-author';
const STORAGE_CURRENT_SLIDE_KEY = 'presentation-current-slide';
const STORAGE_PRESENTER_NAV_KEY = 'presentation-presenter-nav';
const STORAGE_COMPANY_LOGO_KEY = 'presentation-company-logo';

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PresenterView() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('large');
  const [author, setAuthor] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string>('msg-logo.png');
  const [uploadedImages, setUploadedImages] = useState<StoredImage[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  // Initial load from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedMarkdown = localStorage.getItem(STORAGE_KEY) || '';
        const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'default';
        const savedFontSize = localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'large';
        const savedAuthor = localStorage.getItem(STORAGE_AUTHOR_KEY) || '';
        const savedCompanyLogo = localStorage.getItem(STORAGE_COMPANY_LOGO_KEY) || 'msg-logo.png';
        const savedSlide = localStorage.getItem(STORAGE_CURRENT_SLIDE_KEY);

        const parsedSlides = parseSlides(savedMarkdown);
        setSlides(parsedSlides);
        setSelectedTheme(savedTheme);
        setSelectedFontSize(savedFontSize);
        setAuthor(savedAuthor);
        setCompanyLogo(savedCompanyLogo);

        if (savedSlide) {
          const slideNum = parseInt(savedSlide, 10);
          if (!isNaN(slideNum)) {
            setCurrentSlide(slideNum);
          }
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error);
      }

      try {
        const images = await getAllImages();
        setUploadedImages(images);
      } catch (error) {
        console.error('Failed to load images:', error);
      }
    };

    loadData();
  }, []);

  // Listen for storage changes from the audience view
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        try {
          const parsedSlides = parseSlides(e.newValue);
          setSlides(parsedSlides);
        } catch (error) {
          console.error('Failed to parse slides from storage event:', error);
        }
      } else if (e.key === STORAGE_CURRENT_SLIDE_KEY && e.newValue !== null) {
        // Only update if this was NOT triggered by our own presenter navigation
        // (i.e., presentation-presenter-nav was not set simultaneously)
        try {
          const presenterNav = localStorage.getItem(STORAGE_PRESENTER_NAV_KEY);
          // If presenterNav is very recent (within 100ms), this change came from us — skip
          const isOwnNav = presenterNav && (Date.now() - parseInt(presenterNav, 10)) < 100;
          if (!isOwnNav) {
            const slideNum = parseInt(e.newValue, 10);
            if (!isNaN(slideNum)) {
              setCurrentSlide(slideNum);
            }
          }
        } catch (error) {
          console.error('Failed to handle current-slide storage event:', error);
        }
      } else if (e.key === STORAGE_THEME_KEY && e.newValue !== null) {
        setSelectedTheme(e.newValue);
      } else if (e.key === STORAGE_FONTSIZE_KEY && e.newValue !== null) {
        setSelectedFontSize(e.newValue);
      } else if (e.key === STORAGE_AUTHOR_KEY && e.newValue !== null) {
        setAuthor(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentSlide((prev) => {
          const next = Math.min(prev + 1, slides.length - 1);
          try {
            localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, next.toString());
            localStorage.setItem(STORAGE_PRESENTER_NAV_KEY, Date.now().toString());
          } catch (error) {
            console.error('Failed to write to localStorage:', error);
          }
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => {
          const next = Math.max(prev - 1, 0);
          try {
            localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, next.toString());
            localStorage.setItem(STORAGE_PRESENTER_NAV_KEY, Date.now().toString());
          } catch (error) {
            console.error('Failed to write to localStorage:', error);
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => {
      const next = Math.max(prev - 1, 0);
      try {
        localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, next.toString());
        localStorage.setItem(STORAGE_PRESENTER_NAV_KEY, Date.now().toString());
      } catch (error) {
        console.error('Failed to write to localStorage:', error);
      }
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => {
      const next = Math.min(prev + 1, slides.length - 1);
      try {
        localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, next.toString());
        localStorage.setItem(STORAGE_PRESENTER_NAV_KEY, Date.now().toString());
      } catch (error) {
        console.error('Failed to write to localStorage:', error);
      }
      return next;
    });
  }, [slides.length]);

  const handleResetTimer = () => {
    setTimerSeconds(0);
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl text-gray-400">Keine Folien vorhanden</p>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];
  const nextSlideData = currentSlide < slides.length - 1 ? slides[currentSlide + 1] : null;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main content area */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Current slide – large */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Aktuelle Folie</div>
          <div className="flex-1 min-h-0">
            {currentSlideData && (
              <SlidePreview
                markdown={currentSlideData.content}
                slideNumber={currentSlide + 1}
                totalSlides={slides.length}
                themeId={selectedTheme}
                fontSizeId={selectedFontSize}
                uploadedImages={uploadedImages}
                author={author}
                backgroundImage={currentSlideData.backgroundImage}
                productLogo={currentSlideData.productLogo}
                companyLogo={companyLogo}
              />
            )}
          </div>
        </div>

        {/* Right column: next slide + notes */}
        <div className="w-80 flex flex-col gap-4 shrink-0">
          {/* Next slide – small */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Nächste Folie</div>
            <div className="h-44">
              {isLastSlide ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-sm">Letzte Folie</p>
                </div>
              ) : nextSlideData ? (
                <SlidePreview
                  markdown={nextSlideData.content}
                  slideNumber={currentSlide + 2}
                  totalSlides={slides.length}
                  themeId={selectedTheme}
                  fontSizeId={selectedFontSize}
                  uploadedImages={uploadedImages}
                  author={author}
                  backgroundImage={nextSlideData.backgroundImage}
                  productLogo={nextSlideData.productLogo}
                  companyLogo={companyLogo}
                />
              ) : null}
            </div>
          </div>

          {/* Notes – scrollable */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Notizen</div>
            <div
              className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 text-sm text-gray-200 leading-relaxed border border-gray-700"
              data-testid="notes-area"
            >
              {currentSlideData?.notes ? (
                <p className="whitespace-pre-wrap">{currentSlideData.notes}</p>
              ) : (
                <p className="text-gray-500 italic">Keine Notizen für diese Folie.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center gap-4 shrink-0">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg text-green-400" data-testid="timer-display">
            ⏱ {formatTimer(timerSeconds)}
          </span>
          <button
            onClick={handleResetTimer}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            data-testid="reset-timer-btn"
          >
            Reset
          </button>
        </div>

        <div className="flex-1" />

        {/* Slide counter */}
        <span className="text-sm text-gray-300" data-testid="slide-counter">
          {currentSlide + 1} / {slides.length}
        </span>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
          >
            ← Zurück
          </button>
          <button
            onClick={handleNext}
            disabled={isLastSlide}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
}
