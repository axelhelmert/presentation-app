'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { parseSlides, Slide, renderMarkdownToHTML, setNotes } from '@/lib/markdown';
import PresentationMode from './PresentationMode';
import ImageLibrary from './ImageLibrary';
import CustomCSSEditor from './CustomCSSEditor';
import TemplateLibrary from './TemplateLibrary';
import SlideNavigator from './SlideNavigator';
import GoToSlideDialog from './GoToSlideDialog';
import { themes, fontSizes, getTheme } from '@/lib/themes';
import { exportToPDF } from '@/lib/pdfExport';
import {
  getAllImages,
  type StoredImage,
} from '@/lib/imageStorage';
import {
  getAllTemplates,
  saveTemplate,
  type StoredTemplate,
} from '@/lib/templateStorage';
import { extractSlideInfo, type SlideInfo } from '@/lib/slideExtractor';

// IndexedDB helpers for storing FileSystemDirectoryHandle
const DB_NAME = 'presentation-settings';
const DB_VERSION = 1;
const STORE_NAME = 'handles';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function saveToIndexedDB(db: IDBDatabase, key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getFromIndexedDB(db: IDBDatabase, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

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
const STORAGE_CURRENT_SLIDE_KEY = 'presentation-current-slide';
const STORAGE_SYNC_KEY = 'presentation-sync-trigger';
const STORAGE_BEAMER_MODE_KEY = 'presentation-beamer-mode';
const STORAGE_BEAMER_RESOLUTION_KEY = 'presentation-beamer-resolution';
const STORAGE_COMPANY_LOGO_KEY = 'presentation-company-logo';
const STORAGE_SHOW_NOTES_KEY = 'presentation-show-notes';
const STORAGE_EXPORT_FILENAME_KEY = 'presentation-export-filename';
const INDEXEDDB_EXPORT_FILE_KEY = 'export-file-handle';

export default function Editor() {
  const [markdown, setMarkdown] = useState<string>('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [hasFileSystemAPI, setHasFileSystemAPI] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('large');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<StoredImage[]>([]);
  const [storedTemplates, setStoredTemplates] = useState<StoredTemplate[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showImageLibrary, setShowImageLibrary] = useState<boolean>(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState<boolean>(false);
  const [showCustomCSSEditor, setShowCustomCSSEditor] = useState<boolean>(false);
  const [author, setAuthor] = useState<string>('');
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState<boolean>(false);
  const [showGoToDialog, setShowGoToDialog] = useState<boolean>(false);
  const [isPreviewWindowOpen, setIsPreviewWindowOpen] = useState<boolean>(false);
  const [isBeamerMode, setIsBeamerMode] = useState<boolean>(false);
  const [beamerResolution, setBeamerResolution] = useState<string>('1920x1080');
  const [companyLogo, setCompanyLogo] = useState<string>('msg-logo.png');
  const [selectedTextColor, setSelectedTextColor] = useState<string>('orange');
  const [columnCount, setColumnCount] = useState<number>(2);
  const [notesValue, setNotesValue] = useState<string>('');
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [exportFilename, setExportFilename] = useState<string>('presentation.md');
  const [exportFileHandle, setExportFileHandle] = useState<FileSystemFileHandle | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const previewWindowRef = React.useRef<Window | null>(null);
  const deckPreviewWindowRef = React.useRef<Window | null>(null);

  // Grass terminal color scheme (text colors)
  const grassColors = [
    { name: 'Orange', color: 'orange' },
    { name: 'Gold', color: 'gold' },
    { name: 'Darkorange', color: 'darkorange' },
    { name: 'Coral', color: 'coral' },
    { name: 'Tomato', color: 'tomato' },
    { name: 'Orangered', color: 'orangered' },
    { name: 'Chocolate', color: 'chocolate' },
    { name: 'Peru', color: 'peru' },
    { name: 'Sienna', color: 'sienna' },
    { name: 'Tan', color: 'tan' },
  ];

  // Load from LocalStorage on mount
  useEffect(() => {
    // Check if File System Access API is available
    setHasFileSystemAPI('showSaveFilePicker' in window);

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

    const savedBeamerMode = localStorage.getItem(STORAGE_BEAMER_MODE_KEY);
    if (savedBeamerMode === 'true') {
      setIsBeamerMode(true);
    }

    const savedBeamerResolution = localStorage.getItem(STORAGE_BEAMER_RESOLUTION_KEY);
    if (savedBeamerResolution) {
      setBeamerResolution(savedBeamerResolution);
    }

    const savedCompanyLogo = localStorage.getItem(STORAGE_COMPANY_LOGO_KEY);
    if (savedCompanyLogo) {
      setCompanyLogo(savedCompanyLogo);
    }

    const savedShowNotes = localStorage.getItem(STORAGE_SHOW_NOTES_KEY);
    if (savedShowNotes !== null) {
      setShowNotes(savedShowNotes === 'true');
    }

    const savedExportFilename = localStorage.getItem(STORAGE_EXPORT_FILENAME_KEY);
    if (savedExportFilename) {
      setExportFilename(savedExportFilename);
    }

    // Try to restore export file handle from IndexedDB
    const loadExportFile = async () => {
      try {
        const db = await openIndexedDB();
        const handle = await getFromIndexedDB(db, INDEXEDDB_EXPORT_FILE_KEY);
        if (handle) {
          // Verify we still have permission
          const permission = await (handle as FileSystemFileHandle).queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setExportFileHandle(handle as FileSystemFileHandle);
          }
        }
      } catch (error) {
        console.error('Failed to restore export file:', error);
      }
    };
    loadExportFile();

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

    // Load templates from IndexedDB and initialize default templates
    getAllTemplates()
      .then(async (templates) => {
        setStoredTemplates(templates);

        // Check if default templates exist, if not, load them
        const hasDefaultTable = templates.some(t => t.name === 'default_table');
        const hasDefaultBigTable = templates.some(t => t.name === 'default_big_table');

        let templatesUpdated = false;

        if (!hasDefaultTable) {
          try {
            const response = await fetch('/default_table.html');
            if (response.ok) {
              const html = await response.text();
              const defaultTemplate = {
                name: 'default_table',
                html,
                timestamp: Date.now(),
              };
              await saveTemplate(defaultTemplate);
              templatesUpdated = true;
            }
          } catch (error) {
            console.error('Failed to load default_table template:', error);
          }
        }

        if (!hasDefaultBigTable) {
          try {
            const response = await fetch('/default_big_table.html');
            if (response.ok) {
              const html = await response.text();
              const defaultBigTemplate = {
                name: 'default_big_table',
                html,
                timestamp: Date.now(),
              };
              await saveTemplate(defaultBigTemplate);
              templatesUpdated = true;
            }
          } catch (error) {
            console.error('Failed to load default_big_table template:', error);
          }
        }

        // Reload templates if any were added
        if (templatesUpdated) {
          const updatedTemplates = await getAllTemplates();
          setStoredTemplates(updatedTemplates);
        }
      })
      .catch((error) => {
        console.error('Failed to load templates from IndexedDB:', error);
      });
  }, []);

  // Load and inject custom CSS on mount
  useEffect(() => {
    const loadAndInjectCSS = async () => {
      let customCSS = localStorage.getItem('presentation-custom-css');

      // If no CSS in LocalStorage, try to load from public/custom-styles.css
      if (!customCSS) {
        try {
          const response = await fetch('/custom-styles.css');
          if (response.ok) {
            customCSS = await response.text();
            // Save to LocalStorage for future use
            localStorage.setItem('presentation-custom-css', customCSS);
          }
        } catch (error) {
          console.log('No custom-styles.css file found, using defaults');
        }
      }

      // Inject CSS if available
      if (customCSS) {
        let styleTag = document.getElementById('custom-presentation-styles') as HTMLStyleElement;
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'custom-presentation-styles';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = customCSS;
      }
    };

    loadAndInjectCSS();
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

  // Save beamer mode to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_BEAMER_MODE_KEY, isBeamerMode.toString());
  }, [isBeamerMode]);

  // Save beamer resolution to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_BEAMER_RESOLUTION_KEY, beamerResolution);
  }, [beamerResolution]);

  // Save company logo to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_COMPANY_LOGO_KEY, companyLogo);
  }, [companyLogo]);

  // Save show notes state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_SHOW_NOTES_KEY, showNotes.toString());
  }, [showNotes]);

  // Save export filename to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_EXPORT_FILENAME_KEY, exportFilename);
  }, [exportFilename]);

  // Save export file handle to IndexedDB
  useEffect(() => {
    if (exportFileHandle) {
      const saveHandle = async () => {
        try {
          const db = await openIndexedDB();
          await saveToIndexedDB(db, INDEXEDDB_EXPORT_FILE_KEY, exportFileHandle);
        } catch (error) {
          console.error('Failed to save export file:', error);
        }
      };
      saveHandle();
    }
  }, [exportFileHandle]);

  // Save current slide to LocalStorage for preview window sync
  useEffect(() => {
    localStorage.setItem(STORAGE_CURRENT_SLIDE_KEY, currentSlide.toString());
  }, [currentSlide]);

  useEffect(() => {
    const parsedSlides = parseSlides(markdown);
    setSlides(parsedSlides);
    if (currentSlide >= parsedSlides.length && parsedSlides.length > 0) {
      setCurrentSlide(parsedSlides.length - 1);
    }
  }, [markdown]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync notesValue when currentSlide or slides change
  useEffect(() => {
    setNotesValue(slides[currentSlide]?.notes ?? '');
  }, [currentSlide, slides]);

  const handleNotesChange = (value: string) => {
    const textarea = textareaRef.current;
    const selStart = textarea?.selectionStart ?? null;
    const selEnd = textarea?.selectionEnd ?? null;

    const currentSlideData = slides[currentSlide];
    if (!currentSlideData) return;

    // Build new full markdown by replacing the current slide's rawMarkdown with updated notes
    const slideDelimiter = '---';
    const parts = markdown.split(/^---$/m);
    // Find the matching part for the current slide (non-empty parts map to slides)
    const nonEmptyIndices: number[] = [];
    parts.forEach((part, i) => {
      if (part.trim().length > 0) nonEmptyIndices.push(i);
    });
    const partIndex = nonEmptyIndices[currentSlide];
    if (partIndex === undefined) return;

    const updatedSlideContent = setNotes(currentSlideData.rawMarkdown, value);
    const newParts = [...parts];
    newParts[partIndex] = updatedSlideContent;
    const newMarkdown = newParts.join(slideDelimiter);

    setMarkdown(newMarkdown);

    // Restore cursor position after React re-render
    if (textarea && selStart !== null && selEnd !== null) {
      setTimeout(() => {
        textarea.setSelectionRange(selStart, selEnd);
      }, 0);
    }
  };

  // Extract slide info for navigation
  const slideInfos = useMemo(() => extractSlideInfo(markdown, slides), [markdown, slides]);

  // Jump to slide in editor
  const handleJumpToSlide = useCallback((slideIndex: number, position: number) => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Set cursor position
      textarea.focus();
      textarea.setSelectionRange(position, position);

      // Scroll to position - show slide at the top with small offset
      const lineHeight = 20; // Approximate line height
      const lines = markdown.substring(0, position).split('\n').length;
      const scrollTop = Math.max(0, (lines - 2) * lineHeight); // -2 lines for small top padding
      textarea.scrollTop = scrollTop;
    }

    // Update current slide in preview
    setCurrentSlide(slideIndex);
  }, [markdown]);

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
          content: await renderMarkdownToHTML(slide.content),
        }))
      );

      const theme = getTheme(selectedTheme);
      const fontSize = fontSizes.find((s) => s.id === selectedFontSize) || fontSizes[2];

      await exportToPDF({
        slides: slidesWithHTML,
        theme,
        fontSize,
        uploadedImages,
        author,
        companyLogo,
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

  const handleExportMarkdown = async () => {
    try {
      // Check if File System Access API is supported
      if ('showSaveFilePicker' in window) {
        let fileHandle = exportFileHandle;

        // Check if we have a saved file handle with permission
        if (fileHandle) {
          try {
            const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
              const newPermission = await fileHandle.requestPermission({ mode: 'readwrite' });
              if (newPermission !== 'granted') {
                fileHandle = null; // Need to ask for new file
              }
            }
          } catch (error) {
            // Handle might be invalid, ask for new file
            fileHandle = null;
          }
        }

        // If no file handle or permission denied, show save picker
        if (!fileHandle) {
          fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: exportFilename,
            startIn: 'documents',
            types: [
              {
                description: 'Markdown Files',
                accept: { 'text/markdown': ['.md'] },
              },
            ],
          });
          setExportFileHandle(fileHandle);
          // Update filename from what user chose
          setExportFilename(fileHandle.name);
        }

        // Write to file
        const writable = await fileHandle.createWritable();
        await writable.write(markdown);
        await writable.close();

        alert(`Datei gespeichert: ${fileHandle.name}`);
      } else {
        // Fallback to traditional download
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return;
      }
      console.error('Export failed:', error);
      alert('Export fehlgeschlagen: ' + error.message);
    }
  };

  const handleChangeExportLocation = async () => {
    try {
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: exportFilename,
          startIn: 'documents',
          types: [
            {
              description: 'Markdown Files',
              accept: { 'text/markdown': ['.md'] },
            },
          ],
        });
        setExportFileHandle(fileHandle);
        setExportFilename(fileHandle.name);
        alert(`Speicherort ausgewählt: ${fileHandle.name}`);
      } else {
        alert('Diese Funktion wird von Ihrem Browser nicht unterstützt.');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Failed to select file:', error);
      alert('Speicherort-Auswahl fehlgeschlagen: ' + error.message);
    }
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

  const handleLoadStaticTemplate = async (name: string, label: string) => {
    if (markdown.trim() && !confirm(`Aktuelles Markdown durch "${label}" ersetzen?`)) {
      return;
    }
    try {
      const response = await fetch(`/templates/${name}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setMarkdown(await response.text());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load template:', error);
      alert(`Template "${label}" konnte nicht geladen werden: ${message}`);
    }
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

    setOpenMenu(null);
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

    setOpenMenu(null);
  };

  const handleInsertBigNumberedTable = () => {
    const bigNumberedTableTemplate = `\n\n<table class="big-table-numbered">
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

      const newText = text.substring(0, start) + bigNumberedTableTemplate + text.substring(end);
      setMarkdown(newText);

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + bigNumberedTableTemplate.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      setMarkdown((prev) => prev + bigNumberedTableTemplate);
    }

    setOpenMenu(null);
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

  const handleInsertBackgroundImageFromLibrary = (filename: string) => {
    const bgComment = `<!--bg: ${filename}-->`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const text = textarea.value;

      // Find the start of the current slide (or beginning of document)
      const beforeCursor = text.substring(0, start);
      const lastSlideBreak = beforeCursor.lastIndexOf('---');
      const slideStart = lastSlideBreak === -1 ? 0 : lastSlideBreak + 3;

      // Insert at the beginning of the current slide
      const newText = text.substring(0, slideStart) + '\n' + bgComment + '\n' + text.substring(slideStart);
      setMarkdown(newText);

      // Move cursor back to where it was (adjusted for inserted text)
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + bgComment.length + 2; // +2 for the newlines
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Fallback: prepend to beginning
      setMarkdown(bgComment + '\n' + markdown);
    }
  };

  const handleInsertProductLogoFromLibrary = (filename: string) => {
    const logoComment = `<!--product-logo: ${filename}-->`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const text = textarea.value;

      // Find the start of the current slide (or beginning of document)
      const beforeCursor = text.substring(0, start);
      const lastSlideBreak = beforeCursor.lastIndexOf('---');
      const slideStart = lastSlideBreak === -1 ? 0 : lastSlideBreak + 3;

      // Insert at the beginning of the current slide
      const newText = text.substring(0, slideStart) + '\n' + logoComment + '\n' + text.substring(slideStart);
      setMarkdown(newText);

      // Move cursor back to where it was (adjusted for inserted text)
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + logoComment.length + 2; // +2 for the newlines
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Fallback: prepend to beginning
      setMarkdown(logoComment + '\n' + markdown);
    }
  };

  const handleReloadImages = async () => {
    try {
      const images = await getAllImages();
      setUploadedImages(images);
      // Trigger sync for preview window
      localStorage.setItem(STORAGE_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to reload images:', error);
    }
  };

  const handleInsertTemplateFromLibrary = (html: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      // Insert at cursor position with newlines
      const templateWithNewlines = `\n\n${html}\n\n`;
      const newText = text.substring(0, start) + templateWithNewlines + text.substring(end);
      setMarkdown(newText);

      // Set cursor position after inserted template
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + templateWithNewlines.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Fallback: append to end
      setMarkdown((prev) => prev + '\n\n' + html + '\n\n');
    }
  };

  const handleReloadTemplates = async () => {
    try {
      const templates = await getAllTemplates();
      setStoredTemplates(templates);
    } catch (error) {
      console.error('Failed to reload templates:', error);
    }
  };

  const handleWrapBoldColored = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      if (selectedText) {
        const wrappedText = `<span style="font-weight: bold; color: ${selectedTextColor}">${selectedText}</span>`;
        const newText = text.substring(0, start) + wrappedText + text.substring(end);
        setMarkdown(newText);

        // Set cursor after the wrapped text
        setTimeout(() => {
          textarea.focus();
          const newPosition = start + wrappedText.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    }
  };

  const handleInsertColumns = () => {
    const columns = Array.from({ length: columnCount }, (_, i) =>
      `  <div style="flex: 1">\n    Spalte ${i + 1}\n  </div>`
    ).join('\n');

    const columnsTemplate = `\n\n<div style="display: flex; gap: 20px;">\n${columns}\n</div>\n\n`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const newText = text.substring(0, start) + columnsTemplate + text.substring(end);
      setMarkdown(newText);

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + columnsTemplate.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      setMarkdown((prev) => prev + columnsTemplate);
    }

    setOpenMenu(null);
  };

  const handleTogglePreviewWindow = () => {
    if (isPreviewWindowOpen) {
      // Close the preview window
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        previewWindowRef.current.close();
      }
      previewWindowRef.current = null;
      setIsPreviewWindowOpen(false);
    } else {
      // Open preview in new window, as large as the screen allows
      const previewWindow = window.open(
        '/preview',
        'presentation-preview',
        `width=${window.screen.availWidth},height=${window.screen.availHeight},menubar=no,toolbar=no,location=no,status=no`
      );

      if (previewWindow) {
        previewWindowRef.current = previewWindow;
        setIsPreviewWindowOpen(true);

        // Check if window gets closed by user
        const checkWindowClosed = setInterval(() => {
          if (previewWindowRef.current?.closed) {
            clearInterval(checkWindowClosed);
            setIsPreviewWindowOpen(false);
            previewWindowRef.current = null;
          }
        }, 1000);
      }
    }
  };

  const handleOpenDeckPreview = () => {
    if (deckPreviewWindowRef.current && !deckPreviewWindowRef.current.closed) {
      deckPreviewWindowRef.current.focus();
      return;
    }
    deckPreviewWindowRef.current = window.open(
      '/preview-deck',
      'presentation-deck-preview',
      `width=${window.screen.availWidth},height=${window.screen.availHeight},menubar=no,toolbar=no,location=no,status=no`
    );
  };

  // Clean up preview windows on unmount
  useEffect(() => {
    return () => {
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        previewWindowRef.current.close();
      }
      if (deckPreviewWindowRef.current && !deckPreviewWindowRef.current.closed) {
        deckPreviewWindowRef.current.close();
      }
    };
  }, []);

  // Follow slide navigation done in preview windows (storage events
  // only fire in other windows, so this never loops back on our own writes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_CURRENT_SLIDE_KEY && e.newValue !== null) {
        const slideNum = parseInt(e.newValue, 10);
        if (!isNaN(slideNum)) {
          setCurrentSlide(slideNum);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (openMenu && !target.closest('.toolbar-menu')) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenu]);

  // Keyboard shortcuts
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

      // Cmd+G or Ctrl+G to open Go to Slide dialog
      if (
        e.key === 'g' &&
        (e.metaKey || e.ctrlKey) &&
        !isPresentationMode &&
        slides.length > 0
      ) {
        e.preventDefault();
        setShowGoToDialog(true);
      }

      // Escape to close Go to Slide dialog
      if (e.key === 'Escape' && showGoToDialog) {
        e.preventDefault();
        setShowGoToDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, slides.length, handleStartPresentation, showGoToDialog]);

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
        companyLogo={companyLogo}
      />
    );
  }

  const menuItemClass =
    'w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white transition-colors';

  const renderMenuButton = (id: string, label: string) => (
    <button
      onClick={() => setOpenMenu(openMenu === id ? null : id)}
      className={`px-3 py-1 rounded text-sm transition-colors ${
        openMenu === id ? 'bg-gray-600' : 'hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Slide Navigator */}
      <SlideNavigator
        slides={slideInfos}
        currentSlide={currentSlide}
        onSlideClick={handleJumpToSlide}
        isCollapsed={isNavigatorCollapsed}
        onToggleCollapse={() => setIsNavigatorCollapsed(!isNavigatorCollapsed)}
      />

      {/* Editor Column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Global Toolbar */}
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-1 flex-wrap">
          {/* Datei */}
          <div className="relative toolbar-menu">
            {renderMenuButton('datei', 'Datei')}
            {openMenu === 'datei' && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[280px]">
                <label
                  htmlFor="markdown-import"
                  onClick={() => setOpenMenu(null)}
                  className={`${menuItemClass} block cursor-pointer`}
                  title="Markdown-Datei importieren"
                >
                  📂 Markdown importieren…
                </label>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    handleExportMarkdown();
                  }}
                  className={`${menuItemClass} border-t border-gray-600`}
                  title="Markdown-Datei exportieren"
                >
                  💾 Markdown exportieren
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    handleExportPDF();
                  }}
                  disabled={slides.length === 0 || isExporting}
                  className={`${menuItemClass} border-t border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Als PDF exportieren"
                >
                  📄 PDF exportieren
                </button>
                <div className="p-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Export-Einstellungen</div>
                  <label className="text-xs text-gray-300 block mb-1">Dateiname:</label>
                  <input
                    type="text"
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-gray-400"
                    placeholder="presentation.md"
                  />
                  {hasFileSystemAPI ? (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-400">
                        {exportFileHandle ? `💾 ${exportFileHandle.name}` : '💾 Noch kein Speicherort'}
                      </span>
                      <button
                        onClick={handleChangeExportLocation}
                        className="px-2 py-1 bg-indigo-600 rounded hover:bg-indigo-500 text-xs transition-colors"
                      >
                        Speicherort wählen
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 pt-2">
                      ℹ️ Ihr Browser unterstützt keine Dateiauswahl. Datei wird heruntergeladen.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Einfügen */}
          <div className="relative toolbar-menu">
            {renderMenuButton('einfuegen', 'Einfügen')}
            {openMenu === 'einfuegen' && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[260px]">
                <button onClick={() => handleInsertTable(true)} className={menuItemClass}>
                  Tabelle mit Kopfzeile
                </button>
                <button
                  onClick={() => handleInsertTable(false)}
                  className={`${menuItemClass} border-t border-gray-600`}
                >
                  Tabelle ohne Kopfzeile
                </button>
                <button
                  onClick={handleInsertNumberedTable}
                  className={`${menuItemClass} border-t border-gray-600`}
                >
                  🔢 Nummerierte Tabelle
                </button>
                <button
                  onClick={handleInsertBigNumberedTable}
                  className={`${menuItemClass} border-t border-gray-600`}
                >
                  🔢 Große nummerierte Tabelle
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setShowImageLibrary(true);
                  }}
                  className={`${menuItemClass} border-t border-gray-600`}
                  title="Bild-Bibliothek öffnen"
                >
                  🖼️ Bild aus Bibliothek…
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setShowTemplateLibrary(true);
                  }}
                  className={`${menuItemClass} border-t border-gray-600`}
                  title="HTML-Templates verwalten"
                >
                  📋 HTML-Template…
                </button>
                <div className="p-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Spalten einfügen</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={columnCount}
                      onChange={(e) => setColumnCount(Number(e.target.value))}
                      className="bg-gray-600 text-white px-2 py-1 rounded text-xs border border-gray-500 focus:outline-none focus:border-gray-400"
                      title="Anzahl der Spalten"
                    >
                      <option value="2">2 Spalten</option>
                      <option value="3">3 Spalten</option>
                      <option value="4">4 Spalten</option>
                      <option value="5">5 Spalten</option>
                    </select>
                    <button
                      onClick={handleInsertColumns}
                      className="px-3 py-1 bg-indigo-600 rounded hover:bg-indigo-500 text-sm text-white transition-colors"
                    >
                      📑 Einfügen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Format */}
          <div className="relative toolbar-menu">
            {renderMenuButton('format', 'Format')}
            {openMenu === 'format' && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[260px]">
                <div className="p-3">
                  <div className="text-xs text-gray-400 mb-2">Text formatieren</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleWrapBoldColored}
                      className="px-3 py-1 rounded hover:opacity-80 text-sm font-bold transition-colors text-white"
                      style={{ backgroundColor: selectedTextColor }}
                      title="Markierten Text fett und farbig formatieren"
                    >
                      🎨 Bold
                    </button>
                    <select
                      value={selectedTextColor}
                      onChange={(e) => setSelectedTextColor(e.target.value)}
                      className="bg-gray-600 text-white px-2 py-1 rounded text-xs border border-gray-500 focus:outline-none focus:border-gray-400"
                      title="Textfarbe auswählen"
                    >
                      {grassColors.map((item) => (
                        <option key={item.color} value={item.color}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setShowCustomCSSEditor(true);
                  }}
                  className={`${menuItemClass} border-t border-gray-600`}
                  title="CSS-Templates bearbeiten"
                >
                  🎨 Custom-CSS bearbeiten…
                </button>
              </div>
            )}
          </div>

          {/* Decks */}
          <div className="relative toolbar-menu">
            {renderMenuButton('decks', 'Decks')}
            {openMenu === 'decks' && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[280px]">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    handleLoadStaticTemplate('update-ai-deck.md', 'Update AI (Gesamtdeck)');
                  }}
                  className={menuItemClass}
                  title="Update AI @ msg life — Gesamtpräsentation, 4 Kapitel (Topic 4 fertig, 1–3 in Arbeit)"
                >
                  🗂️ Update AI (Gesamtdeck)
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    handleLoadStaticTemplate('policy-admin-contracts.md', 'PAS Vertragsstrukturen');
                  }}
                  className={`${menuItemClass} border-t border-gray-600`}
                  title="PAS-Vertragsstruktur-Diagramme laden (aus policy-admin generiert)"
                >
                  📐 PAS-Demo
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    handleLoadStaticTemplate('gamma-lab-vorgehen.md', 'gamma-lab Vorgehen');
                  }}
                  className={`${menuItemClass} border-t border-gray-600`}
                  title="gamma-lab Vorgehen & Architektur (aus docs/zielbild.md generiert)"
                >
                  𝛄-lab Vorgehen
                </button>
              </div>
            )}
          </div>

          {/* Einstellungen */}
          <div className="relative toolbar-menu">
            {renderMenuButton('einstellungen', 'Einstellungen')}
            {openMenu === 'einstellungen' && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[320px] p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="theme-select" className="text-sm font-medium">
                    Theme:
                  </label>
                  <select
                    id="theme-select"
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400 text-sm w-44"
                  >
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="author-input" className="text-sm font-medium">
                    Autor:
                  </label>
                  <input
                    id="author-input"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Dein Name"
                    className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400 text-sm w-44"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="company-logo-select" className="text-sm font-medium">
                    Firmenlogo:
                  </label>
                  <select
                    id="company-logo-select"
                    value={companyLogo}
                    onChange={(e) => setCompanyLogo(e.target.value)}
                    className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400 text-sm w-44"
                  >
                    <option value="">Kein Logo</option>
                    {uploadedImages.map((img) => (
                      <option key={img.name} value={img.name}>
                        {img.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="fontsize-select" className="text-sm font-medium">
                    Schriftgröße:
                  </label>
                  <select
                    id="fontsize-select"
                    value={selectedFontSize}
                    onChange={(e) => setSelectedFontSize(e.target.value)}
                    className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400 text-sm w-44"
                  >
                    {fontSizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="border-t border-gray-600 pt-3 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={isBeamerMode}
                      onChange={(e) => setIsBeamerMode(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="font-medium">Beamer-Modus (16:9)</span>
                  </label>
                  {isBeamerMode && (
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="resolution-select" className="text-sm font-medium">
                        Auflösung:
                      </label>
                      <select
                        id="resolution-select"
                        value={beamerResolution}
                        onChange={(e) => setBeamerResolution(e.target.value)}
                        className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:outline-none focus:border-gray-400 text-sm w-44"
                      >
                        <option value="1920x1080">1920×1080 (Full HD)</option>
                        <option value="1280x720">1280×720 (HD)</option>
                        <option value="1024x768">1024×768 (XGA)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hilfe */}
          <div className="relative toolbar-menu">
            {renderMenuButton('hilfe', 'Hilfe')}
            {openMenu === 'hilfe' && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[260px]">
                <a
                  href="/benutzerhandbuch.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMenu(null)}
                  className={`${menuItemClass} block`}
                  title="Benutzerhandbuch öffnen"
                >
                  📖 Benutzerhandbuch
                </a>
                <a
                  href="/mermaid-hilfe.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMenu(null)}
                  className={`${menuItemClass} block border-t border-gray-600`}
                  title="Mermaid Diagramm Dokumentation öffnen"
                >
                  📊 Mermaid Hilfe
                </a>
                <div className="p-3 border-t border-gray-600 text-xs text-gray-400 flex flex-col gap-1">
                  <span className="font-medium text-gray-300">Tastenkürzel</span>
                  <span>F = Präsentieren</span>
                  <span>⌘G = Gehe zu Folie</span>
                  <span>← / → = Navigation (Vorschau)</span>
                  <span>ESC = Präsentation beenden</span>
                </div>
              </div>
            )}
          </div>

          <input
            id="markdown-import"
            type="file"
            accept=".md,.markdown"
            onChange={handleImportMarkdown}
            className="hidden"
          />

          <div className="flex-1" />

          {/* Status + primary actions, always visible */}
          {exportProgress && (
            <span className="text-xs text-blue-300 whitespace-nowrap">{exportProgress}</span>
          )}
          <span className="text-sm text-gray-400 whitespace-nowrap mr-1">
            {slides.length} Folie{slides.length !== 1 ? 'n' : ''}
          </span>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              showNotes ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={showNotes ? 'Notizen ausblenden' : 'Notizen einblenden'}
          >
            📝 Notizen
          </button>
          <button
            onClick={handleExportPDF}
            disabled={slides.length === 0 || isExporting}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            title="Als PDF exportieren"
          >
            {isExporting ? '⏳ Exportiere…' : '📄 PDF'}
          </button>
          <button
            onClick={handleTogglePreviewWindow}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isPreviewWindowOpen
                ? 'bg-orange-600 hover:bg-orange-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
            title={
              isPreviewWindowOpen
                ? 'Vorschau-Fenster schließen'
                : 'Aktuelle Folie in eigenem Fenster anzeigen (folgt dem Editor)'
            }
          >
            {isPreviewWindowOpen ? '🪟 Vorschau schließen' : '🪟 Folien-Vorschau'}
          </button>
          <button
            onClick={handleOpenDeckPreview}
            disabled={slides.length === 0}
            className="px-3 py-1 bg-purple-700 rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            title="Alle Folien scrollbar in eigenem Fenster anzeigen"
          >
            🎞️ Deck-Vorschau
          </button>
          <button
            onClick={handleStartPresentation}
            disabled={slides.length === 0}
            className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            title="Präsentationsmodus starten (F)"
          >
            🎬 Präsentieren
          </button>
        </div>

        {/* Markdown Editor */}
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="flex-1 p-6 font-mono text-sm resize-none focus:outline-none bg-gray-900 text-gray-100"
          placeholder="Schreibe dein Markdown hier... Trenne Folien mit ---"
          spellCheck={false}
        />

        {/* Notes Editor */}
        {showNotes && (
          <div
            className="border-t border-gray-700 bg-gray-850 flex flex-col"
            style={{ minHeight: '120px', maxHeight: '200px' }}
          >
            <div className="bg-gray-700 px-4 py-1 text-xs font-medium text-gray-300 flex items-center gap-2">
              <span>
                📝 Notizen (Folie {currentSlide + 1}/{slides.length})
              </span>
              {slides[currentSlide]?.chapterTitle && (
                <span className="text-blue-400">• {slides[currentSlide].chapterTitle}</span>
              )}
              <span className="flex-1" />
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="px-2 py-0.5 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Vorherige Folie"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                disabled={currentSlide === slides.length - 1}
                className="px-2 py-0.5 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Nächste Folie"
              >
                →
              </button>
            </div>
            <textarea
              value={notesValue}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="flex-1 p-3 font-sans text-sm resize-none focus:outline-none bg-gray-800 text-gray-200 placeholder-gray-500"
              placeholder="Notizen für diese Folie…"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Image Library Modal */}
      {showImageLibrary && (
        <ImageLibrary
          images={uploadedImages}
          onClose={() => setShowImageLibrary(false)}
          onInsertImage={handleInsertImageFromLibrary}
          onInsertBackgroundImage={handleInsertBackgroundImageFromLibrary}
          onInsertProductLogo={handleInsertProductLogoFromLibrary}
          onImagesChanged={handleReloadImages}
        />
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <TemplateLibrary
          templates={storedTemplates}
          onClose={() => setShowTemplateLibrary(false)}
          onInsertTemplate={handleInsertTemplateFromLibrary}
          onTemplatesChanged={handleReloadTemplates}
        />
      )}

      {/* Custom CSS Editor Modal */}
      {showCustomCSSEditor && (
        <CustomCSSEditor
          onClose={() => setShowCustomCSSEditor(false)}
        />
      )}

      {/* Go to Slide Dialog */}
      {showGoToDialog && (
        <GoToSlideDialog
          slides={slideInfos}
          onClose={() => setShowGoToDialog(false)}
          onSlideSelect={handleJumpToSlide}
        />
      )}
    </div>
  );
}
