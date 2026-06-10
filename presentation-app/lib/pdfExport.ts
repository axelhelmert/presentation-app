import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import mermaid from 'mermaid';
import { Slide, renderMarkdownToHTML } from './markdown';
import { Theme } from './themes';
import { type StoredImage } from './imageStorage';
import { extractMermaidBlocks } from './mermaidProcessor';

// html2canvas taints the canvas as soon as it draws an <img> whose response
// does not advertise CORS (most public CDNs don't). We sidestep this by
// fetching every remote http(s) image through our same-origin /api/image-proxy
// and embedding the bytes as a data URL before html2canvas ever sees them.
const remoteImageCache = new Map<string, string>();

async function inlineRemoteImages(html: string): Promise<string> {
  const imgRegex = /<img\b([^>]*?)\bsrc\s*=\s*("([^"]+)"|'([^']+)')([^>]*)>/gi;
  const matches = Array.from(html.matchAll(imgRegex));
  if (matches.length === 0) return html;

  const replacements = await Promise.all(
    matches.map(async (match) => {
      const src = match[3] ?? match[4] ?? '';
      if (!/^https?:\/\//i.test(src)) return null;

      let dataUrl = remoteImageCache.get(src);
      if (!dataUrl) {
        try {
          const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(src)}`);
          if (!res.ok) throw new Error(`proxy ${res.status}`);
          const blob = await res.blob();
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          remoteImageCache.set(src, dataUrl);
        } catch (err) {
          console.warn(`[pdfExport] could not inline remote image ${src}:`, err);
          return null;
        }
      }

      const before = match[1] ?? '';
      const after = match[5] ?? '';
      return { original: match[0], replacement: `<img${before}src="${dataUrl}"${after}>` };
    })
  );

  let out = html;
  for (const r of replacements) {
    if (r) out = out.split(r.original).join(r.replacement);
  }
  return out;
}

interface ExportOptions {
  slides: Slide[];
  theme: Theme;
  fontSize: { size: string; lineHeight: string };
  uploadedImages?: StoredImage[];
  author?: string;
  companyLogo?: string;
  onProgress?: (current: number, total: number) => void;
}

export async function exportToPDF({
  slides,
  theme,
  fontSize,
  uploadedImages = [],
  author = '',
  companyLogo = 'msg-logo.png',
  onProgress,
}: ExportOptions): Promise<void> {
  if (slides.length === 0) {
    throw new Error('No slides to export');
  }

  // 16:9 page format (A4-landscape width, height clipped to 16:9) so the slide
  // fills the PDF page edge-to-edge. Previously we used 'a4' (1.414:1) and
  // letterboxed the 16:9 slide vertically, which made the export unusable for
  // full-screen projection from a PDF viewer.
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167.0625],
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Use presentation dimensions (1920x1080)
  const slideWidth = 1920;
  const slideHeight = 1080;

  // Create a temporary container for rendering slides at presentation size.
  // The `pdf-export` class scopes the list-marker workaround CSS injected
  // below so it never leaks into the live preview.
  const container = document.createElement('div');
  container.className = 'pdf-export';
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

  // Inject chapter header styling + list-marker workarounds.
  // html2canvas does not faithfully paint CSS `::marker` pseudo-elements: in
  // the captured canvas the bullets/numbers render at the wrong size and sit
  // at the top of the line instead of being baseline-aligned. Replace them
  // with `::before` content driven by a counter — html2canvas paints
  // `::before` reliably, and the marker inherits the list item's font-size
  // and line-height so it sits on the baseline.
  const chapterStyleElement = document.createElement('style');
  chapterStyleElement.textContent = `
    /* SlidePreview injects its own .slide-container .chapter-header rule
       via React (specificity 0,2,0) which is appended to the body AFTER
       this head-level <style>. Same-specificity ties resolve in DOM order,
       so the React rule was silently winning — !important is the simplest
       guarantee that the PDF export's larger size takes effect regardless
       of whether SlidePreview is mounted on the page. */
    .pdf-export .chapter-header {
      /* -20% gegenüber 1.75em: Kapitelüberschrift brach im PDF sonst
         häufig um. */
      font-size: 1.4em !important;
      font-weight: 600;
      color: var(--theme-accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      /* Tight gap to the slide subtitle/first paragraph: gains vertical room
         so images don't get cropped at the bottom on slides 3..N. */
      margin-bottom: 0.15em !important;
      opacity: 0.8;
    }
    /* Collapse the first paragraph's top margin when it follows the chapter
       header — pulls the slide subtitle visually up against the heading. */
    .pdf-export .prose .chapter-header + p {
      margin-top: 0.2em !important;
    }
    /* Title-slide subtitle ("Axel Helmert | Leiter R&D | msg life"):
       sits at the default prose 1em, which is ~55% of the H1 (.prose h1
       = 1.8em). Bringing it to 0.36em lands at ~20% of the H1.
       !important is required because the user keeps custom CSS in
       localStorage ('presentation-custom-css') which is injected ahead
       of this stylesheet and can carry !important font-size rules on
       .prose p / .prose em that would otherwise override the cascade. */
    .pdf-export.title-slide .content-scaler > p,
    .pdf-export.title-slide .content-scaler > p em {
      font-size: 0.36em !important;
      font-style: normal !important;
      line-height: 1.4 !important;
      margin-top: 1.6em !important;
      color: inherit !important;
    }
    .pdf-export.agenda-slide .prose h2 {
      font-size: 2.6em;
      margin-bottom: 1em;
    }
    .pdf-export.agenda-slide .prose > ol > li,
    .pdf-export.agenda-slide .prose > ul > li {
      font-size: 1.9em;
      line-height: 1.6;
      margin-top: 0.55em;
      margin-bottom: 0.55em;
    }
    .pdf-export .prose ol {
      list-style: none;
      counter-reset: pdf-ol;
      padding-left: 0;
    }
    .pdf-export .prose ol > li {
      counter-increment: pdf-ol;
      padding-left: 1.6em;
      position: relative;
    }
    .pdf-export .prose ol > li::before {
      content: counter(pdf-ol) ".";
      position: absolute;
      left: 0;
      width: 1.4em;
      text-align: left;
      color: var(--theme-text);
      font-weight: inherit;
    }
    .pdf-export .prose ul {
      list-style: none;
      padding-left: 0;
    }
    .pdf-export .prose ul > li {
      padding-left: 1.6em;
      position: relative;
    }
    .pdf-export .prose ul > li::before {
      content: "•";
      position: absolute;
      left: 0;
      width: 1.4em;
      text-align: left;
      color: var(--theme-text);
      line-height: inherit;
    }
    .pdf-export .prose ul ul > li::before {
      content: "◦";
    }
  `;
  document.head.appendChild(chapterStyleElement);

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

      // Toggle per-slide classes so the injected CSS can opt in to
      // title- / agenda-specific sizing without leaking into other slides.
      container.classList.toggle('agenda-slide', !!slide.isAgendaSlide);
      container.classList.toggle('title-slide', isTitleSlide);

      // Extract Mermaid blocks from the processed slide content (chapter header
      // div + body, magic comments already stripped). Synthetic slides — most
      // notably the auto-generated agenda — only populate `content`; their
      // `rawMarkdown` is empty, so reading rawMarkdown silently produced blank
      // pages.
      const { processedMarkdown, mermaidBlocks } = extractMermaidBlocks(slide.content);

      // Render markdown without Mermaid blocks to HTML
      let slideHTML = await renderMarkdownToHTML(processedMarkdown);

      // Replace image filenames with data URLs
      uploadedImages.forEach((img) => {
        const regex = new RegExp(`<img([^>]*)src=["']${img.name}["']([^>]*)>`, 'g');
        slideHTML = slideHTML.replace(regex, `<img$1src="${img.dataUrl}"$2>`);
      });

      // Pull remaining remote http(s) images through the same-origin proxy and
      // inline them as data URLs so html2canvas cannot taint the canvas.
      slideHTML = await inlineRemoteImages(slideHTML);

      // (Subtitle re-styling is done post-injection in the auto-sizer block
      // below — see notes there. The user's title-slide markdown uses raw
      // HTML <div style="font-size: …em">…</div> blocks rather than markdown
      // headings, so any string-level rewrite would have to know the exact
      // tag shape. Operating on the live DOM via querySelector is simpler
      // and structure-agnostic.)

      // Find background image if specified
      const bgImageData = slide.backgroundImage
        ? uploadedImages.find((img) => img.name === slide.backgroundImage)
        : null;

      // Hero-logo background (mostly title slide)
      const bgLogoData = slide.backgroundLogo
        ? uploadedImages.find((img) => img.name === slide.backgroundLogo)
        : null;
      const bgLogoSrc = slide.backgroundLogo
        ? bgLogoData?.dataUrl || `/${slide.backgroundLogo}`
        : null;
      const hasBgLogo = !!bgLogoSrc;

      // Find product logo if specified, falling back to public folder path
      const productLogoData = slide.productLogo
        ? uploadedImages.find((img) => img.name === slide.productLogo)
        : null;
      const productLogoSrc = slide.productLogo && !hasBgLogo
        ? productLogoData?.dataUrl || `/${slide.productLogo}`
        : null;

      // Find company logo data URL or use public folder path
      const companyLogoData = companyLogo
        ? uploadedImages.find((img) => img.name === companyLogo)
        : null;
      const companyLogoSrc = companyLogoData?.dataUrl || `/${companyLogo}`;

      // Determine colors based on background image / hero logo
      const onDarkBg = !!bgImageData || hasBgLogo;
      const textColor = onDarkBg ? '#ffffff' : theme.textColor;
      const headingColor = onDarkBg ? '#ffffff' : theme.headingColor;
      const accentColor = onDarkBg ? '#ffffff' : theme.accentColor;
      const codeBg = onDarkBg ? 'rgba(255, 255, 255, 0.1)' : theme.codeBackground;

      const NIGHT_SKY_BG = 'linear-gradient(to bottom right, #111827, #1e3a8a, #581c87)';

      // Build background style
      const backgroundStyle = bgImageData?.dataUrl
        ? `background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bgImageData.dataUrl}); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : hasBgLogo
        ? `background: ${NIGHT_SKY_BG};`
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
          overflow: hidden;
        ">
          <!-- Hero Logo Background -->
          ${hasBgLogo ? `
          <img src="${bgLogoSrc}" alt="" aria-hidden="true" style="
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            height: 115%;
            width: auto;
            pointer-events: none;
            z-index: 1;
          " />
          ` : ''}

          <!-- Product Logo (left) -->
          ${productLogoSrc ? `
          <div style="position: absolute; top: 30px; left: 30px; z-index: 10;">
            <img src="${productLogoSrc}" alt="Product Logo" style="height: ${isTitleSlide ? '96px' : '58px'}; width: auto; opacity: 0.8;" />
          </div>
          ` : ''}

          <!-- Company Logo (right) -->
          ${companyLogo ? `
          <div style="position: absolute; top: 30px; right: 30px; z-index: 10;">
            <img src="${companyLogoSrc}" alt="Company Logo" style="height: ${isTitleSlide ? '80px' : '48px'}; width: auto; opacity: 0.8;" />
          </div>
          ` : ''}

          <!-- Content -->
          <div class="content-wrapper" style="
            flex: 1;
            min-height: 0;
            /* Top padding tightened further (60→30→15) and bottom 20→10 so
               diagram-heavy slides (slide 3) regain ~5mm of vertical room. */
            padding: ${isTitleSlide ? '0' : '15px 80px 10px 80px'};
            overflow: hidden;
          ">
            <div class="prose max-w-none content-scaler" style="
              ${isTitleSlide ? (hasBgLogo ? `
                font-size: 1.65rem;
                text-align: left;
                position: absolute;
                left: 4%;
                top: 50%;
                transform: translateY(-50%);
                max-width: 28%;
                color: #ffffff;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
                z-index: 2;
              ` : bgImageData ? `
                font-size: 2rem;
                text-align: left;
                position: absolute;
                left: 6%;
                top: 33%;
                transform: translateY(-50%);
                width: 44%;
              ` : `
                font-size: 2rem;
                text-align: center;
                position: absolute;
                left: ${productLogoSrc ? '50%' : '25%'};
                top: 33%;
                transform: translate(-50%, -50%);
                width: 50%;
              `) : `
                /* Body text for content slides (3..N): the user-selected
                   fontSize.size assumes a viewport-scaled preview; rendered
                   at the fixed 1920x1080 PDF canvas it lands tiny. Apply a
                   1.6x bump so headings + paragraphs read at a presentation
                   distance. The overflow auto-scaler later in the loop still
                   shrinks the block uniformly if it now overflows. */
                font-size: calc(${fontSize.size} * 1.6);
                line-height: ${fontSize.lineHeight};
                width: 100%;
                margin-left: ${productLogoSrc ? '4rem' : '0'};
              `}
              color: ${textColor};
              transform-origin: top left;
            ">
              ${slideHTML}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer" style="
            padding: 12px 48px;
            border-top: 1px solid ${accentColor};
            opacity: 0.7;
            font-size: 18px;
            color: ${textColor};
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            min-height: 48px;
            z-index: 100;
          ">
            <span>© ${author || 'Author'}, ${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}</span>
            <span style="font-weight: bold;">${i + 1} / ${slides.length}</span>
          </div>
        </div>
      `;

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Honor the `start` attribute on ordered lists. The list markers are
      // drawn via a CSS `::before` counter (html2canvas can't paint native
      // `::marker` reliably), and that counter resets to 0 on every <ol> —
      // so a markdown list that starts at e.g. 6 (`6.` after a heading, a
      // common pattern for a two-part agenda split across a subheading)
      // would otherwise render as 1, 2 … in the PDF. Seed the counter from
      // the start value so it continues correctly. Inline style beats the
      // stylesheet's `counter-reset: pdf-ol`.
      container.querySelectorAll('.prose ol[start]').forEach((ol) => {
        const start = parseInt((ol as HTMLElement).getAttribute('start') || '', 10);
        if (!Number.isNaN(start)) {
          (ol as HTMLElement).style.counterReset = `pdf-ol ${start - 1}`;
        }
      });

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

      // Title slide with hero-logo background: shrink the subtitle.
      //
      // The user's title-slide markdown is raw HTML — two sibling <div>s with
      // inline `font-size: 2.1em` / `font-size: 1.6em` (NOT a markdown H1 /
      // <p> pair as one might expect). My earlier attempts targeted h1/p
      // selectors and never matched. Drop that assumption and address the
      // structure positionally instead: first top-level child of
      // .content-scaler is the title, every following child is the subtitle
      // (and any decorative trailing blocks).
      //
      // Inline styles in the source HTML carry !important-equivalent weight
      // against any stylesheet rule, so we override them with our own inline
      // !important on the live DOM node and recursively on descendants —
      // spans inside the subtitle have their own font-size: …em that would
      // otherwise re-amplify the shrink.
      // Catch all title-slide variants — `<!--bg-logo:>` (hero-logo) AND
      // `<!--bg:>` (background image). The user's deck uses the bg variant,
      // and the earlier `hasBgLogo`-only guard silently skipped this whole
      // block.
      if (isTitleSlide) {
        const content = container.querySelector('.content-scaler') as HTMLElement | null;
        if (content) {
          const childrenList = Array.from(content.children) as HTMLElement[];
          // First child = title (left alone, user controls size via inline
          // style on the <div>). Index >= 1 = subtitle / trailing blocks.
          for (let idx = 1; idx < childrenList.length; idx++) {
            const e = childrenList[idx];
            // 0.95em — ~45% of the user's 2.1em title. (Iteration: 0.42 →
            // 0.63 → 0.95em as user dialed in the preferred size.)
            // margin-top 3em keeps a clear gap below the title.
            e.style.setProperty('font-size', '0.95em', 'important');
            e.style.setProperty('line-height', '1.4', 'important');
            e.style.setProperty('margin-top', '3em', 'important');
            e.querySelectorAll('*').forEach((c) => {
              const child = c as HTMLElement;
              child.style.setProperty('font-size', 'inherit', 'important');
              child.style.setProperty('line-height', 'inherit', 'important');
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Scale content if it overflows - ensure footer is always visible
      if (!isTitleSlide) {
        const contentWrapper = container.querySelector('.content-wrapper') as HTMLElement;
        const footer = container.querySelector('.footer') as HTMLElement;
        const contentScaler = container.querySelector('.content-scaler') as HTMLElement;

        if (contentWrapper && footer && contentScaler) {
          // Get the actual footer height (must match the footer min-height above)
          const footerHeight = Math.max(footer.offsetHeight, 48);

          // Calculate available height: total height - footer - top padding - bottom padding
          // (must match the content-wrapper padding above — 15/10)
          const topPadding = 15;
          const bottomPadding = 10;
          const availableHeight = slideHeight - footerHeight - topPadding - bottomPadding;
          const contentHeight = contentScaler.scrollHeight;

          if (contentHeight > availableHeight) {
            // Scale the whole block down to fit the available height. Small
            // breathing margin above the footer; origin top-left keeps the
            // heading anchored top-left like non-overflowing slides.
            const scale = (availableHeight - 16) / contentHeight;
            contentScaler.style.transformOrigin = 'top left';
            contentScaler.style.transform = `scale(${scale})`;
            // Deliberately NO width compensation (`width: 100/scale%`).
            // Widening the scaler makes text reflow SHORTER than it measured
            // at width:100%, so after scaling the block ends far short of the
            // available height and clusters at the top with a large empty band
            // below — that is the "heading floats up" symptom on dense slides
            // (e.g. the maturity-model / specialized-agents slides). Leaving
            // width at 100% keeps the measured height valid so the block fills
            // the height exactly; the only cost is some unused width on the
            // right, far less jarring than the top-heavy gap.
          }
        }

        // Wait for scaling to apply
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      // Capture the slide as canvas at fixed presentation size
      const canvas = await html2canvas(container, {
        scale: 1.5, // Reduced from 2 to 1.5 for smaller file size while maintaining quality
        width: slideWidth,
        height: slideHeight,
        backgroundColor: theme.background.includes('gradient') ? null : theme.background,
        logging: false,
        useCORS: true,
        windowWidth: slideWidth,
        windowHeight: slideHeight,
      });

      // Convert canvas to JPEG with compression for much smaller file size
      // JPEG is suitable for slides with images/photos, use quality 0.85 for good balance
      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      // Add new page if not the first slide
      if (i > 0) {
        pdf.addPage();
      }

      // Calculate scaling to fit A4 landscape while maintaining aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Center vertically if needed
      const yOffset = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 0;

      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
    }

    // Download the PDF
    pdf.save('presentation.pdf');
  } finally {
    // Clean up
    document.body.removeChild(container);
    if (styleElement) {
      document.head.removeChild(styleElement);
    }
    if (chapterStyleElement) {
      document.head.removeChild(chapterStyleElement);
    }
    if (katexLinkElement) {
      document.head.removeChild(katexLinkElement);
    }
  }
}
