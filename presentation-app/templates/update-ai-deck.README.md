# Update AI @ msg life — Aufbau des Gesamtdecks

Kurzdoku zum Vorgehen für `update-ai-deck.md`. Stand: 2026-06-08.

## Idee

Eine Gesamtpräsentation „Update AI @ msg life" aus **vier Topics = vier Kapiteln**:

1. A Regulatory-Compliant Architecture for Life Insurance
2. Agentic Knowledge Management
3. Automating & Flexibilizing Business Transactions
4. Software Engineering & Product Development *(fertig — der reviewte Topic-4-Inhalt)*

Kapitel 1–3 sind inhaltlich ausgebaut (Stand inkl. Übernahme aus `processit-askit.pptx`):

- **K1** — Standardsoftware (two-part Build) + GenAI-Verarbeitung/Datenkategorien/Regulatorik (PPTX-Folie 5, als Mermaid).
- **K2** — msg.ask:it (Domänen, Personas Luna/Dex), ACE (Definition, Framework Generator/Reflector/Curator als Mermaid, Knowledge Graphs), Stanford-Zitatbild.
- **K3** — msg.process:it (E2E) + Regulatorik mit konkreten Artikel-Bezügen KI-VO/DSGVO/VVG (PPTX-Folie 2). Offen nur noch: dedizierter Conversational-AI-Teil.
- **K4** — Topic 4 (fertig).

Diagramme aus der PPTX (Vektor-Shapes) wurden als **native Folien** (Mermaid/Listen) nachgebaut, nicht als Bild übernommen.

## Folienstruktur

- **Titelfolie** (vor dem ersten `===`): Hintergrundbild + Titel + Untertitel.
- **Globale Agenda**: fügt die App **automatisch** nach der Titelfolie ein und listet die vier Kapiteltitel. Nicht selbst schreiben.
- **Pro Kapitel genau eine Eröffnungsfolie**, die alles auf einer Folie bündelt:
  - das **Hintergrundbild**,
  - den **Kapiteltitel** (als `#`-Überschrift),
  - direkt darunter die **Agenda dieses Kapitels** als nummerierte Liste.
  - Das Wort „Agenda" steht bewusst **nicht** auf der Folie. Keine separate Divider-Folie davor.
- Danach folgt der **Kapitelinhalt** (bei Kapitel 4 die zwölf Topic-4-Folien).

## Mechanik der App (lib/markdown.ts)

- **`=== Titel`** startet ein Kapitel. Es gibt **nur eine Kapitelebene** — verschachtelte `===` sind nicht möglich. Die fünf Unterabschnitte von Topic 4 sind deshalb in die Kapitel-4-Agenda gewandert statt eigene `===` zu sein.
- Jede Folie eines Kapitels bekommt automatisch einen kleinen Uppercase-**Kicker** (`.chapter-header`, 0.875em, gedämpft) mit dem `===`-Titel. Das ist der dezente Running-Header und kein Ersatz für die `#`-Überschrift.
- Die globale Agenda wird nach der ersten Folie (Titelfolie) eingefügt — solange diese vor dem ersten `===` steht.

## Hintergrundbild

- Syntax: `<!--bg: Gemini_Generated_Image_7omn3y7omn3y7omn.png-->` als erste Zeile der Folie.
- **Wichtig:** `bg:`-Bilder lädt die App **nicht** aus `public/`, sondern aus der **Bild-Bibliothek** (IndexedDB `presentation-images`, Match über **exakten Dateinamen**). Das Bild muss also über den **🖼️ Bilder**-Button unter genau diesem Namen in der Bibliothek liegen — sonst bleibt die Folie ohne Hintergrund.
- Verwendet auf der **Titelfolie** und den **vier Kapitel-Eröffnungsfolien**; Inhaltsfolien bleiben schlicht.

## Inline-Bilder (Galerie) in Folien

- Syntax `![alt](Dateiname.png)`. Die App ersetzt den Dateinamen durch die DataURL aus der Bild-Bibliothek (Match über exakten Namen). Beispiele: `Architektur.png`, `agentic_context_engin.png`.
- Innerhalb eines Kapitels ist eine Folie **nie** eine „reine Bildfolie" (der `.chapter-header`-Kicker wird vorangestellt) → das Bild rendert als normales Inline-Bild im Content.
- **Zu großes Bild?** Nicht am Titel oder am Galerie-Bild drehen. Stattdessen die Folie per gescopetem Style begrenzen — global ist `.prose img` auf `max-height: 80vh` + `margin: 2em auto`:

  ```html
  <style>.arch-fit img { max-height: 58vh; margin: 0.4em auto; }</style>
  <div class="arch-fit">

  ![alt](Architektur.png)

  </div>
  ```

  Leerzeilen um das Markdown-Bild im `<div>` sind nötig, damit es als Markdown (und damit galerie-aufgelöst) geparst wird.

## Fließtext größer darstellen (verbindlich)

Auf Inhaltsfolien wechseln sich oft **Text → Liste → Text** ab. Der **Fließtext**
(die Absätze um die Listen herum) soll **größer** dargestellt werden als der
Default — die Liste selbst bleibt normal. Konvention:

- **Einzelner Absatz / Inline:** den Text in
  `<span style="font-size: 1.3em;">…</span>` einschließen.
- **Mehrere Absätze als Block:** in
  `<div style="font-size: 1.3em;">` einschließen — **Leerzeilen innen** lassen,
  damit der Inhalt als Markdown geparst wird (gleiche Regel wie beim Bild-`<div>`
  oben). **Kritisch:** das öffnende `<div …>` muss **alleine** auf seiner Zeile
  stehen, **kein Text dahinter**. `<div>` ist ein Block-Tag → steht Text in
  derselben Zeile, behandelt der Parser den **ganzen ersten Absatz als Raw-HTML**
  und `**fett**` rendert dann **wörtlich mit Sternchen**. (Bei `<span>` — Inline —
  passiert das nicht, dort darf der Text in derselben Zeile stehen.) Zeilenumbruch
  innerhalb eines Spans: `<br>` schreiben, **nicht** `</br>`.

  ```html
  <div style="font-size: 1.3em;">

  Einleitender Fließtext vor der Liste.

  </div>

  - Listenpunkt eins
  - Listenpunkt zwei

  <div style="font-size: 1.3em;">

  Abschließender Fließtext nach der Liste.

  </div>
  ```

- **Immer `em`, nie `px`.** `em` ist relativ und skaliert in Preview **und**
  PDF-Export korrekt mit (der PDF-Auto-Scaler verkleinert sonst nur den Block,
  die Proportion bleibt). `1.3em` ist der Standardwert; nur bewusst abweichen.
- **Nicht auf der Titelfolie** verwenden: deren Untertitel-Kinder werden im
  PDF-Export per `font-size: inherit !important` plattgedrückt (siehe
  `AGENTS.md`) — die Spans hätten dort keine Wirkung. Auf Inhaltsfolien
  überleben die Inline-Styles den Export.
- Listenpunkte **nicht** zusätzlich vergrößern, wenn der ganze Block schon im
  `<div>` steckt — sonst doppelt skaliert.

## Nummerierte Listen über eine Zwischenüberschrift hinweg

Zweiteilige Agenden (z.B. Folie „Agents Across Build and Run": Build 1–5,
Zwischenlabel, Run 6–7) haben eine Falle: Eine nummerierte Liste darf einen
Absatz nur unterbrechen, wenn sie mit **1** beginnt. `6.` direkt unter einer
Label-Zeile kann das **nicht** → „6. …", „7. …" werden als **Text** an die
Label-Zeile angehängt (Run-on), statt Listenpunkte zu sein.

→ **Immer eine Leerzeile** zwischen Label-Zeile (Span/Absatz) und dem
fortgesetzten Listenanfang lassen. Dann wird daraus ein `<ol start="6">`:

```markdown
<span style="font-size: 1.3em;">**Run — operating the product**</span>

6. The deterministic core meets the conversational layer
7. Use cases, governance & outlook
```

Im PDF-Export zählt der `::before`-Counter den `start`-Wert korrekt mit (eigene
Seed-Logik in `pdfExport.ts`, siehe `AGENTS.md`) — 6, 7 statt 1, 2.

## Dateien & Laden

- Quelle: `templates/update-ai-deck.md`
- Servierte Kopie: `public/templates/update-ai-deck.md` — **muss synchron gehalten werden** (`cp` nach jeder Änderung), denn nur diese wird vom Editor gefetcht.
- Geladen im Editor über den Button **🗂️ Update AI** (`handleLoadStaticTemplate('update-ai-deck.md', …)` in `components/Editor.tsx`).
- Quell-Outline aller vier Themen: `templates/Update-AI.md`. Reviewter Einzel-Stand Topic 4: `templates/swe-thema4-run-process.md`.

## Sprache

Kapiteltitel und Agenden sind aktuell **englisch**, passend zum fertigen englischen Kapitel 4. Beim Überarbeiten von 1–3 leicht auf Deutsch umstellbar.
