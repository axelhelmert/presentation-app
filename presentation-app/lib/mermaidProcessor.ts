export interface MermaidBlock {
  id: string;
  code: string;
  position: number;
  scale: number;
}

export function extractMermaidBlocks(markdown: string): {
  processedMarkdown: string;
  mermaidBlocks: MermaidBlock[];
} {
  const mermaidBlocks: MermaidBlock[] = [];
  let counter = 0;

  // Regex to match ```mermaid or ```mermaid scale:X.X
  // Allows optional scale parameter
  const mermaidRegex = /```mermaid(?:\s+scale:([\d.]+))?[\s]*\r?\n([\s\S]*?)```/gi;
  let match;
  let position = 0;

  while ((match = mermaidRegex.exec(markdown)) !== null) {
    const id = `mermaid-${Date.now()}-${counter++}`;
    const scale = match[1] ? parseFloat(match[1]) : 1.0;
    const code = match[2].trim();

    mermaidBlocks.push({
      id,
      code,
      position: match.index,
      scale,
    });
  }

  // Remove mermaid blocks from markdown
  const processedMarkdown = markdown.replace(mermaidRegex, '');

  return {
    processedMarkdown,
    mermaidBlocks,
  };
}
