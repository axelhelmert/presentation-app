'use client';

import React, { useState, useEffect } from 'react';
import { parseSlides, Slide } from '@/lib/markdown';
import SlidePreview from './SlidePreview';
import { getAllImages, type StoredImage } from '@/lib/imageStorage';

const STORAGE_KEY = 'presentation-markdown';
const STORAGE_THEME_KEY = 'presentation-theme';
const STORAGE_FONTSIZE_KEY = 'presentation-fontsize';
const STORAGE_AUTHOR_KEY = 'presentation-author';
const STORAGE_CURRENT_SLIDE_KEY = 'presentation-current-slide';
const STORAGE_COMPANY_LOGO_KEY = 'presentation-company-logo';

// Renders the ENTIRE deck scrollable. Deliberately NOT live-synced with the
// editor: rendering all slides (incl. Mermaid) on every keystroke would be
// far too expensive. Data is loaded once on open and on demand via the
// reload button.
export default function DeckPreview() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('large');
  const [author, setAuthor] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string>('msg-logo.png');
  const [uploadedImages, setUploadedImages] = useState<StoredImage[]>([]);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const loadDeck = async () => {
    const savedMarkdown = localStorage.getItem(STORAGE_KEY) || '';
    setSelectedTheme(localStorage.getItem(STORAGE_THEME_KEY) || 'default');
    setSelectedFontSize(localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'large');
    setAuthor(localStorage.getItem(STORAGE_AUTHOR_KEY) || '');
    setCompanyLogo(localStorage.getItem(STORAGE_COMPANY_LOGO_KEY) || 'msg-logo.png');
    setSlides(parseSlides(savedMarkdown));
    setLoadedAt(new Date());

    try {
      setUploadedImages(await getAllImages());
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  useEffect(() => {
    loadDeck();
  }, []);

  // Clicking a slide makes the editor (and the live preview window) jump there.
  // storage events only fire when the value actually changes — remove first so
  // clicking the slide the editor is already on still triggers the jump.
  const handleSlideClick = (index: number) => {
    localStorage.removeItem(STORAGE_CURRENT_SLIDE_KEY);
    localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, index.toString());
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Deck-Vorschau</h2>
          <span className="text-sm text-gray-400">
            {slides.length} Folie{slides.length !== 1 ? 'n' : ''}
            {loadedAt && ` • Stand ${loadedAt.toLocaleTimeString()}`}
          </span>
        </div>
        <button
          onClick={loadDeck}
          className="px-4 py-1 bg-indigo-600 rounded hover:bg-indigo-500 text-sm font-medium"
          title="Deck neu aus dem Editor-Stand laden"
        >
          🔄 Aktualisieren
        </button>
      </div>

      {/* Scrollable slide list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 flex flex-col gap-6">
          {slides.length === 0 && (
            <p className="text-gray-400 text-center mt-12">Keine Folien vorhanden</p>
          )}
          {slides.map((slide, index) => (
            <div key={index}>
              <div className="text-xs text-gray-400 mb-1 px-1 flex justify-between">
                <span>
                  Folie {index + 1}
                  {slide.chapterTitle && (
                    <span className="ml-2 text-blue-400">• {slide.chapterTitle}</span>
                  )}
                </span>
                <span className="text-gray-500">Klick = im Editor anwählen</span>
              </div>
              <div
                className="aspect-video w-full cursor-pointer ring-1 ring-gray-700 hover:ring-2 hover:ring-indigo-400 rounded transition-shadow"
                onClick={() => handleSlideClick(index)}
              >
                <SlidePreview
                  markdown={slide.content}
                  slideNumber={index + 1}
                  totalSlides={slides.length}
                  themeId={selectedTheme}
                  fontSizeId={selectedFontSize}
                  uploadedImages={uploadedImages}
                  author={author}
                  backgroundImage={slide.backgroundImage}
                  backgroundLogo={slide.backgroundLogo}
                  productLogo={slide.productLogo}
                  companyLogo={companyLogo}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
