'use client';

import { useEffect, useState, useMemo } from 'react';
import { renderMarkdownToHTML } from '@/lib/markdown';
import { getTheme, fontSizes } from '@/lib/themes';
import { type StoredImage } from '@/lib/imageStorage';
import { extractMermaidBlocks, type MermaidBlock } from '@/lib/mermaidProcessor';
import MermaidDiagram from './MermaidDiagram';
import 'katex/dist/katex.min.css';

// Cache for rendered HTML to avoid re-rendering
const htmlCache = new Map<string, string>();

interface SlidePreviewProps {
  markdown: string;
  slideNumber: number;
  totalSlides: number;
  themeId?: string;
  fontSizeId?: string;
  uploadedImages?: StoredImage[];
  author?: string;
  backgroundImage?: string;
}

export default function SlidePreview({
  markdown,
  slideNumber,
  totalSlides,
  themeId = 'default',
  fontSizeId = 'large',
  uploadedImages = [],
  author = '',
  backgroundImage,
}: SlidePreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [mermaidBlocks, setMermaidBlocks] = useState<MermaidBlock[]>([]);
  const theme = getTheme(themeId);
  const fontSize = fontSizes.find((s) => s.id === fontSizeId) || fontSizes[2];
  const isTitleSlide = slideNumber === 1;

  // Find background image data URL
  const bgImageData = backgroundImage
    ? uploadedImages.find((img) => img.name === backgroundImage)
    : null;

  // Check if this slide is just an image (trim whitespace first)
  const trimmedMarkdown = markdown.trim();
  const imageMatch = trimmedMarkdown.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  const isImageSlide = !!imageMatch;

  // Find the matching image
  const foundImage = imageMatch
    ? uploadedImages.find((img) => img.name === imageMatch[2])
    : null;

  const imageUrl = foundImage?.dataUrl || null;


  // Process markdown with image URLs replaced and mermaid blocks extracted
  const { processedMarkdown, extractedMermaidBlocks } = useMemo(() => {
    if (isImageSlide) return { processedMarkdown: markdown, extractedMermaidBlocks: [] };

    // First, extract mermaid blocks
    const { processedMarkdown: withMermaidExtracted, mermaidBlocks } = extractMermaidBlocks(markdown);

    // Then replace image URLs
    let processed = withMermaidExtracted;
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(withMermaidExtracted)) !== null) {
      const filename = match[2];
      const foundImage = uploadedImages.find((img) => img.name === filename);

      if (foundImage) {
        processed = processed.replace(
          match[0],
          `![${match[1]}](${foundImage.dataUrl})`
        );
      }
    }

    return { processedMarkdown: processed, extractedMermaidBlocks: mermaidBlocks };
  }, [markdown, uploadedImages, isImageSlide, slideNumber]);

  useEffect(() => {
    // Skip HTML rendering for image-only slides
    if (isImageSlide) {
      setHtml('');
      setMermaidBlocks([]);
      return;
    }

    // Save mermaid blocks
    setMermaidBlocks(extractedMermaidBlocks);

    const render = async () => {
      try {
        // Include mermaid blocks count in cache key to invalidate cache when mermaid is added/removed
        const cacheKey = `${processedMarkdown}-mermaid:${extractedMermaidBlocks.length}`;
        const cached = htmlCache.get(cacheKey);

        if (cached) {
          setHtml(cached);
          return;
        }

        // Render and cache
        const rendered = await renderMarkdownToHTML(processedMarkdown);
        htmlCache.set(cacheKey, rendered);

        // Limit cache size to 50 entries
        if (htmlCache.size > 50) {
          const firstKey = htmlCache.keys().next().value;
          if (firstKey) {
            htmlCache.delete(firstKey);
          }
        }

        setHtml(rendered);
      } catch (error) {
        console.error('Error rendering markdown:', error);
        setHtml('<p style="color: red;">Error rendering slide</p>');
      }
    };
    render();
  }, [processedMarkdown, isImageSlide, extractedMermaidBlocks]);

  const containerStyle: React.CSSProperties = bgImageData?.dataUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bgImageData.dataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderColor: theme.borderColor,
        color: '#ffffff',
        // CSS Variables for theme colors
        ['--theme-text' as any]: '#ffffff',
        ['--theme-heading' as any]: '#ffffff',
        ['--theme-accent' as any]: '#ffffff',
        ['--theme-code-bg' as any]: 'rgba(255, 255, 255, 0.1)',
      }
    : {
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
      className="w-full h-full flex flex-col rounded-lg shadow-lg overflow-hidden border slide-container relative"
      style={containerStyle}
    >
      {/* Logo oben rechts */}
      <div className="absolute top-4 right-4 z-10">
        <img
          src="/msg-logo.png"
          alt="MSG Logo"
          className={`${isTitleSlide ? 'h-20' : 'h-10'} w-auto opacity-80`}
        />
      </div>

      <div className={`flex-1 overflow-auto pt-6 px-12 pb-12 ${isTitleSlide ? 'flex' : ''}`}>
        {isImageSlide && imageUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt={imageMatch?.[1] || 'Slide image'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <>
            <div
              className={`prose max-w-none ${isTitleSlide ? 'title-slide' : 'w-full'}`}
              style={isTitleSlide ? {
                ...contentStyle,
                fontSize: '1.65rem',
                textAlign: 'center',
                position: 'absolute',
                left: '25%',
                top: '33%',
                transform: 'translate(-50%, -50%)',
              } : contentStyle}
              dangerouslySetInnerHTML={{ __html: html }}
            />
            {/* Render Mermaid diagrams */}
            {mermaidBlocks.map((block) => (
              <MermaidDiagram
                key={block.id}
                id={block.id}
                chart={block.code}
                themeId={themeId}
                scale={block.scale}
              />
            ))}
          </>
        )}
      </div>
      <div
        className="border-t px-6 py-3 flex justify-between items-center text-base opacity-70"
        style={{ borderColor: theme.borderColor }}
      >
        <span>
          © {author || 'Author'}, {new Date().toLocaleString('en-US', { month: 'long' })} {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}
