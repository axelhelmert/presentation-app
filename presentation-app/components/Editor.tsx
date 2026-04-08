'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { parseSlides, Slide, renderMarkdownToHTML } from '@/lib/markdown';
import SlidePreview from './SlidePreview';
import PresentationMode from './PresentationMode';
import ImageLibrary from './ImageLibrary';
import CustomCSSEditor from './CustomCSSEditor';
import { themes, fontSizes, getTheme } from '@/lib/themes';
import { exportToPDF } from '@/lib/pdfExport';
import {
  getAllImages,
  type StoredImage,
} from '@/lib/imageStorage';

const defaultMarkdown = `# Willkommen zur Präsentation

Dies ist die erste Folie.

---

# Agenda

| Nr. | Thema |
|-----|-------|
| 1   | Einführung |
| 2   | Hauptteil |
| 3   | Technische Details |
| 4   | Zusammenfassung |
| 5   | Fragen & Diskussion |

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

const STORAGE_KEY = 'presentation-markdown';
const STORAGE_THEME_KEY = 'presentation-theme';
const STORAGE_FONTSIZE_KEY = 'presentation-fontsize';
const STORAGE_AUTHOR_KEY = 'presentation-author';

export default function Editor() {
  const [markdown, setMarkdown] = useState<string>('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('large');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<StoredImage[]>([]);
  const [showTableMenu, setShowTableMenu] = useState<boolean>(false);
  const [showImageLibrary, setShowImageLibrary] = useState<boolean>(false);
  const [showCustomCSSEditor, setShowCustomCSSEditor] = useState<boolean>(false);
  const [author, setAuthor] = useState<string>('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedMarkdown = localStorage.getItem(STORAGE_KEY);
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
    const savedFontSize = localStorage.getItem(STORAGE_FONTSIZE_KEY);
    const savedAuthor = localStorage.getItem(STORAGE_AUTHOR_KEY);

    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
    } else {
      setMarkdown(defaultMarkdown);
    }

    if (savedTheme) {
      setSelectedTheme(savedTheme);
    }

    if (savedFontSize) {
      setSelectedFontSize(savedFontSize);
    }

    if (savedAuthor) {
      setAuthor(savedAuthor);
    }

    // Clean up old image data from LocalStorage (if any)
    try {
      localStorage.removeItem('presentation-images');
    } catch (e) {
      // Ignore errors
    }

    // Load images from IndexedDB
    getAllImages()
      .then((images) => {
        setUploadedImages(images);
      })
      .catch((error) => {
        console.error('Failed to load images from IndexedDB:', error);
      });
  }, []);

  // Load and inject custom CSS on mount
  useEffect(() => {
    const customCSS = localStorage.getItem('presentation-custom-css');
    if (customCSS) {
      let styleTag = document.getElementById('custom-presentation-styles') as HTMLStyleElement;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'custom-presentation-styles';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = customCSS;
    }
  }, []);

  // Auto-save to LocalStorage when markdown changes
  useEffect(() => {
    if (markdown) {
      localStorage.setItem(STORAGE_KEY, markdown);
    }
  }, [markdown]);

  // Save theme to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_THEME_KEY, selectedTheme);
  }, [selectedTheme]);

  // Save font size to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_FONTSIZE_KEY, selectedFontSize);
  }, [selectedFontSize]);

  // Save author to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_AUTHOR_KEY, author);
  }, [author]);

  useEffect(() => {
    const parsedSlides = parseSlides(markdown);
    setSlides(parsedSlides);
    if (currentSlide >= parsedSlides.length && parsedSlides.length > 0) {
      setCurrentSlide(parsedSlides.length - 1);
    }
  }, [markdown, currentSlide]);

  const handleStartPresentation = useCallback(() => {
    // Request fullscreen (don't await - stay in user gesture context)
    document.documentElement.requestFullscreen().catch((error) => {
      console.warn('Fullscreen request failed, continuing without fullscreen:', error);
    });

    // Immediately switch to presentation mode
    // Fullscreen will activate asynchronously
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

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportProgress('');

    try {
      // First, render all slides to HTML
      const slidesWithHTML = await Promise.all(
        slides.map(async (slide) => ({
          ...slide,
          content: await renderMarkdownToHTML(slide.rawMarkdown),
        }))
      );

      const theme = getTheme(selectedTheme);
      const fontSize = fontSizes.find((s) => s.id === selectedFontSize) || fontSizes[2];

      await exportToPDF({
        slides: slidesWithHTML,
        theme,
        fontSize,
        onProgress: (current, total) => {
          setExportProgress(`Exporting slide ${current} of ${total}...`);
        },
      });

      setExportProgress('Export complete!');
      setTimeout(() => setExportProgress(''), 2000);
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setMarkdown(content);
      };
      reader.readAsText(file);
    }
    // Reset input so same file can be imported again
    event.target.value = '';
  };

  const handleInsertTable = (withHeader: boolean = true) => {
    const tableTemplate = withHeader
      ? `\n\n| Spalte 1 | Spalte 2 | Spalte 3 |
|----------|----------|----------|
| Zeile 1  | Daten    | Daten    |
| Zeile 2  | Daten    | Daten    |
| Zeile 3  | Daten    | Daten    |

`
      : `\n\n| | | |
|----------|----------|----------|
| Zeile 1  | Daten    | Daten    |
| Zeile 2  | Daten    | Daten    |
| Zeile 3  | Daten    | Daten    |

`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      // Insert table at cursor position
      const newText = text.substring(0, start) + tableTemplate + text.substring(end);
      setMarkdown(newText);

      // Set cursor position after inserted table
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + tableTemplate.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Fallback: append to end
      setMarkdown((prev) => prev + tableTemplate);
    }

    setShowTableMenu(false);
  };

  const handleInsertNumberedTable = () => {
    const numberedTableTemplate = `\n\n<table class="table-numbered">
  <tr>
    <td class="num-col">1</td>
    <td class="content-col">
      <div class="cell-title">Überschrift 1</div>
      <div class="cell-details">
        <ul>
          <li>Detail Punkt 1</li>
          <li>Detail Punkt 2</li>
        </ul>
      </div>
    </td>
  </tr>
  <tr>
    <td class="num-col">2</td>
    <td class="content-col">
      <div class="cell-title">Überschrift 2</div>
      <div class="cell-details">
        <ul>
          <li>Detail Punkt 1</li>
          <li>Detail Punkt 2</li>
        </ul>
      </div>
    </td>
  </tr>
  <tr>
    <td class="num-col">3</td>
    <td class="content-col">
      <div class="cell-title">Überschrift 3</div>
      <div class="cell-details">
        <ul>
          <li>Detail Punkt 1</li>
          <li>Detail Punkt 2</li>
        </ul>
      </div>
    </td>
  </tr>
</table>

`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const newText = text.substring(0, start) + numberedTableTemplate + text.substring(end);
      setMarkdown(newText);

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + numberedTableTemplate.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      setMarkdown((prev) => prev + numberedTableTemplate);
    }

    setShowTableMenu(false);
  };

  const handleInsertImageFromLibrary = (filename: string) => {
    const imageName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const imageMarkdown = `![${imageName}](${filename})`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      // Insert at cursor position
      const newText = text.substring(0, start) + imageMarkdown + text.substring(end);
      setMarkdown(newText);

      // Set cursor position after inserted image
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + imageMarkdown.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Fallback: append to end
      setMarkdown((prev) => prev + '\n\n' + imageMarkdown + '\n\n');
    }
  };

  const handleReloadImages = async () => {
    try {
      const images = await getAllImages();
      setUploadedImages(images);
    } catch (error) {
      console.error('Failed to reload images:', error);
    }
  };

  // Close table menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showTableMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowTableMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTableMenu]);

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
        themeId={selectedTheme}
        fontSizeId={selectedFontSize}
        uploadedImages={uploadedImages}
        author={author}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Editor Panel */}
      <div className="w-1/2 flex flex-col border-r border-gray-300">
        <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Markdown Editor</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {slides.length} Slide{slides.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowTableMenu(!showTableMenu)}
                  className="px-3 py-1 bg-purple-700 rounded hover:bg-purple-600 text-sm transition-colors"
                  title="Tabelle einfügen"
                >
                  📊 Tabelle
                </button>
                {showTableMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 min-w-[200px]">
                    <button
                      onClick={() => handleInsertTable(true)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white transition-colors"
                    >
                      Standard mit Kopfzeile
                    </button>
                    <button
                      onClick={() => handleInsertTable(false)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white transition-colors border-t border-gray-600"
                    >
                      Standard ohne Kopfzeile
                    </button>
                    <button
                      onClick={handleInsertNumberedTable}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white transition-colors border-t border-gray-600"
                    >
                      🔢 Nummerierte Tabelle
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowImageLibrary(true)}
                className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-600 text-sm transition-colors"
                title="Bild-Bibliothek öffnen"
              >
                🖼️ Bilder
              </button>
              <button
                onClick={() => setShowCustomCSSEditor(true)}
                className="px-3 py-1 bg-pink-700 rounded hover:bg-pink-600 text-sm transition-colors"
                title="CSS-Templates bearbeiten"
              >
                🎨 Styles
              </button>
              <label
                htmlFor="markdown-import"
                className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm cursor-pointer transition-colors"
                title="Markdown-Datei importieren"
              >
                📂 Import
              </label>
              <input
                id="markdown-import"
                type="file"
                accept=".md,.markdown"
                onChange={handleImportMarkdown}
                className="hidden"
              />
              <button
                onClick={handleExportMarkdown}
                className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm transition-colors"
                title="Markdown-Datei exportieren"
              >
                💾 Export
              </button>
            </div>
          </div>
        </div>
        <textarea
          ref={textareaRef}
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
          <div className="flex gap-2 items-center">
            {exportProgress && (
              <span className="text-xs text-blue-300 mr-2">{exportProgress}</span>
            )}
            <button
              onClick={handleExportPDF}
              disabled={slides.length === 0 || isExporting}
              className="px-4 py-1 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Als PDF exportieren"
            >
              {isExporting ? '⏳ Exportiere...' : '📄 PDF Export'}
            </button>
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

        {/* Theme and Font Size Controls */}
        <div className="bg-gray-700 text-white px-6 py-2 flex gap-4 items-center justify-between text-sm border-b border-gray-600">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="theme-select" className="font-medium">
                Theme:
              </label>
              <select
                id="theme-select"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400"
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="author-input" className="font-medium">
                Autor:
              </label>
              <input
                id="author-input"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Dein Name"
                className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400 w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="fontsize-select" className="font-medium">
                Schriftgröße:
              </label>
              <select
                id="fontsize-select"
                value={selectedFontSize}
                onChange={(e) => setSelectedFontSize(e.target.value)}
                className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400"
              >
                {fontSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-300 flex items-center gap-2">
            <span className="font-medium">Tastenkürzel:</span>
            <span>F = Präsentieren</span>
            <span>•</span>
            <span>← / → = Navigation</span>
            <span>•</span>
            <span>ESC = Beenden</span>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-hidden">
          {slides.length > 0 && slides[currentSlide] ? (
            <SlidePreview
              markdown={slides[currentSlide].rawMarkdown}
              slideNumber={currentSlide + 1}
              totalSlides={slides.length}
              themeId={selectedTheme}
              fontSizeId={selectedFontSize}
              uploadedImages={uploadedImages}
              author={author}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-lg">
              <p className="text-gray-400">Keine Folien vorhanden</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Library Modal */}
      {showImageLibrary && (
        <ImageLibrary
          images={uploadedImages}
          onClose={() => setShowImageLibrary(false)}
          onInsertImage={handleInsertImageFromLibrary}
          onImagesChanged={handleReloadImages}
        />
      )}

      {/* Custom CSS Editor Modal */}
      {showCustomCSSEditor && (
        <CustomCSSEditor
          onClose={() => setShowCustomCSSEditor(false)}
        />
      )}
    </div>
  );
}
