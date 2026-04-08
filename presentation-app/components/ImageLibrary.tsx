'use client';

import React, { useState } from 'react';
import { StoredImage, deleteImage, saveImage } from '@/lib/imageStorage';

interface ImageLibraryProps {
  images: StoredImage[];
  onClose: () => void;
  onInsertImage: (filename: string) => void;
  onImagesChanged: () => void;
}

export default function ImageLibrary({
  images,
  onClose,
  onInsertImage,
  onImagesChanged,
}: ImageLibraryProps) {
  const [isUploading, setIsUploading] = useState(false);

  const compressImage = (
    dataUrl: string,
    maxWidth: number = 1920,
    quality: number = 0.85
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const originalDataUrl = e.target?.result as string;

        try {
          const compressedDataUrl = await compressImage(originalDataUrl);

          const newImage: StoredImage = {
            name: file.name,
            dataUrl: compressedDataUrl,
            timestamp: Date.now(),
          };

          await saveImage(newImage);
          onImagesChanged();
        } catch (error) {
          console.error('Failed to save image:', error);
          alert('Fehler beim Speichern des Bildes.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleDelete = async (name: string) => {
    if (confirm(`Bild "${name}" wirklich löschen?`)) {
      try {
        await deleteImage(name);
        onImagesChanged();
      } catch (error) {
        console.error('Failed to delete image:', error);
        alert('Fehler beim Löschen des Bildes.');
      }
    }
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
          <h2 className="text-xl font-semibold">📚 Bild-Bibliothek</h2>
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
            htmlFor="library-upload"
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 cursor-pointer inline-block ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? '⏳ Lädt...' : '➕ Neues Bild hochladen'}
          </label>
          <input
            id="library-upload"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
          <span className="ml-4 text-sm text-gray-600">
            {images.length} {images.length === 1 ? 'Bild' : 'Bilder'} gespeichert
          </span>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-auto p-6">
          {images.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Keine Bilder vorhanden</p>
              <p className="text-sm mt-2">Lade ein Bild hoch, um zu beginnen</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.name}
                  className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow hover:shadow-lg transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate" title={image.name}>
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(image.timestamp)}
                    </p>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          onInsertImage(image.name);
                          onClose();
                        }}
                        className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500"
                      >
                        Einfügen
                      </button>
                      <button
                        onClick={() => handleDelete(image.name)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500"
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
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
