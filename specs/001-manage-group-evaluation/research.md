# Research: Gestión integral de evaluación grupal

## Purpose

Resolve the technical decisions required to implement and validate the Parte II scope while preserving the existing single-application architecture and distinguishing verified behavior from planned behavior.

## Decision 1: Preserve the current application architecture

**Decision**: Extend the existing Next.js application, Supabase authentication/data access, PostgreSQL migrations, server actions, and present teacher/student routes. Do not introduce a separate backend service.

**Rationale**: The repository already implements the relevant workflows in these boundaries. PostgreSQL is the trusted boundary for cross-row academic invariants and concurrency, while server actions provide authenticated use-case orchestration and user-facing errors. This satisfies the constitution's simplicity requirement.

**Alternatives considered**:
- Separate API service: rejected because it duplicates authentication and authorization boundaries without a demonstrated need.
- Client-only writes: rejected because client checks cannot protect academic authorization or integrity.

## Decision 2: Model group membership as non-overlapping effective-time intervals

**Decision**: Add immutable membership history records for each enrollment, with `effective_from` inclusive and `effective_to` exclusive. Current `course_students.group_id` remains a denormalized current-state projection during migration and compatibility, but every path that changes it must atomically update history.

**Rationale**: Evaluation attribution depends on the group at the activity instant, not at grade-save time. Half-open intervals make boundary behavior deterministic and permit exactly one applicable membership at an instant. PostgreSQL exclusion/integrity constraints and transactional functions can prevent overlaps and race conditions.

**Alternatives considered**:
- Snapshot members on every grade: duplicates membership data and cannot explain changes before a grade exists.
- Infer from the current group: fails historical attribution.
- Append-only events without intervals: valid in principle, but makes overlap detection and deterministic querying more complex for this project.

## Decision 3: Use institutional timestamps for activities and transfers

**Decision**: Store activity and membership instants as timezone-aware timestamps. Display and collect them in one documented institutional timezone, converting at the trusted boundary. The exact IANA timezone is an environment/domain setting confirmed before fixtures are finalized; tests use explicit offsets and do not depend on the machine timezone.

**Rationale**: Date-only values cannot order a transfer and activity on the same day. Timezone-aware instants avoid deployment-dependent interpretation.

**Alternatives considered**:
- Date only: rejected because same-day ordering is undefined.
- Server local time: rejected because it varies by environment.

## Decision 4: Freeze participant attribution by effective-time resolution, not copied grades

**Decision**: Resolve each student's applicable group by the evaluation's `occurred_at` timestamp and membership history. A grade remains attached to group plus evaluation. Teacher views derive historical participants from membership; correcting the group grade automatically applies to that historical participant set.

**Rationale**: This preserves the group grade as the source of truth and meets the rule that a late correction affects original participants without moving them between groups.

**Alternatives considered**:
- Copy a grade to every student: creates reconciliation and update hazards.
- Use current membership: violates the specification.

## Decision 5: Preserve grade corrections as an append-only audit trail

**Decision**: Keep one current group-grade record per group/evaluation and append a correction event for each confirmed value transition, including previous value, new value, responsible teacher and timestamp. All grade writes go through one transactional database function that validates ownership/course consistency, performs idempotency handling and writes the audit event.

**Rationale**: The existing upsert overwrites evidence. Centralizing the mutation makes authorization, correction history and retries consistent across callers.

**Alternatives considered**:
- Store only `updated_at`: insufficient to explain corrections.
- Make every grade version a full temporal table: more complexity than needed for the current query patterns.
- Log corrections only in application logs: inappropriate for restricted academic history and unreliable as the source of truth.

## Decision 6: Use client-generated operation identifiers for retry safety

**Decision**: Every mutating import, membership transfer, evaluation date change, grade save/correction and reconciliation operation carries a UUID operation identifier generated once per user intent. The trusted mutation boundary records its outcome and returns the prior result when the same identifier is retried with the same payload; reuse with a different payload is rejected.

**Rationale**: Unique data constraints prevent some duplicates but cannot distinguish a legitimate correction from a transport retry. An operation ledger provides correlation and deterministic recovery for uncertain outcomes.

**Alternatives considered**:
- Blind upsert: avoids duplicate rows but may repeat audit events and obscures uncertain results.
- Server-generated identifier after receipt: cannot correlate a request whose response was lost.

## Decision 7: Separate academic audit data from operational signals

**Decision**: Keep grade values and correction details in access-controlled academic tables. Emit structured server-side signals containing operation/correlation ID, non-personal course/evaluation identifiers, event type, outcome, error category and timestamp; never emit names, emails, secrets or grades. Initially use the runtime's structured server logs and retain an adapter seam for a configured monitoring provider.

**Rationale**: This meets evidence and privacy requirements without claiming an unverified monitoring platform. Academic history must remain queryable under course authorization even if runtime logs expire.

**Alternatives considered**:
- Put grades or student identity in logs: rejected for privacy.
- Require a new external monitoring vendor now: rejected because no provider or retention policy is verified.

## Decision 8: Validate with layered tests in an isolated environment

**Decision**: Use PostgreSQL/Supabase SQL integration tests for constraints, RPC behavior, RLS, concurrency-sensitive invariants and synthetic fixtures. Add a TypeScript test runner for pure parsing/mapping/use-case behavior, and Playwright for a small set of critical accessible teacher/student journeys. Run lint, type checking and build as complementary checks.

**Rationale**: SQL tests provide the strongest evidence for RLS and integrity. Unit/component tests give fast feedback, while end-to-end tests demonstrate observable workflows. The current repository has only one SQL test and no JS test script, so test dependencies and scripts are justified by the required evidence.

**Alternatives considered**:
- End-to-end tests only: too slow and poor at isolating RLS/invariant failures.
- Manual testing only: not reproducible enough for regression control.
- Production testing: prohibited.

## Decision 9: Keep web contracts internal and explicit

**Decision**: Treat server-action inputs/results and PostgreSQL RPC signatures as the feature's contracts. Do not add public HTTP endpoints. Contract documents define validation, authorization, idempotency, errors and observable UI states.

**Rationale**: The application is not exposing an external integration API. Explicit internal contracts still allow independent implementation and review by five team members.

**Alternatives considered**:
- New REST API: unnecessary duplication for a server-rendered application.
- Undocumented action shapes: impedes parallel work and consistent error handling.

## Decision 10: Migrate existing data conservatively

**Decision**: Create an initial open membership interval only when existing current membership and a defensible effective instant are available. Mark ambiguous historical data for teacher review; do not infer earlier memberships or activity dates. Existing evaluations require an explicit activity timestamp before historical attribution or reconciliation.

**Rationale**: Invented history would undermine academic integrity. The specification explicitly requires uncertain cases to be identified rather than guessed.

**Alternatives considered**:
- Backfill all history from current membership: rejected as factually unsupported.
- Block all existing records: unnecessarily prevents valid current/future operation.
