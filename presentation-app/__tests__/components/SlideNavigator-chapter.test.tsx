import { describe, it, expect } from 'vitest';
import { SlideInfo } from '../../lib/slideExtractor';

// Feature: chapter-structure
// Validates: Requirements 5.1, 5.4

/**
 * Tests for SlideNavigator chapter group heading rendering logic.
 *
 * The vitest environment is "node" (no jsdom / @testing-library), so we test
 * the rendering decision logic directly rather than mounting the React component.
 *
 * The logic under test mirrors the showChapterHeading computation in
 * SlideNavigator.tsx:
 *
 *   const prevSlide = slides[i - 1];
 *   const showChapterHeading =
 *     slide.chapterTitle !== undefined &&
 *     !slide.isAgendaSlide &&
 *     slide.chapterTitle !== prevSlide?.chapterTitle;
 */

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Replicates the showChapterHeading logic from SlideNavigator.tsx for each slide.
 * Returns an array of { slideIndex, chapterTitle } for every slide that should
 * render a chapter group heading.
 */
function computeChapterHeadings(slides: SlideInfo[]): Array<{ slideIndex: number; chapterTitle: string }> {
  const headings: Array<{ slideIndex: number; chapterTitle: string }> = [];

  slides.forEach((slide, i) => {
    const prevSlide = slides[i - 1];
    const showChapterHeading =
      slide.chapterTitle !== undefined &&
      !slide.isAgendaSlide &&
      slide.chapterTitle !== prevSlide?.chapterTitle;

    if (showChapterHeading) {
      headings.push({ slideIndex: i, chapterTitle: slide.chapterTitle! });
    }
  });

  return headings;
}

// ─── Test data helpers ────────────────────────────────────────────────────────

function makeSlide(overrides: Partial<SlideInfo> & { index: number }): SlideInfo {
  return {
    title: `Slide ${overrides.index + 1}`,
    position: overrides.index * 100,
    ...overrides,
  };
}

// ─── Tests: SlideNavigator zeigt Chapter-Gruppenüberschriften ─────────────────
// Validates: Requirements 5.1

describe('SlideNavigator – chapter group headings', () => {
  it('shows a chapter heading before the first slide of each chapter', () => {
    // Validates: Requirements 5.1
    const slides: SlideInfo[] = [
      makeSlide({ index: 0, title: 'Titelfolie' }),                                    // no chapter
      makeSlide({ index: 1, isAgendaSlide: true, title: 'Agenda' }),                   // agenda
      makeSlide({ index: 2, chapterTitle: 'Einführung', chapterIndex: 0 }),            // first of chapter 0
      makeSlide({ index: 3, chapterTitle: 'Einführung', chapterIndex: 0 }),            // second of chapter 0
      makeSlide({ index: 4, chapterTitle: 'Hauptteil', chapterIndex: 1 }),             // first of chapter 1
    ];

    const headings = computeChapterHeadings(slides);

    expect(headings).toHaveLength(2);
    expect(headings[0]).toEqual({ slideIndex: 2, chapterTitle: 'Einführung' });
    expect(headings[1]).toEqual({ slideIndex: 4, chapterTitle: 'Hauptteil' });
  });

  it('renders each chapter heading exactly once even when multiple slides share the same chapter', () => {
    // Validates: Requirements 5.1
    const slides: SlideInfo[] = [
      makeSlide({ index: 0, chapterTitle: 'Kapitel A', chapterIndex: 0 }),
      makeSlide({ index: 1, chapterTitle: 'Kapitel A', chapterIndex: 0 }),
      makeSlide({ index: 2, chapterTitle: 'Kapitel A', chapterIndex: 0 }),
    ];

    const headings = computeChapterHeadings(slides);

    expect(headings).toHaveLength(1);
    expect(headings[0]).toEqual({ slideIndex: 0, chapterTitle: 'Kapitel A' });
  });

  it('renders a new heading when chapter changes', () => {
    // Validates: Requirements 5.1
    const slides: SlideInfo[] = [
      makeSlide({ index: 0, chapterTitle: 'Kapitel 1', chapterIndex: 0 }),
      makeSlide({ index: 1, chapterTitle: 'Kapitel 2', chapterIndex: 1 }),
      makeSlide({ index: 2, chapterTitle: 'Kapitel 3', chapterIndex: 2 }),
    ];

    const headings = computeChapterHeadings(slides);

    expect(headings).toHaveLength(3);
    expect(headings.map(h => h.chapterTitle)).toEqual(['Kapitel 1', 'Kapitel 2', 'Kapitel 3']);
  });

  it('agenda slide (isAgendaSlide: true) gets no chapter heading even if chapterTitle were set', () => {
    // Validates: Requirements 5.1 – agenda slide is excluded from chapter headings
    const slides: SlideInfo[] = [
      makeSlide({ index: 0, isAgendaSlide: true, chapterTitle: 'ShouldNotAppear' }),
    ];

    const headings = computeChapterHeadings(slides);

    expect(headings).toHaveLength(0);
  });
});

// ─── Tests: SlideNavigator ohne Chapters – keine Gruppenüberschriften ─────────
// Validates: Requirements 5.4

describe('SlideNavigator – no chapters (backward compatibility)', () => {
  it('shows no chapter headings when no slide has chapterTitle', () => {
    // Validates: Requirements 5.4
    const slides: SlideInfo[] = [
      makeSlide({ index: 0, title: 'Folie 1' }),
      makeSlide({ index: 1, title: 'Folie 2' }),
      makeSlide({ index: 2, title: 'Folie 3' }),
    ];

    const headings = computeChapterHeadings(slides);

    expect(headings).toHaveLength(0);
  });

  it('shows no chapter headings for an empty slide list', () => {
    // Validates: Requirements 5.4
    const headings = computeChapterHeadings([]);
    expect(headings).toHaveLength(0);
  });

  it('shows no chapter headings when slides have undefined chapterTitle', () => {
    // Validates: Requirements 5.4
    const slides: SlideInfo[] = [
      makeSlide({ index: 0, chapterTitle: undefined }),
      makeSlide({ index: 1, chapterTitle: undefined }),
    ];

    const headings = computeChapterHeadings(slides);

    expect(headings).toHaveLength(0);
  });

  it('slide without chapterTitle between two chapter slides does not trigger a heading', () => {
    // Validates: Requirements 5.2 – slides without chapterTitle get no heading
    const slides: SlideInfo[] = [
      makeSlide({ index: 0, chapterTitle: 'Kapitel 1', chapterIndex: 0 }),
      makeSlide({ index: 1, title: 'Zwischenfolie ohne Chapter' }),                    // no chapterTitle
      makeSlide({ index: 2, chapterTitle: 'Kapitel 2', chapterIndex: 1 }),
    ];

    const headings = computeChapterHeadings(slides);

    // Only slides with chapterTitle get headings; the plain slide in the middle does not
    expect(headings).toHaveLength(2);
    expect(headings[0]).toEqual({ slideIndex: 0, chapterTitle: 'Kapitel 1' });
    expect(headings[1]).toEqual({ slideIndex: 2, chapterTitle: 'Kapitel 2' });
  });
});
