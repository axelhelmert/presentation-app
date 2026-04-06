'use client';

import { useEffect, useState } from 'react';
import { renderMarkdownToHTML } from '@/lib/markdown';
import { getTheme, fontSizes } from '@/lib/themes';
import 'katex/dist/katex.min.css';

interface SlidePreviewProps {
  markdown: string;
  slideNumber: number;
  totalSlides: number;
  themeId?: string;
  fontSizeId?: string;
}

export default function SlidePreview({
  markdown,
  slideNumber,
  totalSlides,
  themeId = 'default',
  fontSizeId = 'large',
}: SlidePreviewProps) {
  const [html, setHtml] = useState<string>('');
  const theme = getTheme(themeId);
  const fontSize = fontSizes.find((s) => s.id === fontSizeId) || fontSizes[2];

  useEffect(() => {
    const render = async () => {
      try {
        const rendered = await renderMarkdownToHTML(markdown);
        setHtml(rendered);
      } catch (error) {
        console.error('Error rendering markdown:', error);
        setHtml('<p style="color: red;">Error rendering slide</p>');
      }
    };
    render();
  }, [markdown]);

  const containerStyle: React.CSSProperties = {
    background: theme.background,
    borderColor: theme.borderColor,
    color: theme.textColor,
    // CSS Variables for theme colors
    ['--theme-text' as any]: theme.textColor,
    ['--theme-heading' as any]: theme.headingColor,
    ['--theme-accent' as any]: theme.accentColor,
    ['--theme-code-bg' as any]: theme.codeBackground,
  };

  const contentStyle: React.CSSProperties = {
    fontSize: fontSize.size,
    lineHeight: fontSize.lineHeight,
  };

  return (
    <div
      className="w-full h-full flex flex-col rounded-lg shadow-lg overflow-hidden border slide-container"
      style={containerStyle}
    >
      <div className="flex-1 overflow-auto p-12">
        <div
          className="prose max-w-none"
          style={contentStyle}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div
        className="border-t px-6 py-3 flex justify-between items-center text-sm opacity-70"
        style={{ borderColor: theme.borderColor }}
      >
        <span>
          Slide {slideNumber} / {totalSlides}
        </span>
      </div>
    </div>
  );
}
