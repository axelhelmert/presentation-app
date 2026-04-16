import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

export interface Slide {
  id: number;
  content: string;       // Markdown ohne <!--notes:-->-Kommentar
  rawMarkdown: string;   // Original-Markdown inkl. <!--notes:-->
  notes: string;         // Extrahierter Notizen-Text (leer wenn keine Notizen)
  backgroundImage?: string;
  productLogo?: string;
}

const NOTES_REGEX = /<!--notes:([\s\S]*?)-->/;
const NOTES_REGEX_GLOBAL = /<!--notes:([\s\S]*?)-->/g;

export function extractNotes(slideContent: string): string {
  const match = slideContent.match(NOTES_REGEX);
  return match ? match[1] : '';
}

export function removeNotesComment(slideContent: string): string {
  return slideContent.replace(NOTES_REGEX_GLOBAL, '');
}

export function setNotes(slideContent: string, notes: string): string {
  if (notes === '') {
    return removeNotesComment(slideContent);
  }
  if (NOTES_REGEX.test(slideContent)) {
    return slideContent.replace(NOTES_REGEX, `<!--notes:${notes}-->`);
  }
  return `${slideContent}\n<!--notes:${notes}-->`;
}

export function parseSlides(markdown: string): Slide[] {
  const slideContents = markdown.split(/^---$/m);

  return slideContents
    .map((content, index) => content.trim())
    .filter((content) => content.length > 0)
    .map((content, index) => {
      // Check for background image syntax: <!--bg: filename.jpg-->
      const bgMatch = content.match(/<!--\s*bg:\s*(.+?)\s*-->/);
      let backgroundImage: string | undefined;
      let cleanContent = content;

      if (bgMatch) {
        backgroundImage = bgMatch[1].trim();
        // Remove the background image comment from content
        cleanContent = cleanContent.replace(/<!--\s*bg:\s*.+?\s*-->\s*/g, '');
      }

      // Check for product logo syntax: <!--product-logo: filename.png-->
      const logoMatch = cleanContent.match(/<!--\s*product-logo:\s*(.+?)\s*-->/);
      let productLogo: string | undefined;

      if (logoMatch) {
        productLogo = logoMatch[1].trim();
        // Remove the product logo comment from content
        cleanContent = cleanContent.replace(/<!--\s*product-logo:\s*.+?\s*-->\s*/g, '');
      }

      // Extract notes and remove notes comment from content
      const notes = extractNotes(cleanContent);
      cleanContent = removeNotesComment(cleanContent);

      return {
        id: index,
        content: cleanContent,
        rawMarkdown: content,
        notes,
        backgroundImage,
        productLogo,
      };
    });
}

export async function renderMarkdownToHTML(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}
