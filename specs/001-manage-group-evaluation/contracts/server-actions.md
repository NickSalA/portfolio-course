# Contract: Application use cases

These contracts define authenticated server-side operations. Names are logical and may map to existing or refactored server actions. All mutations validate the session and course responsibility before invoking a trusted database operation.

## Common result

```text
OperationResult<T> =
  | { status: "success"; operationId: UUID; data: T }
  | { status: "rejected"; operationId: UUID; code: DomainError; message: string; field?: string }
  | { status: "failed"; operationId: UUID; code: "unexpected"; message: string }
  | { status: "uncertain"; operationId: UUID; code: "confirmation_lost"; message: string }
```

Messages are safe for display. Diagnostic detail is emitted only in restricted server signals. A retry reuses the same `operationId`.

## Error vocabulary

- `not_authenticated`
- `not_authorized`
- `course_not_found`
- `cross_course_reference`
- `invalid_input`
- `invalid_grade`
- `duplicate_conflict`
- `group_selection_closed`
- `group_full`
- `membership_conflict`
- `history_required`
- `review_required`
- `operation_id_conflict`
- `unexpected`

## Import students

**Input**: `operationId`, `coursePublicId`, parsed rows containing the documented institutional student identifier/name/email fields.

**Validation output before confirmation**: row index, normalized non-secret identity reference, status (`valid`, `invalid`, `duplicate`, `existing`) and reason.

**Confirmation output**: counts for inserted, updated, unchanged and rejected rows plus an evidence reference.

**Rules**:
- Teacher must own the course.
- Equivalent retry returns the original result.
- Duplicate rows cannot create duplicate authorization or enrollment records.
- Raw file contents and personal fields are not written to operational logs.

## Configure and select groups

### Configure selection window

**Input**: `operationId`, `coursePublicId`, opening instant, closing instant.

**Output**: normalized window and status.

**Rules**: opening precedes closing; teacher owns course.

### Select student group

**Input**: `operationId`, `enrollmentId`, `groupId`, effective instant supplied by the trusted boundary.

**Output**: current group summary and membership interval reference.

**Rules**: authenticated student owns active enrollment; group belongs to same course; window is open; capacity is available; history changes atomically.

### Transfer student group

**Input**: `operationId`, `enrollmentPublicId`, target group public ID or no-group state, effective instant.

**Output**: closed interval, opened interval and current group summary.

**Rules**: teacher owns course; no overlaps; target belongs to course and has capacity; ambiguous pre-existing history returns `history_required`.

## Manage evaluation

### Create evaluation

**Input**: `operationId`, `coursePublicId`, name, `occurredAt` with explicit offset.

**Output**: evaluation public ID, normalized activity instant and position.

**Rules**: teacher owns course; name unique within course; activity instant required.

### Change activity instant

**Input**: `operationId`, `evaluationPublicId`, new `occurredAt`, `reviewToken` when affected attributions exist.

**Output**: affected attribution count and saved evaluation summary.

**Rules**: first request identifies impact and returns `review_required`; confirmation token binds the reviewed impact set and new instant; stale tokens are rejected.

## Save or correct group grade

**Input**: `operationId`, `evaluationPublicId`, `groupPublicId`, numeric grade, optional feedback.

**Output**: current grade, whether it was created/unchanged/corrected, correction reference when changed, and historical participant count.

**Rules**:
- Teacher owns course; evaluation and group belong to that same course.
- Grade is in `[0, 20]`.
- Same operation ID plus same payload returns the original outcome.
- Same operation ID plus different payload returns `operation_id_conflict`.
- Same value is `unchanged` and does not create a correction.
- Changed value atomically updates current grade and appends correction history.

## Reconcile evaluation

**Input**: `operationId`, `evaluationPublicId`, explicit exception references for groups that cannot yet be graded.

**Output**: expected, graded, missing and exception counts; reconciliation status and timestamp.

**Rules**:
- Teacher owns course.
- `conciled` requires every expected group to have a valid grade or explicit exception.
- Reconciliation never converts points into grades and never creates individual grade overrides.

## Queries

- Teacher course context returns only owned courses, enrollments, current/history-relevant memberships, evaluations, current grades, correction summaries and reconciliation status.
- Student dashboard returns only own authorized courses, enrollment, current group and non-voided point movements/balance.
- Student queries never include group grades or correction history.
