import { describe, it, expect } from 'vitest';
import { preprocessEmbeds } from '../../lib/markdown.ts';

describe('preprocessEmbeds', () => {
  it('replaces a bare :::embed line with an iframe carrying the url', () => {
    const out = preprocessEmbeds(':::embed https://example.com');
    expect(out).toContain('<iframe');
    expect(out).toContain('src="https://example.com"');
  });

  it('defaults height to 70vh when none is given', () => {
    const out = preprocessEmbeds(':::embed https://example.com');
    expect(out).toContain('height:70vh');
  });

  it('honours height=NNN with explicit px/vh/% unit', () => {
    expect(preprocessEmbeds(':::embed https://example.com height=600px')).toContain('height:600px');
    expect(preprocessEmbeds(':::embed https://example.com height=80vh')).toContain('height:80vh');
    expect(preprocessEmbeds(':::embed https://example.com height=50%')).toContain('height:50%');
  });

  it('treats a unit-less height value as px', () => {
    const out = preprocessEmbeds(':::embed https://example.com height=400');
    expect(out).toContain('height:400px');
  });

  it('escapes double quotes in the url to prevent attribute injection', () => {
    const out = preprocessEmbeds(':::embed https://evil"onerror=x"');
    expect(out).not.toContain('"onerror=x"');
    expect(out).toContain('&quot;onerror=x&quot;');
  });

  it('surrounds the iframe with blank lines so rehype-raw treats it as block HTML', () => {
    const out = preprocessEmbeds('before\n:::embed https://example.com\nafter');
    expect(out).toMatch(/before\n\n<iframe[\s\S]*<\/iframe>\n\nafter/);
  });

  it('ignores lines that look similar but are not the directive', () => {
    const input = 'just text\n\n:::embed-but-not-really\n\n  :::embed https://indented.com';
    expect(preprocessEmbeds(input)).toBe(input);
  });
});
