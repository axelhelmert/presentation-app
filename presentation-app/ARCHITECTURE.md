# Presentation App - Architektur Dokumentation

## Überblick

Eine markdown-basierte Präsentations-App mit Live-Vorschau, Theming-Unterstützung und PDF-Export. Die Anwendung läuft vollständig im Browser und benötigt keine Backend-Infrastruktur.

## Tech Stack

### Core Framework
- **Next.js 16.2.2** - React Framework mit App Router
- **React 19.2.4** - UI Bibliothek
- **TypeScript 5** - Type Safety

### Markdown Processing Pipeline
- **unified** - Text-Processing-Framework
- **remark-parse** - Markdown Parser
- **remark-gfm** - GitHub Flavored Markdown (Tabellen, Strikethrough, etc.)
- **remark-math** - LaTeX Math-Unterstützung
- **rehype-raw** - HTML-in-Markdown-Unterstützung
- **rehype-katex** - Math-Rendering mit KaTeX
- **katex** - LaTeX Math Rendering Engine

### Styling
- **Tailwind CSS 4** - Utility-First CSS Framework
- **Custom CSS** - Theme Variables und Prose Styling

### Export & Storage
- **jsPDF** - PDF-Generierung
- **html2canvas** - DOM zu Canvas Rendering
- **IndexedDB** - Browser-Datenbank für Bilder
- **LocalStorage** - Persistenz für Text und Einstellungen

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Editor Component (Main)                │    │
│  │  - Markdown Input                                   │    │
│  │  - Slide Management                                 │    │
│  │  - Import/Export                                    │    │
│  │  - Image Upload                                     │    │
│  └───────┬────────────────────────────────┬───────────┘    │
│          │                                 │                 │
│          ▼                                 ▼                 │
│  ┌──────────────┐                ┌──────────────────┐      │
│  │ SlidePreview │                │ PresentationMode │      │
│  │  - Live View │                │  - Full Screen   │      │
│  │  - Themes    │                │  - Navigation    │      │
│  └──────────────┘                └──────────────────┘      │
│          │                                 │                 │
│          └────────────┬────────────────────┘                │
│                       ▼                                      │
│          ┌─────────────────────────┐                        │
│          │  Markdown Processing    │                        │
│          │  - parseSlides()        │                        │
│          │  - renderMarkdownToHTML │                        │
│          └─────────────────────────┘                        │
│                       │                                      │
│          ┌────────────┴────────────┐                        │
│          ▼                          ▼                        │
│  ┌──────────────┐          ┌──────────────┐               │
│  │ LocalStorage │          │  IndexedDB   │               │
│  │  - Markdown  │          │  - Images    │               │
│  │  - Theme     │          │  (compressed)│               │
│  │  - Font Size │          └──────────────┘               │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Komponenten

### 1. Editor (`components/Editor.tsx`)
**Hauptkomponente** - Orchestriert die gesamte Anwendung

**State Management:**
- `markdown` - Markdown-Content
- `slides` - Geparste Slides
- `currentSlide` - Aktive Folie
- `isPresentationMode` - Präsentationsmodus-Flag
- `selectedTheme` - Aktives Theme
- `selectedFontSize` - Schriftgröße
- `uploadedImages` - Bild-Referenzen aus IndexedDB

**Features:**
- Split-Screen Editor/Preview
- Auto-Save (debounced)
- Markdown Import/Export
- Bild-Upload mit Kompression
- Tabellen-Einfüge-Helper
- PDF-Export-Steuerung

### 2. SlidePreview (`components/SlidePreview.tsx`)
**Vorschau-Komponente** - Rendert einzelne Folien

**Features:**
- HTML-Rendering aus Markdown
- Theme-Anwendung via CSS Variables
- Image-Resolution aus IndexedDB
- Caching für Performance (Map-basiert, max 50 Einträge)
- Title-Slide spezielle Formatierung
- Full-Image-Slide Erkennung
- Logo-Overlay (oben rechts)
- Footer mit Copyright

### 3. PresentationMode (`components/PresentationMode.tsx`)
**Vollbild-Präsentation** - Keyboard-gesteuerte Navigation

**Features:**
- Full-Screen API
- Keyboard Shortcuts (←/→, Leertaste, Escape)
- Slide-Zähler
- Theme-/Font-Übernahme vom Editor
- Clean Exit zurück zum Editor

## Datenfluss

### Markdown zu HTML Pipeline

```
Markdown Input
      │
      ▼
parseSlides() ───────────────────┐
(Split by "---")                  │
      │                           │
      ▼                           │
Slide Objects                     │
      │                           │
      ▼                           ▼
renderMarkdownToHTML()  ←──  Image Resolution
      │                     (IndexedDB Lookup)
      ▼
unified Pipeline:
  1. remarkParse        (Markdown → MDAST)
  2. remarkGfm          (Tables, Strikethrough)
  3. remarkMath         (LaTeX Math)
  4. remarkRehype       (MDAST → HAST, allow HTML)
  5. rehypeRaw          (Parse HTML in Markdown)
  6. rehypeKatex        (Render Math)
  7. rehypeStringify    (HAST → HTML)
      │
      ▼
HTML String
      │
      ▼
dangerouslySetInnerHTML
      │
      ▼
Rendered Slide
```

### Bild-Upload Flow

```
User wählt Bild
      │
      ▼
FileReader → DataURL
      │
      ▼
compressImage()
(Canvas-basiert, max 1920px, 85% quality)
      │
      ▼
saveImage() → IndexedDB
      │
      ├─── Store: {name, dataUrl, timestamp}
      └─── Update State: uploadedImages
      │
      ▼
Insert Markdown: ![alt](filename.jpg)
      │
      ▼
Rendering: Lookup dataUrl by filename
```

## Persistenz

### LocalStorage
**Schlüssel:**
- `presentation-markdown` - Vollständiger Markdown-Content
- `presentation-theme` - Theme ID
- `presentation-fontsize` - Font Size ID

**Auto-Save:** Triggered bei jeder Änderung (useEffect)

### IndexedDB
**Datenbank:** `PresentationImagesDB`
**Object Store:** `images`

**Schema:**
```typescript
interface StoredImage {
  name: string;      // Dateiname (Primary Key)
  dataUrl: string;   // Base64-kodiertes Bild (komprimiert)
  timestamp: number; // Upload-Zeit
}
```

**Operationen:**
- `saveImage(image)` - Speichern/Überschreiben
- `getAllImages()` - Alle Bilder laden
- Automatisches Cleanup von altem LocalStorage-Cache

## Theme-System

### Theme Interface
```typescript
interface Theme {
  id: string;
  name: string;
  background: string;        // Color | Gradient
  textColor: string;
  headingColor: string;
  accentColor: string;
  codeBackground: string;
  borderColor: string;
}
```

### Verfügbare Themes
1. **Default** - Clean White
2. **Dark** - Dark Gray
3. **Blue Ocean** - Blue Gradient
4. **Forest** - Green Gradient
5. **Sunset** - Warm Gradient
6. **Purple Haze** - Purple Gradient
7. **Minimal** - Minimal Gray
8. **Night Sky** - Dark Blue/Purple Gradient

### Theme-Anwendung
Themes werden über CSS Custom Properties angewendet:
```css
.slide-container {
  --theme-text: #...;
  --theme-heading: #...;
  --theme-accent: #...;
  --theme-code-bg: #...;
}
```

## Styling-Hierarchie

### Listen-Ebenen
- **Level 1:** Große Schrift (1.15em), mehr Abstand (0.75em)
- **Level 2+:** Kleine Schrift (0.9em), enger Abstand (0.25em), line-height 1.3

### Listen in Tabellen
Kompakte Darstellung mit reduzierten Margins und Padding für optimale Platznutzung.

### Tabellen
- Max-width: 1200px
- Größere Schrift: 1.1em
- Erste Spalte: Zentriert, bold, feste Breite (80px)
- Leere Header: Transparenter Hintergrund

### Bilder
- Max-width: 90%
- Max-height: 60vh
- Zentriert
- Object-fit: contain

## PDF-Export

### Prozess
1. Erstelle verstecktes Container-Element
2. Für jede Folie:
   - Rendere HTML mit Theme-Styling
   - Konvertiere zu Canvas (html2canvas)
   - Füge Canvas als Bild in PDF ein (jsPDF)
3. Cleanup & Download

### Format
- A4 Querformat (Landscape)
- 1 Folie = 1 Seite
- Logo-Integration
- Theme-Farben erhalten

## Keyboard Shortcuts

### Editor-Modus
- **F** - Präsentationsmodus starten

### Präsentations-Modus
- **→ / Leertaste** - Nächste Folie
- **←** - Vorherige Folie
- **Escape / Q** - Präsentation beenden
- **F** - Fullscreen toggle

## Sicherheit

### Content Security
- `dangerouslySetInnerHTML` nur für vertrauenswürdigen Markdown-Output
- Keine externen Ressourcen
- Bilder werden lokal komprimiert und gespeichert

### Data Privacy
- Alle Daten bleiben im Browser (LocalStorage/IndexedDB)
- Keine Server-Kommunikation
- Keine Tracking-Tools

## Performance-Optimierungen

1. **Render-Caching:** Bereits gerenderte Folien werden gecacht (Map, max 50)
2. **Bild-Kompression:** Automatische Kompression auf max 1920px, 85% JPEG-Quality
3. **Debounced Auto-Save:** Verhindert excessive LocalStorage-Writes
4. **Lazy Image Loading:** Bilder werden nur bei Bedarf aus IndexedDB geladen
5. **Memoization:** React useCallback/useMemo wo sinnvoll

## Limitierungen

1. **Browser Storage Limits:**
   - LocalStorage: ~5-10 MB
   - IndexedDB: ~50 MB (variiert je nach Browser)

2. **PDF Export:**
   - Performance hängt von Folien-Anzahl ab
   - Komplexe Layouts können Rendering-Zeit erhöhen

3. **Keine Synchronisation:**
   - Kein Multi-Device-Sync
   - Jedes Gerät hat eigenen Datenstand

## Erweiterungsmöglichkeiten

### Kurzfristig
- Slide-Notizen für Präsentierende
- Timer/Countdown
- Export zu anderen Formaten (PPTX, HTML)
- Slide-Vorlagen (Templates)

### Mittelfristig
- Backend-Integration für Multi-Device-Sync
- Kollaboratives Editing
- Versionierung
- Presenter-View mit Notizen

### Langfristig
- Video-Embedding
- Animationen zwischen Folien
- Remote-Präsentation (WebRTC)
- Cloud-Storage-Integration

## Deployment

### Development
```bash
npm run dev
```
Server läuft auf http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Static Export
Next.js kann zu statischem HTML exportiert werden:
```bash
next build && next export
```
Dann deploybar auf beliebigem Static-Host (GitHub Pages, Netlify, Vercel, etc.)

## Maintenance

### Dependencies Updates
Regelmäßige Updates empfohlen für:
- Next.js (Breaking Changes beachten!)
- React
- Security-relevante Dependencies

### Browser Compatibility
Getestet mit:
- Chrome/Edge (Chromium)
- Firefox
- Safari

IndexedDB und CSS Custom Properties werden benötigt.
