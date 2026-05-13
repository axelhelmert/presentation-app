# Policy Administration System

Vertragsstrukturen — automatisch generiert aus `policy-admin`.

---

=== Schema

# Contract-Schema

```mermaid
classDiagram
    class Contract {
        +str contractId
        +str productId
    }
    class ContractPart {
        +str contractPartId
        +str policyFormId
    }
    class ContractSegment {
        +str contractSegmentId
        +str policyFormGeneration
        +LAUFEND|EINMALIG beitragsart
        +dict inputs
    }
    class InsuredPerson {
        +str partnerId
        +dict data
    }
    Contract "1" *-- "n" ContractPart : contractParts
    ContractPart "1" *-- "n" ContractSegment : contractSegments
    ContractPart "1" *-- "n" InsuredPerson : insuredPersons
```

<!--notes:
Quelle: src/policy_admin/contract/models.py — die pydantic-Modelle sind die
single source of truth. Dieses Diagramm wird per Reflection erzeugt.
-->

---

=== Beispiel-Verträge

# Beispiel: C-2026-0001

```mermaid
graph TD
    C["Contract<br/>C-2026-0001<br/>product: P-RISIKO-2024"]
    CP1["ContractPart<br/>CP-1<br/>pf: TARIF_RISIKO_2024"]
    C --> CP1
    CP1_CS1["ContractSegment<br/>CS-1<br/>gen: 2024.1<br/>LAUFEND<br/>duration=20, age=35, sum=250000"]
    CP1 --> CP1_CS1
    CP1_IP1["InsuredPerson<br/>PTN-123456<br/>birthDate: 1991-06-15, sex: F"]
    CP1 --> CP1_IP1
```

---

# Beispiel: C-2026-0002

```mermaid
graph TD
    C["Contract<br/>C-2026-0002<br/>product: P-RISIKO-2024"]
    CP1["ContractPart<br/>CP-1<br/>pf: TARIF_RISIKO_2024"]
    C --> CP1
    CP1_CS1["ContractSegment<br/>CS-1<br/>gen: 2024.1<br/>LAUFEND<br/>duration=25, age=47, sum=500000"]
    CP1 --> CP1_CS1
    CP1_CS2["ContractSegment<br/>CS-2<br/>gen: 2024.1<br/>EINMALIG<br/>duration=10, age=47, sum=100000"]
    CP1 --> CP1_CS2
    CP1_IP1["InsuredPerson<br/>PTN-200001<br/>birthDate: 1979-09-30, sex: M"]
    CP1 --> CP1_IP1
```
