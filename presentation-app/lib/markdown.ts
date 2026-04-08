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
  content: string;
  rawMarkdown: string;
  backgroundImage?: string;
}

export function parseSlides(markdown: string): Slide[] {
  const slideContents = markdown.split(/^---$/m);

  return slideContents
    .map((content, index) => content.trim())
    .filter((content) => content.length > 0)
    .map((content, index) => {
      // Check for background image syntax: <!--bg: filename.jpg-->
      const bgMatch = content.match(/^<!--\s*bg:\s*(.+?)\s*-->/);
      let backgroundImage: string | undefined;
      let cleanContent = content;

      if (bgMatch) {
        backgroundImage = bgMatch[1].trim();
        // Remove the background image comment from content
        cleanContent = content.replace(/^<!--\s*bg:\s*.+?\s*-->\s*/, '');
      }

      return {
        id: index,
        content: cleanContent,
        rawMarkdown: content,
        backgroundImage,
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
