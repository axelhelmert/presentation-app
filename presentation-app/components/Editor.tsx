'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseSlides, Slide } from '@/lib/markdown';
import SlidePreview from './SlidePreview';
import PresentationMode from './PresentationMode';

const defaultMarkdown = `# Willkommen zur Präsentation

Dies ist die erste Folie.

---

# Zweite Folie

Markdown wird unterstützt:

- Bullet Points
- **Fettgedruckt**
- *Kursiv*

---

# Mathematische Formeln

Inline Formeln: $E = mc^2$

Block Formeln:

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

---

# Code Beispiel

\`\`\`javascript
function hello() {
  console.log("Hello World!");
}
\`\`\`

---

# Letzte Folie

Danke für die Aufmerksamkeit!
`;

export default function Editor() {
  const [markdown, setMarkdown] = useState<string>(defaultMarkdown);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  useEffect(() => {
    const parsedSlides = parseSlides(markdown);
    setSlides(parsedSlides);
    if (currentSlide >= parsedSlides.length && parsedSlides.length > 0) {
      setCurrentSlide(parsedSlides.length - 1);
    }
  }, [markdown, currentSlide]);

  const handleStartPresentation = useCallback(() => {
    // Request fullscreen (must be in user gesture context)
    document.documentElement.requestFullscreen().catch((error) => {
      console.error('Error entering fullscreen:', error);
    });

    // Switch to presentation mode immediately
    setIsPresentationMode(true);
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Keyboard shortcut to start presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F key to start presentation (when not in an input)
      if (
        e.key === 'f' &&
        !isPresentationMode &&
        slides.length > 0 &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handleStartPresentation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, slides.length, handleStartPresentation]);

  // Show presentation mode if active
  if (isPresentationMode) {
    return (
      <PresentationMode
        slides={slides}
        onExit={() => setIsPresentationMode(false)}
        initialSlide={currentSlide}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Editor Panel */}
      <div className="w-1/2 flex flex-col border-r border-gray-300">
        <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Markdown Editor</h2>
          <span className="text-sm text-gray-400">
            {slides.length} Slide{slides.length !== 1 ? 's' : ''}
          </span>
        </div>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="flex-1 p-6 font-mono text-sm resize-none focus:outline-none bg-gray-900 text-gray-100"
          placeholder="Schreibe dein Markdown hier... Trenne Folien mit ---"
          spellCheck={false}
        />
      </div>

      {/* Preview Panel */}
      <div className="w-1/2 flex flex-col">
        <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Vorschau</h2>
          <div className="flex gap-2">
            <button
              onClick={handleStartPresentation}
              disabled={slides.length === 0}
              className="px-4 py-1 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Präsentationsmodus starten (F)"
            >
              🎬 Präsentieren
            </button>
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
        <div className="flex-1 p-6 overflow-hidden">
          {slides.length > 0 && slides[currentSlide] ? (
            <SlidePreview
              markdown={slides[currentSlide].rawMarkdown}
              slideNumber={currentSlide + 1}
              totalSlides={slides.length}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-lg">
              <p className="text-gray-400">Keine Folien vorhanden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
