'use client';

import React, { useState } from 'react';
import { StoredTemplate, deleteTemplate, saveTemplate } from '@/lib/templateStorage';

interface TemplateLibraryProps {
  templates: StoredTemplate[];
  onClose: () => void;
  onInsertTemplate: (html: string) => void;
  onTemplatesChanged: () => void;
}

export default function TemplateLibrary({
  templates,
  onClose,
  onInsertTemplate,
  onTemplatesChanged,
}: TemplateLibraryProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/html' || file.name.endsWith('.html'))) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const html = e.target?.result as string;

        try {
          // Use filename (without extension) as template name
          const name = file.name.replace(/\.html$/i, '');

          const newTemplate: StoredTemplate = {
            name,
            html,
            timestamp: Date.now(),
          };

          await saveTemplate(newTemplate);
          onTemplatesChanged();
        } catch (error) {
          console.error('Failed to save template:', error);
          alert('Fehler beim Speichern des Templates.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Bitte eine HTML-Datei auswählen (.html)');
    }
    event.target.value = '';
  };

  const handleDelete = async (name: string) => {
    if (confirm(`Template "${name}" wirklich löschen?`)) {
      try {
        await deleteTemplate(name);
        onTemplatesChanged();
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('Fehler beim Löschen des Templates.');
      }
    }
  };

  const handleDownload = (template: StoredTemplate) => {
    const blob = new Blob([template.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreview = (html: string) => {
    // Extract first 100 characters for preview
    const clean = html.replace(/<[^>]*>/g, ' ').trim();
    return clean.substring(0, 100) + (clean.length > 100 ? '...' : '');
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
          <h2 className="text-xl font-semibold">📋 Template-Bibliothek</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Upload Area */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
          <label
            htmlFor="template-upload"
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 cursor-pointer inline-block ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? '⏳ Lädt...' : '➕ HTML-Template hochladen'}
          </label>
          <input
            id="template-upload"
            type="file"
            accept=".html,text/html"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
          <span className="ml-4 text-sm text-gray-600">
            {templates.length} {templates.length === 1 ? 'Template' : 'Templates'} gespeichert
          </span>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-auto p-6">
          {templates.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Keine Templates vorhanden</p>
              <p className="text-sm mt-2">Lade eine HTML-Datei hoch, um zu beginnen</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className="border border-gray-300 rounded-lg p-4 bg-white shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Hochgeladen: {formatDate(template.timestamp)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 font-mono bg-gray-50 p-2 rounded">
                        {getPreview(template.html)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        onInsertTemplate(template.html);
                        onClose();
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                    >
                      ✓ Einfügen
                    </button>
                    <button
                      onClick={() => handleDownload(template)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                      title="Template herunterladen"
                    >
                      💾
                    </button>
                    <button
                      onClick={() => handleDelete(template.name)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                      title="Löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3 border-t border-gray-300 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
