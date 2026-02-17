

# Twilight Explorer Indexer — Migration & Rollout Strategy (File 4)

**Purpose of this document:** define a safe, reversible rollout plan to migrate the current indexer to the Forever Indexer target architecture without downtime, without data corruption, and without running two long-lived indexers side-by-side.

This plan assumes:
- Postgres is the source of truth.
- Only one writer indexer should be active in production.
- We can use staging, canary deployments, feature flags, and “dry-run” modes to validate changes.

---

## 0) Guiding rules for migration

1. **No split-brain writers in prod.** If two indexers are running, only one may hold the leader lock and perform writes.
2. **Every phase is reversible.** Rollback = stop the new indexer, restore previous version, and resume from a known checkpoint.
3. **Schema-first, behavior-second.** Add schema in a backward-compatible way first, then switch behavior.
4. **Always verify with objective signals.** Lag, errors, DB invariants, and sample queries must pass before moving forward.

---

## 1) Environments & prerequisites

### 1.1 Environments
- **Local:** developer validation
- **Staging:** mirrors production topology + representative data
- **Production:** controlled rollout (canary → full)

### 1.2 Pre-flight checklist
- Confirm chain identity expectations:
  - expected `chain_id`
  - stable chain fingerprint (genesis hash or agreed marker)
- Confirm RPC availability and retention requirements:
  - `/status`, `/block`, `/block_results` are reachable
  - retention window supports your backfill needs
- Confirm leader lock plan:
  - old indexer will be updated to either respect lock or be stopped during cutover

---

## 2) Backward-compatible DB migration strategy

We will use an **expand → backfill → enforce → switch** approach.

### 2.1 Expand (safe additions)
Add new columns/tables needed for forever indexer without breaking existing readers:

- **Event deterministic identity**
  - add `phase` (begin/tx/end)
  - add `eventIndex` (required)
  - add optional `msgIndex` (if used)
  - add optional `txHash` nullable for begin/end events
- **Indexed vs enriched contract** (zkOS)
  - add `decodeStatus`, `decodeAttempts`, `lastDecodeError`, timestamps
- **Operational state**
  - add fields to IndexerState to record:
    - `mode` (normal/degraded/idle)
    - `poisonHeight` (if applicable)
    - `lastErrorSummary`

**Important:** Do not add uniqueness constraints yet if you haven’t backfilled.

### 2.2 Backfill (offline or low-risk job)
- Backfill deterministic event identity for historical rows:
  - compute `phase` + `eventIndex` deterministically from stored data where possible
  - for rows where identity cannot be derived, mark as legacy and exclude from uniqueness enforcement (temporary)
- Backfill zkOS decode state:
  - set existing rows to `ok` if decoded payload exists
  - else set to `pending`

### 2.3 Enforce (constraints + indexes)
After backfill:
- Add unique constraints for events based on the chosen identity model.
- Add indexes required for query patterns (by height, txHash, address, etc.).

### 2.4 Switch (behavior change)
Only after enforcement is in place:
- Change writer behavior to use the new identity fields.
- Change insert patterns to use upserts / createMany skipDuplicates.

---

## 3) Rollout by refactor phases

This section provides a **production rollout playbook** aligned to the refactor plan.

### Phase 1 rollout: Leader lock + RPC transport + WS head tracking

**Staging steps**
1. Deploy leader lock + readiness gating.
2. Enable WS head tracking with poll fallback.
3. Keep ingestion source as LCD initially, but record RPC head/height metrics for comparison.
4. Enable RPC ingestion behind a feature flag (`INGEST_SOURCE=rpc|lcd`).

**Validation gates (staging)**
- Head height updates continuously.
- Lag remains stable.
- No double-writer incidents (lock works).

**Production steps (canary)**
1. Deploy new version with **RPC ingestion OFF** (LCD continues) + leader lock ON.
2. Verify:
   - only one writer holds lock
   - readiness reflects lock
3. Turn ON RPC ingestion for canary (small % or single node).

**Production gates**
- No increase in 5xx/timeouts.
- Indexed height advances smoothly.
- DB write latency remains within baseline.

**Rollback**
- Flip flag back to LCD.
- If needed, redeploy previous version.

---

### Phase 1.5 rollout: Minimal telemetry + health

**Staging steps**
- Expose `/health/live`, `/health/ready`, `/metrics`.

**Production gates**
- Dashboards show head/indexed/lag.
- Readiness fails when lock is not held.

**Rollback**
- Safe; telemetry additions should not affect core behavior.

---

### Phase 2 rollout: Atomic block commit + replay safety

**Staging steps**
1. Apply schema expand/backfill/enforce for deterministic event identity.
2. Update writer to commit **all block-derived writes** in a single transaction.
3. Introduce a controlled reindex test range in staging:
   - reindex last 500–2000 blocks twice
   - verify no duplicates / drift

**Validation gates**
- Reindexing a range produces identical row counts and checksums.
- `lastIndexedHeight` only advances after full commit.
- No partial state visible.

**Production steps**
1. Deploy Phase 2 changes with conservative batch size.
2. Run a controlled replay validation (non-destructive):
   - pick a recent height window
   - compare derived counts (blocks/tx/events) to expected

**Rollback**
- Stop new indexer.
- Restore DB from snapshot if constraints were enforced incorrectly.
- Redeploy previous version.

**Critical note:** take a DB snapshot before enforcing new uniqueness constraints.

---

### Phase 3 rollout: Ingest vs enrichment split

**Staging steps**
1. Make zkOS decode non-blocking.
2. Enable enrichment worker with bounded concurrency.
3. Simulate decoder outage:
   - force decode API failures
   - ensure ingestion continues

**Production steps**
1. Deploy ingestion changes first (write `pending` state).
2. Deploy enrichment worker (can be same binary, separate mode).
3. Start with low concurrency.

**Validation gates**
- Block indexing throughput unaffected by decode failures.
- Backlog metrics visible and stable.

**Rollback**
- Disable enrichment worker; ingestion continues.

---

### Phase 4 rollout: Single source of truth cutover (withdrawals + slow state)

**Staging steps**
1. Implement indexer-owned withdrawal sync.
2. Run **shadow verification**:
   - keep API job running but do not expose its results as authoritative
   - compare indexer vs API results for a fixed period

**Production cutover plan**
1. Deploy indexer withdrawal sync in shadow mode.
2. Compare for N days:
   - record mismatches, latency differences
3. Cutover:
   - disable API job
   - mark indexer as authoritative

**Rollback**
- Re-enable API job.

---

### Phase 5 rollout: Scaling + backpressure

**Staging steps**
- Increase catch-up scenarios and tune:
  - max inflight heights
  - decode concurrency
  - DB batch sizes
- Run load tests that include:
  - RPC latency spikes
  - DB latency spikes

**Production approach**
- Start conservative (low parallelism).
- Increase limits gradually while watching:
  - lag
  - DB tx latency
  - RPC errors

**Rollback**
- Reduce concurrency limits immediately (no redeploy required).

---

### Phase 6 rollout: Reorg rollback automation + chain halt semantics

**Staging steps**
- Validate chain halt behavior:
  - simulate no new blocks
  - ensure idle mode triggers
- Validate rollback logic on a test DB:
  - artificially inject a linkage mismatch
  - confirm rollback deletes/rewinds all derived tables

**Production approach**
- Enable rollback automation behind a flag.
- Initially set rollback depth small and alert-heavy.

**Rollback**
- Disable rollback automation; revert to “detect + halt.”

---

### Phase 7 rollout: Full ops package

**Staging steps**
- Define and test alert rules.
- Document and validate runbooks.

**Production gates**
- Alerts trigger appropriately in controlled tests.
- Runbooks are validated by at least one operator.

---

### Phase 8 rollout: Longevity (partitioning, aggregates, reconciliation)

**Staging steps**
- Test partitions on a clone of production.
- Validate query performance.

**Production approach**
- Partition in small steps.
- Add aggregates without changing API semantics (API reads from aggregates where safe).

**Rollback**
- Keep raw tables intact; aggregates can be disabled.

---

## 4) Verification checklist (production acceptance)

A rollout is considered successful when all of the following are true:

- **Correctness**
  - No duplicate events after replay
  - Deterministic per-height commits
  - No missing heights

- **Reliability**
  - WS down does not stall ingestion
  - RPC hiccups handled by retries/backoff
  - External decode outages do not stall indexing

- **Operability**
  - `/health/ready` is meaningful
  - `/metrics` exposes head/indexed/lag
  - Alerts fire before users notice

- **Sustainability**
  - DB write latency stable
  - Storage growth tracked and predictable

---

## 5) Rollback strategy (universal)

When something goes wrong, rollback must be fast and deterministic:

1. **Stop the indexer** (or disable readiness so traffic is drained).
2. **Decide rollback scope:**
   - config rollback only (feature flags)
   - redeploy previous binary
   - restore DB snapshot (only if schema enforcement/backfills were wrong)
3. **Resume from checkpoint**:
   - verify `lastIndexedHeight`
   - restart the safe version

---

## 6) Operator runbook starter (high-level)

### If lag increases
- Check RPC latency/errors
- Check DB transaction duration
- Reduce inflight concurrency
- Verify leader lock is held

### If WS disconnects
- Confirm poll fallback is active
- Alert only if lag is growing

### If decode backlog grows
- Confirm decode API status
- Reduce decode concurrency to protect ingestion
- Keep ingestion running

### If chain stalls
- Ensure indexer enters idle mode
- Alert only after threshold

---

**This migration plan is designed to be safe, reversible, and compatible with the “single writer” forever indexer model.**