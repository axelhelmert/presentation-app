# Update KI

## Einleitung 

Es geht um einen Überblick zur KI bei msg life. Ich möchte in mehreren Schritten darstellen, wo wir aktuell stehen. 

Aufteilung der Themen in 4 Schwerpunkte:

- Eine regulatorisch konforme Architektur für die LV 
- Agentisches Wissensmanagement
- Automation und Flexibilisierung von Geschäftsprozessen 
- Software Engineering und Produktentwicklung 

Wir werden dazu die Kapitelstruktur von presentation-app nutzen. Jedes dieser 4 Themen bildet ein Kapitel.

> **Umsetzung:** Das Gesamtdeck liegt als `update-ai-deck.md`; das Vorgehen (Kapitel-/Agenda-Aufbau, Hintergrundbild, Dateien) ist in [`update-ai-deck.README.md`](./update-ai-deck.README.md) dokumentiert.

## Eine regulatorisch konforme Architektur für die LV

Der Einsatz von KI, und hier insbesondere von (teil-)autonomer agentischer KI, für die LV Bedarf einiger grundlegender Rahmenbedingungen mit Blick auf Security und Regulatorik.

Mit Blick auf die Regulatorik geht es vor allem um die DSGVO, die KI-VO, um Compliance / Kartellrecht und um IP-Rechte.

Bezüglich der Security ist zu Bedenken, dass die meisten KI-Anwendungen in der Cloud laufen. Auch hier schlägt einerseits die Regulatorik zu: z.B. DORA, aber auch allgemeine IT-Fragen zur Sicherheit, Verfügbarkeit und Performance.

Eine wichtige Vereinfachung der Diskussion ergibt sich aus einer sauberen Trennung von Build und Run.  Agentische KI kann und wird zunehmen im SWE eingesetzt. Dabei wird aber häufig regelbasierter Code erzeugt (z.B. Python oder Java). Der Engineering Prozess unterscheidet sich auch nicht grundsätzlich vom konventionellen Ansatz, wenn man akzeptiert, dass unter einer menschlichen Aufsicht alle Artefakte des Prozesses ganz oder teilweise durch Agenten erzeugt werden. Am Ende des Prozesses stehen umfangreiche Qualität sichernde Maßnahmen.

### Besonderheiten für die Entwicklung von Standardsoftware

Die Überlegungen zur Differenzierung von Build und Run haben einige wichtige Aspekte, wenn es darum geht Standardsoftware für Lebensversicherer zu entwickeln. Der Build-Prozess zerfällt dann in 2 Teile: 

1 Entwicklung der Standardsoftware für eine LV

2 Customizing der Standardsoftware und Entwicklung von Produkten durch die LV

Der Begriff Standardsoftware ist in dem Bild zur Architektur mit Shared industry commons bereits dargestellt.

Dabei muss auf folgende Begriffe eingegangen werden:

- Continuous Delivery
- Merge (Standardrelease vs. Customer)

### Datenkategorien und regulatorischer Rahmen

**Datenkategorien** (aufsteigende Schutzbedürftigkeit): Public Data · Personal Data (DSGVO) · Internal Data · Customer Data · Customer Strategic Data · Core IP / Proprietary Data.

Je höher die Schutzbedürftigkeit, desto enger die Kontrolle darüber, was den Kern verlassen darf. **Maßgebliche Regulatorik:** KI-VO, GeschGehG (Geschäftsgeheimnisse), Kartellrecht, Datenschutz (DSGVO, DSG).

> Die konkrete GenAI-Verarbeitungskette (RAG-Pipeline, Ablauf, Audit-Trail) gehört fachlich zum Wissensmanagement und ist dort beschrieben — siehe Kapitel „Agentisches Wissensmanagement".

## Agentisches Wissensmanagement

Das Thema agentisches Wissensmanagement hat 3 Schwerpunkte :

- Aktueller Stand msg.ask:it
- Integration in Workflows und Verbindung mit Applikationen 
- Agentic Context Engineering / Self-learning Machines
- Anmerkungen zur Regulatorik

### msg.ask:it — Agentic Knowledge Management

Übergang von einfachen Chatbot-Lösungen zu integrierten, quellenbasierten Assistenten:

- **Domänen statt Chatbot:** Eine Domäne enthält alle freigegebenen Dokumente; der Nutzer entscheidet, ob nur in dieser Domäne gesucht wird. Neben der Domäne **DAV** wird auch eine Domäne **Regulation** eingerichtet.
- **Nutzer bestimmt den Kontext:** „Wo suche ich?", den Grad der Verlässlichkeit, Tiefe und Format der Antwort. Personas: **Luna** (schnelle, domänen-fokussierte Suche), **Dex** (tiefgehende, detaillierte Analyse).
- **Quellenbasiert:** Alle Antworten referenzieren ihre Quellen; schließt die Anbindung von Applikationen ein.
- **Personal Domain:** additive, nutzereigene Dokumente; Domänen können vom Nutzer temporär verbunden werden.
- **Glossar & Filter:** ask:it unterstützt ein Fachbegriff-Glossar und vorgegebene Filter.
- **Agent-zu-Agent:** KI-Agenten interagieren mit KI-Agenten in anderen Systemen (Web, Bestandsführung, Jira, Code-Repositories, Intranet, …).
- **Mehrsprachig:** Oberfläche und Dokumente; es werden jeweils die besten verfügbaren LLMs eingesetzt (nach Preis-/Leistungsverhältnis).
- **Domänenspezialisierung:** Anpassung an domänenspezifische Skills, Sicherheit und Verlässlichkeit.

### Verarbeitungskette und Auditierbarkeit (RAG)

ask:it gibt **quellenbasierte** Antworten. Die regulatorischen Anforderungen lassen sich entlang der GenAI-Verarbeitungskette konkretisieren — durchgängig auditierbar (zuvor im Architektur-Kapitel verortet, fachlich gehört es hierher).

**Verarbeitungspipeline (RAG):**

1. Chunking
2. Vektorisierung und Embedding
3. Metadaten-Attribuierung
4. Indexierung und Speicherung (VektorDB)

**Ablauf:** Eingabe (Daten / Prompts) → Validierung → Aufruf LLM und RAG → Ausgabe. Auf Nutzerseite: sorgfältiges Prompting und Prüfung der Ausgaben; bei Bedarf Human-in-the-Loop.

**Querschnitt:** Data Lineage & Auditierbarkeit (Audit Trail) über die gesamte Kette.

### Agentic Context Engineeering (ACE)

ACE ist eine sehr wichtige Weiterentwicklung für alle ChatBots (weltweit und nicht nur für die Branche LV). Aufgrund der immateriellen Güter und der ausgeprägten Regulierung in der LV, ist dies hier aber besonders wichtig. Es geht um self-learning in der Kommunikation zwischen Mensch und Maschine, aber auch zwischen Maschine und Maschine. Wir haben bisher in den meisten Anwendungen auf fine-tuning verzichtet. Aus verschiedenen Gründen: Kosten, Regulatorik (hier geht es um Compliance, training oder fine-tuning auf der Basis Kundeninformationen, würde unternehmensspezifische Kontexte ins Modell integrieren. Das ist nicht erlaubt. Wir müssen vielmehr unseren Kunden regelmäßig garantieren dass mit ihren Daten keine Trainings erfolgen.)

Wir haben daher bisher RAG eingesetzt um aktuelles Wissen zu integrieren. Dies funktioniert aber nur dann gut, wenn das Wissen bereits in irgendeiner Form dokumentiert ist. Wissen dass aus der Kommunikation mit dem Bot entsteht geht regelmäßig verloren. Hier verspricht ACE endlich einen neuen Zugang. Dabei bleibt der selbstgelernte Kontext **strikt pro Kunde isoliert** — der Dialog eines Tenants fließt nie in die Antworten eines anderen.

**Was ACE genau ist:** Context Engineering bezeichnet (teil-)autonome Methoden, die das Verhalten eines Modells verbessern, indem sie **additive, natürlichsprachige Information** für ein LLM erzeugen, anpassen und verwalten — **statt die Gewichte zu ändern**. Kontexte sind interpretierbar, ermöglichen die schnelle Integration neuen Wissens und sind über Modelle hinweg teilbar.

**ACE-Framework (Generator · Reflector · Curator):** ACE setzt — inspiriert vom „Dynamic Cheatsheet" — auf eine agentische Architektur mit drei spezialisierten Komponenten: einem **Generator**, einem **Reflector** und einem **Curator**.

**ACE + Knowledge Graphs (KGs):** Die neurosymbolische Forschung kombiniert symbolische und neuronale Ansätze in hybriden, modularen Systemen; symbolische Komponenten ermöglichen Abstraktion. In diesem Rahmen dienen **KGs als symbolisches Gedächtnis und Regel-Repository** — besonders relevant in tiefen domänenspezifischen Anwendungen wie der **Produktentwicklung**. Self-learning betrifft dabei sowohl die Mensch-Maschine- als auch die Maschine-Maschine-Kommunikation.

## Automation und Flexibilisierung von Geschäftsprozessen 

- Aktueller Stand msg.process:it
- Integration mit AF und ask:it 
- Conversational AI

### msg.process:it → E2E-Orchestrierung aller relevanten Geschäftsprozesse

Kernidee: KI-Agenten orchestrieren Geschäftsprozesse **E2E (teil-)autonom** — keine regelbasierte Implementierung, sondern Steuerung in menschlicher Sprache (human language).

1. **Agenten orchestrieren Prozesse E2E.** Die Agenten kennen die Geschäftsprozesse, die sie durchführen können (inkl. deren API), und übernehmen das **Mapping selbst**. Sie führen die Prozesse aus, verarbeiten die Ergebnisse und behandeln den Prozessfall abschließend.

2. **Agenten beschaffen, verstehen und erzeugen Informationen.** Bei Bedarf
   - analysieren und verifizieren sie **externe Eingaben** (E-Mail, Chatbot, WhatsApp) — z.B. durch Abfragen von Daten,
   - analysieren **interne Daten** (Vertragsdaten, (Zwischen-)Ergebnisse einer Simulation),
   - erzeugen **Output** (Berichte, E-Mails, Abschlüsse, Chatbot),
   - machen **Vorschläge**, unterstützen Entscheidungen und dokumentieren diese.

3. **Human-in-the-Loop bei Bedarf.** Der KI-Agent „ruft" bei Bedarf einen menschlichen „Agenten" und liefert alle relevanten Informationen. Ziel: Automatisierung, ein **perfektes Kundenerlebnis** (sofortige Antworten 24×7) und optimale **Skalierbarkeit** — cloud-basiert, SaaS-Subscription, nutzenbasiert.

4. **Mehr als Bestandsführung.** Erweiterungen für Selfservice- und Vertriebssysteme (ggf. hybrid):
   - Die Lösung wird als **anpassbare Standardsoftware** entwickelt (Cost-Sharing).
   - Ziel: sukzessive den **gesamten Lebenszyklus der Policen** abdecken (Pain-Points zuerst!).
   - Das **Customizing** kann von Experten durchgeführt werden (Anforderungen in menschenlesbarem Text).
   - Setzt auf **regelbasierten Geschäftsprozessen** auf (z.B. AF).

### Demo-Beispiel: Zuzahlung (additional payment)

In diesem Kapitel zeigen wir in der Regel eine **Live-Demo** — Standardbeispiel ist eine **Zuzahlung** (englisch: *additional payment*; „top-up" vermeiden). Sie erdet die vier konzeptionellen Punkte an einem echten Prozess:

1. **Eingang** — der Wunsch kommt in natürlicher Sprache (Portal, E-Mail, Chat): „Ich möchte 5.000 € zusätzlich in meine Police einzahlen."
2. **Verstehen & prüfen** — der Agent identifiziert die Police, liest die Vertragsdaten und prüft die **Zulässigkeit** der Zuzahlung (Tarifregeln, Grenzen).
3. **Simulieren** — er ruft den **deterministischen Kern** (gamma-lab/Rechenkern) und berechnet die **Auswirkung** (neue Leistung / Versicherungssumme, Kosten, steuerliche Sicht).
4. **Vorschlagen & bestätigen** — er erklärt das Ergebnis in klarer Sprache; der Kunde bestätigt; **Human-in-the-Loop**, wo erforderlich.
5. **Ausführen & dokumentieren** — der Kern bucht die Zuzahlung, der Agent **schließt den Fall ab** und schreibt den **Audit-Trail**.

Ein Wunsch, **E2E**: beschafft, simuliert, ausgeführt, dokumentiert.

### Regulatorik (process:it)

Die agentische Orchestrierung wird als **KI-System mit geringem Risiko** ausgelegt — ein autonomer Agent **ohne** Risikobewertung und **ohne** Preisbildung. Konkret:

- **Zweckbestimmung** (Art. 3 Nr. 12 KI-VO): agentische Steuerung der Versicherungsprozesse und Kundenkommunikation bis zur Durchführung.
- **Kein Einsatz** gem. Anhang I + III KI-VO; **keine** Risikobewertung und Preisbildung (ErwGr 58 KI-VO).
- **Autonomiegrad** (Art. 3 Nr. 1 KI-VO): Stufe 5 — volle Automatisierung; das System kann seine Mission ohne externe Eingriffe durchführen.
- **Transparenzpflicht** (Art. 50 Abs. 5 KI-VO): der VN wird bei der ersten Interaktion informiert, dass er mit einem KI-System interagiert.
- **Rechtsgrundlage Datenverarbeitung** (Art. 6 Abs. 1b DSGVO): Vertragserfüllung.
- **Betroffenenrechte** (Art. 22 DSGVO): Recht auf Eingreifen einer Person seitens des VU (Sachbearbeitung).
- **Sicherheit der Verarbeitung** (Art. 32 DSGVO): Audit-Logs — wer wann auf welche Kundendaten zugegriffen oder diese übermittelt hat.
- **Beratungs- / Dokumentationspflichten** (Art. 61, 62 VVG): Dokumentation aller Beratungsschritte, der vorgeschlagenen Änderungen, ihrer Auswirkungen auf den Versicherungsschutz und ihrer Begründung (Audit-Trail).

## Software Engineering und Produktentwicklung 

Das Thema hat aktuell sehr an Bedeutung gewonnen. Die rasante Entwicklung der Agents erlaubt heute eine Unterstützung des gesamten Produktmanagement Prozesses.

Darin eingebettet wird auch der gesamte SWE-Prozess unterstützt. Dabei ist die Fähigkeit Code zu generieren für sich allein betrachtet gar nicht mehr der wesentliche Aspekt. Unter menschlicher Aufsicht (Human-on-the-Loop) unterstützten Agenten alle Elemente des Prozesses. Sie erzeugen, prüfen und erweitern Anforderungsdokumente, Design- und Architekturdokumente, Testwerkzeuge und Testfälle und natürlich auch Code. Änderungen betreffen immer den gesamten Zyklus.

Darüber hinaus werden Benutzerhandbücher und Dokumentation erzeugt. Auch die Versionswerwaltung (commit, push) oder das deploy (z.B. in die Cloud) wird unterstützt oder sogar automatisiert.

Im Enwicklungspozess können und sollen regulatorische und sicherheitsrelevante Aspekte berücksichtigt werden. Nicht zuletzt spielen Aspekte zum Betrieb in der Cloud (Pricing, Performance, Sicherheit) schon im Design eine wesentliche Rolle. Auch diese Elemente können in die Automation einbezogen werden. 

### Vom Code-Agenten zum Produktmanagement

> Grundlage: gamma-lab `docs/prozess/E2E-AutomationProduktmanagement.md`. Wir heben hier den Bogen von „Code generieren" zu „den gesamten Produktlebenszyklus begleiten".

**Heute** automatisiert Claude Code wesentliche Teile des SWE-Prozesses. **Morgen** begleitet agentische KI den **gesamten** Produktmanagement-Prozess — von der Idee über Anforderungen, Design, Implementierung, Test, Doku, Betrieb und Compliance bis zu Wartung und EOL. Die Fähigkeit, Code zu erzeugen, ist dabei nur noch ein Baustein.

Drei Rahmenbedingungen prägen das, weil wir **große, komplexe Standardsoftware für die Lebensversicherung** bauen:

- **Sicherheit & Nachhaltigkeit** über das gesamte Produktleben (Verträge laufen 30+ Jahre)
- **Teamfähig & standardisiert** — kein Einzelkämpfer-Setup
- **Auditierbarkeit & Compliance by design** (BaFin/VAIT, DSGVO, EU AI Act, aktuarielle Funktionstrennung)

### Dualer Lebenszyklus: Standardsoftware + Kunden-Customizing

Dies ist der zentrale, in der SWE-Diskussion oft unterschlagene Punkt — und er knüpft direkt an Kapitel 1 an (dort: „Build zerfällt in Standardsoftware-Entwicklung und Customizing/Produktentwicklung durch die LV"):

- **Standard-Zyklus** — Entwicklung und Releases des Produktkerns
- **Kunden-Instanz-Zyklus** — Customizing, Release-Upgrades, Multi-Tenant-Betrieb pro Kunde

Der zweite Zyklus ist **genauso groß** wie der erste, läuft pro Kunde getrennt und mit Versatz zum Release-Takt. Kunden docken über drei Schichten an: **Konfiguration** (Werte, Feature-Flags), **Erweiterung** (Plugins mit stabiler API), **Override/Customer-Layer** (eigene Code-Schicht, sandbox-isoliert). Konkretes Beispiel `gamma-lab`: Die **Customer-Layer-Formeln** (Python in RestrictedPython-Sandbox) sind genau so eine Override-Schicht — Kunden ersetzen Default-Berechnungsformeln, ohne den Standard zu forken.

Beim Release-Upgrade (Standard N → N+1) muss **jede** Kunden-Instanz hochgezogen werden — ein **Code**-Upgrade des Customer-Layers, die Versicherungsverträge bleiben unangetastet: Impact-Analyse → Merge → Test pro Instanz → Kunden-Sign-off → Deploy. Komplexität **N Kunden × M Releases** — ohne Automatisierung skaliert das nicht. Genau hier hilft KI besonders — **strikt pro Tenant**: Merge-Vorschläge eines **tenant-isolierten** Agenten, der das neue Standard-Release mit dem *eigenen* Customizing genau dieses Kunden abgleicht (nie kundenübergreifend); Test-Synthese aus dem Customizing eines einzelnen Kunden, nur gegen dessen Instanz; Release-Notes pro Tenant; Upgrade-Readiness-Score pro Kunde.

### Spezialisierte Agenten statt Universal-Agent

Ein E2E-Prozess braucht ein Rollenmodell — der eine universelle Code-Agent reicht nicht:

| Rolle | Verantwortung |
|---|---|
| **PM-Agent** | Roadmap, Priorisierung, Stakeholder-Sync |
| **BA-Agent** | Anforderungen, User-Stories, Akzeptanzkriterien |
| **Architekt-Agent** | ADRs, Tech-Auswahl, Security-Architektur |
| **Dev-Agent** | Implementierung (heute: Claude Code) |
| **Test-Agent** | Property-Tests, E2E, Regression |
| **Doku-Agent** | Benutzerhandbuch, API-Doku, Runbooks |
| **Ops-Agent** | Monitoring, Alerts, Incident-Triage |
| **Compliance-Agent** | BaFin/DSGVO-Checks, Audit-Berichte |

Für den **Kunden-Pfad** zusätzlich: Release-Agent, Upgrade-Agent (Impact-Analyse + Merge pro Kunde), Tenant-Ops-Agent, Customer-Success-Agent. Jeder Agent hat einen **Skill** (Markdown-Anleitung) und greift auf geteilten **Memory** + **MCP-Connectors** zu.

### Standardisierung, HITL & Auditierbarkeit

Damit Teams effizient und sicher zusammenarbeiten, brauchen wir geteilte Bausteine: **Templates** (Anforderungen, ADRs, Postmortems, Runbooks), **Skills** (`.claude/skills/*.md` im Team-Template-Repo), **Hooks** als verbindliche Quality-Gates (Lint, Format, Test, Security-Scan, Audit-Log vor Commit), eine gemeinsame **Memory-Struktur** und ein einheitliches **MCP-Server-Set**. Quality Gates: Definition of Ready / Done / Compliance.

Pflicht-Punkte für **Human-in-the-Loop**: Anforderungsfreigabe (Fachbereich), Architektur-Entscheidungen (Tech-Lead), **Vier-Augen-Aktivierung** (Tarife, Releases, Berechtigungen — in gamma-lab schon erzwungen), Pre-Prod-Smoke-Test, Compliance-Sign-off. Pro KI-Aktion ein **Audit-Trail**: Agent/Person, Zeitstempel, Prompt, Antwort, Modell-Version, Tool-Calls, Reviewer + Begründung.

### Reifegrad-Modell

| Stufe | Was läuft mit KI | Mensch entscheidet |
|---|---|---|
| 1 | SWE (Code, Test, PR) | Alles andere |
| 2 | + Doku | Releases, Compliance |
| 3 | + Anforderungen, ADR-Drafts | Review vor Implementierung |
| 4 | + Ops (Incidents, Alerts) | Kritische Eskalationen |
| 5 | + Discovery, Portfolio, Compliance, Kunden-Upgrade-Merges | Nur an HITL-Gates |

**Zwei Dimensionen** — Standard-Pfad und Kunden-Pfad reifen zeitversetzt. Stand heute: Standard-Pfad Stufe 1–2, Kunden-Pfad Stufe 0–1. Ziel-Hypothese: Stufe 4 in beiden Pfaden bis Ende 2026. **Pilot-Domäne: `gamma-lab`** (in Produktion, klare Compliance-Anforderungen — ideales Testfeld).

### SWE: Bausteine für eine Präsentation

Im folgenden werden Textbausteine für Präsentationen zum Thema SWE produziert. Die Präsentation erfolgt mit presentation-app. Bevorzugte Sprache ist englisch.

1. Where are current developments (Agentic AI, Claude-Code, Spec-Driven Development) taking us?
2. What will the IT architecture for the insurance industry look like in the future?
3. Extensive use of AI agents during the build process (SWE, Product Development, Product Management)
4. Combined use of conventional software (core systems) and AI agents (conversational AI) in the run process.
