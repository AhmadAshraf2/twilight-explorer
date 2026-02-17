---

# Twilight Explorer Indexer — Master Implementation Prompt (File 5)

Copy/paste this prompt into Claude/Codex/Cursor (the “implementation AI”). It is designed to trigger a **major refactor** while preserving safety, correctness, and rollout discipline.

> **Required inputs for the implementation AI**
> - `indexer_target_spec.md` (target invariants + architecture contract)
> - `refactor_plan.md` (sequencing + phase exit criteria)
> - This file (File 5) for the execution instructions and output format

---

## MASTER PROMPT

You are a senior production infrastructure engineer and distributed systems architect.

### Context
We operate a chain explorer stack (indexer + API + web) for a Cosmos/Tendermint chain (`chain_id=nyks`, bech32 prefix `twilight`).

The current indexer is a Node/TypeScript service using Prisma + Postgres + Redis. It ingests blocks/txs primarily via **LCD** and writes to Postgres. Some module state is also fetched via LCD. A zkOS decoder call is currently used in the ingestion path.

**Goal:** refactor the indexer into an “industry-grade forever indexer” that can stream indefinitely, recover from failures, handle replays safely, degrade gracefully, and be operable in production.

### Non-negotiable contract
You must treat `indexer_target_spec.md` as the architectural contract. Every change must satisfy the invariants listed there (including chain identity, rollback coverage, deterministic event identity, side-effect ordering, indexed vs enriched contract, and reindex modes).

You must implement changes in the phase order defined by `refactor_plan.md`.

You must respect the rollout discipline defined in File 4 (expand/backfill/enforce/switch; canary/rollback; no split-brain writers).

---

## What you must produce

Produce a **single PR plan** that includes:

1) **Architecture diff** (what changes, what stays)
2) **Phase-by-phase implementation plan** aligned to `refactor_plan.md`
3) **Schema migration plan** aligned to expand→backfill→enforce→switch
4) **Operational plan** (health checks, metrics, alerts, runbooks)
5) **Rollout plan** aligned to File 4
6) **Acceptance tests** (objective checks for correctness + resilience)

Then implement Phase 1 and Phase 1.5 changes in code.

If you cannot implement everything in one pass, implement Phase 1 + 1.5 fully and leave clear TODOs for Phase 2+.

---

## Hard requirements (must follow)

### A) Safety & correctness
- Enforce **single writer leadership** using Postgres advisory lock.
- Readiness must fail if:
  - DB unreachable
  - RPC unreachable
  - leader lock not held
- Implement **RPC-first** ingestion:
  - fetch blocks via `/block?height=H`
  - fetch events/results via `/block_results?height=H`
- Implement **WS head tracking** with poll fallback (RPC `/status`).
- Implement **head lag** (`HEAD_LAG`).
- Implement **linkage validation** (verify previous hash via `last_block_id.hash`):
  - on mismatch: **halt + alert** (do not silently continue).
- Implement bounded retries/backoff with jitter.

### B) Do not block ingestion on external dependencies
- Phase 1 must remove any synchronous dependency that can stall ingest, or isolate it behind a non-blocking boundary.
- zkOS decode must not be in the hot path in later phases; for Phase 1, if it remains, it must be protected by timeouts and failure must not halt block commits.

### C) Side effects ordering
- No Redis/pubsub emit is allowed before successful DB commit for height H.

### D) Configurability
Expose configuration values with sane defaults:
- RPC URL(s)
- WS URL
- timeouts
- retry budgets
- `HEAD_LAG`
- batch size
- max inflight heights (even if 1 for Phase 1)

---

## Output format (strict)

### 1) Executive summary
- What changes in Phase 1/1.5
- Expected impact
- Risks

### 2) Implementation steps
For each phase (1, 1.5, 2…):
- deliverables
- code areas affected
- config changes
- migration steps
- exit criteria

### 3) Database plan
- expand changes
- backfill approach
- enforce constraints
- switch behavior
- rollback notes

### 4) Observability plan
- health endpoints
- metrics list
- alert suggestions

### 5) Test plan
- deterministic replay test
- WS down fallback test
- RPC hiccup test
- linkage mismatch halt test

### 6) Rollout plan
- staging validation gates
- production canary gates
- rollback actions

---

## Notes / constraints
- Avoid introducing a second long-lived indexer. If you propose “shadow mode,” it must be read-only or lock-gated.
- Prefer simple, deterministic designs over clever ones.
- Keep the API and Web stable (no breaking changes).

---

## Deliverable for Phase 1 + 1.5 implementation

Implement these concrete items:

1. **Leader lock**
   - Acquire advisory lock at startup.
   - If not acquired, indexer should remain alive but not ready; no writes.

2. **RPC + WS head tracking**
   - WS subscription to new headers.
   - Poll fallback.
   - Maintain `latestSeenHeight`.

3. **RPC ingestion**
   - Replace LCD usage for block/tx ingestion.
   - Keep LCD only for slow-state queries.

4. **Linkage validation**
   - Verify `last_block_id.hash` relationship.
   - On mismatch: stop ingestion and emit a clear metric/log.

5. **Minimal telemetry**
   - `/health/live`
   - `/health/ready`
   - `/metrics` with: head_height, indexed_height, lag, block_processing_duration, rpc_errors, db_tx_duration

6. **Post-commit side effects**
   - Ensure Redis/pubsub emits only after commit.

---

## Definition of done for this PR

- Phase 1 + Phase 1.5 fully implemented and working.
- Indexer can run for hours against live chain without drifting.
- WS disconnect does not stall ingestion.
- RPC hiccups do not crash the process.
- Leader lock prevents multi-writer.
- Minimal metrics and health endpoints are exposed.

END MASTER PROMPT
S