# Implementation Plan: Gestión integral de evaluación grupal

**Branch**: `001-manage-group-evaluation` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-manage-group-evaluation/spec.md`

## Summary

Complete the teacher-led group evaluation process inside the existing Next.js/Supabase application. Extend the PostgreSQL domain with effective-time group membership, evaluation activity timestamps, idempotent transactional mutations, grade correction history and reconciliation evidence. Keep authorization at server and RLS boundaries, expose the behavior through existing teacher/student routes, and validate it with synthetic SQL, TypeScript and critical browser-flow tests in an isolated environment.

## Technical Context

**Language/Version**: TypeScript 5.9.3; SQL/PLpgSQL on PostgreSQL 17

**Primary Dependencies**: Next.js 16.3.0, React 19.2.8, `@supabase/ssr` 0.12.5, `@supabase/supabase-js` 2.112.4, XLSX 0.18.5; planned test-only dependencies for TypeScript/component and browser tests

**Storage**: Supabase PostgreSQL 17 with versioned SQL migrations, RLS, constraints, indexes and transactional functions

**Testing**: Existing Supabase SQL test harness; add a TypeScript test runner for parsing/domain adapters and Playwright for a focused set of end-to-end accessibility journeys; retain ESLint, TypeScript checking and production build checks

**Target Platform**: Server-rendered web application deployed through the existing hosting path; desktop and mobile web browsers; isolated local Supabase for destructive/integration validation

**Project Type**: Single full-stack web application with database-enforced domain and authorization rules

**Performance Goals**: At least 95% of sampled Must-flow interactive confirmations visible within 2 seconds at the agreed synthetic single-course volume; longer imports show progress and prevent duplicate submission

**Constraints**: Preserve Next.js/Supabase/PostgreSQL; Google authentication; server plus RLS authorization; no destructive production tests; no secrets or real personal data in tests/evidence; grade range 0–20; student grade reads prohibited; retries must not duplicate mutations; five independently reviewable work streams

**Scale/Scope**: One responsible teacher per course; realistic single-course fixtures bounded below the configured 1000-row API response limit; period/course/import/enrollment/group/evaluation/grade/reconciliation workflows; no general LMS, grade export or individual grade override

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

### Pre-research gate

| Principle                                      | Gate result | Plan evidence                                                                                                                                |
| ---------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Security and authorization by default          | PASS        | All academic mutations require authenticated server orchestration and RLS/trusted database checks; student grade access is removed.          |
| Data integrity and traceability                | PASS        | Planned constraints, effective-time membership, transactional mutations, append-only correction audit and point-history preservation.        |
| Clear boundaries and simplicity                | PASS        | Existing single application is retained; no separate service; database owns cross-row invariants and server actions own use-case/UI mapping. |
| Controlled, observable, recoverable automation | PASS        | Operation IDs, explicit states/errors, safe structured signals, reconciliation and retry contracts are defined.                              |
| Verifiable quality and collaboration           | PASS        | Layered tests with synthetic data, isolated environment, acceptance evidence and five reviewable outcomes.                                   |
| Reproducible commits and versioning            | PASS        | Work remains migration/PR based and follows repository Git Flow/Conventional Commits governance.                                             |
| Additional constraints                         | PASS        | Stack preserved; future grade types and individual overrides remain out of scope; final evaluation record is planned.                        |

No constitutional violation requires an exception. Phase 0 may proceed.

### Post-design gate

| Principle                        | Result after design                                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Least privilege and privacy      | PASS — contracts omit student grade queries and segregate operational signals from restricted academic values.                               |
| Integrity and traceability       | PASS — data model specifies course consistency, non-overlapping intervals, correction events and idempotent operations.                      |
| Simplicity                       | PASS — all additions deepen existing database/server-action/UI boundaries; no new deployable component.                                      |
| Recoverability and observability | PASS — operation ledger, stable outcomes, failure categories and reconciliation provide recovery/evidence paths without claiming a provider. |
| Quality and evidence             | PASS — quickstart covers valid, invalid, exceptional, failure, retry, accessibility and baseline comparison scenarios.                       |
| Workflow/governance              | PASS — artifacts support disjoint PRs and require reviewed, reproducible evidence.                                                           |

## Technical Design

### Boundary responsibilities

1. **PostgreSQL trusted domain boundary**: enforce RLS, ownership, same-course references, grade range, non-overlapping membership, capacity under concurrency, idempotency and atomic audit/history writes.
2. **Server actions and query modules**: authenticate, normalize/validate presentation input, call trusted operations, map domain error codes to safe typed results, emit privacy-safe signals and invalidate affected views.
3. **React UI**: collect explicit inputs, generate/reuse operation IDs per user intent, prevent duplicate submission, present progress/result/error states, require impact confirmation and meet keyboard/accessibility criteria.
4. **Evidence/test boundary**: seed synthetic identities, exercise direct RLS and user journeys, and record environment/version/outcomes separately from production claims.

### Delivery sequence

1. Establish test scripts/fixtures and preserve the current RLS baseline.
2. Add effective-time membership and route every current-group mutation through a transactional history-aware function.
3. Add evaluation activity time, impact preview and conservative legacy-data review behavior.
4. Add idempotent grade mutation, same-course database integrity and append-only correction history.
5. Build teacher evaluation/reconciliation read model and UI states.
6. Confirm student dashboard exposes only course/group/points and strengthen negative authorization tests.
7. Add structured signals, failure/retry demonstrations, accessibility/performance sampling and final evaluation documentation.

### Compatibility and migration

- Additive migrations precede behavior switches.
- Existing `course_students.group_id` remains temporarily as the current projection for existing UI/query compatibility.
- Existing evaluations without defensible activity timestamps require teacher review and cannot be reconciled.
- Existing current memberships are backfilled only from a documented baseline instant; unknown earlier history remains explicitly unresolved.
- Existing grades remain current values; no correction history is fabricated for pre-migration changes.
- Physical deletion is restricted where it would erase required history; deactivation/review paths replace destructive behavior.

### Testing strategy

- **Database integration**: reset local migrations; test RLS, constraints, RPCs, idempotency, capacity race, historical resolution, correction history and reconciliation using transaction-scoped synthetic fixtures.
- **TypeScript tests**: import validation, result/error mapping, timestamp normalization and read-model transforms.
- **Browser tests**: critical teacher grade lifecycle, student group selection and student grade-denial/accessibility flows.
- **Manual protocol**: same-day timestamp case, uncertain-result recovery, observability lookup, keyboard review, sampled response time and repeated manual/platform baseline.

## Project Structure

### Documentation (this feature)

```text
specs/001-manage-group-evaluation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── database-rpcs.md
│   └── server-actions.md
├── checklists/
│   └── requirements.md
└── tasks.md                 # generated later by /speckit-tasks
```

### Source Code (repository root)

```text
portfolio-coursse/
├── app/
│   ├── student/
│   │   ├── actions.ts
│   │   └── page.tsx
│   └── teacher/
│       ├── courses/
│       │   ├── actions.ts
│       │   ├── group-actions.ts
│       │   └── [coursePublicId]/page.tsx
│       ├── grades/
│       │   ├── actions.ts
│       │   └── page.tsx
│       ├── periods/
│       ├── points/
│       └── students/
├── components/
│   ├── student-portal/
│   └── teacher/
│       ├── grades/
│       ├── groups/
│       └── students/
├── lib/
│   ├── academic/
│   ├── student/
│   ├── teacher/
│   └── supabase/
├── supabase/
│   ├── migrations/
│   ├── tests/
│   └── seed.sql
└── package.json

docs/
└── automatizaciones/
    └── gestion-evaluacion-grupal/
        └── evaluacion.md    # implemented/evaluated record, created when evidence exists
```

**Structure Decision**: Use the existing single Next.js application. Add migrations/tests under `portfolio-coursse/supabase/`; keep course/evaluation mutations in the relevant server-action modules; extract reusable authorization, result mapping and query logic under `lib/`; evolve existing teacher/student components rather than create a parallel interface. The final evidence record belongs under `docs/automatizaciones/` and must distinguish planned from measured behavior.

## Team Work Streams and Integration Seams

| Stream             | Primary outcome                                                 | Contract/seam                                  | Main dependency                          |
| ------------------ | --------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Domain/preparation | Reliable periods, courses, import, authorization and enrollment | Import result and current enrollment contracts | Existing course/import schema            |
| Experience         | Accessible teacher/student workflows and explicit states        | `OperationResult` and read models              | Stable server-action contracts           |
| Data/security      | Membership history, grade integrity, correction audit and RLS   | Database RPC contracts                         | Migration order and synthetic identities |
| Quality            | SQL/unit/E2E suites and fixtures                                | Acceptance scenarios and error vocabulary      | Stable contracts; isolated environment   |
| Operation/evidence | Signals, reconciliation, measurements and final record          | Operation IDs and evidence schema              | Mutations emitting stable outcomes       |

PRs should remain vertically demonstrable where possible. Database contract changes land before dependent UI changes; test fixtures and contract tests can be developed in parallel against documented signatures.

## Complexity Tracking

No constitutional violations or additional deployable components are planned. Test-only dependencies are justified by the explicit requirement for reproducible database, application and browser-flow evidence.
