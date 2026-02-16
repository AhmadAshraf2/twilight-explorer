---

# Twilight Explorer Indexer — Target Forever Indexer Architecture Spec

**Purpose of this document:** define the *target-state architecture* for the Twilight indexer once it reaches “industry-grade forever indexer” status. This is the reference spec against which all refactors, design decisions, and implementation work will be evaluated.

This document is **normative**: it defines required invariants, responsibilities, and failure semantics. It is not tied to a specific code implementation.

---

## 1. Design goals (non-negotiable)

The forever indexer must:

1. **Stream indefinitely** without manual intervention
2. **Recover safely** from crashes, restarts, and partial failures
3. **Remain correct under replay and backfill**
4. **Degrade gracefully** when dependencies fail
5. **Scale predictably** without risking data corruption
6. **Be operable by humans** (metrics, alerts, runbooks)
7. **Avoid split-brain ingestion** (single source of truth)

---

## 2. Core invariants

These invariants must *always* hold. Violating any of them disqualifies the system from “forever indexer” status.

### 2.1 Ordered ingestion
- Blocks are *committed in strictly increasing height order*.
- Height H+1 is never committed before height H.

### 2.2 Atomic per-block commit
- All DB writes derived from a given block height H either:
  - commit together, or
  - do not commit at all.
- `lastIndexedHeight` advances **only after** the full block commit succeeds.

### 2.3 Replay safety / idempotency
- Re-indexing the same height range produces identical final DB state.
- Deterministic uniqueness exists for:
  - blocks
  - transactions
  - events
  - module-specific entities

### 2.4 Single writer
- At most **one active ingest leader** exists at any time.
- Leadership is enforced via a durable coordination mechanism (e.g., DB advisory lock).

### 2.5 Separation of concerns
- **Ingest** (critical path) never blocks on:
  - external APIs
  - enrichment
  - analytics
- **Enrichment** is retryable and eventually consistent.

---

## 3. High-level architecture

### 3.1 Logical components

The forever indexer is composed of **five logical subsystems**:

1. **Head Tracker**
2. **Ingest Pipeline**
3. **Enrichment Workers**
4. **Slow-State Synchronizers**
5. **Observability & Control Plane**

Each subsystem has a single, well-defined responsibility.

---

## 4. Head tracking & chain awareness

### 4.1 Primary mechanism: RPC WebSocket
- Subscribe to `tm.event='NewBlockHeader'`.
- Maintain `latestSeenHeight` in memory.

### 4.2 Head-lag policy
- Indexer targets `targetHeight = latestSeenHeight - HEAD_LAG`.
- HEAD_LAG absorbs:
  - finality uncertainty
  - RPC race conditions
  - transient forks

### 4.3 Fallback behavior
- If WS disconnects:
  - fall back to polling `/status` at a reduced cadence.
- WS unavailability **must not** stall ingestion.

### 4.4 Chain halt semantics
- If `latestSeenHeight` does not advance beyond a threshold:
  - enter **Idle / Halted** mode
  - stop emitting errors
  - emit explicit “chain stalled” metric
- Resume automatically when blocks continue.

---

## 5. Ingest pipeline (critical path)

### 5.1 Data sources
- **RPC HTTP** is the authoritative ingestion source:
  - `/block?height=H`
  - `/block_results?height=H`
- LCD is relegated to *non-critical slow state* only.

### 5.2 Pipeline stages

For each target height H:

1. Fetch block + block_results (with bounded concurrency).
2. Validate block linkage (`last_block_id.hash`).
3. Extract:
   - header
   - transactions
   - events
4. Perform deterministic decoding (no external calls).
5. Prepare a complete write-set for height H.
6. Commit write-set atomically.

### 5.3 Reorg handling
- If block linkage validation fails:
  - enter **reorg recovery mode**
  - roll back last N heights (configurable)
  - re-index forward

### 5.4 Backpressure model
- Bounded inflight heights
- Bounded decode concurrency
- Bounded DB transaction queue
- If any bound is exceeded, ingestion rate slows automatically.

---

## 6. Enrichment subsystem (non-critical path)

### 6.1 Responsibilities
- zkOS bytecode decoding
- heavy analytics
- optional derived summaries

### 6.2 Execution model
- Asynchronous worker pool
- Driven by DB rows in `pending` state
- Retryable with exponential backoff
- Circuit-breaker around external APIs

### 6.3 Guarantees
- Enrichment failures **do not block ingestion**.
- Enrichment is eventually consistent.
- Enrichment status is explicitly tracked.

---

## 7. Slow-state synchronizers

### 7.1 Scope
- Validators
- Fragments
- Reserves
- Params
- Withdrawals (if not derivable directly from tx stream)

### 7.2 Execution
- Periodic polling via LCD or RPC module endpoints
- Idempotent upserts
- Treated as *metadata*, not part of block-critical path

### 7.3 Degradation
- If slow-state sources fail:
  - continue core indexing
  - mark metadata as stale

---

## 8. Observability & control plane

### 8.1 Metrics (required)

At minimum:
- head height
- indexed height
- lag
- blocks/sec
- tx/sec
- RPC error rates & latency
- DB transaction latency
- enrichment backlog size
- chain stalled indicator

### 8.2 Health endpoints
- **Liveness:** process is running
- **Readiness:** DB reachable, RPC reachable, leader lock held

### 8.3 Alerts
- sustained lag
- RPC failure rate spike
- enrichment backlog growth
- chain stalled beyond threshold

### 8.4 Operator controls
- reindex from height
- stop at height
- ingest-only mode
- enrich-only mode

---

## 9. Persistence & longevity

### 9.1 Data layering
- Raw chain facts (immutable)
- Derived decoded data
- Aggregated summaries (for UI)

### 9.2 Growth controls
- Partition high-volume tables (events first)
- Avoid full-table scans for dashboards
- Periodic reconciliation jobs

---

## 10. Failure modes & guarantees

| Failure | Expected Behavior |
|------|------------------|
| Indexer crash | Resume from last committed height |
| RPC down | Retry + failover + degraded mode |
| WS down | Poll fallback |
| External decode API down | Enrichment pauses; ingest continues |
| Chain halt | Enter idle mode |
| Reorg | Roll back and reindex |

---

## 11. Definition of “done”

The indexer qualifies as a **forever indexer** when:

- It can be stopped, restarted, or crashed at any point without data corruption.
- It can replay historical ranges without duplicates or drift.
- It can survive RPC/LCD/decoder outages without losing ingestion continuity.
- Operators can diagnose issues via metrics and logs alone.
- DB growth and performance remain stable over long time horizons.

---

**This document is the architectural contract.** All refactors and implementations must move the system closer to this target state.
