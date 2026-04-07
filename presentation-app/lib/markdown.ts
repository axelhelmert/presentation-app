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
}

export function parseSlides(markdown: string): Slide[] {
  const slideContents = markdown.split(/^---$/m);

  return slideContents
    .map((content, index) => content.trim())
    .filter((content) => content.length > 0)
    .map((content, index) => ({
      id: index,
      content: content,
      rawMarkdown: content,
    }));
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
