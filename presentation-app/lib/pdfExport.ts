import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import mermaid from 'mermaid';
import { Slide, renderMarkdownToHTML } from './markdown';
import { Theme } from './themes';
import { type StoredImage } from './imageStorage';
import { extractMermaidBlocks } from './mermaidProcessor';

interface ExportOptions {
  slides: Slide[];
  theme: Theme;
  fontSize: { size: string; lineHeight: string };
  uploadedImages?: StoredImage[];
  author?: string;
  onProgress?: (current: number, total: number) => void;
}

export async function exportToPDF({
  slides,
  theme,
  fontSize,
  uploadedImages = [],
  author = '',
  onProgress,
}: ExportOptions): Promise<void> {
  if (slides.length === 0) {
    throw new Error('No slides to export');
  }

  // Create PDF in landscape mode (16:9 aspect ratio)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Use presentation dimensions (1920x1080)
  const slideWidth = 1920;
  const slideHeight = 1080;

  // Create a temporary container for rendering slides at presentation size
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${slideWidth}px`;
  container.style.height = `${slideHeight}px`;
  document.body.appendChild(container);

  // Load and inject custom CSS styles
  const customCSS = localStorage.getItem('presentation-custom-css');
  let styleElement: HTMLStyleElement | null = null;
  if (customCSS) {
    styleElement = document.createElement('style');
    styleElement.textContent = customCSS;
    document.head.appendChild(styleElement);
  }

  // Ensure KaTeX styles are loaded
  const katexLinkExists = !!document.querySelector('link[href*="katex"]');
  let katexLinkElement: HTMLLinkElement | null = null;
  if (!katexLinkExists) {
    katexLinkElement = document.createElement('link');
    katexLinkElement.rel = 'stylesheet';
    katexLinkElement.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css';
    document.head.appendChild(katexLinkElement);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Determine if theme is dark for Mermaid
  const isDarkTheme = ['dark', 'night', 'forest'].includes(theme.id || 'default');

  // Initialize Mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: isDarkTheme ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
    fontSize: 16,
    themeVariables: isDarkTheme ? {
      primaryColor: '#4a9eff',
      primaryTextColor: '#fff',
      primaryBorderColor: '#7CB9E8',
      lineColor: '#B0C4DE',
      secondaryColor: '#7CB9E8',
      tertiaryColor: '#333',
      background: '#1a1a1a',
      mainBkg: '#2a2a2a',
      secondBkg: '#3a3a3a',
      edgeLabelBackground: '#1a1a1a',
      textColor: '#ffffff',
      nodeBorder: '#7CB9E8',
      clusterBkg: '#2a2a2a',
      clusterBorder: '#7CB9E8',
      defaultLinkColor: '#B0C4DE',
      titleColor: '#ffffff',
      nodeTextColor: '#ffffff',
    } : {},
  });

  try {
    for (let i = 0; i < slides.length; i++) {
      if (onProgress) {
        onProgress(i + 1, slides.length);
      }

      const slide = slides[i];
      const isTitleSlide = i === 0;

      // Extract Mermaid blocks from raw markdown
      const { processedMarkdown, mermaidBlocks } = extractMermaidBlocks(slide.rawMarkdown);

      // Render markdown without Mermaid blocks to HTML
      let slideHTML = await renderMarkdownToHTML(processedMarkdown);

      // Replace image filenames with data URLs
      uploadedImages.forEach((img) => {
        const regex = new RegExp(`<img([^>]*)src=["']${img.name}["']([^>]*)>`, 'g');
        slideHTML = slideHTML.replace(regex, `<img$1src="${img.dataUrl}"$2>`);
      });

      // Find background image if specified
      const bgImageData = slide.backgroundImage
        ? uploadedImages.find((img) => img.name === slide.backgroundImage)
        : null;

      // Determine colors based on background image
      const textColor = bgImageData ? '#ffffff' : theme.textColor;
      const headingColor = bgImageData ? '#ffffff' : theme.headingColor;
      const accentColor = bgImageData ? '#ffffff' : theme.accentColor;
      const codeBg = bgImageData ? 'rgba(255, 255, 255, 0.1)' : theme.codeBackground;

      // Build background style
      const backgroundStyle = bgImageData?.dataUrl
        ? `background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bgImageData.dataUrl}); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : `background: ${theme.background};`;

      // Create slide content with exact presentation styling
      container.innerHTML = `
        <div class="slide-container" style="
          position: relative;
          width: 100%;
          height: 100%;
          ${backgroundStyle}
          border-color: ${theme.borderColor};
          color: ${textColor};
          --theme-text: ${textColor};
          --theme-heading: ${headingColor};
          --theme-accent: ${accentColor};
          --theme-code-bg: ${codeBg};
          display: flex;
          flex-direction: column;
        ">
          <!-- Logo -->
          <div style="position: absolute; top: 30px; right: 30px; z-index: 10;">
            <img src="/msg-logo.png" alt="MSG Logo" style="height: ${isTitleSlide ? '80px' : '48px'}; width: auto; opacity: 0.8;" />
          </div>

          <!-- Content -->
          <div class="content-wrapper" style="flex: 1; padding: ${isTitleSlide ? '0' : '60px 80px 20px 80px'};">
            <div class="prose max-w-none content-scaler" style="
              ${isTitleSlide ? `
                font-size: 2rem;
                text-align: center;
                position: absolute;
                left: 25%;
                top: 33%;
                transform: translate(-50%, -50%);
                width: 50%;
              ` : `
                font-size: ${fontSize.size};
                line-height: ${fontSize.lineHeight};
                width: 100%;
              `}
              color: ${textColor};
              transform-origin: top center;
            ">
              ${slideHTML}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer" style="
            padding: 24px 48px;
            border-top: 1px solid ${accentColor};
            opacity: 0.7;
            font-size: 20px;
            color: ${textColor};
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span>© ${author || 'Author'}, ${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}</span>
            <span>${i + 1} / ${slides.length}</span>
          </div>
        </div>
      `;

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Render Mermaid diagrams if any
      if (mermaidBlocks.length > 0) {
        const contentDiv = container.querySelector('.prose');
        if (contentDiv) {
          for (const block of mermaidBlocks) {
            try {
              const { svg } = await mermaid.render(`mermaid-pdf-${i}-${block.id}`, block.code);
              const mermaidContainer = document.createElement('div');
              mermaidContainer.className = 'mermaid-diagram';
              mermaidContainer.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 50px 0 80px 0;
                transform: scale(${block.scale});
                transform-origin: center;
              `;
              mermaidContainer.innerHTML = svg;
              contentDiv.appendChild(mermaidContainer);
            } catch (error) {
              console.error('Failed to render Mermaid in PDF:', error);
            }
          }
        }
        // Give Mermaid time to render
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Scale content if it overflows
      if (!isTitleSlide) {
        const contentWrapper = container.querySelector('.content-wrapper') as HTMLElement;
        const footer = container.querySelector('.footer') as HTMLElement;
        const contentScaler = container.querySelector('.content-scaler') as HTMLElement;

        if (contentWrapper && footer && contentScaler) {
          const availableHeight = slideHeight - footer.offsetHeight - 60; // 60px top padding
          const contentHeight = contentScaler.scrollHeight;

          if (contentHeight > availableHeight) {
            const scale = (availableHeight - 40) / contentHeight; // -40px for safety margin
            contentScaler.style.transform = `scale(${scale})`;
            contentScaler.style.transformOrigin = 'top left';
            contentScaler.style.width = `${100 / scale}%`;
          }
        }

        // Wait for scaling to apply
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Capture the slide as canvas at fixed presentation size
      const canvas = await html2canvas(container, {
        scale: 2,
        width: slideWidth,
        height: slideHeight,
        backgroundColor: theme.background.includes('gradient') ? null : theme.background,
        logging: false,
        useCORS: true,
        windowWidth: slideWidth,
        windowHeight: slideHeight,
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');

      // Add new page if not the first slide
      if (i > 0) {
        pdf.addPage();
      }

      // Calculate scaling to fit A4 landscape while maintaining aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Center vertically if needed
      const yOffset = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 0;

      pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
    }

    // Download the PDF
    pdf.save('presentation.pdf');
  } finally {
    // Clean up
    document.body.removeChild(container);
    if (styleElement) {
      document.head.removeChild(styleElement);
    }
    if (katexLinkElement) {
      document.head.removeChild(katexLinkElement);
    }
  }
}
