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
  content: string;            // Markdown mit Chapter-Header (nur in content, nicht rawMarkdown)
  rawMarkdown: string;        // Original-Markdown ohne Chapter-Header; '' für Agenda-Folie
  notes: string;              // Sprechernotizen (leer wenn keine)
  backgroundImage?: string;
  productLogo?: string;
  chapterTitle?: string;      // Titel des Chapters, zu dem diese Folie gehört
  chapterIndex?: number;      // Nullbasierter Index des Chapters
  isAgendaSlide?: boolean;    // true nur für die synthetische Agenda-Folie
}

interface ChapterBlock {
  title: string | undefined;  // undefined für Präsentationen ohne Chapter-Syntax
  rawContent: string;         // Markdown-Inhalt des Chapters (ohne === Zeile)
}

export function splitByChapters(markdown: string): ChapterBlock[] {
  const CHAPTER_REGEX = /^===(.*)$/m;

  if (!CHAPTER_REGEX.test(markdown)) {
    return [{ title: undefined, rawContent: markdown }];
  }

  const parts = markdown.split(/^===(.*)\n?/m);
  // parts[0] = content before first ===, then alternating: title, content, title, content...

  const blocks: ChapterBlock[] = [];

  // Content before first === (no title)
  if (parts[0].trim().length > 0) {
    blocks.push({ title: undefined, rawContent: parts[0] });
  }

  // Each chapter: parts[i*2+1] = inline title, parts[i*2+2] = content
  for (let i = 1; i < parts.length; i += 2) {
    const inlineTitle = parts[i].trim();
    const rawContent = parts[i + 1] ?? '';

    let title: string | undefined;
    if (inlineTitle.length > 0) {
      title = inlineTitle;
    } else {
      // Fallback: first non-empty line of the block
      const firstLine = rawContent.split('\n').find(l => l.trim().length > 0);
      title = firstLine?.trim();
    }

    blocks.push({ title, rawContent });
  }

  return blocks;
}

export function buildAgendaSlide(chapterTitles: string[], id: number): Slide {
  const listItems = chapterTitles.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const content = `## Agenda\n\n${listItems}`;
  return {
    id,
    content,
    rawMarkdown: '',
    notes: '',
    isAgendaSlide: true,
    chapterTitle: undefined,
    chapterIndex: undefined,
  };
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

function parseSlideContent(rawContent: string, chapterTitle: string | undefined, chapterIdx: number | undefined): Omit<Slide, 'id'> {
  // Check for background image syntax: <!--bg: filename.jpg-->
  const bgMatch = rawContent.match(/<!--\s*bg:\s*(.+?)\s*-->/);
  let backgroundImage: string | undefined;
  let cleanContent = rawContent;

  if (bgMatch) {
    backgroundImage = bgMatch[1].trim();
    cleanContent = cleanContent.replace(/<!--\s*bg:\s*.+?\s*-->\s*/g, '');
  }

  // Check for product logo syntax: <!--product-logo: filename.png-->
  const logoMatch = cleanContent.match(/<!--\s*product-logo:\s*(.+?)\s*-->/);
  let productLogo: string | undefined;

  if (logoMatch) {
    productLogo = logoMatch[1].trim();
    cleanContent = cleanContent.replace(/<!--\s*product-logo:\s*.+?\s*-->\s*/g, '');
  }

  // Extract notes and remove notes comment from content
  const notes = extractNotes(cleanContent);
  cleanContent = removeNotesComment(cleanContent);

  // Prepend chapter header to content (not rawMarkdown)
  if (chapterTitle !== undefined) {
    cleanContent = `## ${chapterTitle}\n${cleanContent}`;
  }

  return {
    content: cleanContent,
    rawMarkdown: rawContent,
    notes,
    backgroundImage,
    productLogo,
    chapterTitle,
    chapterIndex: chapterIdx,
  };
}

export function parseSlides(markdown: string): Slide[] {
  const chapters = splitByChapters(markdown);
  const hasChapters = chapters.some(c => c.title !== undefined);

  const allSlides: Omit<Slide, 'id'>[] = [];
  let chapterIdx = 0;

  for (const chapter of chapters) {
    const slideContents = chapter.rawContent.split(/^---$/m);

    for (const slideContent of slideContents) {
      const trimmed = slideContent.trim();
      if (trimmed.length === 0) continue;

      const slide = parseSlideContent(
        trimmed,
        chapter.title,
        chapter.title !== undefined ? chapterIdx : undefined,
      );
      allSlides.push(slide);
    }

    if (chapter.title !== undefined) {
      chapterIdx++;
    }
  }

  if (hasChapters && allSlides.length > 0) {
    const chapterTitles = chapters
      .filter(c => c.title !== undefined)
      .map(c => c.title!);
    // Insert agenda slide after first slide (index 1), or at 0 if no slides before first chapter
    const insertAt = allSlides[0] && allSlides[0].chapterTitle === undefined ? 1 : 0;
    allSlides.splice(insertAt, 0, buildAgendaSlide(chapterTitles, -1));
  }

  return allSlides.map((slide, i) => ({ ...slide, id: i }));
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
