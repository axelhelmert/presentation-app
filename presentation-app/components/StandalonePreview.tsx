'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { parseSlides, Slide } from '@/lib/markdown';
import SlidePreview from './SlidePreview';
import { themes, fontSizes } from '@/lib/themes';
import { getAllImages, type StoredImage } from '@/lib/imageStorage';

const STORAGE_KEY = 'presentation-markdown';
const STORAGE_THEME_KEY = 'presentation-theme';
const STORAGE_FONTSIZE_KEY = 'presentation-fontsize';
const STORAGE_AUTHOR_KEY = 'presentation-author';
const STORAGE_CURRENT_SLIDE_KEY = 'presentation-current-slide';
const STORAGE_SYNC_KEY = 'presentation-sync-trigger';

export default function StandalonePreview() {
  const [markdown, setMarkdown] = useState<string>('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('large');
  const [author, setAuthor] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<StoredImage[]>([]);

  // Initial load from localStorage
  useEffect(() => {
    const loadData = async () => {
      const savedMarkdown = localStorage.getItem(STORAGE_KEY) || '';
      const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'default';
      const savedFontSize = localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'large';
      const savedAuthor = localStorage.getItem(STORAGE_AUTHOR_KEY) || '';
      const savedSlide = localStorage.getItem(STORAGE_CURRENT_SLIDE_KEY);

      setMarkdown(savedMarkdown);
      setSelectedTheme(savedTheme);
      setSelectedFontSize(savedFontSize);
      setAuthor(savedAuthor);

      if (savedSlide) {
        const slideNum = parseInt(savedSlide, 10);
        if (!isNaN(slideNum)) {
          setCurrentSlide(slideNum);
        }
      }

      // Load images
      try {
        const images = await getAllImages();
        setUploadedImages(images);
      } catch (error) {
        console.error('Failed to load images:', error);
      }
    };

    loadData();
  }, []);

  // Listen for changes from the main editor window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setMarkdown(e.newValue);
      } else if (e.key === STORAGE_THEME_KEY && e.newValue !== null) {
        setSelectedTheme(e.newValue);
      } else if (e.key === STORAGE_FONTSIZE_KEY && e.newValue !== null) {
        setSelectedFontSize(e.newValue);
      } else if (e.key === STORAGE_AUTHOR_KEY && e.newValue !== null) {
        setAuthor(e.newValue);
      } else if (e.key === STORAGE_CURRENT_SLIDE_KEY && e.newValue !== null) {
        const slideNum = parseInt(e.newValue, 10);
        if (!isNaN(slideNum)) {
          setCurrentSlide(slideNum);
        }
      } else if (e.key === STORAGE_SYNC_KEY) {
        // Force reload all data when sync trigger fires
        const savedMarkdown = localStorage.getItem(STORAGE_KEY) || '';
        const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'default';
        const savedFontSize = localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'large';
        const savedAuthor = localStorage.getItem(STORAGE_AUTHOR_KEY) || '';
        const savedSlide = localStorage.getItem(STORAGE_CURRENT_SLIDE_KEY);

        setMarkdown(savedMarkdown);
        setSelectedTheme(savedTheme);
        setSelectedFontSize(savedFontSize);
        setAuthor(savedAuthor);

        if (savedSlide) {
          const slideNum = parseInt(savedSlide, 10);
          if (!isNaN(slideNum)) {
            setCurrentSlide(slideNum);
          }
        }

        // Reload images
        getAllImages()
          .then((images) => setUploadedImages(images))
          .catch((error) => console.error('Failed to reload images:', error));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Parse slides when markdown changes
  useEffect(() => {
    const parsedSlides = parseSlides(markdown);
    setSlides(parsedSlides);
    if (currentSlide >= parsedSlides.length && parsedSlides.length > 0) {
      setCurrentSlide(parsedSlides.length - 1);
    }
  }, [markdown, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentSlide < slides.length - 1) {
          const newSlide = currentSlide + 1;
          setCurrentSlide(newSlide);
          localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, newSlide.toString());
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentSlide > 0) {
          const newSlide = currentSlide - 1;
          setCurrentSlide(newSlide);
          localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, newSlide.toString());
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlide(0);
        localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, '0');
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastSlide = slides.length - 1;
        setCurrentSlide(lastSlide);
        localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, lastSlide.toString());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);
      localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, newSlide.toString());
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);
      localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, newSlide.toString());
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      {/* Header with controls */}
      <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-semibold">Vorschau</h2>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-300">
            Folie {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ← Zurück
          </button>
          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Weiter →
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 p-6 overflow-hidden">
        {slides.length > 0 && slides[currentSlide] ? (
          <SlidePreview
            markdown={slides[currentSlide].content}
            slideNumber={currentSlide + 1}
            totalSlides={slides.length}
            themeId={selectedTheme}
            fontSizeId={selectedFontSize}
            uploadedImages={uploadedImages}
            author={author}
            backgroundImage={slides[currentSlide].backgroundImage}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-lg">
            <p className="text-gray-400">Keine Folien vorhanden</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-700 text-white px-6 py-2 text-xs text-center shrink-0">
        <span className="text-gray-300">
          Tastenkürzel: ← / → = Navigation • Home / End = Erste/Letzte Folie
        </span>
      </div>
    </div>
  );
}
