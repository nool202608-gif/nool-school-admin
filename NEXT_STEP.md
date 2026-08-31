# Next Steps — nool School Admin

Supersedes `changes.md` (an early wishlist — everything in it is done except
where noted) and `IMPLEMENTATION-PLAN.md` (this session's first pass — folded
in here, more current). Companion doc: `../nool-super-admin/NEXT_STEP.md`
(the split between the two admin consoles is explained there and in §0 below).

## 0. Scope split

This repo is the **single-school** console. Its sibling `nool-super-admin` is
the **cross-tenant** console (schools, plans, platform analytics, School Admin
accounts). If a feature request sounds like "as the platform operator I want
to see every school" — that's the other repo. Everything below is scoped to
what one School Admin can do for their own school.

## 0-7. Done this session, round 7 — a real live-testing pass' issue list, across all four apps

The user did an actual click-through session (onboarding a school, setting
it up end to end in both admin consoles) and filed a specific, itemized
issue list split by app: Super Admin, School Admin, "Both Apps," Teacher
app, Student app. This round worked through the entire list. Two items
needed a decision only the user could make, asked up front before touching
code: **Google Places autocomplete for the school address** was explicitly
descoped (needs a paid API key/billing setup) in favor of a plain Pincode
field; and **which side loses the Curriculum enable/disable toggle** was
confirmed as School Admin (Super Admin keeps full control everywhere).
"Pull to refresh" was confirmed to mean an actual touch gesture, not
something else.

**School Admin, this repo:**

1. **Password policy + strength meter.** New `src/lib/passwordPolicy.ts`
   (length + upper/lower/digit/special, a 5-band strength label) and
   `PasswordStrengthMeter.tsx`, wired into both password-entry forms this
   app controls: the forced first-login `/change-password` page and
   Settings' own "change my password" form. (Firebase's own hosted
   "forgot password" email-reset page is outside this app's control, not
   touched.)
2. **School's uploaded logo now shows in the sidebar** next to the nool
   wordmark - Settings already had upload/remove wired to
   `getSchoolLogo`/`updateSchoolLogo`; the gap was just that nothing
   *displayed* it anywhere. Shares SWR's cache key with Settings' own
   fetch, so no extra request on navigation between the two.
3. **Section creation restricted to Classes actually allocated to this
   school.** Previously "Add section" free-typed any grade 1-12 with only
   a range check - now a searchable dropdown sourced from `listGrades()`
   (deactivated Classes filtered out; a section's own current Class is
   preserved as a selectable option on Edit even if it's since been
   deallocated, so editing an unrelated field doesn't silently drop it).
4. **"Curriculum" → "Subject," now read-only.** The enable/disable
   Switch and its backend write path are both gone - `PUT /school/
   curriculum` was removed from `nool-core` entirely (see below), not
   just hidden in this app's UI. School Admin can see which subjects are
   assigned; changing that is exclusively Super Admin's job now (either
   the global catalog or the per-Class `GradeSubject` toggle on a
   school's own Classes page in `nool-super-admin`, both untouched).
5. **Own question bank now shown under Datasets too.** New backend
   summary endpoint (`GET /school/custom-questions/collections/summary`)
   groups this school's own `CustomQuestion` rows by named set (plus the
   general bank) with real counts; the Datasets page renders these as a
   second section below the global catalog table, each row linking into
   the Question bank page pre-filtered to that set.
6. **Pull-to-refresh gesture**, shared with `nool-super-admin`: new
   `src/components/PullToRefresh.tsx`, mounted once in the dashboard
   layout, wrapping every page. Touch-only by design (a mouse-drag
   equivalent would fight text selection and normal desktop interactions
   in a way no real product's pull-to-refresh does) - engages only when
   already scrolled to the very top, shows a damped pull indicator, and
   triggers a full page reload past the threshold (a global gesture can't
   know each page's own individual data-fetch keys, so a reload is the
   closest honest equivalent to what pull-to-refresh means natively).

**Backend (`nool-core`), affecting every app:**

7. **A real, previously-*completely untested* WHOLE_CLASS delivery bug,
   found and fixed.** `VoiceTestTargetStudent` - the table every "what
   tests am I assigned" read path a student's own app uses joins through
   (`GET /me/assigned-tests`, `/me/assigned-tests/{id}`, `/me/dashboard`'s
   pending-tests query) - was, per its own now-corrected docstring, "only
   populated when target_mode is SPECIFIC_STUDENTS." A WHOLE_CLASS-
   targeted test therefore reached **zero students**, not "some" - no test
   file for `create_test` existed at all before this round (`voice_test.py`
   had no dedicated test file, confirmed by search). Fixed in
   `create_test`: WHOLE_CLASS now resolves the class roster at creation
   time and populates the identical delivery table SPECIFIC_STUDENTS
   already did, so every downstream read path works unchanged - no
   separate "is this WHOLE_CLASS, go look up the roster instead" branch
   needed anywhere else. `VoiceTest.assigned_count` (previously always 0,
   a separately-flagged gap) is now also set correctly at creation time
   for both modes, as a direct side effect of resolving the real roster.
   2 new tests in `test_voice_test.py`, including a true end-to-end
   regression check calling each student's own `list_my_tests` read path
   directly - both pass; a 3rd confirms SPECIFIC_STUDENTS' existing
   behavior is unchanged.
8. **`GET /me/progress` (the Student app's "Progress" screen - already a
   rich, colorful, multi-chart report-card-equivalent UI, see "Student app"
   below) had several hardcoded-placeholder fields, now real.** `trajectory`
   was always a single fake "Now" point; `trajectory_gain_label` and
   `next_best_focus` were always empty strings, regardless of real data.
   Now: `trajectory` is a real weekly mastery trend (same `date_trunc`
   pattern `school_analytics.py`'s `compute_school_analytics` already
   uses, just scoped to one student), `trajectory_gain_label` compares
   first vs. last point, and `next_best_focus` names the student's
   weakest *assessed* Bloom level with a real percent in the message
   (falls back to an honest "take your first test" state when nothing's
   assessed yet, never a fake number). `concepts_tracked`/
   `strongest_concept`/`focus_concept` stay unset - "concept"-level
   tracking doesn't exist anywhere in the schema (`TopicPerformance` is
   homework-gap-specific, not general mastery-by-concept); building that
   is a distinctly larger, separate feature, not attempted here. 3 new
   tests in `test_progress.py` (also a previously-completely-untested
   route), including one asserting the "no results yet" state renders
   honest zeros/empty-strings rather than anything fabricated.
9. Full backend suite: 318 passed (up from 312 at the top of this round),
   only the same one pre-existing environmental failure
   (`test_config.py`, a local-shell `POSTGRES_PORT` mismatch, unrelated).

**Teacher app / Student app (`nool-apps`) - investigated thoroughly, no
code changes needed:**

10. The WHOLE_CLASS bug above **was** the Teacher-app-reported issue
    ("assign test to overall class, not reaching all students") - it's a
    backend delivery-table gap, not a Teacher-app bug; nothing in
    `nool-apps` itself needed to change once `nool-core`'s `create_test`
    was fixed.
11. **"Milo isn't ready, mimic it and don't let the app break" - audited
    both the Test and Retest voice-session flows end to end, found them
    already solidly engineered for exactly this.** `ApiAiAssessorSession`
    (the real WS client) already catches unparseable frames instead of
    crashing, surfaces connection failures as a real `failed` phase with
    retry, and its own doc comment already states plainly there's no real
    speech pipeline on either end. `aiAssessorReducer.ts` exhaustively
    handles every event type the backend can actually send, with a safe
    no-op default for anything unrecognized. The Retest flow
    (`useRetestResult`) has its own proper processing/error/retry states.
    `npm run typecheck` and the full Jest suite (72 suites, 411 tests)
    both pass clean, untouched. The one genuine gap in this whole pipeline
    was the backend's own `record_test_completion` (shipped round 6, not
    this round) - before that fix, a completed session's result was
    silently never written at all; that's now fixed and tested. Nothing
    else needed changing.
12. **Student app "report card"** - `app/(app)/student/progress.tsx`
    already *is* a fully-built, colorful, multi-chart report-card-
    equivalent screen (subject cards, a Bloom's-level "staircase" chart,
    a mastery trajectory line chart, class leaderboard, a "next best
    focus" callout) - it just had nothing real to show before this
    session's completion-pipeline fix (round 6) and the placeholder-field
    fix above (item 8) existed. No new screen was built; the existing one
    is now fed real, honest data end to end for the first time.

## 0-5. Done this session, round 5 — leaderboard/points now real, plus a new Support page

Two pieces of cross-repo work (full detail in
`../nool-super-admin/NEXT_STEP.md`'s round 5):

1. **The leaderboard's "always zero" bug (§2 item 2 above, and
   `requirements.md`'s flagged gap) is fixed at the source.** `nool-core`
   never had anything transition a `VoiceTest` to `COMPLETED`/
   `RESULTS_READY` or write `StudentTestResult`/`StudentPoints` in
   production - only test fixtures ever touched those tables. A new
   `record_test_completion` service, wired into the AI Assessor's session-
   completion event, now writes real results, awards real points (10 per
   question answered - a participation signal, not a synthesized
   correctness grade, since no real grading vendor exists), and unblocks
   `homework.py`'s "generate follow-up Homework from gaps" gate that was
   equally unreachable before. This page (`/activity/leaderboard`) needed
   no changes - it was always correctly reading whatever data existed,
   there just wasn't any real data to read before now.
2. **New Support page** (`/support`, under the sidebar's School group) -
   file a ticket, see your own school's tickets and their status, reply in
   a thread. Talks to `nool-core`'s new `SupportTicket`/
   `SupportTicketComment` tables via `/school/tickets*`. Mirrors this
   app's own Subscription page's "Request an upgrade" pattern in spirit,
   but as its own durable, queryable record rather than a fire-and-forget
   email. Deliberately no email/Slack integration for this first version -
   noolAI works these from `nool-super-admin`'s new Support tickets inbox.
   `tsc`/`eslint` clean. **Verified live**: filed a real ticket as
   `schooladmin@test.com`, confirmed it appeared in Super Admin's inbox,
   and confirmed a status change + reply made there showed up back here.

## 0-6. Done this session, round 6 — ingestion visibility (Import jobs)

Cross-repo work, full detail in `../nool-super-admin/NEXT_STEP.md`'s round
6. `nool-core`'s three bulk `.csv`/`.xlsx` upload routes this app already
has UI for - Teachers' "Bulk upload", Students' bulk-create, and the
question bank's bulk import - now each write a durable `ImportJob` summary
row (school, who ran it, filename, row/success/failure counts) instead of
that outcome only ever existing in the one in-the-moment response. No
changes needed in this repo - the existing Bulk-upload flows already
worked correctly and needed no touching; the new visibility is entirely
Super Admin-side (`nool-super-admin`'s new **Import jobs** page). Verified
live by running a real bulk-invite through this app's own Teachers page
Bulk-upload modal and confirming the run showed up correctly on the other
app's Import jobs page with the right counts.

**Session-admin note**: while live-testing rounds 5/6, the browser session
that had been logged in as `schooladmin@test.com`/`superadmin@nool.test`
expired after a Chrome-extension reconnect, with no test credentials on
hand. Per the user's direction ("reset and create password"), both
accounts' Firebase passwords were reset directly via the Firebase Admin
SDK (using the service account already configured for this project) to a
known test password, used only for this session's verification.

## 0-4. Done this session, round 4 — Reports page redesigned into a colorful executive dashboard

User's ask, verbatim: "the report generation part i am not happy it should a
fancy chart based report analysing various aspect of the school it will go
ti higher athorities of the school so make it color full and appealing and
track the real metrics thing of multipele charts and items." The plain
DataGrid-only pivot builder from round 3 stayed (still useful for ad-hoc
Class/Section/Student queries + CSV export/save), but `/reports` now opens
with a new **"School report"** section above it: a fixed, colorful,
multi-chart snapshot built to be shown to school leadership as-is, no
export step needed first.

Installed `recharts` (v3.10.1, React 19-compatible) - neither admin app had
a charting library before this. New `src/components/ExecutiveReport.tsx`:
5 KPI cards (school mastery average, active teachers, active students,
classes tracked, plan/status) using the existing `insight-card` dashboard
styling, plus 4 real charts, each pulling from an endpoint already used
elsewhere (`getAnalytics`, `getSubscription`, `getSchoolLeaderboard`,
`listTeachers`/`listStudents`/`listClasses` - nothing invented):
- **Mastery trend** - gradient-filled area chart over `masteryTrend`.
- **Bloom's level breakdown** - horizontal bar chart, one brand color per
  level, nulls (not-yet-assessed levels) filtered out rather than shown as
  a misleading zero.
- **By class** - grouped bar chart, mastery average vs. improvement per
  class.
- **Leaderboard** - horizontal bar chart, top 5 students by points.

Color palette is drawn from `globals.css`'s existing brand tokens (yellow/
purple/green/red/amber) plus one added blue, not an unrelated chart-only
palette. `tsc`/`eslint` clean. Verified live in the browser (real logged-in
session, "Meera Nair · ABC Public School") - all four charts render with
real data, tooltips work (hover on the Bloom bar showed "Remember ·
Mastery: 80%"), no console errors. The `web` container here is a
**production build** (no hot reload, unlike `nool-core`'s dev container) -
picking up a new npm dependency required `docker compose build web` +
`up -d web`, not just a page refresh; worth remembering next time a
dependency changes here.

**Bug found and fixed while diagnosing an unrelated report during this
same work session** (in `nool-super-admin`'s Datasets page, not this repo):
typing in a create/edit form that lives in the same component as a live,
unmemoized-`columns` MUI DataGrid could trip React's "Maximum update depth
exceeded" limiter. Fixed there with `useMemo`. Diagnosed as *not* an active
production bug - it only reproduced under synthetic rapid-fire automated
keystrokes, never under human-paced typing (tested character-by-character
with real delays) - but the fix is correct practice regardless. Worth
checking for the same unmemoized-`columns`-next-to-a-form pattern if a
similar report ever surfaces on a page in this repo.

Not done: no chart view added to the ad-hoc pivot builder's own Results
table (arbitrary dimension/metric combinations don't map to a fixed chart
layout the way the School report's known, specific metrics do) - it stays
a DataGrid, by design, not an oversight.

## 0-3. Done this session, round 3 — Reports page shipped

A real `/reports` page now exists: pick Class/Section/Student, pick metrics,
optionally filter by status, run, save, export CSV — plus a "Shared with
your school" section for reports a Super Admin has shared. Full detail
(including the security-scoped Data Explorer shipped alongside it in
`nool-super-admin`) is in `../nool-super-admin/NEXT_STEP.md`'s "Done this
session, round 3." `tsc`/`eslint` clean; the dev container compiled every
change with no errors.

## 0-2. Done this session, round 2

**Per-school feature visibility — shipped** (was §4 item 2). `Profile` now
carries `enabledFeatures: Feature[] | null` (the field `nool-core`'s `/me`
already returned, just wasn't declared here), and `Sidebar.tsx`'s
`NAV_GROUPS` filters the Activity group against it — a School Admin whose
plan has e.g. `voice_test` disabled no longer sees Voice Tests in their own
nav. `null` still means "everything enabled," matching the backend
convention.

Also shipped as part of the cross-repo work this round (full detail in
`../nool-super-admin/NEXT_STEP.md`): school suspension / inactive-
subscription now actually block API access (`nool-core`), and Classes got a
"Subjects" action (per-Class subject toggle, new backend table + endpoints).
`StudentPoints`/Leaderboard investigated and deliberately left broken — it's
downstream of the test-completion pipeline never being built, a separate,
larger initiative, not a quick fix.

## 0. Done this session — Class/Section split shipped

The Class/Section schema decision (see `../nool-super-admin/NEXT_STEP.md`
for the full design) is live: `nool-core` got an additive migration adding
a real "Class" entity (`SchoolGrade`) above the existing per-section
`classes` table, with both route surfaces, covered by 22 new backend tests
(full suite: 213 existing + 22 new, all passing).

In this repo: the Sidebar's "Classes" item is now "Sections" (unchanged
route, `/classes` — it was always the per-section page), a new "Classes"
item (`/grades`) manages the grade level itself (add/deactivate/delete a
Class, e.g. "Class 10"), and the existing Sections page's user-facing text
was relabeled to match (page title, empty state, modal titles, toasts — the
underlying `SchoolAdminClass`/`classId` code identifiers were deliberately
left alone, per the "additive, not a rename" design). `tsc`/`eslint` clean.

## 0a. New requirements (from the user, 2026-08-28)

Restated base hierarchy: `School → class → section → students`. School Admin
list, mapped against this repo:

| Requirement | Status |
|---|---|
| Current all features | No action — this repo's existing feature set stays. |
| Remove any feature that is not needed | **Tracked as §4 item 2 below.** Turns out to be a frontend-only fix: `nool-core`'s `GET /api/v1/me` already returns `enabledFeatures` per school (verified by reading `profile.py` directly), this app just doesn't consume it yet in `Sidebar.tsx`. |
| Generate reports at each class/section/student level | **Tracked as §4 item 4 below** (the report builder). Note: `nool-super-admin/NEXT_STEP.md` flags a terminology question worth resolving first — the user's hierarchy treats "class" and "section" as two distinct levels, but this app's `classes` table today is one row per grade+section pairing (what the user calls "section"). There's no separate "whole grade" entity to report on independent of picking one section at a time, except where `CustomQuestion.grade` already carries that idea loosely. Confirm which is meant — "by section" (already buildable, one row = one section) vs. "by class/grade rolled up across its sections" (needs a small aggregation step first) — before scoping the report builder's grouping options. |

Full Super Admin list lives in `../nool-super-admin/NEXT_STEP.md` — none of
those bullets are this repo's work except where they reference something
`nool-school-admin` already owns (roster CRUD, per-school toggles), which is
called out there.

## 1. Current state (verified against actual code + a live click-through, not docs)

Already shipped and solid: Teachers/Students (invite, edit, delete,
multi-delete, activate/deactivate, bulk upload, CSV export, send-credentials
email, filter/sort via DataGrid), Classes (full CRUD, assign teacher+subject),
Curriculum/Datasets (per-school enable/disable toggles), Question bank (custom
questions, full CRUD, bulk import, collections), Analytics, Subscription
(read-only + upgrade request), Settings (profile, logo, password), Dashboard
(real insight cards + onboarding checklist). Yellow/black premium theme, MUI
tables, icon buttons — the general-enhancements list from the old `changes.md`
is done.

**Oversight pages** (Tests/Homework/Question Papers/Retests/Leaderboard/Audit
log under Activity) are read-only lists. As of this session they all have
filter UI matching what the backend supports (see §3 — this was the main gap,
now closed). Still missing: detail/click-through and CSV export (see §4).

## 2. Confirmed bugs (live-tested against the real backend, not just read from code)

1. **Curriculum subject toggle → 500, reproducibly.** Toggling a subject on
   `/curriculum` fails every time. Backend bug (`nool-core`'s
   `update_school_curriculum` has a UUID-vs-string key-comparison bug) — not
   fixable from this repo alone.
2. **Leaderboard points permanently zero**, every student tied at rank #1 —
   `StudentPoints` is never written server-side. The page itself (real data,
   real class filter) is fine; the numbers behind it aren't. Backend fix.
   **Fixed in round 5** (see §0-5 below) — `nool-core` now writes real
   `StudentPoints` on Voice Test completion. This page needs no changes;
   it was always correctly reading whatever the backend had.
3. **Orphaned create-on-first-attempt.** A first invite/create call can
   return a transient 503 while the record is *actually created*
   server-side — the temp-password reveal never shows (permanently lost bar
   a manual reset), and a retry with the same email then says "already
   exists." Looks like backend cold-start flakiness colliding with this
   app's 10s request timeout. Needs either a backend idempotency-key
   contract or at least a "this may have already gone through, check the
   list" message on a create-call timeout — not fixed this session, needs a
   contract decision first.
4. Backend intermittent 503s on plain `GET`s too, under the local dev stack —
   succeeds on retry. General dev-environment flakiness, watch if it persists
   outside local dev.

## 3. Done this session

- **Oversight filters.** `activity/tests` (class + teacher),
  `activity/homework` (class), `activity/question-papers` (subject +
  teacher), `activity/retests` (class) — all previously had zero filter UI
  despite the backend already accepting these params; `activity/leaderboard`
  was the only one that had this right, so the fix just replicates its exact
  pattern (`useUrlParam`, resets pagination on change).
- **Action-column clipping fix.** Teachers/Students DataGrid action icons
  (Edit/Reset/Deactivate/Delete) were getting clipped past the viewport edge.
  MUI's column-pinning is Pro-tier in the installed version (confirmed via a
  `tsc` failure, not a guess) — went with trimming `minWidth` on the less-load-
  bearing columns instead. A kebab-menu redesign would be the more robust
  fix long-term (see §4).
- Analytics "Growth, last 1 weeks" pluralization fix.

Typecheck and lint are clean across the repo. **Not yet live-click-verified**
— the documented dev credentials (`schooladmin@test.com` / `Test1234!` from
`nool-core/docs/SPEC.md`) are rejected by the real auth service right now
(confirmed via server logs, not a guess), and the account offered by Chrome's
saved autofill isn't provisioned as a School Admin in this seed DB. Didn't
attempt to reset anyone's password to force a way in. **First thing to do
with a working login**: open `/activity/tests`, `/homework`,
`/question-papers`, `/retests` on `npm run dev` and confirm the new dropdowns
actually narrow results.

## 4. Recommended next steps, in priority order

1. **Verify §3's filters live**, per the note above — 2 minutes once there's
   a working login.
2. ~~**Per-school feature visibility**~~ **Done, see §0-2 above.** Originally scoped as:
   `nool-core`'s `GET /api/v1/me` already returns `enabledFeatures` for
   *any* signed-in user with a school (confirmed by reading
   `services/core/src/api/routes/profile.py` directly — it's role-agnostic,
   not teacher/student-only). `nool-apps` already consumes this for its own
   nav-hiding. **This app's own `Profile` type (`src/lib/AuthProvider.tsx`)
   doesn't declare the field, and `Sidebar.tsx`'s `NAV_GROUPS` doesn't filter
   on it** — so today every School Admin sees all 6 Activity-group items
   regardless of their plan's `Plan.enabled_features` (set in
   `nool-super-admin`'s Plans page). Fix is frontend-only: add
   `enabledFeatures: Feature[] | null` to `Profile`, filter `NAV_GROUPS`'
   Activity items against it (map: Voice Tests→`voice_test`,
   Homework→`homework`, Question Papers→`question_paper`, Retests &
   Improvement→`improvement_analysis`, Leaderboard→`leaderboard`). No
   backend work needed — this was a guess at real backend effort in the
   prior draft of this doc; it turned out to already be plumbed.
3. **Oversight detail + export symmetry.** Tests/Homework/Question
   Papers/Retests/Leaderboard have no click-through and no CSV export, unlike
   Teachers/Students which have both. Needs one backend export endpoint (or a
   `?format=csv` on the existing list endpoints) plus a detail route per
   entity type.
4. ~~**Class/Section/Student report builder.**~~ **Done.** Shipped as a new
   `/reports` page (dimension → metrics → optional status filter → run →
   save → export) plus a "Shared with your school" section for reports a
   Super Admin has shared. Backed by `nool-core`'s new
   `src/services/reporting.py` registry and `report_configurations`/
   `report_shares` tables — same engine `nool-super-admin`'s own Reports
   page uses, built once and shared across both apps as planned. See
   `../nool-super-admin/NEXT_STEP.md`'s "Done this session, round 3" for
   full detail (30 new backend tests, all passing).
5. **Action-column kebab-menu redesign** (Teachers/Students/Classes) — makes
   §3's width-trimming fix unnecessary at any screen size, more robust than a
   pixel-budget fix. Low urgency, do when touching those pages next anyway.
6. Flag to whoever owns `nool-core`: the three confirmed backend bugs in §2,
   plus the ones already tracked in `nool-super-admin/requirements.md` §8.2
   (school suspension not enforced, canceled/past-due subscriptions still get
   full limits) — none of these are fixable from this repo.

## 5. Not recommended yet

Building more UI on `/activity/leaderboard` or `/activity/retests`'
Improvement table beyond what's there is low-value until §2's backend data
gaps (StudentPoints, TopicPerformance) are closed — more screens rendering
structurally-empty data isn't progress.
