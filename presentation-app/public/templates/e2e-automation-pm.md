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

=== Standard + Kunde

# Standardprodukt + Kunden-Customizing

Bisher unterschlagen, aber **prägend** für unseren Prozess:

- Wir bauen **Standardsoftware** — ein Produkt für viele Kunden
- Kunden **customizen** über Konfiguration, Erweiterung oder eigene Code-Schichten
- Daraus ergibt sich ein **dualer Lebenszyklus**:
  - **Standard-Zyklus** — Releases des Produktkerns
  - **Kunden-Instanz-Zyklus** — Customizing, Upgrades, Betrieb pro Kunde

Der zweite Zyklus ist **genauso groß** wie der erste und läuft pro Kunde getrennt.

---

# Customizing-Schichten

Wo Kunden andocken dürfen — pro Produkt sauber zu definieren:

**Konfiguration**
- Werte, Feature-Flags, Mandantendaten — keine Code-Änderung

**Erweiterung**
- Plugins / Extension-Points mit stabiler API
- Kunde liefert eigene Module

**Override / Customer-Layer**
- Eigene Code-Schicht, überschreibt Standardverhalten
- Sandbox-isoliert
- *Beispiel `gamma-lab`*: Customer-Layer-Formeln in RestrictedPython

---

# Release-Upgrade — Standard → Kunde

Standard N → N+1: jede Kunden-Instanz muss migriert werden.

1. **Impact-Analyse** — Was hat sich am Standard geändert?
2. **Merge** — Standard-Update + Customizing zusammenführen
3. **Test pro Instanz** — Customizing-Regression + neue Standard-Features
4. **Migration** — Daten-/Schema-Migration, ggf. Customizing-Refactoring
5. **Kunden-Sign-off** — Smoke-Test in Pre-Prod
6. **Deploy** in Kunden-Produktion

**Komplexität:** N Kunden × M Releases. Ohne Automatisierung skaliert das nicht.

---

# Multi-Tenant-Betrieb

- Kunden-Instanzen auf **unterschiedlichen Versions-Ständen**
- **Monitoring pro Tenant** — eigene Dashboards, Alerts, SLOs
- **Incident-Kontext** — welche Kunden in welcher Version betroffen
- **Compliance pro Kunde** — abweichende Aufsichten (BaFin, FINMA, FCA …)
- **Datenisolation** — nachweisbar im Audit
- **SLA / Support-Stufen** — pro Kunde, im Routing berücksichtigt

---

# Wo KI im Kunden-Pfad besonders hilft

- **Merge-Vorschläge** beim Upgrade — KI kennt Standard-Diff *und* Customizing
- **Test-Synthese** aus dem Customizing — automatische Regressions-Tests
- **Release-Notes pro Tenant** — gefiltert auf das, was den Kunden betrifft
- **Incident-Korrelation** über Tenants hinweg
- **Customizing-Doku** synchron zum Code halten
- **Upgrade-Readiness-Score** pro Kunde — wie aufwendig wird der nächste Sprung?

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

**Für den Kunden-Pfad zusätzlich:**

| Rolle | Verantwortung |
|---|---|
| **Release-Agent** | Standard-Release-Pakete, Migrations-Skripte |
| **Upgrade-Agent** | Pro Kunde: Impact-Analyse, Merge, Konflikt-Resolution |
| **Tenant-Ops-Agent** | Multi-Tenant-Monitoring, Customer-Health |
| **Customer-Success-Agent** | Roadmap-Kommunikation, Webinare, Schulung |

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
| 5 | + Discovery, Portfolio, Compliance, Kunden-Upgrade-Merges | Nur an HITL-Gates |

**Zwei Dimensionen:** Standard-Pfad und Kunden-Pfad reifen zeitversetzt.

**Stand heute:**
- Standard-Pfad: Stufe 1–2
- Kunden-Pfad: Stufe 0–1 (Upgrades, Merges manuell)

**Hypothese:** Stufe 4 in beiden Pfaden bis Ende 2026.

---

# Pilot & nächste Schritte

**Pilot-Domäne:** `gamma-lab` (in Produktion, Lebensversicherung, klare Compliance-Anforderungen — ideal als Testfeld).

**Erste Schritte (Standard-Pfad):**

1. **BA-Agent-Skill** definieren (Templates für Anforderungen, Akzeptanzkriterien)
2. **Doku-Agent** für Handbuch-Updates aus PR-Diffs
3. **Compliance-Agent** als Lese-Tool für BaFin-Checklisten
4. **Audit-Trail-Schicht** — wo werden KI-Interaktionen protokolliert
5. **Team-Onboarding-Skill** — neue Mitarbeitende auf agentische Arbeit schulen

**Erste Schritte (Kunden-Pfad):**

1. **Customizing-Inventar** — wo darf der Kunde andocken? Pro Modul dokumentieren
2. **Upgrade-Agent-Pilot** an einer Standard-Release-Migration (gamma-lab: Customer-Layer-Formel)
3. **Pro-Tenant-Monitoring** als Standard-Pattern etablieren

---

# Offene Fragen

- **Audit-Speicherung** — wo und wie lange? Aufbewahrungspflicht vs. DSGVO-Löschpflicht
- **Modell-Versionsmanagement** — Verhalten ändert sich bei Modell-Updates
- **Inter-Agent-Protokoll** — Memory? Linear-Tickets? Eigene Event-Schicht?
- **Team-Onboarding** — Skill-Definition, Memory-Pflege, HITL-Disziplin
- **Tool-Sourcing** — Self-Hosted vs. SaaS für sensible Daten
- **MCP-Connectors skalieren** — pro Mitarbeitender oder pro Team?
- **Customizing-Versionierung pro Kunde** — eigenes Repo? Branch? Overlay?
- **Auto-Merge-Schwellwert** — wann KI selbst mergt, wann Mensch ran muss
- **Tenant-Isolation der KI** — Memory-/Context-Trennung zwischen Kunden
- **Upgrade-Test-Strategie** — Test-Suiten pro Kunde ohne Wartungs-Explosion

---

# Zusammenfassung

- E2E-Automatisierung im Produktmanagement = mehr als SWE
- **Dualer Lebenszyklus**: Standardprodukt + Kunden-Customizing/-Betrieb
- Lebensversicherung als Domäne erzwingt **Compliance-by-Design** und **Auditierbarkeit**
- Spezialisierte Agent-Rollen statt Universal-Agent — auch für Release-, Upgrade- und Tenant-Ops
- Standardisierung über **Skills, Templates, Hooks, Memory, MCP**
- Reifegrade 1 → 5 in **beiden Pfaden** (Standard und Kunde)
- **Pilot in `gamma-lab`** mit BA-, Doku-, Compliance- und Upgrade-Agent

*Diskussions- und Arbeitsdokument — wird gemeinsam mit dem Quell-Markdown weiterentwickelt.*
