export interface Theme {
  id: string;
  name: string;
  background: string;
  textColor: string;
  headingColor: string;
  accentColor: string;
  codeBackground: string;
  borderColor: string;
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    background: '#ffffff',
    textColor: '#111827',
    headingColor: '#111827',
    accentColor: '#2563eb',
    codeBackground: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  {
    id: 'dark',
    name: 'Dark',
    background: '#111827',
    textColor: '#f3f4f6',
    headingColor: '#ffffff',
    accentColor: '#60a5fa',
    codeBackground: '#1f2937',
    borderColor: '#374151',
  },
  {
    id: 'blue',
    name: 'Blue Ocean',
    background: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)',
    textColor: '#1f2937',
    headingColor: '#1e3a8a',
    accentColor: '#2563eb',
    codeBackground: '#ffffff',
    borderColor: '#bfdbfe',
  },
  {
    id: 'forest',
    name: 'Forest',
    background: 'linear-gradient(to bottom right, #f0fdf4, #d1fae5)',
    textColor: '#1f2937',
    headingColor: '#14532d',
    accentColor: '#16a34a',
    codeBackground: '#ffffff',
    borderColor: '#bbf7d0',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background: 'linear-gradient(to bottom right, #fff7ed, #fecaca, #fce7f3)',
    textColor: '#1f2937',
    headingColor: '#7c2d12',
    accentColor: '#dc2626',
    codeBackground: '#ffffff',
    borderColor: '#fed7aa',
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    background: 'linear-gradient(to bottom right, #faf5ff, #e0e7ff)',
    textColor: '#1f2937',
    headingColor: '#581c87',
    accentColor: '#9333ea',
    codeBackground: '#ffffff',
    borderColor: '#e9d5ff',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: '#f9fafb',
    textColor: '#111827',
    headingColor: '#000000',
    accentColor: '#374151',
    codeBackground: '#ffffff',
    borderColor: '#d1d5db',
  },
  {
    id: 'night',
    name: 'Night Sky',
    background: 'linear-gradient(to bottom right, #111827, #1e3a8a, #581c87)',
    textColor: '#f3f4f6',
    headingColor: '#ffffff',
    accentColor: '#22d3ee',
    codeBackground: '#1f2937',
    borderColor: '#6b21a8',
  },
];

export const fontSizes = [
  { id: 'small', name: 'Klein', size: '0.875rem', lineHeight: '1.5' },
  { id: 'medium', name: 'Normal', size: '1rem', lineHeight: '1.75' },
  { id: 'large', name: 'Groß', size: '1.125rem', lineHeight: '1.75' },
  { id: 'xl', name: 'Extra Groß', size: '1.25rem', lineHeight: '1.75' },
];

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}
