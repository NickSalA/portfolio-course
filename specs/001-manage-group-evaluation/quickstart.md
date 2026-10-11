# Quickstart: Validate group evaluation management

This guide validates the planned feature end to end in an isolated local environment. It is not evidence that production has the same configuration.

## Prerequisites

- Node.js and pnpm versions compatible with `portfolio-coursse/package.json`.
- Docker-compatible runtime and Supabase CLI available.
- Local environment variables configured from non-secret development values.
- No command or environment below points to production.
- Synthetic fixture identities for: teacher A, teacher B, authorized student A, unauthorized student and students used for transfers.
- Institutional timezone chosen and recorded for the test run; fixture timestamps include explicit offsets.

## Setup

From `portfolio-coursse/`:

```sh
pnpm install --frozen-lockfile
supabase start
supabase db reset --local
```

Record the local project URL/identifier without publishing keys. Confirm explicitly that the application environment uses local Supabase before destructive tests.

## Static checks

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected: all commands exit successfully. These checks do not prove academic behavior.

## Automated tests

The implementation phase must add scripts for TypeScript tests and critical browser journeys. Run the final scripts documented in `package.json`, plus SQL tests against local Supabase. At minimum execute:

```sh
supabase test db
pnpm test
pnpm test:e2e
```

Expected: synthetic fixtures are isolated/reverted; failures identify the scenario and no test requires production credentials.

## Scenario 1: Authentication and course isolation

1. Sign in as teacher A and open owned course A.
2. Attempt a direct trusted-operation call against teacher B's course.
3. Sign in as an unauthorized student and attempt course access.
4. Sign in as an authorized student and attempt direct grade reads.

Expected:
- Teacher A can access course A only.
- Cross-course write/read is rejected at server and RLS boundaries.
- Unauthorized student gets no academic data.
- Authorized student sees own enrollment/group/points but no group grades.

Evidence: SQL/RLS test output, safe operation IDs/error categories, screenshots without personal data.

## Scenario 2: Idempotent import and enrollment

1. Validate a synthetic file containing valid, malformed, duplicate and existing rows.
2. Confirm the valid subset with one operation ID.
3. Repeat confirmation using the same operation ID.
4. Sign in as one authorized synthetic student to trigger or complete enrollment linkage.

Expected:
- Row statuses and totals match fixtures.
- Repetition creates no duplicate authorization/enrollment.
- Only matching authenticated identity links to the course.

## Scenario 3: Group selection, capacity and history

1. Open a known selection window and create groups with limited capacity.
2. Have a student select a group; retry the same operation.
3. Attempt student selection after the window closes.
4. Race two students for the final capacity slot.
5. Transfer one student as the responsible teacher at a known instant.

Expected:
- Retry leaves one current interval.
- Closed-window attempt is rejected without mutation.
- Capacity is never exceeded; one racing request receives a controlled rejection.
- Transfer closes the previous interval and opens a non-overlapping interval.

## Scenario 4: Historical evaluation attribution

1. Create evaluation E1 before the transfer and E2 after it.
2. Create E3 at a specific same-day instant around another transfer.
3. Resolve the student's group for each evaluation.
4. Change E1's timestamp so attribution would differ; preview impact, then confirm with the bound review token.

Expected:
- E1 resolves to old group and E2 to new group.
- E3 follows exact timestamp ordering in the configured timezone.
- Timestamp change cannot apply silently when attribution changes.

Reference: [data-model.md](data-model.md), `course_student_group_memberships`.

## Scenario 5: Grade validation, correction and retry

1. Save boundary grades 0 and 20 for valid same-course pairs.
2. Attempt negative, greater-than-20, non-numeric and cross-course grades.
3. Save a valid grade, simulate a lost confirmation, and retry with the same operation ID.
4. Correct the grade after one historical participant has transferred.

Expected:
- Only valid range and same-course combinations persist.
- Retry leaves one current grade and no duplicate correction event.
- Correction retains old/new values, responsible teacher and timestamp.
- Historical participant set comes from the activity instant, not current membership.

Reference: [contracts/server-actions.md](contracts/server-actions.md).

## Scenario 6: Failure, signals and reconciliation

1. Trigger one controlled database rejection and one recoverable application failure.
2. Locate safe structured signals by operation ID.
3. Create an evaluation with graded, missing and explicit-exception groups.
4. Reconcile before and after resolving all unexplained missing groups.

Expected:
- UI distinguishes rejected, failed and uncertain outcomes and offers safe retry where applicable.
- Signals contain no names, emails, secrets or grades.
- Evaluation cannot be marked reconciled with unexplained missing groups.
- Final counts equal the expected group total.

## Scenario 7: Accessibility and performance sample

1. Complete all Must flows using keyboard only.
2. Check focus, accessible names and non-color status/error communication.
3. Capture visible response time for the agreed synthetic course volume over at least the planned sample.

Expected:
- No keyboard blocker or unlabeled required field.
- At least 95% of sampled interactive confirmations appear within two seconds; long operations show progress and prevent duplicate submission.
- Results are reported as observed measurements, not assumed guarantees.

## Manual baseline comparison

Using identical synthetic inputs and group count:

1. Run the manual XLSX/group/point process at least three times.
2. Run the platform workflow at least three times.
3. Record total and reconciliation time, completeness, corrections/duplicates, retry results and exception detection.
4. Calculate the indicators in `spec.md` and report raw observations, median and limitations.

The 50% time reduction is a target, not a pre-existing result.

## Evidence record

For every run record:

- date and version/PR;
- isolated environment identifier;
- fixture set/version and timezone;
- expected and observed result;
- operation IDs and safe signal references;
- anonymized screenshots/test reports;
- discrepancy, retry or follow-up;
- whether the capability is pending, verified or evaluated.

Consolidate implemented behavior and measured results in `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` only after execution. Do not include secrets or real personal data.

## Cleanup

Stop or reset only the local test environment. Never run destructive cleanup against production.
