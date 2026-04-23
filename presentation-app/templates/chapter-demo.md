# Willkommen zur Chapter-Demo

Eine Präsentation mit automatischer Agenda-Generierung

---

=== Einführung

# Was sind Chapter?

Chapter ermöglichen die strukturierte Gliederung Ihrer Präsentation in logische Abschnitte.

- Automatische Agenda-Generierung
- Bessere Navigation
- Klare Struktur

---

# Vorteile von Chaptern

**Übersichtlichkeit**
- Inhalte werden gruppiert
- Einfachere Navigation

**Professionalität**
- Strukturierter Aufbau
- Agenda-Folie

**Flexibilität**
- Beliebig viele Chapter
- Individuelle Länge pro Chapter

---

=== Technische Details

# Architektur

Die Chapter-Funktion basiert auf einer einfachen Markdown-Syntax:

```markdown
=== Chapter-Titel

# Folie 1
Inhalt...

---

# Folie 2
Inhalt...
```

---

# Implementation

**Parser-Logik**
- Erkennt `===` Marker
- Extrahiert Chapter-Titel
- Generiert Agenda automatisch

**Slide-Struktur**
- Jede Folie kennt ihr Chapter
- Chapter-Header wird eingefügt
- Navigation bleibt erhalten

<!--notes:
Hier können technische Details vertieft werden:
- splitByChapters() Funktion
- parseSlides() Integration
- buildAgendaSlide() Logik
-->

---

# Features

| Feature | Beschreibung |
|---------|--------------|
| Auto-Agenda | Wird nach Titelfolie eingefügt |
| Chapter-Header | Erscheint auf jeder Folie |
| Navigation | Unterstützt Chapter-Sprünge |
| Export | PDF mit Chapter-Struktur |

---

=== Best Practices

# Tipps für Chapter

**1. Aussagekräftige Titel**
Wählen Sie klare, beschreibende Chapter-Titel

**2. Ausgewogene Länge**
Verteilen Sie Inhalte gleichmäßig

**3. Logische Reihenfolge**
Bauen Sie Ihre Story schrittweise auf

---

# Chapter-Syntax

Verwenden Sie drei Gleichheitszeichen gefolgt vom Titel:

```markdown
=== Mein Chapter-Titel
```

Der Titel kann inline stehen oder wird aus der ersten Überschrift extrahiert.

---

# Agenda-Folie

Die Agenda wird **automatisch** generiert:

1. Erscheint nach der Titelfolie
2. Listet alle Chapter nummeriert auf
3. Wird bei Änderungen aktualisiert

Keine manuelle Pflege notwendig!

<!--notes:
Die Agenda-Folie wird bei jedem Parsing neu generiert.
Position: Nach erster Folie ohne Chapter (typischerweise Titelfolie)
-->

---

# Zusammenfassung

**Chapter-Funktion bietet:**
- Strukturierte Präsentationen
- Automatische Agenda
- Bessere Übersicht
- Professioneller Auftritt

**Syntax:**
- `===` für Chapter-Marker
- `---` für Folien-Trenner
- Automatische Integration

---

# Vielen Dank!

Probieren Sie Chapter in Ihren eigenen Präsentationen aus.

**Fragen?**

Dokumentation: [GitHub Repository]
