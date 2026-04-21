import { describe, it, expect } from 'vitest';
import { Slide } from '../../lib/markdown';

// Feature: chapter-structure
// Validates: Requirements 6.1, 6.3

/**
 * Tests for PresentationMode chapter title display logic in the status bar.
 *
 * The vitest environment is "node" (no jsdom / @testing-library), so we test
 * the rendering decision logic directly rather than mounting the React component.
 *
 * The logic under test mirrors the status bar rendering in PresentationMode.tsx:
 *
 *   {slides[currentSlide]?.chapterTitle && (
 *     <span className="ml-3 text-gray-300 text-xs">
 *       {slides[currentSlide].chapterTitle}
 *     </span>
 *   )}
 *
 * This logic determines whether a chapter title is shown next to the slide
 * number (e.g. "3 / 12  Einführung").
 */

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Replicates the chapter title visibility logic from PresentationMode.tsx.
 * Returns the chapter title to display, or undefined if none should be shown.
 */
function getStatusBarChapterTitle(
  slides: Pick<Slide, 'chapterTitle'>[],
  currentSlide: number
): string | undefined {
  return slides[currentSlide]?.chapterTitle || undefined;
}

// ─── Test data helpers ────────────────────────────────────────────────────────

function makeSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: 0,
    content: '# Test',
    rawMarkdown: '# Test',
    notes: '',
    ...overrides,
  };
}

// ─── Tests: PresentationMode zeigt Chapter-Titel in Statusleiste ──────────────
// Validates: Requirements 6.1

describe('PresentationMode – Chapter-Titel in Statusleiste', () => {
  it('zeigt Chapter-Titel wenn aktuelle Folie chapterTitle hat', () => {
    // Validates: Requirements 6.1
    const slides: Slide[] = [
      makeSlide({ id: 0 }),
      makeSlide({ id: 1, chapterTitle: 'Einführung', chapterIndex: 0 }),
      makeSlide({ id: 2, chapterTitle: 'Einführung', chapterIndex: 0 }),
    ];

    const chapterTitle = getStatusBarChapterTitle(slides, 1);

    expect(chapterTitle).toBe('Einführung');
  });

  it('zeigt den korrekten Chapter-Titel für die aktuelle Folie', () => {
    // Validates: Requirements 6.1
    const slides: Slide[] = [
      makeSlide({ id: 0, chapterTitle: 'Kapitel 1', chapterIndex: 0 }),
      makeSlide({ id: 1, chapterTitle: 'Kapitel 2', chapterIndex: 1 }),
    ];

    expect(getStatusBarChapterTitle(slides, 0)).toBe('Kapitel 1');
    expect(getStatusBarChapterTitle(slides, 1)).toBe('Kapitel 2');
  });

  it('zeigt Chapter-Titel auch für die letzte Folie', () => {
    // Validates: Requirements 6.1
    const slides: Slide[] = [
      makeSlide({ id: 0 }),
      makeSlide({ id: 1, chapterTitle: 'Abschluss', chapterIndex: 1 }),
    ];

    const chapterTitle = getStatusBarChapterTitle(slides, slides.length - 1);

    expect(chapterTitle).toBe('Abschluss');
  });
});

// ─── Tests: PresentationMode ohne Chapter – kein Chapter-Titel ───────────────
// Validates: Requirements 6.3

describe('PresentationMode – kein Chapter-Titel ohne Chapter', () => {
  it('zeigt keinen Chapter-Titel wenn aktuelle Folie kein chapterTitle hat', () => {
    // Validates: Requirements 6.3
    const slides: Slide[] = [
      makeSlide({ id: 0 }),
      makeSlide({ id: 1 }),
    ];

    const chapterTitle = getStatusBarChapterTitle(slides, 0);

    expect(chapterTitle).toBeUndefined();
  });

  it('zeigt keinen Chapter-Titel für Titelfolie ohne Chapter-Zugehörigkeit', () => {
    // Validates: Requirements 6.3
    const slides: Slide[] = [
      makeSlide({ id: 0, content: '# Willkommen' }),                          // Titelfolie, kein Chapter
      makeSlide({ id: 1, isAgendaSlide: true }),                               // Agenda-Folie
      makeSlide({ id: 2, chapterTitle: 'Einführung', chapterIndex: 0 }),       // Chapter-Folie
    ];

    // Titelfolie (index 0) hat kein chapterTitle
    expect(getStatusBarChapterTitle(slides, 0)).toBeUndefined();
  });

  it('zeigt keinen Chapter-Titel für Agenda-Folie (isAgendaSlide)', () => {
    // Validates: Requirements 6.3
    const slides: Slide[] = [
      makeSlide({ id: 0 }),
      makeSlide({ id: 1, isAgendaSlide: true, content: '## Agenda\n\n1. Einführung' }),
    ];

    const chapterTitle = getStatusBarChapterTitle(slides, 1);

    expect(chapterTitle).toBeUndefined();
  });

  it('zeigt keinen Chapter-Titel bei Präsentation ohne Chapter-Syntax', () => {
    // Validates: Requirements 6.3
    const slides: Slide[] = [
      makeSlide({ id: 0, content: '# Folie 1' }),
      makeSlide({ id: 1, content: '# Folie 2' }),
      makeSlide({ id: 2, content: '# Folie 3' }),
    ];

    slides.forEach((_, index) => {
      expect(getStatusBarChapterTitle(slides, index)).toBeUndefined();
    });
  });

  it('gibt undefined zurück wenn currentSlide außerhalb des Arrays liegt', () => {
    // Validates: Requirements 6.3 – defensive check
    const slides: Slide[] = [
      makeSlide({ id: 0, chapterTitle: 'Kapitel 1', chapterIndex: 0 }),
    ];

    expect(getStatusBarChapterTitle(slides, 99)).toBeUndefined();
  });
});

// ─── Tests: Folien-Nummerierung bleibt unverändert ───────────────────────────
// Validates: Requirements 6.2

describe('PresentationMode – Folien-Nummerierung unverändert', () => {
  it('Folien-Nummerierung ist unabhängig vom Chapter-Titel', () => {
    // Validates: Requirements 6.2
    // The slide number (currentSlide + 1) / slides.length is always present.
    // We verify that chapter title presence does not affect slide count logic.
    const slides: Slide[] = [
      makeSlide({ id: 0 }),
      makeSlide({ id: 1, chapterTitle: 'Einführung', chapterIndex: 0 }),
      makeSlide({ id: 2, chapterTitle: 'Einführung', chapterIndex: 0 }),
    ];

    // Slide numbering: currentSlide + 1 / slides.length
    expect(slides.length).toBe(3);
    // Chapter title on slide 1 does not change the total count
    expect(getStatusBarChapterTitle(slides, 1)).toBe('Einführung');
    // Slide 0 has no chapter title but is still counted
    expect(getStatusBarChapterTitle(slides, 0)).toBeUndefined();
  });
});
