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

      const slideIndex = result.length;
      const correspondingSlide = slides?.[slideIndex];

      result.push({
        index: slideIndex,
        title,
        position: currentPosition,
        ...(slides !== undefined && {
          chapterTitle: correspondingSlide?.chapterTitle,
          chapterIndex: correspondingSlide?.chapterIndex,
          isAgendaSlide: correspondingSlide?.isAgendaSlide,
        }),
      });
    }

    // Update position (including the separator)
    currentPosition += content.length + (index < slideContents.length - 1 ? 4 : 0); // +4 for "---\n"
  });

  return result;
}
