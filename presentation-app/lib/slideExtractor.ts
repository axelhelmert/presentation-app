export interface SlideInfo {
  index: number;
  title: string;
  position: number;
}

/**
 * Extract slide information from markdown for navigation
 * Returns slide number, title (first heading), and character position in text
 */
export function extractSlideInfo(markdown: string): SlideInfo[] {
  const slides: SlideInfo[] = [];
  const slideContents = markdown.split(/^---$/m);

  let currentPosition = 0;

  slideContents.forEach((content, index) => {
    const trimmedContent = content.trim();

    if (trimmedContent.length > 0) {
      // Extract first heading as title
      const headingMatch = trimmedContent.match(/^#{1,6}\s+(.+)$/m);
      const title = headingMatch
        ? headingMatch[1].trim()
        : trimmedContent.substring(0, 50).trim() + (trimmedContent.length > 50 ? '...' : '');

      slides.push({
        index: slides.length,
        title,
        position: currentPosition,
      });
    }

    // Update position (including the separator)
    currentPosition += content.length + (index < slideContents.length - 1 ? 4 : 0); // +4 for "---\n"
  });

  return slides;
}
