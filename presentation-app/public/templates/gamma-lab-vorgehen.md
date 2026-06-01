<!--default-product-logo: gamma-lab-logo.png-->
<!--bg-logo: gamma-lab-logo.svg-->

# gamma-lab — Vorgehen

Vom Tarif-Konzept zum Product Information Hub

*Skizze auf Basis von `gamma-lab/docs/zielbild.md` und `docs/architektur/`*

---

=== Vision & Problem

# Vision

**𝛄-lab** ist ein cloud-basiertes System, mit dem Fachexperten in Lebensversicherungen Tarife **unabhängig vom späteren Zielsystem** entwerfen, prüfen, versionieren und freigeben.

Es fungiert als zentraler **Product Information Hub**:

- nachgelagerte Bestands-, Vertriebs- und Portalsysteme beziehen daraus Produktdaten und ausführbare Berechnungslogik
- Tarifentwicklung wird von der Zielsystem-Implementierung entkoppelt

---

# Problemstellung

**Was wir heute haben**

- Tarif-Wissen verteilt zwischen Köpfen, Excel und Zielsystemen — keine einheitliche, versionierte, auditierbare Quelle
- Fachnutzer ohne IT-Kenntnisse haben keinen eigenständigen Pfad — jeder Tarif geht über Programmierer

**Warum jetzt**

- AWS Bedrock (Claude Sonnet 4.6 / Opus 4.7) macht KI-gestützte Fachnutzer-UX wirtschaftlich tragfähig

**Wenn wir es nicht tun**

- Punkt-zu-Punkt-Integrationen pro Abnehmer
- Compliance (Audit, Vier-Augen, Validierung) im Monolithen nicht sauber durchsetzbar

---

# Zielgruppen

**Fachnutzer (kein IT)**
- **Produktentwickler** — Tarife anlegen/bearbeiten via UI + KI
- **Aktuare** — berechnen, validieren, aktivieren (Vier-Augen)

**Technisch**
- **Technische Nutzer** — Customer-Layer-Formeln (Python)
- **Administratoren** — Volle Rechte, Bulk-Operationen
- **DevOps** — Cloud-Betrieb, Health, Monitoring

**Konsumenten & Aufsicht**
- **Abnehmer-Systeme** — Export-API für Produktdaten & Code-Artefakte
- **Compliance / Audit** — unveränderliche Änderungshistorie

---

=== Leitprinzipien

# Wie wir vorgehen

Sieben Prinzipien — alle aus Specs/Steering belegt:

1. **MVP vor Breite** — zuerst Risiko- + kapitalbildende LV
2. **Fachnutzer-zentriert, KI als Brücke** — Kernfunktionen ohne IT-Skill bedienbar
3. **Cloud-only SaaS** — ausschließlich AWS, kein On-Premise
4. **Lose Kopplung über HTTP** — vier FastAPI-Module, keine DB-zu-DB-Aufrufe
5. **Compliance-by-Design** — Audit, Vier-Augen, regulatorische Validierung als feste Bausteine
6. **Property-Based Testing zuerst** — 13 Korrektheitseigenschaften, ≥ 100 Iterationen
7. **Spec vor Implementierung** — Tasks/Properties referenzieren Anforderungen rückverfolgbar

---

# Spec → Property → Code

**Reihenfolge der Arbeit**

1. Anforderung in `.kiro/specs/<feature>/requirements.md`
2. Design in `design.md`, Korrektheits-**Properties** definiert
3. Property-Test (Hypothesis, ≥ 100 Iterationen)
4. Implementierung im jeweiligen Modul
5. Unit-Tests ergänzend, nicht ersetzend

**Tag-Format** zur Rückverfolgung:

```
# Feature: gamma-lab, Property {N}
```

Toolchain pro Commit: `ruff` → `black` → `mypy --strict` → `pytest`

---

=== Architektur im Überblick

# System-Übersicht

![System-Übersicht](/gamma-lab-arch/01-system-uebersicht.svg)

Vier produktive Module + ein geplantes, auf gemeinsamer Shared Library und gemeinsamem Neptune-Cluster.

---

# Module & Ports

| Modul | Port | Aufgabe |
|---|---|---|
| `tarif_manager` | 8000 | CRUD, Versionierung, Status, Export-API |
| `rechenkern` | 8001 | LBW, BBW, Netto-/Bruttobeitrag, Sandbox |
| `kg_chat` | 8002 | KI-Assistent über Knowledge Graph |
| `rechenkern_chat` | 8003 | KI-Assistent für Berechnungen |
| `tarif_agent` | 8004 | *geplant* — Zwei-Phasen-Tarifentwicklung |
| `gamma_lab_shared` | — | Bibliothek (Models, Repos, Infra-Clients, i18n) |

**Inter-Service:** ausschließlich HTTP REST. Kein DB-Zugriff zwischen Modulen.

---

# Datenmodell — Knowledge Graph

**AWS Neptune (Gremlin)**

**Vertizes:** `Tarif`, `Sterbetafel`, `Rechnungszins`, `BetaKosten`, `AbschlussKosten`, `Formel`, `TarifVersion`, `FormelVersion`, `DescriptionVersion`, `AuditEntry`

**Edges:** `HAT_STERBETAFEL`, `HAT_RECHNUNGSZINS`, `HAT_BETA_KOSTEN`, `HAT_ABSCHLUSSKOSTEN`, `VERWENDET_FORMEL`, `HAT_VERSION`, `BEZIEHT_SICH_AUF`, `HAS_DESCRIPTION_VERSION`

**Regel:** Alle Gremlin-Abfragen über `GremlinQueryBuilder` — String-Interpolation in Queries ist verboten (Injection-Schutz).

<!--notes:
Property-Updates müssen Cardinality.single setzen — Neptune-Default ist set
und hängt Werte an, statt zu ersetzen. Reader-Bridges (`_normalize_kosten_wert`)
wurden 2026-05-10 entfernt, nachdem das Migrations-Framework live war.
-->

---

# Request-Flow

![Request-Flow](/gamma-lab-arch/02-request-flow.svg)

Vom UI-/KI-Request über ALB, Modul-FastAPI, Repository-Schicht bis Neptune — mit zwischengelagerten Validierungen und Audit-Eintrag.

---

# AWS-Bausteine

![AWS-Übersicht](/gamma-lab-arch/04-aws-uebersicht.svg)

- **ECS Fargate** — ein Service pro Modul
- **Neptune** — Knowledge Graph (IAM-Auth, TLS)
- **MemoryDB** — Redis-kompatibel (TLS, ACL), u.a. Tarif-Agent-Sessions
- **Bedrock** — `eu.anthropic.claude-sonnet-4-6`, `eu.anthropic.claude-opus-4-7` (Cross-Region Inference Profile)
- **Secrets Manager** + **CloudWatch** + **ALB**

---

=== Tarif-Lebenszyklus

# Vom Entwurf zur Auslieferung

![Tarif-Lebenszyklus](/gamma-lab-arch/03-tarif-lebenszyklus.svg)

**Statusübergänge** — `ENTWURF` → `AKTIV` (Vier-Augen) → `INAKTIV` (Soft Delete)

**Versionierung** auf Tarif, Formel und Beschreibung — jeder Snapshot rekonstruierbar.

---

# Vier-Augen-Prinzip

**Regel** — Ein Tarif darf nicht vom Ersteller selbst aktiviert werden.

**Implementierung**

- Aktivierungs-Endpoint prüft `ersteller != aktivierender_nutzer`
- Verstoß → `FourEyesPrincipleViolation` → HTTP 403
- abgesichert durch **Property 11**

**Auch beim Bundle-Import** — Import erzwingt Status `ENTWURF`, damit das Prinzip nicht umgangen wird.

---

# Audit-Log

**Unveränderlich** — vollständiger Snapshot pro Operation:

`CREATE`, `UPDATE`, `DELETE`, `ACTIVATE`, `EXPORT`,
`TARIF_EXPORTIERT`, `BULK_EXPORTIERT`, `TARIF_IMPORTIERT`, `IMPORT_FEHLGESCHLAGEN`

**Schutz** — Property 12 testet Vollständigkeit + Modifikationsablehnung.

**Compliance-Wert** — jede Export-Abfrage durch Abnehmer wird protokolliert.

---

=== KI & Sandbox

# KI-Integration

![KI-Integration](/gamma-lab-arch/10-ki-integration.svg)

**Zwei Assistenten-Module**

- `kg_chat` — natürlichsprachliche Tarifsuche/-pflege, Graph-Visualisierung
- `rechenkern_chat` — Berechnungsanfragen in Sprache, JSON-Codeblock fürs Frontend

**Bausteine** — Bedrock Cross-Region Inference Profile, Dynamic Tool Injection, Konversationshistorie.

---

# Datenfluss KI ↔ Berechnung

![Datenfluss KI-Berechnung](/gamma-lab-arch/07-datenfluss-ki-berechnung.svg)

**Workflow** — erst `rk_export_tarif`, dann Berechnung. Die KI ruft den Rechenkern nicht direkt auf den KG — sie geht über das Modul-API.

---

# Sandbox für Customer-Layer-Code

**Customer Layer überschreibt Core Layer** — Ergebnisse weisen `verwendetes_layer ∈ {core, customer}` aus.

**Schutz**

- **RestrictedPython** — keine `exec` / `eval` direkt
- **Blockierte Imports** — `os`, `subprocess`, `sys`, `socket`, `shutil`, `pathlib`, `importlib`, `builtins.__import__`
- **Timeout** — Standard 5 s
- **Fehlertypen** — `SandboxSecurityError`, `SandboxTimeoutError`, `ParameterValidationError`

---

=== Betrieb & Auslieferung

# Sicherheit & Netzwerk

![AWS Security](/gamma-lab-arch/05-aws-security.svg)

![AWS Netzwerk](/gamma-lab-arch/06-aws-netzwerk.svg)

**Eckwerte** — HTTPS in Produktion, Pydantic-Validierung an jeder API-Grenze, Rate Limiting 100/min/Client, parametrisierte Queries.

---

# CI/CD

![CI/CD Pipeline](/gamma-lab-arch/08-cicd-pipeline.svg)

`ruff` → `black` → `mypy --strict` → `pytest` (Hypothesis) → Docker-Build → ECR-Push → ECS-Deploy

**Operative Regel** — vor Deploy alle Live-Fixes in den Deploy-Branch integrieren (Last-Write-Wins-Falle, **R6**).

---

# Backup & DR

![Backup & DR](/gamma-lab-arch/09-backup-dr.svg)

**Health-Checks** — `/health`, `/health/neo4j`, `/health/redis`, `/health/bedrock` bzw. `/health/rechenkern`

**Degraded Mode** — bei Bedrock-Ausfall liefern KI-Module HTTP 503; Tarif_Manager + Rechenkern bleiben verfügbar.

**Retry-Politik** — max. 3 Versuche, exponentielles Backoff (1 s → 2 s → 4 s, max 30 s).

---

=== Roadmap

# Wo wir stehen

- **Phase 0** — Monorepo + Shared Library (✅)
- **Phase 1** — Tarif_Manager + Rechenkern (✅ lt. tasks, Stand prüfen)
- **Phase 2** — KI-Assistenten KG_Chat + Rechenkern_Chat (✅)
- **Phase 3** — Cloud-Härtung, Migrations-Framework (m000–m007 live, mypy strict blockierend seit PR #28 / 2026-05-10) (laufend)
- **Phase 4** — Tarif-Beschreibung, Bundle Import/Export, Tarif-Agent (laufend)
- **Phase 5** — Produktreife & Erweiterung über Risiko-/kapitalbildende LV hinaus

---

# Offene Fragen

- Owner für das Zielbild
- Adoptions-/Geschäftsmetriken — wie messen wir „Produktreife"?
- `ABNEHMER` — eigene RBAC-Rolle oder Service-Account?
- `tasks.md` vs. `implementation-status.md` divergieren — wahrer Stand?
- Concurrency / Locking beim Bundle-Re-Import
- Lasttest für Neptune-Cluster (parallel Legacy + gamma-lab)
- Frontend-Architektur — wo lebt die kanonische UI?

---

# Danke

**Quellen** — `gamma-lab/docs/zielbild.md`, `gamma-lab/docs/architektur/*.svg`

**Fragen?**
