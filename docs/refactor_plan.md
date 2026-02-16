---

# Twilight Explorer Indexer — Gap Analysis & Refactor Plan

**Purpose of this document:** translate the gap between the *current system* (File 1) and the *target forever indexer architecture* (File 2) into a concrete, phased refactor plan. This document answers **what must change**, **why**, and **in what order**, without prescribing code-level details.

This is the execution bridge between analysis and implementation.

---

## 1. Summary: where we stand vs target

| Dimension | Current State | Target State | Gap Severity |
|--------|---------------|--------------|--------------|
| Ingestion source | LCD (blocks + txs) | RPC HTTP + WS | **Critical** |
| Head tracking | Poll LCD | WS + lag policy + poll fallback | **Critical** |
| Single writer (leader lock) | Not enforced | DB-backed leader lock + readiness gating | **Critical** |
| Block atomicity | Partial | Full per-height atomicity across all derived tables | **Critical** |
| Replay safety | Incomplete | Deterministic idempotency + DB uniqueness | **Critical** |
| Event identity | Implicit / non-deterministic | Deterministic event identity (begin/tx/end) | **High** |
| Enrichment model | Synchronous | Async / retryable with backlog visibility | **High** |
| Source of truth | Split (API + indexer) | Indexer-only ingestion ownership | **High** |
| Backpressure model | Implicit | Explicit bounded pipeline + serial commit | **High** |
| Reorg handling | None | Detect early (halt) + rollback/reindex automation | **Medium** |
| Chain halt semantics | Implicit wait | Explicit idle mode + stalled-head metrics | **Medium** |
| Telemetry & health | Logs only | Minimal metrics/health early + full ops package | **High** |
| Longevity controls | None | Partitioning + summaries + reconciliation | **Medium** |

---

## 2. Refactor principles

Before detailing phases, the following principles govern *all* changes:

1. **Correctness before performance** — never trade replay safety for speed.
2. **One axis at a time** — transport, correctness, ops, and scaling are refactored in sequence.
3. **Deployable increments** — each phase must be deployable and reversible.
4. **No product regressions** — UI and API semantics must remain stable.

---

## 3. Phase-by-phase refactor plan

### Phase 1 — Safety foundations + Transport & head tracking (RPC-first)
**Objective:** remove LCD from the hot path, establish reliable head awareness, and prevent unsafe multi-writer scenarios from day one.

**Changes required:**
- **Leader lock (single writer):** enforce one ingest leader via Postgres advisory lock; readiness must fail if lock is not held.
- **RPC WebSocket head tracker:** subscribe to `NewBlockHeader` and maintain `latestSeenHeight`.
- **Poll fallback:** if WS is down, fall back to polling RPC `/status` (reduced cadence).
- **Head-lag policy:** index to `latestSeenHeight - HEAD_LAG` (configurable).
- **RPC-first ingestion:** replace LCD block/tx ingestion with RPC HTTP (`/block`, `/block_results`).
- **Bounded retries & timeouts:** standardize request timeouts, retry budgets, exponential backoff + jitter.
- **Linkage validation (reorg detection v1):** validate `last_block_id.hash` linkage during ingestion; on mismatch, **halt and alert** (rollback automation comes later).
- Retain LCD only for slow, non-critical module queries (validators/fragments/reserves/params) temporarily.

**Why this phase comes first:**
- It eliminates the largest systemic fragility (LCD hot path).
- It prevents accidental “two indexers running” incidents during deployment.
- It surfaces reorg-like inconsistencies early rather than silently corrupting state.

**Exit criteria:**
- Indexer advances heights based solely on RPC head tracking + RPC fetch.
- Only one writer can run; second instance fails readiness.
- WS loss does not stall ingestion (poll fallback works).
- Linkage mismatch halts deterministically with clear operator signal.

---

### Phase 1.5 — Minimal telemetry & health (for safe refactoring)
**Objective:** gain immediate visibility while the refactor is in motion.

**Changes required:**
- Add **liveness** and **readiness** endpoints:
  - liveness = process up
  - readiness = DB reachable + RPC reachable + leader lock held
- Add minimal Prometheus metrics:
  - `head_height`, `indexed_height`, `lag`
  - block processing duration (histogram)
  - RPC request error count + latency (high level)
  - DB transaction duration + errors (high level)

**Why now:**
- Without basic metrics/health, later correctness changes are risky to deploy.

**Exit criteria:**
- Operators can observe lag and determine whether the indexer is healthy without inspecting the DB directly.

---

### Phase 2 — Block atomicity & replay safety
**Objective:** make indexing restartable, replay-safe, and crash-tolerant.

**Changes required:**
- Define deterministic identity + uniqueness for:
  - events (begin/tx/end phases)
  - module entities
  - any “activity rollup” counters that can be replayed
- Enforce uniqueness at the DB level (constraints/indexes).
- Move *all* block-derived writes (including module tables) into a single atomic transaction.
- Ensure `lastIndexedHeight` only updates after full commit.
- Establish the **Indexed vs Enriched** contract (indexed facts must progress even when enrichment is pending).

**Why this phase matters:**
- Without this, any scaling or parallelism will amplify corruption.

**Exit criteria:**
- Re-indexing an already indexed range produces no net DB changes.
- Crashes mid-block leave no partial state.

---

### Phase 3 — Ingest vs enrichment separation
**Objective:** prevent external dependencies from blocking core indexing.

**Changes required:**
- Redesign zkOS decoding as an async enrichment task.
- Store raw facts immediately; decode later.
- Track enrichment status, retries, and errors explicitly.
- Add circuit breakers around external decode APIs.
- Add enrichment backlog metrics (queue depth, decode durations, fail rates).

**Why this phase matters:**
- External APIs are unreliable; ingestion must not be.

**Exit criteria:**
- Decode API outages do not slow block ingestion.
- Enrichment can be paused/resumed independently.

---

### Phase 4 — Single source of truth (ingestion ownership cutover)
**Objective:** eliminate ingestion ambiguity and split ownership.

**Changes required:**
- Move withdrawal syncing from API to indexer.
- Consolidate all chain-derived state ingestion inside the indexer.
- Treat API as read-only from the chain perspective.
- Run a short transition plan (shadow verification → cutover → remove API job).

**Why this phase matters:**
- Operational clarity and debuggability.

**Exit criteria:**
- Only the indexer writes chain-derived tables.

---

### Phase 5 — Scaling & backpressure model
**Objective:** safely improve throughput without sacrificing correctness.

**Changes required:**
- Introduce explicit pipeline stages (fetch → decode → commit).
- Allow bounded parallel fetch/decode with **serial commit**.
- Introduce inflight height limits, decode concurrency limits, and DB backpressure.
- Expose concurrency limits as configuration.

**Why this phase matters:**
- Catch-up scenarios and future chain growth.

**Exit criteria:**
- Indexer can catch up faster without DB overload.
- Throughput is predictable and tunable.

---

### Phase 6 — Reorg recovery automation + chain-halt semantics
**Objective:** handle real-world chain behavior deterministically.

**Changes required:**
- **Chain halt/idle mode:** detect stalled head and enter idle mode without spamming errors.
- Emit chain-stalled metrics and alerts.
- Upgrade reorg handling from “detect + halt” to “detect + rollback + reindex”:
  - rollback last N heights (configurable)
  - reindex forward
  - rollback must cover *all* derived tables (no orphans)

**Why this phase matters:**
- Silent corruption or infinite retries are unacceptable in production.

**Exit criteria:**
- Chain halt does not cause errors or drift.
- Reorgs are detected and resolved automatically.

---

### Phase 7 — Full telemetry, alerting & operations package
**Objective:** make the system deeply observable and safe to operate.

**Changes required:**
- Expand Prometheus metrics to include:
  - RPC/LCD request rates + latency + error codes
  - DB transaction latency/errors by operation group
  - enrichment success/fail + durations + backlog
  - poison height counters
  - Redis publish failures
- Define alert thresholds (lag, errors, backlog, chain stalled).
- Add operator controls (reindex range, stop-at-height, ingest-only/enrich-only).
- Document runbooks for common incidents.

**Why this phase matters:**
- Without observability, failures are discovered too late.

**Exit criteria:**
- Operators can diagnose issues with metrics/logs alone.
- Alerts fire before user-visible impact.

---

### Phase 8 — Longevity & cost control
**Objective:** ensure the indexer remains viable over years.

**Changes required:**
- Partition high-volume tables (events first).
- Introduce summary/aggregate tables for dashboards.
- Add reconciliation jobs for data quality.
- Define retention policies where acceptable.

**Why this phase matters:**
- Long-term DB growth is inevitable; planning prevents outages.

**Exit criteria:**
- Query performance remains stable as data grows.
- Storage growth is predictable.

---

## 4. Risk management & sequencing rationale

- Phases 1–4 are **mandatory** before calling the system production-grade.
- Phases 5–7 elevate the system to **industry-grade** and safely operable at scale.
- Phase 8 ensures **long-term sustainability**.

Skipping early phases makes later phases dangerous.

---

## 5. How this file should be used

- As a checklist during refactor planning
- As acceptance criteria for each milestone
- As grounding context for implementation prompts (Claude/Codex)
- As internal documentation for future contributors

---

**This document defines the path from “working indexer” to “forever indexer.”**
