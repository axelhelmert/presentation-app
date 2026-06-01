# E2E-Automatisierung<br>im Produktmanagement

*Agentische KI über den gesamten Produktlebenszyklus*

---

=== Worum es geht

# Zielsetzung

**Heute:** Claude Code automatisiert wesentliche Teile des SWE-Prozesses.

**Morgen:** Agentische KI begleitet den **gesamten** Produktmanagement-Prozess — von der Idee bis zur Wartung und EOL.

Wir entwickeln **große, komplexe Software-Produkte** für die **Lebensversicherung**. Daraus folgen drei Rahmenbedingungen:

- **Sicherheit & Nachhaltigkeit** über das gesamte Produktleben
- **Teamfähig & standardisiert** — kein Einzelkämpfer-Setup
- **Auditierbarkeit & Compliance** by design

---

# Produkt-Lebenszyklus

Ein vollständiger Prozess umfasst:

1. **Discovery** — Markt, Wettbewerb, Kundenbedarf, Regulatorik
2. **Idee & Roadmap** — Portfolio-Einordnung, Priorisierung
3. **Anforderungen** — User-Stories, Akzeptanzkriterien
4. **Design & Architektur** — ADRs, Security-Modell
5. **Implementierung** — Code, Reviews
6. **Test** — Unit, Property, E2E, Regression
7. **Doku** — Benutzerhandbuch, API, Runbooks
8. **Betrieb** — Monitoring, Incident, Continuous Improvement
9. **Compliance** — BaFin/VAIT, DSGVO, EU AI Act
10. **Sunset / EOL** — Migrationen, Datenexport

*Heute KI-unterstützt: 5, 6, teilweise 7. Ziel: alle Phasen.*

---

# Wo der aktuelle Stand endet

**SWE-Automation funktioniert** — der Code-Pfad (Implementierung, Test, PR, Doku-Updates) läuft mit Claude Code stabil.

**Was fehlt:**

- Vor-Phasen: Discovery, Portfolio-Pflege, Anforderungserhebung
- Nach-Phasen: Operations, Incident-Management, Customer Feedback
- Querschnitt: Compliance, Audit-Trail, regulatorische Pflichten
- Toolset: stark SWE-zentriert; Konnektoren für CRM, Ticketing, Monitoring fehlen
- Rollen: ein Universal-Agent reicht nicht — wir brauchen Spezialisten

---

=== Branchenkontext

# Lebensversicherung als Domäne

Drei branchenspezifische Verstärker:

**Regulatorische Dichte**
- BaFin / VAIT — IT-Governance-Pflichten
- DSGVO — Datenminimierung, Auskunft, Löschung
- EU AI Act — Klassifizierung jedes KI-Einsatzes
- Aktuarielle Funktionstrennung — Vier-Augen-Prinzip

**Langlebigkeit der Produkte**
- Versicherungs-Verträge laufen 30+ Jahre
- Migrationen sind teuer und risikoreich
- Doku & Auditierbarkeit über Jahrzehnte gefragt

**Komplexität der Fachlogik**
- Aktuarielle Berechnung, Rechnungsgrundlagen, Tarifstrukturen
- Fachexperten ohne IT-Skill — KI muss übersetzen
- Beispiel: `gamma-lab` — KI als Brücke zwischen Fachnutzer und Produktentwicklung

---

=== Vorgeschlagene Struktur

# Agent-Topologie

Spezialisierte Agenten statt Universal-Agent:

| Rolle | Verantwortung |
|---|---|
| **PM-Agent** | Roadmap, Priorisierung, Stakeholder-Sync |
| **Research-Agent** | Markt-/Wettbewerb-/Regulatory-Monitoring |
| **BA-Agent** | Anforderungen, User-Stories, Akzeptanzkriterien |
| **Architekt-Agent** | ADRs, Tech-Auswahl, Security-Architektur |
| **Dev-Agent** | Implementierung (heute: Claude Code) |
| **Test-Agent** | Property-Tests, E2E, Regression |
| **Doku-Agent** | Benutzerhandbuch, API-Doku, Runbooks |
| **Ops-Agent** | Monitoring, Alerts, Incident-Triage |
| **Compliance-Agent** | BaFin/DSGVO-Checks, Audit-Berichte |

Jeder Agent hat einen **Skill** (Markdown) und nutzt geteilten **Memory** + **MCP-Connectors**.

---

# Standardisierung — Was genau

Damit Teams effizient zusammenarbeiten, brauchen wir geteilte Bausteine:

- **Templates** — Anforderungen, ADRs, Postmortems, Runbooks, PR-Beschreibungen
- **Skills** — `.claude/skills/*.md`, im Team-Template-Repo
- **Hooks** — verbindliche Quality-Gates (Lint, Format, Test, Security-Scan, Audit-Log) vor Commit
- **Memory-Struktur** — gemeinsame Kategorien (user, feedback, project, reference)
- **MCP-Server-Set** — pro Team identisch (GitHub, Linear, AWS, Drive, Calendar)
- **Quality Gates** — Definition of Ready, Definition of Done, Definition of Compliance

---

# Human-in-the-Loop

Wo Menschen zwingend entscheiden:

- **Anforderungsfreigabe** durch Fachbereich
- **Architektur-Entscheidungen** (ADRs) durch Tech-Lead
- **Vier-Augen-Aktivierung** — Tarife, Releases, Berechtigungsänderungen
- **Pre-Prod-Deploy** — Smoke-Test bestätigt
- **Compliance-Sign-off** vor Release in regulierten Märkten

**Audit-Trail pro KI-Aktion:** Agent/Person, Zeitstempel, Prompt, Antwort, Modell-Version, Tool-Calls, Reviewer + Begründung.

---

=== Umsetzung

# Reifegrad-Modell

| Stufe | Was läuft mit KI | Mensch entscheidet |
|---|---|---|
| 1 | SWE (Code, Test, PR) | Alles andere |
| 2 | + Doku | Releases, Compliance |
| 3 | + Anforderungen, ADR-Drafts | Review vor Implementierung |
| 4 | + Ops (Incidents, Alerts) | Kritische Eskalationen |
| 5 | + Discovery, Portfolio, Compliance | Nur an HITL-Gates |

**Stand heute:** Stufe 1–2.
**Hypothese:** Stufe 4 bis Ende 2026.

---

# Pilot & nächste Schritte

**Pilot-Domäne:** `gamma-lab` (in Produktion, Lebensversicherung, klare Compliance-Anforderungen — ideal als Testfeld).

**Erste Schritte:**

1. **BA-Agent-Skill** definieren (Templates für Anforderungen, Akzeptanzkriterien)
2. **Doku-Agent** für Handbuch-Updates aus PR-Diffs
3. **Compliance-Agent** als Lese-Tool für BaFin-Checklisten
4. **Audit-Trail-Schicht** — wo werden KI-Interaktionen protokolliert
5. **Team-Onboarding-Skill** — neue Mitarbeitende auf agentische Arbeit schulen

---

# Offene Fragen

- **Audit-Speicherung** — wo und wie lange? Aufbewahrungspflicht vs. DSGVO-Löschpflicht
- **Modell-Versionsmanagement** — Verhalten ändert sich bei Modell-Updates
- **Inter-Agent-Protokoll** — Memory? Linear-Tickets? Eigene Event-Schicht?
- **Team-Onboarding** — Skill-Definition, Memory-Pflege, HITL-Disziplin
- **Tool-Sourcing** — Self-Hosted vs. SaaS für sensible Daten
- **MCP-Connectors skalieren** — pro Mitarbeitender oder pro Team?

---

# Zusammenfassung

- E2E-Automatisierung im Produktmanagement = mehr als SWE
- Lebensversicherung als Domäne erzwingt **Compliance-by-Design** und **Auditierbarkeit**
- Spezialisierte Agent-Rollen statt Universal-Agent
- Standardisierung über **Skills, Templates, Hooks, Memory, MCP**
- Stufenweise Erweiterung — Reifegrade 1 → 5
- **Pilot in `gamma-lab`** mit BA-, Doku- und Compliance-Agent

*Diskussions- und Arbeitsdokument — wird gemeinsam mit dem Quell-Markdown weiterentwickelt.*
