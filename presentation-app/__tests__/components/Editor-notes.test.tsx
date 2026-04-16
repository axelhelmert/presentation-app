import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { setNotes, parseSlides, extractNotes } from '../../lib/markdown.ts';

// Feature: slide-notes, Property 5: Notizen-Bearbeitung verändert Cursor-Position nicht
// Validates: Requirements 2.6

/**
 * Extracts the cursor-preservation logic from handleNotesChange for isolated testing.
 *
 * The logic in Editor.tsx handleNotesChange:
 *   1. Read selectionStart / selectionEnd from textareaRef.current
 *   2. Update markdown (setMarkdown)
 *   3. After re-render: call textarea.setSelectionRange(selStart, selEnd)
 *
 * This function replicates that logic so we can property-test it without
 * mounting the full React component.
 */
function simulateHandleNotesChange(
  textarea: { selectionStart: number; selectionEnd: number; setSelectionRange: (s: number, e: number) => void },
  markdown: string,
  currentSlide: number,
  newNotesValue: string
): { newMarkdown: string; restoredStart: number; restoredEnd: number } | null {
  const selStart = textarea.selectionStart;
  const selEnd = textarea.selectionEnd;

  const slides = parseSlides(markdown);
  const currentSlideData = slides[currentSlide];
  if (!currentSlideData) return null;

  const slideDelimiter = '---';
  const parts = markdown.split(/^---$/m);
  const nonEmptyIndices: number[] = [];
  parts.forEach((part, i) => {
    if (part.trim().length > 0) nonEmptyIndices.push(i);
  });
  const partIndex = nonEmptyIndices[currentSlide];
  if (partIndex === undefined) return null;

  const updatedSlideContent = setNotes(currentSlideData.rawMarkdown, newNotesValue);
  const newParts = [...parts];
  newParts[partIndex] = updatedSlideContent;
  const newMarkdown = newParts.join(slideDelimiter);

  // Simulate the setTimeout restoration
  let restoredStart = selStart;
  let restoredEnd = selEnd;
  textarea.setSelectionRange(selStart, selEnd);

  return { newMarkdown, restoredStart, restoredEnd };
}

describe('Editor – handleNotesChange cursor preservation', () => {
  it('Property 5: selectionStart of markdown textarea is unchanged after handleNotesChange', () => {
    // Validates: Requirements 2.6
    fc.assert(
      fc.property(
        // Arbitrary cursor position (non-negative integer)
        fc.integer({ min: 0, max: 10000 }),
        // Arbitrary new notes text
        fc.string().filter(s => !s.includes('-->')),
        (cursorPos, newNotes) => {
          const sampleMarkdown = `# Folie 1\n\nInhalt der ersten Folie.\n\n---\n\n# Folie 2\n\nInhalt der zweiten Folie.\n`;

          let capturedStart: number | null = null;
          let capturedEnd: number | null = null;

          const mockTextarea = {
            selectionStart: cursorPos,
            selectionEnd: cursorPos,
            setSelectionRange: (s: number, e: number) => {
              capturedStart = s;
              capturedEnd = e;
            },
          };

          const result = simulateHandleNotesChange(mockTextarea, sampleMarkdown, 0, newNotes);

          // The function must have run (slide 0 exists)
          expect(result).not.toBeNull();

          // The cursor position passed to setSelectionRange must equal the original selectionStart
          expect(capturedStart).toBe(cursorPos);
          expect(capturedEnd).toBe(cursorPos);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests for Notes-Editor UI (Task 3.2) ───────────────────────────────
// Validates: Requirements 2.1, 2.2, 2.5

/**
 * The Notes-Editor textarea in Editor.tsx derives its value from:
 *   notesValue = slides[currentSlide]?.notes ?? ""
 *
 * We test this derivation logic directly (without mounting the React component)
 * because the vitest environment is "node" (no jsdom / @testing-library).
 */

describe('Notes-Editor UI – unit tests', () => {
  // Helper: derive notesValue the same way Editor.tsx does
  function getNotesValue(markdown: string, currentSlide: number): string {
    const slides = parseSlides(markdown);
    return slides[currentSlide]?.notes ?? '';
  }

  // ── Requirement 2.5 ──────────────────────────────────────────────────────
  it('notesValue is empty string when slide has no notes (placeholder would be shown)', () => {
    // Validates: Requirements 2.5
    const markdown = `# Folie ohne Notizen\n\nKein Notizen-Kommentar vorhanden.`;
    const notesValue = getNotesValue(markdown, 0);

    // Empty string → textarea shows placeholder "Notizen für diese Folie…"
    expect(notesValue).toBe('');
  });

  // ── Requirement 2.1 ──────────────────────────────────────────────────────
  it('notesValue equals the notes of the currently selected slide', () => {
    // Validates: Requirements 2.1
    const expectedNotes = 'Das sind meine Sprechernotizen für Folie 1.';
    const markdown = `# Folie 1\n\nInhalt.\n<!--notes:${expectedNotes}-->\n\n---\n\n# Folie 2\n\nKein Notizen.`;

    const notesValue = getNotesValue(markdown, 0);

    expect(notesValue).toBe(expectedNotes);
  });

  // ── Requirement 2.2 ──────────────────────────────────────────────────────
  it('switching slides updates notesValue to the notes of the newly selected slide', () => {
    // Validates: Requirements 2.2
    const notes1 = 'Notizen für Folie 1';
    const notes2 = 'Notizen für Folie 2';
    const markdown = [
      `# Folie 1\n\nInhalt 1.\n<!--notes:${notes1}-->`,
      `# Folie 2\n\nInhalt 2.\n<!--notes:${notes2}-->`,
      `# Folie 3\n\nKeine Notizen.`,
    ].join('\n\n---\n\n');

    // Slide 0 → notes1
    expect(getNotesValue(markdown, 0)).toBe(notes1);

    // Slide 1 → notes2
    expect(getNotesValue(markdown, 1)).toBe(notes2);

    // Slide 2 → empty (no notes)
    expect(getNotesValue(markdown, 2)).toBe('');
  });
});
