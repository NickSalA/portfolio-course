<!--
Sync Impact Report
- Version change: template/unratified -> 1.0.0 (initial ratification; no prior adopted version).
- Modified principles: template placeholders replaced with six project principles covering security,
  data integrity, simplicity, automation, quality/collaboration, and commits/versioning.
- Added sections: Additional Constraints; Development Workflow; substantive Governance rules.
- Removed sections: none; scaffold structure retained.
- Follow-up TODOs: none.
-->

# Plataforma Académica Constitution

## Core Principles

### I. Security and Authorization by Default

Access to academic information MUST follow least privilege. Authentication MUST NOT be treated as
academic authorization. Server-side logic and PostgreSQL Row Level Security (RLS) MUST enforce
access; client-side checks are for user experience and MUST NOT be the sole security control.
Secrets MUST remain outside version control and MUST NOT be exposed to browsers. Evidence, logs,
and reports MUST avoid unnecessary personal data.

### II. Data Integrity and Traceability

Academic rules and state-changing operations MUST be enforced at trusted boundaries and, where
appropriate, by PostgreSQL constraints or transactions. Changes to academic data MUST leave enough
traceability to explain their outcomes. Point history MUST NOT be deleted to correct an assignment;
corrections MUST use an adjustment or reversal that preserves the history.

### III. Clear Boundaries and Simplicity

The application MUST maintain clear responsibilities between user interface, business rules,
authentication, and data access. It MUST remain a single application while that meets its
requirements. A separate service, new dependency, or additional architectural complexity MUST be
justified by a concrete technical need and its expected benefits.

### IV. Controlled, Observable, and Recoverable Automation

Every automation MUST define its inputs, rules, relevant events or states, expected outcomes,
validations, and handling of errors and exceptions. It MUST provide useful execution evidence and
sufficient monitoring to assess its operation while protecting secrets and personal data. Processes
that may be retried or partially fail MUST define appropriate idempotency and recovery behavior.

When an automation is completed, its implemented design, operation, and evaluation MUST be recorded
in version-controlled documentation under `docs/`. The record MUST distinguish planned behavior
from what was implemented and evaluated, include results and evidence, and link to related
specification artifacts rather than duplicating them.

### V. Verifiable Quality and Team Collaboration

Changes MUST be validated with tests representative of their behavior, including relevant valid,
invalid, and exceptional cases. Automation MUST be evaluated against defined criteria, with
reproducible evidence of the results. Available, relevant CI checks MUST run before integration;
production deployment MUST be controlled and protect secrets and environments.

The team MUST use Git Flow. `main` represents production and `develop` integrates approved work for
the next release. Feature and regular bug-fix work MUST use separate branches and reviewed pull
requests; direct commits to shared `main` and `develop` branches are prohibited. Project conventions
and decisions MUST be documented in the repository and MUST NOT depend on a specific coding agent
or vendor.

### VI. Reproducible Commits and Versioning

Commits MUST use Conventional Commits in the format `type(scope): imperative description`, using
only `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, or `ci`. Commit messages
MUST be specific and concise.

Application releases MUST use Semantic Versioning (`MAJOR.MINOR.PATCH`). Version calculation and
publication SHOULD be automated at release time using commit history where practical; versions
MUST NOT be incremented for every commit. Database migration numbering MUST remain sequential and
independent from application release versioning.

## Additional Constraints

- The current application stack is Next.js, React, TypeScript, Supabase, and PostgreSQL. Replacing
  these technologies or adding dependencies requires a demonstrated need.
- Database migrations MUST be versioned under `portfolio-coursse/supabase/migrations/`.
- Teachers may manage only academic information under their responsibility. Students may access
  only their own authorized information.
- The course automation project MUST demonstrate repeat-activity automation, control rules,
  event handling, execution validation, evidence and results, error and exception handling,
  monitoring, and evaluation through tests.
- Each completed automation MUST have a version-controlled record at
  `docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`. At minimum, it MUST describe the
  process and problem addressed, implemented rules and controls, architectural approach and its
  rationale, events, validations, error and exception handling, monitoring, tests performed,
  evidence, results against defined indicators, and conclusions.
- The automation record MUST link to related Spec Kit specifications, plans, and tasks; it MUST
  not duplicate them. It MUST distinguish planned from implemented and evaluated behavior. Shared
  evidence MUST use synthetic or anonymized data where possible and MUST NOT contain unnecessary
  personal information or credentials.
- Formal course deliverables, including the final report and presentation, MUST be derived from
  project evidence and remain distinct from Spec Kit planning artifacts.
- Additional grade types are a possible future feature, not a current requirement. They MUST be
  specified separately if approved for development.

## Development Workflow

- Git Flow branches MUST follow these roles and paths:
    - `feature/<name>` and `bugfix/<name>` branch from `develop` and return to `develop` through a
      reviewed pull request with relevant checks.
    - `release/<version>` branches from `develop`; after validation, the release is integrated into
      `main`, tagged, and synchronized back to `develop`.
    - `hotfix/<name>` branches from `main` for urgent production corrections and are integrated into
      both `main` and `develop`.
    - Integrated work branches SHOULD be deleted when safe.
- CI MUST run configured checks relevant to the change, such as linting, type checking, tests, and
  build. The constitution does not require a pipeline or check that has not been configured.
- Production deployment MUST use an approved, verifiable process. Automatic production deployment
  is not required until a production environment and deployment process are configured.
- Pull request review MUST consider security, data integrity, relevant tests, and compliance with
  this constitution.
- Before adding complexity, contributors MUST justify it against project requirements and scale.
- Course deadlines and report formatting are course deliverables, not permanent engineering rules.

## Governance

This constitution is the shared, tool-independent source of governance for the repository. It
applies to implementation, automation, review, and release decisions. If another repository
instruction conflicts with it, contributors MUST resolve the conflict and update the relevant
instruction rather than maintaining contradictory rules.

Amendments MUST be proposed through a reviewed pull request that explains the rationale, affected
principles, and expected impact. A change MUST update the constitution version and last-amended date.
Versioning follows Semantic Versioning: MAJOR for incompatible governance changes or removal of a
principle; MINOR for a new principle or materially expanded requirements; PATCH for clarifications
that do not change obligations.

Contributors and reviewers MUST check relevant work against this constitution during specification,
planning, pull-request review, and release. Any exception MUST be explicit, justified, scoped, and
recorded with the affected work; temporary exceptions MUST include an expiry or resolution plan.

**Version**: 1.0.0 | **Ratified**: 2026-10-11 | **Last Amended**: 2026-10-11
