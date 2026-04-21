import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseSlides } from '../../lib/markdown.ts';

// Helper: normalize markdown for semantic comparison
// Splits on --- boundaries, trims each part, then normalizes whitespace
function normalize(s: string): string {
  return s
    .split(/\n?---\n?/)
    .map(part => part.trim().replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n'))
    .filter(part => part.length > 0)
    .join('\n---\n');
}

// Feature: chapter-structure, Property 1: Abwärtskompatibilität rawMarkdown Round-Trip
describe('parseSlides – Property 1: Abwärtskompatibilität rawMarkdown Round-Trip', () => {
  it('Abwärtskompatibilität: rawMarkdown-Join ist äquivalent zum Original', () => {
    // Validates: Requirements 1.4, 7.1
    fc.assert(
      fc.property(
        // Markdown ohne === generieren; jeder Teil hat mindestens ein nicht-leeres Zeichen
        fc.array(
          fc.string({ minLength: 1 }).filter(s => !s.includes('===') && s.trim().length > 0),
          { minLength: 1 }
        ).map(parts => parts.join('\n---\n')),
        (markdown) => {
          const slides = parseSlides(markdown);
          const rejoined = slides.map(s => s.rawMarkdown).join('\n---\n');
          // Semantische Äquivalenz: nach Normalisierung identisch
          expect(normalize(rejoined)).toBe(normalize(markdown));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chapter-structure, Property 2: Chapter-Titel Round-Trip
describe('parseSlides – Property 2: Chapter-Titel Round-Trip', () => {
  it('chapterTitle-Felder stimmen exakt mit den ursprünglichen Chapter-Titeln überein', () => {
    // Validates: Requirements 1.2, 4.1
    const arbitrarySlideContent = fc.string()
      .filter(s => !s.includes('===') && !s.includes('\n---\n') && s.trim().length > 0);

    const arbitraryChapter = fc.record({
      title: fc.string({ minLength: 1 }).filter(s => !s.includes('\n') && s.trim() === s && s.trim().length > 0),
      slides: fc.array(arbitrarySlideContent, { minLength: 1, maxLength: 5 }),
    });

    const arbitraryPresentation = fc.record({
      titleSlide: fc.option(arbitrarySlideContent),
      chapters: fc.array(arbitraryChapter, { minLength: 1, maxLength: 5 }),
    }).map(({ titleSlide, chapters }) => {
      const parts: string[] = [];
      if (titleSlide) parts.push(titleSlide);
      for (const chapter of chapters) {
        parts.push(`=== ${chapter.title}`);
        parts.push(chapter.slides.join('\n---\n'));
      }
      return { markdown: parts.join('\n---\n'), chapters };
    });

    fc.assert(
      fc.property(
        arbitraryPresentation,
        ({ markdown, chapters }) => {
          const slides = parseSlides(markdown);
          const slidesWithChapter = slides.filter(s => s.chapterTitle !== undefined);

          // Every slide with a chapterTitle must have a title that matches one of the original chapter titles
          const originalTitles = new Set(chapters.map(c => c.title));
          slidesWithChapter.forEach(slide => {
            expect(originalTitles.has(slide.chapterTitle!)).toBe(true);
          });

          // Every original chapter title must appear in at least one slide's chapterTitle
          chapters.forEach(chapter => {
            const found = slidesWithChapter.some(s => s.chapterTitle === chapter.title);
            expect(found).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chapter-structure, Property 3: chapterTitle und chapterIndex konsistent
describe('parseSlides – Property 3: chapterTitle und chapterIndex konsistent', () => {
  it('chapterTitle und chapterIndex sind immer gemeinsam definiert oder undefiniert', () => {
    // Validates: Requirements 4.5, 4.1, 4.2
    const arbitrarySlideContent = fc.string()
      .filter(s => !s.includes('===') && !s.includes('\n---\n'));

    const arbitraryChapter = fc.record({
      title: fc.string({ minLength: 1 }).filter(s => !s.includes('\n')),
      slides: fc.array(arbitrarySlideContent, { minLength: 1, maxLength: 5 }),
    });

    const arbitraryPresentation = fc.record({
      titleSlide: fc.option(arbitrarySlideContent),
      chapters: fc.array(arbitraryChapter, { minLength: 0, maxLength: 5 }),
    }).map(({ titleSlide, chapters }) => {
      const parts: string[] = [];
      if (titleSlide) parts.push(titleSlide);
      for (const chapter of chapters) {
        parts.push(`=== ${chapter.title}`);
        parts.push(chapter.slides.join('\n---\n'));
      }
      return parts.join('\n---\n');
    });

    fc.assert(
      fc.property(
        arbitraryPresentation,
        (markdown) => {
          const slides = parseSlides(markdown);
          slides.forEach(slide => {
            expect(slide.chapterTitle !== undefined)
              .toBe(slide.chapterIndex !== undefined);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chapter-structure, Property 4: Agenda-Folie ist zweite Folie bei Chapter-Präsentationen
describe('parseSlides – Property 4: Agenda-Folie ist zweite Folie bei Chapter-Präsentationen', () => {
  it('slides[1].isAgendaSlide === true wenn Titelfolie und mindestens ein Chapter vorhanden', () => {
    // Validates: Requirements 2.1, 2.4
    const arbitrarySlideContent = fc.string()
      .filter(s => !s.includes('===') && !s.includes('\n---\n'));

    const arbitraryChapter = fc.record({
      title: fc.string({ minLength: 1 }).filter(s => !s.includes('\n')),
      slides: fc.array(arbitrarySlideContent.filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
    });

    const arbitraryPresentationWithTitleAndChapters = fc.record({
      titleSlide: arbitrarySlideContent.filter(s => s.trim().length > 0),
      chapters: fc.array(arbitraryChapter, { minLength: 1, maxLength: 5 }),
    }).map(({ titleSlide, chapters }) => {
      const parts: string[] = [];
      parts.push(titleSlide);
      for (const chapter of chapters) {
        parts.push(`=== ${chapter.title}`);
        parts.push(chapter.slides.join('\n---\n'));
      }
      return parts.join('\n---\n');
    });

    fc.assert(
      fc.property(
        arbitraryPresentationWithTitleAndChapters,
        (markdown) => {
          const slides = parseSlides(markdown);
          expect(slides[1].isAgendaSlide).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chapter-structure, Property 5: Agenda-Folie enthält alle Chapter-Titel
describe('parseSlides – Property 5: Agenda-Folie enthält alle Chapter-Titel', () => {
  it('Agenda-Folie enthält jeden Chapter-Titel im content-Feld', () => {
    // Validates: Requirements 2.2, 2.5
    const arbitrarySlideContent = fc.string()
      .filter(s => !s.includes('===') && !s.includes('\n---\n') && s.trim().length > 0);

    const arbitraryChapter = fc.record({
      title: fc.string({ minLength: 1 }).filter(s => !s.includes('\n') && s.trim() === s && s.trim().length > 0),
      slides: fc.array(arbitrarySlideContent, { minLength: 1, maxLength: 5 }),
    });

    fc.assert(
      fc.property(
        fc.array(arbitraryChapter, { minLength: 1, maxLength: 5 }),
        (chapters) => {
          const parts: string[] = [];
          for (const chapter of chapters) {
            parts.push(`=== ${chapter.title}`);
            parts.push(chapter.slides.join('\n---\n'));
          }
          const markdown = parts.join('\n---\n');

          const slides = parseSlides(markdown);
          const agendaSlide = slides.find(s => s.isAgendaSlide === true);

          expect(agendaSlide).toBeDefined();
          chapters.forEach(chapter => {
            expect(agendaSlide!.content).toContain(chapter.title);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chapter-structure, Property 6: Keine Agenda-Folie ohne Chapter-Syntax
describe('parseSlides – Property 6: Keine Agenda-Folie ohne Chapter-Syntax', () => {
  it('Kein Slide hat isAgendaSlide === true wenn das Markdown kein === enthält', () => {
    // Validates: Requirements 2.6
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('===')),
        (markdown) => {
          const slides = parseSlides(markdown);
          slides.forEach(slide => {
            expect(slide.isAgendaSlide).not.toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chapter-structure, Property 7: Chapter-Header nur in content, nicht in rawMarkdown
describe('parseSlides – Property 7: Chapter-Header nur in content, nicht in rawMarkdown', () => {
  it('rawMarkdown beginnt nicht mit ## chapterTitle für Slides mit chapterTitle', () => {
    // Validates: Requirements 3.3
    const arbitrarySlideContent = fc.string()
      .filter(s => !s.includes('===') && !s.includes('\n---\n'));

    const arbitraryChapter = fc.record({
      title: fc.string({ minLength: 1 }).filter(s => !s.includes('\n')),
      slides: fc.array(arbitrarySlideContent, { minLength: 1, maxLength: 5 }),
    });

    const arbitraryPresentation = fc.record({
      titleSlide: fc.option(arbitrarySlideContent),
      chapters: fc.array(arbitraryChapter, { minLength: 1, maxLength: 5 }),
    }).map(({ titleSlide, chapters }) => {
      const parts: string[] = [];
      if (titleSlide) parts.push(titleSlide);
      for (const chapter of chapters) {
        parts.push(`=== ${chapter.title}`);
        parts.push(chapter.slides.join('\n---\n'));
      }
      return parts.join('\n---\n');
    });

    fc.assert(
      fc.property(
        arbitraryPresentation,
        (markdown) => {
          const slides = parseSlides(markdown);
          slides
            .filter(s => s.chapterTitle !== undefined)
            .forEach(slide => {
              expect(slide.rawMarkdown.startsWith(`## ${slide.chapterTitle}`)).toBe(false);
            });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chapter-structure, Property 8: Chapter-Header steht am Anfang von content
describe('parseSlides – Property 8: Chapter-Header steht am Anfang von content', () => {
  it('slide.content beginnt mit ## chapterTitle für alle Slides mit chapterTitle', () => {
    // Validates: Requirements 3.1
    const arbitrarySlideContent = fc.string()
      .filter(s => !s.includes('===') && !s.includes('\n---\n'));

    const arbitraryChapter = fc.record({
      title: fc.string({ minLength: 1 }).filter(s => !s.includes('\n')),
      slides: fc.array(arbitrarySlideContent, { minLength: 1, maxLength: 5 }),
    });

    const arbitraryPresentation = fc.record({
      titleSlide: fc.option(arbitrarySlideContent),
      chapters: fc.array(arbitraryChapter, { minLength: 1, maxLength: 5 }),
    }).map(({ titleSlide, chapters }) => {
      const parts: string[] = [];
      if (titleSlide) parts.push(titleSlide);
      for (const chapter of chapters) {
        parts.push(`=== ${chapter.title}`);
        parts.push(chapter.slides.join('\n---\n'));
      }
      return parts.join('\n---\n');
    });

    fc.assert(
      fc.property(
        arbitraryPresentation,
        (markdown) => {
          const slides = parseSlides(markdown);
          slides
            .filter(s => s.chapterTitle !== undefined)
            .forEach(slide => {
              expect(slide.content.startsWith(`## ${slide.chapterTitle}`)).toBe(true);
            });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Task 2.4: Unit-Tests für buildAgendaSlide
import { buildAgendaSlide } from '../../lib/markdown.ts';

describe('buildAgendaSlide', () => {
  it('Agenda-Folie beginnt mit ## Agenda', () => {
    const slide = buildAgendaSlide(['Einführung', 'Hauptteil'], 1);
    expect(slide.content).toMatch(/^## Agenda/);
  });

  it('Agenda-Folie enthält nummerierte Liste aller Chapter-Titel', () => {
    const slide = buildAgendaSlide(['Einführung', 'Hauptteil'], 1);
    expect(slide.content).toContain('1. Einführung');
    expect(slide.content).toContain('2. Hauptteil');
  });

  it('isAgendaSlide === true', () => {
    const slide = buildAgendaSlide(['Einführung'], 1);
    expect(slide.isAgendaSlide).toBe(true);
  });

  it('rawMarkdown === ""', () => {
    const slide = buildAgendaSlide(['Einführung'], 1);
    expect(slide.rawMarkdown).toBe('');
  });

  it('chapterTitle und chapterIndex sind undefined', () => {
    const slide = buildAgendaSlide(['Einführung'], 1);
    expect(slide.chapterTitle).toBeUndefined();
    expect(slide.chapterIndex).toBeUndefined();
  });

  it('Leere Chapter-Liste → content ist "## Agenda\\n\\n"', () => {
    const slide = buildAgendaSlide([], 0);
    expect(slide.content).toBe('## Agenda\n\n');
  });

  it('Einzelner Chapter-Titel → nummerierte Liste mit einem Eintrag', () => {
    const slide = buildAgendaSlide(['Einziges Kapitel'], 2);
    expect(slide.content).toContain('1. Einziges Kapitel');
    expect(slide.content).not.toContain('2.');
  });
});

// Task 3.9: Unit-Tests für parseSlides Edge-Cases
describe('parseSlides – Edge-Cases', () => {
  it('parseSlides("") → []', () => {
    expect(parseSlides('')).toEqual([]);
  });

  it('parseSlides("===") → []', () => {
    expect(parseSlides('===')).toEqual([]);
  });

  it('parseSlides("===\\n===") → []', () => {
    expect(parseSlides('===\n===')).toEqual([]);
  });

  it('Chapter ohne Folien wird ignoriert', () => {
    const md = '=== Kapitel A\n\n=== Kapitel B\n\nFolie 1';
    const slides = parseSlides(md);
    // Only slides from Kapitel B (which has content), plus agenda
    expect(slides.some(s => s.chapterTitle === 'Kapitel A')).toBe(false);
  });

  it('Chapter-Header steht vor #-Überschrift (Requirement 3.2)', () => {
    const md = '=== Einführung\n\n# Haupttitel\n\nInhalt';
    const slides = parseSlides(md);
    const chapterSlide = slides.find(s => s.chapterTitle === 'Einführung');
    expect(chapterSlide).toBeDefined();
    expect(chapterSlide!.content).toMatch(/^## Einführung\n/);
    expect(chapterSlide!.content).toContain('# Haupttitel');
  });

  it('rawMarkdown enthält keinen Chapter-Header', () => {
    const md = '=== Einführung\n\nFolieninhalt';
    const slides = parseSlides(md);
    const chapterSlide = slides.find(s => s.chapterTitle === 'Einführung');
    expect(chapterSlide).toBeDefined();
    expect(chapterSlide!.rawMarkdown).not.toContain('## Einführung');
  });

  it('Agenda-Folie ist slides[1] wenn Titelfolie vorhanden', () => {
    const md = '# Titelfolie\n\n=== Kapitel 1\n\nFolie 1';
    const slides = parseSlides(md);
    expect(slides[1].isAgendaSlide).toBe(true);
  });

  it('Agenda-Folie ist slides[0] wenn keine Titelfolie', () => {
    const md = '=== Kapitel 1\n\nFolie 1';
    const slides = parseSlides(md);
    expect(slides[0].isAgendaSlide).toBe(true);
  });

  it('chapterTitle und chapterIndex sind konsistent', () => {
    const md = '# Titel\n\n=== Kap 1\n\nFolie A\n\n---\n\nFolie B\n\n=== Kap 2\n\nFolie C';
    const slides = parseSlides(md);
    slides.forEach(slide => {
      expect(slide.chapterTitle !== undefined).toBe(slide.chapterIndex !== undefined);
    });
  });

  it('Abwärtskompatibilität: ohne === identisches Verhalten', () => {
    const md = '# Folie 1\n\n---\n\n# Folie 2';
    const slides = parseSlides(md);
    expect(slides).toHaveLength(2);
    expect(slides[0].chapterTitle).toBeUndefined();
    expect(slides[0].chapterIndex).toBeUndefined();
    expect(slides.some(s => s.isAgendaSlide)).toBe(false);
  });
});

// Task 5.2: Unit-Tests für extractSlideInfo mit Chapter-Daten
import { extractSlideInfo } from '../../lib/slideExtractor.ts';
import type { Slide } from '../../lib/markdown.ts';

describe('extractSlideInfo – mit slides-Parameter (Chapter-Daten)', () => {
  const markdown = '# Folie 1\n\n---\n\n# Folie 2\n\n---\n\n# Folie 3';

  const slides: Slide[] = [
    {
      id: 0,
      content: '# Folie 1',
      rawMarkdown: '# Folie 1',
      notes: '',
      chapterTitle: 'Einführung',
      chapterIndex: 0,
      isAgendaSlide: false,
    },
    {
      id: 1,
      content: '# Folie 2',
      rawMarkdown: '# Folie 2',
      notes: '',
      isAgendaSlide: true,
    },
    {
      id: 2,
      content: '# Folie 3',
      rawMarkdown: '# Folie 3',
      notes: '',
      chapterTitle: 'Hauptteil',
      chapterIndex: 1,
      isAgendaSlide: false,
    },
  ];

  it('liefert korrekte chapterTitle-Felder für Chapter-Folien', () => {
    const result = extractSlideInfo(markdown, slides);
    expect(result[0].chapterTitle).toBe('Einführung');
    expect(result[2].chapterTitle).toBe('Hauptteil');
  });

  it('liefert isAgendaSlide: true für Agenda-Folie', () => {
    const result = extractSlideInfo(markdown, slides);
    expect(result[1].isAgendaSlide).toBe(true);
  });

  it('liefert korrekte chapterIndex-Werte', () => {
    const result = extractSlideInfo(markdown, slides);
    expect(result[0].chapterIndex).toBe(0);
    expect(result[2].chapterIndex).toBe(1);
  });

  it('slides ohne Chapter haben chapterTitle: undefined', () => {
    const slidesNoChapter: Slide[] = [
      { id: 0, content: '# A', rawMarkdown: '# A', notes: '' },
      { id: 1, content: '# B', rawMarkdown: '# B', notes: '' },
    ];
    const md = '# A\n\n---\n\n# B';
    const result = extractSlideInfo(md, slidesNoChapter);
    expect(result[0].chapterTitle).toBeUndefined();
    expect(result[1].chapterTitle).toBeUndefined();
  });
});

describe('extractSlideInfo – ohne slides-Parameter (Abwärtskompatibilität)', () => {
  it('liefert keine chapterTitle-Felder ohne slides-Parameter', () => {
    const md = '# Folie 1\n\n---\n\n# Folie 2';
    const result = extractSlideInfo(md);
    result.forEach(info => {
      expect(info.chapterTitle).toBeUndefined();
      expect(info.chapterIndex).toBeUndefined();
      expect(info.isAgendaSlide).toBeUndefined();
    });
  });

  it('liefert korrekte index, title und position wie bisher', () => {
    const md = '# Titel A\n\n---\n\n# Titel B';
    const result = extractSlideInfo(md);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Titel A');
    expect(result[1].title).toBe('Titel B');
    expect(result[0].index).toBe(0);
    expect(result[1].index).toBe(1);
  });
});
