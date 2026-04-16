import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractNotes, removeNotesComment, setNotes } from '../../lib/markdown.ts';

// Feature: slide-notes, Property 1: Notes-Extraktion ist positionsunabhängig
describe('extractNotes', () => {
  it('Property 1: Notes-Extraktion ist positionsunabhängig', () => {
    // Validates: Requirements 1.1, 1.4
    fc.assert(
      fc.property(
        // before must not contain a notes comment (would interfere with extraction)
        fc.string().filter(s => !s.includes('<!--notes')),
        // Notes text must not contain '-->' which would prematurely close the comment
        fc.string().filter(s => !s.includes('-->')),
        fc.constantFrom('start', 'middle', 'end') as fc.Arbitrary<'start' | 'middle' | 'end'>,
        (before, notesText, position) => {
          // Build a notes comment with the given text (no extra whitespace around content)
          const comment = `<!--notes:${notesText}-->`;
          let content: string;
          if (position === 'start') {
            content = `${comment}\n${before}`;
          } else if (position === 'end') {
            content = `${before}\n${comment}`;
          } else {
            // middle: split before in half
            const mid = Math.floor(before.length / 2);
            content = `${before.slice(0, mid)}\n${comment}\n${before.slice(mid)}`;
          }
          expect(extractNotes(content)).toBe(notesText);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: slide-notes, Property 2: Fehlender Notizen-Kommentar ergibt leeren String
  it('Property 2: extractNotes returns "" for content without <!--notes comment', () => {
    // Validates: Requirements 1.2
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('<!--notes')),
        (content) => {
          expect(extractNotes(content)).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: slide-notes, Property 3: removeNotesComment hinterlässt keinen Notizen-Kommentar
describe('removeNotesComment', () => {
  it('Property 3: result contains no <!--notes: substring for any input', () => {
    // Validates: Requirements 1.3, 7.1
    fc.assert(
      fc.property(
        fc.string(),
        (content) => {
          const result = removeNotesComment(content);
          expect(result).not.toContain('<!--notes:');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: slide-notes, Property 4: Round-Trip setNotes / extractNotes
describe('setNotes / extractNotes round-trip', () => {
  it('Property 4: extractNotes(setNotes(removeNotesComment(content), notes)) === notes', () => {
    // Validates: Requirements 1.5, 2.3, 2.4, 6.1
    fc.assert(
      fc.property(
        fc.string(),
        // Notes text must not contain '-->' which would break the comment syntax
        fc.string().filter(s => !s.includes('-->')),
        (content, notes) => {
          const cleanContent = removeNotesComment(content);
          expect(extractNotes(setNotes(cleanContent, notes))).toBe(notes);
        }
      ),
      { numRuns: 100 }
    );
  });
});
