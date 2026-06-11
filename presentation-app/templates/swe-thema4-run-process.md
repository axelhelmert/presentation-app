# AI Agents meet Conventional Core Systems

How conversational AI and deterministic core systems work together in the **run** process

*Update AI @ msg life — Software Engineering & Product Development · Topic 4*

---

=== Setting the Stage

# Build vs. Run — a clean separation

A recurring theme of this update: **separate Build from Run.**

- **Build** — agents help create code, tests, docs, architecture. Output is largely *deterministic, rule-based* software (Python, Java).
- **Run** — the system is *in production*, processing real business transactions.

Topic 4 is about the **run** side: what happens when conventional core systems and AI agents operate **side by side** in live operations.

<!--notes:
Anchor back to Chapter 1 (regulatorisch konforme Architektur) and the Build/Run argument.
Key message: the hard governance questions change character once we are in Run.
-->

---

# Why "run" is a different problem

In Build, a human reviews artifacts before they ship. In Run, decisions happen **continuously, at transaction speed**.

- No human in the loop for every single case
- Latency, availability, cost matter (cf. DORA, cloud operations)
- Outcomes touch policyholders directly

→ The design question: **what may an agent decide, and what stays deterministic?**

<!--notes:
This is the pivot slide. Everything after answers that question.
-->

---

=== Two Worlds

# The deterministic core

Core systems (PAS, actuarial engine, policy administration) are valued precisely because they are **predictable**.

- Same input → same output, every time
- Auditable, versioned, regulator-friendly
- Decades of encoded domain rules

This is **not** a legacy problem to be replaced — it is the **system of record**.

<!--notes:
Important framing for an insurance audience: we are not throwing the core away.
gamma-lab / policy-admin are concrete examples of this deterministic core.
-->

---

# The conversational layer

AI agents add what the core was never good at:

- **Natural-language** access to data and processes
- **Flexibility** for the long tail of cases
- **Orchestration** across systems and steps

Strength and weakness are mirror images: agents are **flexible but probabilistic**; the core is **rigid but exact**.

<!--notes:
Tie to msg.ask:it (knowledge) and msg.process:it (business transactions / Conversational AI) from the other chapters.
-->

---

# Division of labor

| Concern | Core system | AI agent |
|---|---|---|
| Calculation / pricing | ✅ authoritative | ❌ never |
| Record of truth | ✅ | ❌ |
| Natural-language intake | ❌ | ✅ |
| Routing / orchestration | partial | ✅ |
| Edge cases & exceptions | rigid | ✅ adaptive |

**Rule of thumb:** agents *interpret and orchestrate*, the core *decides and records*.

<!--notes:
This table is the heart of the talk. Worth dwelling on.
-->

---

=== The Integration Pattern

# Conversational AI on top of a deterministic core

```
   User / Process
        │  natural language
        ▼
   ┌──────────────┐
   │   AI Agent   │  interpret · orchestrate · explain
   └──────┬───────┘
          │ typed, validated API calls
          ▼
   ┌──────────────┐
   │ Core System  │  calculate · decide · persist
   └──────────────┘
```

The agent never *replaces* the core — it **drives** it through the same APIs a human or another system would use.

<!--notes:
Concretely: an agent calling /api/v1/berechnung/einzel rather than computing a premium itself.
-->

---

# Guardrails make it safe

The core stays the source of truth, so the agent's mistakes are **contained**:

- Agent proposes → core **validates and executes**
- Every action is a **logged, replayable** API call
- The agent **explains**; the core **proves**

This is **Human-on-the-Loop** for operations: oversight on outcomes, not on every keystroke.

<!--notes:
Contrast Human-IN-the-loop (Build) vs Human-ON-the-loop (Run).
-->

---

=== Use Cases in Run

# Where this pays off today

- **Customer & advisor self-service** — ask about a policy in plain language; the core answers with exact figures
- **Business-transaction automation** — agent gathers and validates input, core executes the change (msg.process:it)
- **Exception handling** — the long tail that rules never fully covered
- **Explainability** — turn a deterministic calculation into a human-readable narrative

<!--notes:
One slide per use case if a longer version is needed — these are the expansion points.
-->

---

# A concrete flow

**"I'd like to add my newborn to my policy."**

1. Agent understands intent, asks for the missing facts
2. Agent calls the core with validated, typed data
3. Core recalculates premium & produces the binding result
4. Agent explains the change in plain language, logs everything

Flexibility at the edge, **exactness at the core**.

<!--notes:
Use a real product/policyForm from gamma-lab here when we flesh this out.
-->

---

=== Governance & Outlook

# Risk, regulation, operations

Even in Run, the Chapter-1 constraints hold:

- **DSGVO / EU AI Act** — what data the agent sees, what it may decide
- **DORA & cloud ops** — availability, performance, cost of the agent layer
- **Auditability** — the deterministic core remains the evidence trail

The architecture *is* the compliance story: keep authority in the auditable core.

<!--notes:
Cross-reference Chapter 1 explicitly. Do not re-derive — point to it.
-->

---

# Takeaways

**Conventional ≠ obsolete.** The deterministic core is the foundation.

**Agents add reach, not authority.** They interpret and orchestrate; the core decides and records.

**The boundary is the design.** Draw it well and you get flexibility *and* compliance.

→ Combined use is not a compromise — it is the **target architecture** for run.

<!--notes:
Close by linking back to the overall "Update AI" arc: this is how Build and Run fit together.
-->

---

# Discussion

Where in our run processes is the **core/agent boundary** still unclear?

*Topic 4 of: Where developments are taking us · Future IT architecture · AI in Build · **AI in Run***
