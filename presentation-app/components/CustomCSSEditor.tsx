'use client';

import React, { useState, useEffect } from 'react';

interface CustomCSSEditorProps {
  onClose: () => void;
}

const STANDARD_TEMPLATES = `/* ===== Standard Table Templates ===== */
/* Basis-Styles für nummerierte Tabellen */

.prose .table-numbered {
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  border-collapse: collapse;
  font-family: sans-serif;
}

.prose .table-numbered td {
  border-bottom: 1px solid #ddd;
  padding: 20px;
  vertical-align: top;
}

/* Numbered column: Large numbering */
.prose .num-col {
  width: 160px;
  font-size: 5rem;
  font-weight: bold;
  color: #333;
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
  color: #999;
  border-bottom: 0.5px solid #ddd;
}

/* Cell details with lists */
.prose .cell-details {
  font-size: 2rem;
  color: #555;
}

.prose .cell-details ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

/* ===== Eigene Anpassungen hier hinzufügen ===== */
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
        className="bg-white rounded-lg shadow-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
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

        {/* Info */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <p className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Die Standard-Templates werden beim ersten Öffnen angezeigt.
            Du kannst sie anpassen oder erweitern. Änderungen werden in LocalStorage gespeichert.
            Mit "Standards laden" kannst du jederzeit die Original-Templates wiederherstellen.
          </p>
        </div>

        {/* CSS Editor */}
        <div className="flex-1 overflow-hidden p-6">
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            className="w-full h-full font-mono text-sm border border-gray-300 rounded p-4 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="/* Eigene CSS-Regeln hier einfügen */"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-300 flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleLoadStandards}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
              title="Standard-Templates laden"
            >
              📋 Standards laden
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
              title="Alles zurücksetzen und Standards wiederherstellen"
            >
              🗑️ Zurücksetzen
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
            >
              {isSaving ? '✓ Gespeichert' : '💾 Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
