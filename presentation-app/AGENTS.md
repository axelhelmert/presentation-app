<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PDF-Export (`lib/pdfExport.ts`) — Stolperfallen

Mehrfach gegen denselben Stein gelaufen. Lies das vor jeder Änderung an
`lib/pdfExport.ts` oder der Titelfolien-Darstellung.

## Titelfolien-Struktur ist Raw-HTML, kein Markdown

Aktive Decks (z.B. das `AI = Amazing Innovation`-Deck) nutzen für die
Titelfolie **Raw-HTML mit Inline-Styles**, kein `# H1`:

```html
<div style="font-weight: bold; font-size: 2.1em;">AI = …</div>
<div style="color: gold; font-size: 1.6em; …">Axel Helmert | …</div>
```

→ **kein `<h1>`**, **kein `<p>`/`<em>`**. Jede Lösung, die per Selector auf
`h1`/`p` ansetzt (CSS oder Regex), läuft ins Leere. Stattdessen positional
über `querySelector('.content-scaler')` und Child-Index ansprechen:
erstes Kind = Titel, ab Index 1 = Subtitle.

## Background-Mechanismus: `bg` vs `bg-logo`

Aktive Decks setzen `<!--bg: shield.png-->` (Background-Image, →
`bgImageData` truthy, `hasBgLogo` **false**), **nicht** `<!--bg-logo:>`
(Hero-Logo). Conditions wie `if (isTitleSlide && hasBgLogo)` greifen
folglich NICHT — `if (isTitleSlide)` reicht.

## Warum CSS-Klassenregeln verlieren

Die App lädt **Custom-CSS aus `localStorage['presentation-custom-css']`**
vor allen injizierten Styles. Dieses Custom-CSS setzt teilweise
`!important` auf `.prose p` / `.prose em`. Plus die Inline-Styles im
Raw-HTML der Folie selbst. Beides schlägt jede Stylesheet-Regel — selbst
mit `!important`, sobald die Spezifität tied ist und DOM-Reihenfolge gegen
uns spricht.

**Einziger zuverlässiger Weg:** auf dem Live-DOM
`element.style.setProperty(prop, value, 'important')`. Inline `!important`
schlägt alles außer anderen Inline-Styles. Rekursiv auf Descendants
anwenden (innere `<span style="font-size:…em">` würden sonst
zurückskalieren).

## Editor.tsx double-rendert

`Editor.tsx` (~525) ruft `renderMarkdownToHTML(slide.content)` **vor**
`exportToPDF`. In `pdfExport` läuft danach nochmal ein Render — kein
Schaden (Raw-HTML überlebt), aber wichtig für die Annahme dass
`slide.content` beim Eintritt in `exportToPDF` schon HTML ist.

## Agenda-Folie

Die synthetische Agenda-Folie (von `parseSlides` eingefügt) hat
`rawMarkdown = ''`; ihr Inhalt steckt nur in `slide.content`. Daher in
`pdfExport` `extractMermaidBlocks(slide.content)` aufrufen, **nicht**
`rawMarkdown`.

## Liste der Festwerte mit Begründung

- **PDF-Format `[297, 167.0625]` mm** (echtes 16:9). Nicht `'a4'` —
  letterboxt die 16:9-Folie sonst vertikal und macht den Export für
  Vollbild-Präsentation unbrauchbar.
- **Body-Text auf Content-Folien:** `calc(${fontSize.size} * 1.6)` —
  Default ist am 1920×1080-Canvas zu klein.
- **Chapter-Header:** `font-size: 1.75em !important` — SlidePreviews
  React-injected `.slide-container .chapter-header`-Rule wäre sonst in
  DOM-Reihenfolge gleich-spezifisch und später → würde gewinnen.
- **Content-Wrapper-Padding:** `15px 80px 10px 80px`, **Footer**
  `min-height: 48px`, `padding: 12px 48px` — knapper als ursprünglich,
  weil Diagramm-Folien (z.B. Folie 3) sonst unten gecroppt werden.
- **List-Marker** (`ol`/`ul`): `::before`-Counter, **nicht** `::marker`
  — html2canvas paintet `::marker` nicht zuverlässig.
- **Titelfolien-Subtitle:** `font-size: 0.95em`, `margin-top: 3em`,
  inline-`!important` per JS auf Kindern ab Index 1 der `.content-scaler`.
  (Iteration: 0.42 → 0.63 → 0.95em.)

## Debug-Strategie wenn nichts greift

Browser-Bundle-Cache schlägt regelmäßig zu — Hard-Reload (Cmd+Shift+R)
nicht vergessen. Wenn Beweis nötig dass Code überhaupt läuft: `alert(...)`
ist robuster als `console.log` (DevTools nicht immer offen). Nach
Bestätigung sofort wieder entfernen.
