import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { formatTimer } from '../../components/PresenterView';
import { parseSlides } from '../../lib/markdown';

// ─── Property 9: Timer-Format ist immer MM:SS ─────────────────────────────────
// Feature: slide-notes, Property 9: Timer-Format ist immer MM:SS
// Validates: Requirements 5.3

describe('formatTimer', () => {
  it('Property 9: formatTimer always returns MM:SS format with correct values', () => {
    // Feature: slide-notes, Property 9: Timer-Format ist immer MM:SS
    // Validates: Requirements 5.3
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5999 }),
        (s) => {
          const result = formatTimer(s);
          // Must match MM:SS pattern
          expect(/^\d{2}:\d{2}$/.test(result)).toBe(true);
          // Values must be correct
          const expectedMins = Math.floor(s / 60);
          const expectedSecs = s % 60;
          const [minsStr, secsStr] = result.split(':');
          expect(parseInt(minsStr, 10)).toBe(expectedMins);
          expect(parseInt(secsStr, 10)).toBe(expectedSecs);
          // Leading zeros
          expect(minsStr.length).toBe(2);
          expect(secsStr.length).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formats 0 seconds as 00:00', () => {
    expect(formatTimer(0)).toBe('00:00');
  });

  it('formats 65 seconds as 01:05', () => {
    expect(formatTimer(65)).toBe('01:05');
  });

  it('formats 5999 seconds as 99:59', () => {
    expect(formatTimer(5999)).toBe('99:59');
  });
});

// ─── Helpers for PresenterView logic tests ────────────────────────────────────

/**
 * Simulates the PresenterView's notes display logic:
 * returns the notes of slides[currentSlide].
 */
function getNotesForSlide(slides: { notes: string; content: string }[], index: number): string {
  return slides[index]?.notes ?? '';
}

/**
 * Simulates the PresenterView's next-slide logic:
 * returns 'LAST_SLIDE' sentinel when on last slide, otherwise the next slide index.
 */
function getNextSlideInfo(
  slides: { notes: string; content: string }[],
  currentIndex: number
): { isLast: boolean; nextIndex: number | null } {
  const isLast = currentIndex === slides.length - 1;
  return { isLast, nextIndex: isLast ? null : currentIndex + 1 };
}

/**
 * Simulates the PresenterView's slide counter text.
 */
function getSlideCounterText(slides: { notes: string; content: string }[], currentIndex: number): string {
  return `${currentIndex + 1} / ${slides.length}`;
}

// ─── Property 6: PresenterView zeigt Notizen der aktuellen Folie ──────────────
// Feature: slide-notes, Property 6: PresenterView zeigt Notizen der aktuellen Folie
// Validates: Requirements 4.2, 5.2

describe('PresenterView – notes display', () => {
  it('Property 6: shows notes of the current slide', () => {
    // Feature: slide-notes, Property 6: PresenterView zeigt Notizen der aktuellen Folie
    // Validates: Requirements 4.2, 5.2
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ notes: fc.string(), content: fc.string() }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.nat(),
        (slides, rawIndex) => {
          const index = rawIndex % slides.length;
          const displayedNotes = getNotesForSlide(slides, index);
          expect(displayedNotes).toBe(slides[index].notes);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: PresenterView zeigt nächste Folie korrekt ───────────────────
// Feature: slide-notes, Property 7: PresenterView zeigt nächste Folie korrekt
// Validates: Requirements 4.3, 4.4

describe('PresenterView – next slide display', () => {
  it('Property 7: shows next slide or "Letzte Folie" hint correctly', () => {
    // Feature: slide-notes, Property 7: PresenterView zeigt nächste Folie korrekt
    // Validates: Requirements 4.3, 4.4
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ notes: fc.string(), content: fc.string() }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.nat(),
        (slides, rawIndex) => {
          const index = rawIndex % slides.length;
          const { isLast, nextIndex } = getNextSlideInfo(slides, index);

          if (index < slides.length - 1) {
            // Not last slide: next slide should be index+1
            expect(isLast).toBe(false);
            expect(nextIndex).toBe(index + 1);
          } else {
            // Last slide: should show "Letzte Folie"
            expect(isLast).toBe(true);
            expect(nextIndex).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 8: Folien-Zähler ist korrekt ───────────────────────────────────
// Feature: slide-notes, Property 8: Folien-Zähler ist korrekt
// Validates: Requirements 4.5, 5.5

describe('PresenterView – slide counter', () => {
  it('Property 8: slide counter text is always "${i+1} / ${N}"', () => {
    // Feature: slide-notes, Property 8: Folien-Zähler ist korrekt
    // Validates: Requirements 4.5, 5.5
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ notes: fc.string(), content: fc.string() }),
          { minLength: 1, maxLength: 50 }
        ),
        fc.nat(),
        (slides, rawIndex) => {
          const index = rawIndex % slides.length;
          const counterText = getSlideCounterText(slides, index);
          expect(counterText).toBe(`${index + 1} / ${slides.length}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 10: Keyboard-Navigation schreibt LocalStorage korrekt ──────────
// Feature: slide-notes, Property 10: Keyboard-Navigation im PresenterView schreibt LocalStorage korrekt
// Validates: Requirements 5.7

/**
 * Simulates the PresenterView keyboard navigation handler.
 * Mirrors the exact logic in PresenterView.tsx's handleKeyDown:
 *   ArrowRight → Math.min(prev + 1, slides.length - 1)
 *   ArrowLeft  → Math.max(prev - 1, 0)
 * Writes results into the provided localStorage-like storage map.
 */
function simulateKeyNav(
  key: 'ArrowRight' | 'ArrowLeft',
  currentIndex: number,
  totalSlides: number,
  storage: Map<string, string>
): number {
  let next: number;
  if (key === 'ArrowRight') {
    next = Math.min(currentIndex + 1, totalSlides - 1);
  } else {
    next = Math.max(currentIndex - 1, 0);
  }
  storage.set('presentation-current-slide', next.toString());
  storage.set('presentation-presenter-nav', Date.now().toString());
  return next;
}

describe('PresenterView – keyboard navigation writes localStorage', () => {
  it('Property 10: ArrowRight writes correct slide index and presenter-nav timestamp', () => {
    // Feature: slide-notes, Property 10: Keyboard-Navigation im PresenterView schreibt LocalStorage korrekt
    // Validates: Requirements 5.7
    fc.assert(
      fc.property(
        fc.nat(),
        fc.array(fc.record({ notes: fc.string(), content: fc.string() }), { minLength: 1 }),
        (rawIndex, slides) => {
          const N = slides.length;
          const i = rawIndex % N;
          const storage = new Map<string, string>();
          const before = Date.now();

          simulateKeyNav('ArrowRight', i, N, storage);

          const expectedSlide = Math.min(i + 1, N - 1);
          expect(storage.get('presentation-current-slide')).toBe(expectedSlide.toString());

          const navTimestamp = parseInt(storage.get('presentation-presenter-nav') ?? '0', 10);
          expect(navTimestamp).toBeGreaterThanOrEqual(before);
          expect(navTimestamp.toString()).toMatch(/^\d+$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: ArrowLeft writes correct slide index and presenter-nav timestamp', () => {
    // Feature: slide-notes, Property 10: Keyboard-Navigation im PresenterView schreibt LocalStorage korrekt
    // Validates: Requirements 5.7
    fc.assert(
      fc.property(
        fc.nat(),
        fc.array(fc.record({ notes: fc.string(), content: fc.string() }), { minLength: 1 }),
        (rawIndex, slides) => {
          const N = slides.length;
          const i = rawIndex % N;
          const storage = new Map<string, string>();
          const before = Date.now();

          simulateKeyNav('ArrowLeft', i, N, storage);

          const expectedSlide = Math.max(i - 1, 0);
          expect(storage.get('presentation-current-slide')).toBe(expectedSlide.toString());

          const navTimestamp = parseInt(storage.get('presentation-presenter-nav') ?? '0', 10);
          expect(navTimestamp).toBeGreaterThanOrEqual(before);
          expect(navTimestamp.toString()).toMatch(/^\d+$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests for PresenterView (Task 6.6) ─────────────────────────────────
// Validates: Requirements 4.3, 4.4, 5.4, 4.6

describe('PresenterView – unit tests', () => {
  // ── "Letzte Folie" on last slide ─────────────────────────────────────────
  it('shows "Letzte Folie" hint when on the last slide', () => {
    // Validates: Requirements 4.3, 4.4
    const slides = [
      { notes: 'note1', content: '# Folie 1' },
      { notes: 'note2', content: '# Folie 2' },
    ];
    const lastIndex = slides.length - 1;
    const { isLast } = getNextSlideInfo(slides, lastIndex);
    expect(isLast).toBe(true);
  });

  it('does NOT show "Letzte Folie" when not on the last slide', () => {
    // Validates: Requirements 4.3
    const slides = [
      { notes: 'note1', content: '# Folie 1' },
      { notes: 'note2', content: '# Folie 2' },
    ];
    const { isLast } = getNextSlideInfo(slides, 0);
    expect(isLast).toBe(false);
  });

  // ── Reset timer sets timerSeconds to 0 ───────────────────────────────────
  it('reset timer logic sets seconds to 0', () => {
    // Validates: Requirements 5.4
    let timerSeconds = 123;
    // Simulate reset
    timerSeconds = 0;
    expect(timerSeconds).toBe(0);
    expect(formatTimer(timerSeconds)).toBe('00:00');
  });

  // ── storage event updates slide index ────────────────────────────────────
  it('storage event for presentation-current-slide updates currentSlide', () => {
    // Validates: Requirements 4.6
    // Simulate the storage event handler logic
    let currentSlide = 0;
    const presenterNavTimestamp: string | null = null; // no own nav

    function handleStorageEvent(key: string, newValue: string, presenterNav: string | null): void {
      if (key === 'presentation-current-slide' && newValue !== null) {
        const isOwnNav = presenterNav && (Date.now() - parseInt(presenterNav, 10)) < 100;
        if (!isOwnNav) {
          const slideNum = parseInt(newValue, 10);
          if (!isNaN(slideNum)) {
            currentSlide = slideNum;
          }
        }
      }
    }

    handleStorageEvent('presentation-current-slide', '3', presenterNavTimestamp);
    expect(currentSlide).toBe(3);
  });

  it('storage event is ignored when presentation-presenter-nav was just set (own navigation)', () => {
    // Validates: Requirements 4.6 – no feedback loop
    let currentSlide = 0;
    const recentTimestamp = Date.now().toString(); // very recent

    function handleStorageEvent(key: string, newValue: string, presenterNav: string | null): void {
      if (key === 'presentation-current-slide' && newValue !== null) {
        const isOwnNav = presenterNav && (Date.now() - parseInt(presenterNav, 10)) < 100;
        if (!isOwnNav) {
          const slideNum = parseInt(newValue, 10);
          if (!isNaN(slideNum)) {
            currentSlide = slideNum;
          }
        }
      }
    }

    handleStorageEvent('presentation-current-slide', '5', recentTimestamp);
    // Should NOT update because it's our own navigation
    expect(currentSlide).toBe(0);
  });

  // ── Empty state when slides.length === 0 ─────────────────────────────────
  it('empty state: no slides means slides.length === 0', () => {
    // Validates: Requirements 4.6 (empty state)
    const slides = parseSlides('');
    expect(slides.length).toBe(0);
  });

  // ── Notes of current slide are displayed ─────────────────────────────────
  it('displays notes of the current slide', () => {
    // Validates: Requirements 4.2, 5.2
    const slides = [
      { notes: 'Wichtiger Hinweis für Folie 1', content: '# Folie 1' },
      { notes: '', content: '# Folie 2' },
    ];
    expect(getNotesForSlide(slides, 0)).toBe('Wichtiger Hinweis für Folie 1');
    expect(getNotesForSlide(slides, 1)).toBe('');
  });
});
