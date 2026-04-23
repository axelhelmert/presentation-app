import { Slide } from './markdown';

export interface SlideInfo {
  index: number;
  title: string;
  position: number;
  chapterTitle?: string;   // Titel des Chapters, zu dem diese Folie gehört
  chapterIndex?: number;   // Nullbasierter Index des Chapters
  isAgendaSlide?: boolean; // true nur für die synthetische Agenda-Folie
}

/**
 * Extract slide information from markdown for navigation
 * Returns slide number, title (first heading), and character position in text.
 *
 * When `slides` is provided, chapterTitle, chapterIndex and isAgendaSlide are
 * taken directly from the corresponding Slide objects (by index).
 * Without `slides`, the legacy behaviour is preserved for backwards compatibility.
 */
export function extractSlideInfo(markdown: string, slides?: Slide[]): SlideInfo[] {
  // If slides array is provided, use it as the source of truth
  if (slides && slides.length > 0) {
    const result: SlideInfo[] = [];
    const slideContents = markdown.split(/^---$/m);

    let currentPosition = 0;
    let markdownSlideIndex = 0;

    for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      const slide = slides[slideIndex];

      // If this is an agenda slide (synthetic, not in markdown)
      if (slide.isAgendaSlide) {
        result.push({
          index: slideIndex,
          title: 'Agenda',
          position: 0, // Position doesn't matter for synthetic slides
          chapterTitle: slide.chapterTitle,
          chapterIndex: slide.chapterIndex,
          isAgendaSlide: true,
        });
        continue;
      }

      // Find corresponding markdown content
      let content = '';
      while (markdownSlideIndex < slideContents.length) {
        const trimmed = slideContents[markdownSlideIndex].trim();
        markdownSlideIndex++;
        if (trimmed.length > 0) {
          content = trimmed;
          break;
        }
      }

      if (content) {
        // Extract first heading as title
        const headingMatch = content.match(/^#{1,6}\s+(.+)$/m);
        const title = headingMatch
          ? headingMatch[1].trim()
          : content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');

        result.push({
          index: slideIndex,
          title,
          position: currentPosition,
          chapterTitle: slide.chapterTitle,
          chapterIndex: slide.chapterIndex,
          isAgendaSlide: false,
        });
      }

      // Update position for next slide
      const actualIndex = markdownSlideIndex - 1;
      if (actualIndex < slideContents.length) {
        currentPosition += slideContents[actualIndex].length + (actualIndex < slideContents.length - 1 ? 4 : 0);
      }
    }

    return result;
  }

  // Legacy behavior when slides array is not provided
  const result: SlideInfo[] = [];
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

      result.push({
        index: result.length,
        title,
        position: currentPosition,
      });
    }

    // Update position (including the separator)
    currentPosition += content.length + (index < slideContents.length - 1 ? 4 : 0); // +4 for "---\n"
  });

  return result;
}
