# Contract: Trusted database operations

The exact SQL names may be refined during implementation, but signatures and outcomes are stable planning contracts. Functions execute transactionally, use a fixed search path, check the authenticated identity and expose execution only to intended roles. RLS remains enabled on all academic tables.

## `select_course_group`

```text
(enrollment_id bigint, selected_group_id bigint, operation_id uuid)
→ membership_change_result
```

Checks student ownership, active enrollment, course match, open window and capacity under concurrency. Closes the prior interval and opens the new interval atomically. Retrying the operation ID is safe.

## `transfer_course_student_group`

```text
(enrollment_public_id uuid, selected_group_public_id uuid|null,
 effective_at timestamptz, operation_id uuid)
→ membership_change_result
```

Checks teacher ownership, course match, capacity and non-overlap. Supports an explicit no-group interval. Rejects unsupported historical gaps/ambiguity.

## `save_group_grade`

```text
(evaluation_public_id uuid, group_public_id uuid, grade numeric,
 feedback text|null, operation_id uuid)
→ grade_write_result
```

Checks teacher ownership, same-course relationship and range. Creates or updates the unique current grade and appends correction history only when the value changes. Returns the historical participant count at the evaluation instant.

## `preview_evaluation_time_change`

```text
(evaluation_public_id uuid, new_occurred_at timestamptz)
→ impact_summary + review_token
```

Read-only impact calculation for memberships and grades whose attribution would differ.

## `confirm_evaluation_time_change`

```text
(evaluation_public_id uuid, new_occurred_at timestamptz,
 review_token text, operation_id uuid)
→ evaluation_change_result
```

Recomputes and verifies the reviewed impact before applying the timestamp. A stale or mismatched token is rejected.

## `reconcile_group_evaluation`

```text
(evaluation_public_id uuid, exception_group_ids uuid[], operation_id uuid)
→ reconciliation_result
```

Calculates expected groups from historical participation, counts current grades and explicit exceptions, and marks reconciliation only when no unexplained group is missing.

## `resolve_enrollment_group_at`

```text
(enrollment_id bigint, occurred_at timestamptz)
→ group_id bigint|null, resolution_status text
```

Returns exactly one applicable interval or a status indicating missing/ambiguous history. It never falls back silently to current membership.

## Mutation operation ledger

Each mutation stores:

- operation UUID (unique)
- authenticated actor UUID
- operation kind
- canonical payload fingerprint
- status (`pending`, `success`, `rejected`, `failed`)
- safe result/error code
- created/completed timestamps

A duplicate operation UUID with the same actor, kind and fingerprint returns the stored completed result. A different fingerprint is rejected. Personal data and grade values are excluded from general operational evidence; restricted academic audit tables retain values where required.

## Required RLS assertions

1. Teacher can read and mutate only owned courses and dependent academic records.
2. Teacher cannot pair a group with an evaluation from another course.
3. Student can read only own active enrollment, current permitted group data and points.
4. Student cannot select `group_grades` or grade corrections.
5. Student can execute group selection only for own enrollment and an eligible group.
6. Anonymous users cannot access academic entities or execute academic mutation functions.
