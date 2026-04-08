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
- **IndexedDB** - Browser-Datenbank für Bilder und HTML-Templates
- **LocalStorage** - Persistenz für Text, Einstellungen und Custom CSS

## Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Editor Component (Main)                        │    │
│  │  - Markdown Input                                           │    │
│  │  - Slide Management                                         │    │
│  │  - Import/Export                                            │    │
│  │  - Author Management                                        │    │
│  └───┬────────────┬────────────┬────────────┬────────────────┘    │
│      │            │            │            │                       │
│      ▼            ▼            ▼            ▼                       │
│  ┌────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐             │
│  │ Image  │ │Template │ │ Custom  │ │ SlidePreview │             │
│  │Library │ │Library  │ │   CSS   │ │  - Live View │             │
│  │        │ │         │ │ Editor  │ │  - Themes    │             │
│  └────────┘ └─────────┘ └─────────┘ └──────────────┘             │
│      │            │            │            │                       │
│      └────────────┴────────────┴────────────┘                       │
│                   │                                                  │
│                   ▼                                                  │
│          ┌──────────────────┐                ┌──────────────────┐  │
│          │ PresentationMode │                │ Markdown Process │  │
│          │  - Full Screen   │◄───────────────│  - parseSlides() │  │
│          │  - Navigation    │                │  - render HTML   │  │
│          └──────────────────┘                └──────────────────┘  │
│                                                        │              │
│                   ┌────────────────────────────────────┘              │
│                   │                                                   │
│          ┌────────┴─────────┐                                        │
│          ▼                   ▼                                        │
│  ┌──────────────┐    ┌──────────────┐                               │
│  │ LocalStorage │    │  IndexedDB   │                               │
│  │  - Markdown  │    │  - Images    │                               │
│  │  - Theme     │    │  - Templates │                               │
│  │  - Font Size │    │ (compressed) │                               │
│  │  - Author    │    └──────────────┘                               │
│  │  - Custom CSS│                                                    │
│  └──────────────┘                                                    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
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
- `storedTemplates` - HTML-Template-Referenzen aus IndexedDB
- `author` - Autor-Name für Footer

**Features:**
- Split-Screen Editor/Preview
- Auto-Save (debounced) zu LocalStorage
- Markdown Import/Export
- Image Library Management
- Template Library Management
- Custom CSS Editor
- Template-Einfüge-Helper (Numbered Tables)
- PDF-Export-Steuerung
- Author Management für Footer

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
- Dynamischer Footer mit Author und Datum (© {author}, {Month} {Year})

### 3. PresentationMode (`components/PresentationMode.tsx`)
**Vollbild-Präsentation** - Keyboard-gesteuerte Navigation

**Features:**
- Full-Screen API
- Keyboard Shortcuts (←/→, Leertaste, Escape)
- Slide-Zähler
- Theme-/Font-Übernahme vom Editor
- Clean Exit zurück zum Editor

### 4. ImageLibrary (`components/ImageLibrary.tsx`)
**Bild-Verwaltungs-Modal** - Upload, Verwaltung und Einfügen von Bildern

**Features:**
- Bild-Upload mit Drag & Drop oder File-Input
- Automatische Kompression (max 1920px, 85% Quality)
- Thumbnail-Grid-Ansicht aller gespeicherten Bilder
- Bild-Einfügen in Markdown (![alt](filename.jpg))
- Bild-Löschen aus IndexedDB
- Speicher-Nutzungs-Anzeige

### 5. TemplateLibrary (`components/TemplateLibrary.tsx`)
**HTML-Template-Verwaltungs-Modal** - Management von wiederverwendbaren HTML-Snippets

**Features:**
- Upload von .html Dateien
- Template-Preview als Thumbnail
- Template-Einfügen in Markdown an Cursor-Position
- Template-Download für externe Bearbeitung
- Template-Löschen aus IndexedDB
- Vorinstallierte Standard-Templates (table-numbered, big-table-numbered)
- Auto-Load von Standard-Templates beim ersten Start

### 6. CustomCSSEditor (`components/CustomCSSEditor.tsx`)
**CSS-Editor-Modal** - Bearbeitung von Custom CSS Styles

**Features:**
- Großflächiger Textarea-Editor für CSS
- LocalStorage-Persistenz
- Download/Upload für externe Bearbeitung
- "Standards laden" Button für Standard-Template-CSS
- "Zurücksetzen" Button zum Löschen aller Änderungen
- Live-Anwendung der CSS-Änderungen via Style-Tag-Injection
- Vorinstallierte Standard-Templates für .table-numbered und .big-table-numbered

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
- `presentation-author` - Autor-Name für Footer
- `presentation-custom-css` - Custom CSS Styles

**Auto-Save:** Triggered bei jeder Änderung (useEffect)

### IndexedDB

#### Images Database
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

**Operationen (lib/imageStorage.ts):**
- `saveImage(image)` - Speichern/Überschreiben
- `getAllImages()` - Alle Bilder laden
- `deleteImage(name)` - Bild löschen
- Automatisches Cleanup von altem LocalStorage-Cache

#### Templates Database
**Datenbank:** `PresentationTemplatesDB`
**Object Store:** `templates`

**Schema:**
```typescript
interface StoredTemplate {
  name: string;      // Template-Name (Primary Key)
  htmlContent: string; // HTML-Code
  timestamp: number; // Upload-Zeit
}
```

**Operationen (lib/templateStorage.ts):**
- `saveTemplate(template)` - Speichern/Überschreiben
- `getAllTemplates()` - Alle Templates laden
- `deleteTemplate(name)` - Template löschen

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

## Template-System

### HTML-Templates
Wiederverwendbare HTML-Snippets für komplexe Layouts (hauptsächlich Tabellen).

**Standard-Templates:**
1. **default_table.html** - Numbered Table mit 3 Zeilen (große Schrift)
2. **default_big_table.html** - Big Numbered Table mit 3 Zeilen (kleinere Schrift für mehr Inhalt)

**Template-Struktur:**
```html
<table class="table-numbered">
  <tr>
    <td class="num-col">1</td>
    <td class="content-col">
      <div class="cell-title">Überschrift</div>
      <div class="cell-details">
        <ul>
          <li>Detail Punkt 1</li>
        </ul>
      </div>
    </td>
  </tr>
</table>
```

**Verwendung:**
- Templates werden in den Markdown-Content eingefügt
- HTML-in-Markdown wird durch rehype-raw Plugin verarbeitet
- Templates können im Editor über "Template einfügen" Button eingefügt werden
- Externe Bearbeitung via Download/Upload möglich

### CSS-Customization

**Custom CSS System:**
- Nutzer können eigene CSS-Regeln definieren
- CSS wird in LocalStorage gespeichert
- Live-Anwendung über dynamisch injiziertes `<style>`-Tag mit ID `custom-presentation-styles`

**Standard CSS Templates:**
Vordefinierte Styles für Table-Templates mit Theme-Variablen:

```css
/* Standard Table */
.prose .table-numbered .num-col {
  width: 160px !important;
  font-size: 5rem;
  font-weight: bold;
  color: var(--theme-heading);
}

.prose .cell-title {
  font-size: 2.2rem;
  border-bottom: 0.5px solid var(--theme-accent);
}

/* Big Table (für mehr Inhalt) */
.prose .big-table-numbered .num-col {
  font-size: 4rem;
}

.prose .big-table-numbered .cell-title {
  font-size: 1.6rem;
}
```

**Verfügbare Theme-Variablen für Custom CSS:**
- `--theme-text` - Haupttext-Farbe
- `--theme-heading` - Überschriften-Farbe
- `--theme-accent` - Akzent-Farbe
- `--theme-code-bg` - Code-Hintergrund-Farbe

## Styling-Hierarchie

### Listen-Ebenen
- **Level 1:** Große Schrift (1.15em), mehr Abstand (0.75em)
- **Level 2+:** Kleine Schrift (0.9em), enger Abstand (0.25em), line-height 1.3

### Listen in Tabellen
Kompakte Darstellung mit reduzierten Margins und Padding für optimale Platznutzung.

### Tabellen

**Standard Markdown-Tabellen:**
- Width: 80%
- Größere Schrift: 1.1em
- Erste Spalte: Zentriert, bold, feste Breite (80px)
- Leere Header: Transparenter Hintergrund

**Custom Table-Templates:**
- `.table-numbered` - Numbered Table mit großen Zahlen (5rem), optimiert für weniger Inhalt
- `.big-table-numbered` - Big Table mit kleineren Zahlen (4rem), optimiert für mehr Inhalt
- Beide nutzen Theme-Variablen für konsistente Farben
- Anpassbar über Custom CSS Editor

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

### Implementiert
- ✅ Slide-Vorlagen (HTML-Templates)
- ✅ Custom CSS Editor
- ✅ Image Library Management
- ✅ Template Library Management
- ✅ Externe Bearbeitung (Download/Upload für Templates & CSS)

### Kurzfristig
- Slide-Notizen für Präsentierende
- Timer/Countdown
- Export zu anderen Formaten (PPTX, HTML)

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
