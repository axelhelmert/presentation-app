'use client';

import { useEffect, useState } from 'react';
import { renderMarkdownToHTML } from '@/lib/markdown';
import 'katex/dist/katex.min.css';

interface SlidePreviewProps {
  markdown: string;
  slideNumber: number;
  totalSlides: number;
}

export default function SlidePreview({
  markdown,
  slideNumber,
  totalSlides,
}: SlidePreviewProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    const render = async () => {
      try {
        const rendered = await renderMarkdownToHTML(markdown);
        setHtml(rendered);
      } catch (error) {
        console.error('Error rendering markdown:', error);
        setHtml('<p class="text-red-500">Error rendering slide</p>');
      }
    };
    render();
  }, [markdown]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex-1 overflow-auto p-12">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-between items-center text-sm text-gray-600">
        <span>
          Slide {slideNumber} / {totalSlides}
        </span>
      </div>
    </div>
  );
}
