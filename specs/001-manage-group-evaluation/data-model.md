# Data Model: Gestión integral de evaluación grupal

## Design principles

- Preserve current records while adding explicit history and audit data.
- Use public UUIDs at application boundaries and internal numeric keys for relations where the project already does so.
- Enforce course consistency and authorization at both mutation functions and RLS.
- Store academic timestamps as `timestamptz`; format in the agreed institutional timezone.
- Never infer ambiguous historical facts.

## Existing entities retained

### `profiles`

Identity profile linked to authentication.

Key fields: identity ID, role, display data.

Rules: role distinguishes teacher and student but does not by itself authorize a course.

### `academic_periods`

Key fields: ID/public ID, year/term/code, lifecycle dates/status.

Relationships: one period has many courses.

### `courses`

Key fields: ID/public ID, period ID, teacher ID, name, group selection window.

Relationships: belongs to one period and one responsible teacher; has authorizations, enrollments, groups and evaluations.

Rules: opening instant precedes closing instant when a selection window exists.

### `authorized_students`

Key fields: ID, course ID, normalized email, status and imported student fields.

Relationships: belongs to course; may link to enrollment; owns point movements.

Rules: unique authorized identity per course; imports are idempotent.

### `course_students`

Current enrollment projection.

Key fields: ID/public ID, course ID, student identity ID, authorization ID, current group ID nullable, status.

Relationships: belongs to course, identity and authorization; has membership history.

Rules: unique course/student pair; authorization and current group belong to same course. Changes to current group occur only through history-aware trusted operations.

### `groups`

Key fields: ID/public ID, course ID, position/name, capacity, active.

Relationships: belongs to course; has membership intervals and group grades.

Rules: capacity is positive; a group referenced by historical participation or grades cannot be physically deleted. Deactivation is preferred.

### `point_transactions`

Key fields: ID, authorization ID, points, reason, created timestamp, voided flag.

Rules: individual and separate from grades; correction preserves original movement by voiding/adjusting rather than deleting.

### `course_evaluations` (extended)

Key fields:
- ID/public ID
- course ID
- name and display position
- `occurred_at` required for newly created/ready evaluations
- lifecycle status: `defined`, `partial`, `conciled`
- created/updated timestamps

Relationships: belongs to course; has group grades and optional reconciliation records.

Rules:
- Unique name within course.
- Activity timestamp includes timezone.
- Legacy records without a defensible timestamp remain `defined` and cannot be reconciled until reviewed.
- Timestamp changes with affected attribution require preview and explicit confirmation.

### `group_grades` (extended)

Current grade for a group/evaluation.

Key fields:
- ID/public ID
- group ID
- evaluation ID
- grade numeric
- feedback nullable
- created/updated timestamps
- last operation ID

Relationships: belongs to one group and evaluation; has correction history.

Rules:
- Unique group/evaluation pair.
- Grade is required for a completed grade record and in `[0, 20]`.
- Group and evaluation must belong to the same course through a database-enforced invariant.
- Writes occur through trusted mutation operation.

## New entities

### `course_student_group_memberships`

Effective-time history for an enrollment's group state.

Fields:
- ID/public ID
- enrollment ID
- course ID (included to enforce same-course invariants)
- group ID nullable for explicit no-group state
- `effective_from` inclusive
- `effective_to` exclusive, nullable for current interval
- change kind: `initial`, `student_selection`, `teacher_transfer`, `authorization_sync`, `data_review`
- changed by identity ID
- operation ID
- created timestamp

Relationships: belongs to enrollment and course; optionally belongs to group.

Validation:
- `effective_to > effective_from` when closed.
- No overlapping intervals per enrollment.
- At most one open interval per enrollment.
- Enrollment and group belong to the recorded course.
- Current enrollment group equals the open interval's group after each mutation.

State transitions:

```text
(no history) -> open initial interval
open interval A -> close A + open B
open interval A -> close A + open no-group
open no-group -> close no-group + open group
```

Closed intervals are not edited during normal operations. Historical correction requires an explicit reviewed data-repair path and is not a routine user action.

### `group_grade_corrections`

Append-only academic audit of confirmed grade changes.

Fields:
- ID/public ID
- group grade ID
- previous grade
- new grade
- previous feedback nullable
- new feedback nullable
- changed by teacher identity ID
- operation ID
- changed timestamp

Relationships: belongs to current group grade and operation.

Validation:
- Teacher is responsible for the grade's course at mutation time.
- At least grade or feedback changes.
- Rows are immutable to application roles.

### `academic_operations`

Idempotency and safe operation evidence ledger.

Fields:
- operation UUID primary key
- actor identity ID
- course ID nullable when unresolved
- operation kind
- payload fingerprint
- status: `pending`, `success`, `rejected`, `failed`
- safe result/error code
- correlation metadata without personal data or grade values
- created/completed timestamps

Rules:
- Operation ID is globally unique.
- Same operation may be replayed only by same actor with same kind/fingerprint.
- Pending operations can be reconciled; completed outcomes are stable.
- Access is restricted to relevant teacher/actor and trusted operations.

### `evaluation_reconciliations`

Evidence that an evaluation was checked for completeness.

Fields:
- ID/public ID
- evaluation ID
- expected group count
- graded group count
- missing group count
- exception group count
- status: `partial`, `conciled`
- reconciled by teacher identity ID
- operation ID
- reconciled timestamp

Relationships: belongs to evaluation and operation.

Rules:
- Counts are non-negative and explain the expected total.
- `conciled` requires `missing_group_count = 0` after explicit exceptions.
- A later grade/membership/activity-time change marks prior reconciliation stale or creates a new reconciliation record; history is retained.

### `evaluation_exceptions`

Explicit unresolved or accepted group-level exception for reconciliation; not an individual grade override.

Fields:
- ID/public ID
- evaluation ID
- group ID
- category from controlled vocabulary
- safe description/reason restricted to teacher
- status: `open`, `resolved`, `accepted_for_reconciliation`
- created/resolved by and timestamps

Rules:
- Evaluation and group belong to same course.
- Does not create or replace a grade.
- Individual exceptional corrections remain out of scope.

## Derived views/read models

### Teacher evaluation matrix

For one owned course: evaluations by historically applicable groups, current grade, correction indicator, historical participant count and reconciliation status.

### Student dashboard

For current identity: active authorized courses, current group interval and non-voided point history/balance. It excludes evaluations' grades and correction data.

### Historical participant resolution

For an evaluation/group: enrollments whose membership interval contains `occurred_at`. Returns missing/ambiguous resolution explicitly rather than falling back to current group.

## Cross-entity invariants

1. Authorization, enrollment, membership, group, evaluation and grade course IDs agree.
2. One non-overlapping membership timeline exists per enrollment.
3. One current grade exists per group/evaluation, with append-only corrections.
4. Student grade access is absent; teacher access is scoped to owned course.
5. Group deletion cannot erase required historical explanation.
6. Points never participate in grade calculation or reconciliation.
7. Retried operation identifiers do not duplicate domain changes or correction events.
8. Evaluation reconciliation is invalidated by changes that alter expected groups or grades.

## Migration strategy

1. Add nullable activity timestamps and new history/audit/operation tables without rewriting known facts.
2. Backfill only defensible current membership intervals using an explicitly documented baseline instant; mark ambiguous rows for review.
3. Require an activity timestamp for new evaluations and before an existing evaluation can be reconciled.
4. Route all future group changes and grade writes through transactional functions.
5. Verify RLS and invariants with synthetic fixtures before enabling the completed flow outside the isolated environment.
6. Do not backfill individual grade overrides or fabricate past group memberships.
