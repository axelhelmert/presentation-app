'use client';

import React, { useState, useEffect } from 'react';

interface CustomCSSEditorProps {
  onClose: () => void;
}

const STANDARD_TEMPLATES = `/* ===== Standard Table Templates ===== */
/* Basis-Styles für nummerierte Tabellen */
/* Verwendet Theme-Variablen, damit sich Farben automatisch mit dem Theme ändern */

.prose .table-numbered {
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  border-collapse: collapse;
  font-family: sans-serif;
}

.prose .table-numbered td {
  border-bottom: 1px solid var(--theme-accent);
  padding: 20px;
  vertical-align: top;
}

/* Numbered column: Large numbering */
.prose .table-numbered .num-col {
  width: 160px !important;
  font-size: 5rem;
  font-weight: bold;
  color: var(--theme-heading);
  text-align: center;
  line-height: 1;
}

/* Content column */
.prose .content-col {
  display: flex;
  flex-direction: column;
}

/* Cell title with thin separator */
.prose .cell-title {
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  color: var(--theme-text);
  opacity: 0.7;
  border-bottom: 0.5px solid var(--theme-accent);
}

/* Cell details with lists */
.prose .cell-details {
  font-size: 2rem;
  color: var(--theme-text);
}

.prose .cell-details ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

/* ===== Big Table Variant (für Tabellen mit mehr Inhalt) ===== */
.prose .big-table-numbered {
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  border-collapse: collapse;
  font-family: sans-serif;
}

.prose .big-table-numbered td {
  border-bottom: 1px solid var(--theme-accent);
  padding: 20px;
  vertical-align: top;
}

.prose .big-table-numbered .num-col {
  width: 160px !important;
  font-size: 4rem;
  font-weight: bold;
  color: var(--theme-heading);
  text-align: center;
  line-height: 1;
}

.prose .big-table-numbered .content-col {
  display: flex;
  flex-direction: column;
}

.prose .big-table-numbered .cell-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  color: var(--theme-text);
  opacity: 0.7;
  border-bottom: 0.5px solid var(--theme-accent);
}

.prose .big-table-numbered .cell-details {
  font-size: 1.4rem;
  color: var(--theme-text);
}

.prose .big-table-numbered .cell-details ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

/* ===== Eigene Anpassungen hier hinzufügen ===== */
/* Verfügbare Theme-Variablen: */
/* --theme-text, --theme-heading, --theme-accent, --theme-code-bg */
`;

export default function CustomCSSEditor({ onClose }: CustomCSSEditorProps) {
  const [css, setCss] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Load from LocalStorage or use standard templates
    const savedCSS = localStorage.getItem('presentation-custom-css');
    if (savedCSS) {
      setCss(savedCSS);
    } else {
      setCss(STANDARD_TEMPLATES);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('presentation-custom-css', css);

    // Update the injected style tag
    let styleTag = document.getElementById('custom-presentation-styles') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-presentation-styles';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;

    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  const handleLoadStandards = () => {
    if (confirm('Standard-Templates laden? Ungespeicherte Änderungen gehen verloren.')) {
      setCss(STANDARD_TEMPLATES);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-styles.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/css' || file.name.endsWith('.css'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCss(content);
      };
      reader.readAsText(file);
    } else {
      alert('Bitte eine CSS-Datei auswählen (.css)');
    }
    event.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Alle eigenen CSS-Änderungen löschen und Standards wiederherstellen?')) {
      setCss(STANDARD_TEMPLATES);
      localStorage.removeItem('presentation-custom-css');
      const styleTag = document.getElementById('custom-presentation-styles');
      if (styleTag) {
        styleTag.remove();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-11/12 max-w-6xl h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">🎨 Custom CSS Styles</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Info & Actions */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
          <div className="flex justify-between items-center gap-4">
            <p className="text-xs text-blue-800 flex-shrink">
              Bearbeite hier oder extern mit 💾 Download / 📂 Upload
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
                title="CSS-Datei herunterladen"
              >
                💾 Download
              </button>
              <label
                htmlFor="css-upload"
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-sm cursor-pointer"
                title="CSS-Datei hochladen"
              >
                📂 Upload
              </label>
              <input
                id="css-upload"
                type="file"
                accept=".css,text/css"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* CSS Editor */}
        <div className="flex-1 overflow-hidden p-3">
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            className="w-full h-full font-mono text-sm border border-gray-300 rounded p-4 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="/* Eigene CSS-Regeln hier einfügen */"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-2 border-t border-gray-300 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleLoadStandards}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
              title="Standard-Templates laden"
            >
              📋 Standards laden
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500"
              title="Alles zurücksetzen und Standards wiederherstellen"
            >
              🗑️ Zurücksetzen
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500 disabled:opacity-50"
            >
              {isSaving ? '✓ Gespeichert' : '💾 Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
