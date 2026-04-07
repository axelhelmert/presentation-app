import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Slide } from './markdown';
import { Theme } from './themes';

interface ExportOptions {
  slides: Slide[];
  theme: Theme;
  fontSize: { size: string; lineHeight: string };
  onProgress?: (current: number, total: number) => void;
}

export async function exportToPDF({
  slides,
  theme,
  fontSize,
  onProgress,
}: ExportOptions): Promise<void> {
  if (slides.length === 0) {
    throw new Error('No slides to export');
  }

  // Create PDF in landscape mode (16:9 aspect ratio)
  // A4 landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Create a temporary container for rendering slides
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1920px'; // 16:9 width
  container.style.height = '1080px'; // 16:9 height
  container.style.background = theme.background;
  container.style.color = theme.textColor;
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  document.body.appendChild(container);

  // Load logo image
  const logoImg = new Image();
  logoImg.src = '/msg-logo.png';
  await new Promise((resolve, reject) => {
    logoImg.onload = resolve;
    logoImg.onerror = reject;
  });

  try {
    for (let i = 0; i < slides.length; i++) {
      if (onProgress) {
        onProgress(i + 1, slides.length);
      }

      // Create slide content with theme styling and logo
      container.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%;">
          <div style="position: absolute; top: 0; right: 0; z-index: 10;">
            <img src="/msg-logo.png" alt="MSG Logo" style="height: 48px; width: auto; opacity: 0.8;" />
          </div>
          <div class="prose max-w-none" style="
            font-size: ${fontSize.size};
            line-height: ${fontSize.lineHeight};
            color: ${theme.textColor};
            --theme-text: ${theme.textColor};
            --theme-heading: ${theme.headingColor};
            --theme-accent: ${theme.accentColor};
            --theme-code-bg: ${theme.codeBackground};
          ">
            ${slides[i].content}
          </div>
        </div>
      `;

      // Wait for any KaTeX rendering to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture the slide as canvas
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        backgroundColor: theme.background.includes('gradient')
          ? null
          : theme.background,
        logging: false,
        useCORS: true,
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');

      // Add new page if not the first slide
      if (i > 0) {
        pdf.addPage();
      }

      // Add image to PDF, maintaining aspect ratio
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
  }
}
