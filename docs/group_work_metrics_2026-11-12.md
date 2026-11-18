# Group work: Chamnay delivery metrics

**Snapshot:** 12 November 2026, Asia/Phnom_Penh. **Sources:** CP Jira board and issue histories; this repository's Git history and automated checks. These figures count **user stories only**. Subtasks and epics are excluded so their points are not counted again.

## 1. Committed and completed story points

| Sprint | Dates in Phnom Penh | Points recorded at sprint start | Points in scope at the snapshot or close | Completed points |
| --- | --- | ---: | ---: | ---: |
| [CP Sprint 1](https://sochan7621-1792216131737.atlassian.net/jira/software/projects/CP/boards/3) (closed) | 31 Oct 00:00 to 5 Nov 08:54 (actual close; planned end 3 Nov 20:00) | 0 | 15 | 15 |
| [CP Sprint 2](https://sochan7621-1792216131737.atlassian.net/jira/software/projects/CP/boards/3) (active) | 7 Nov 11:00 to 17 Nov 23:30 (planned) | 0 | 27 as of 12 Nov morning | 0 so far |

Sprint 1's completed stories were [CP-6](https://sochan7621-1792216131737.atlassian.net/browse/CP-6), [CP-7](https://sochan7621-1792216131737.atlassian.net/browse/CP-7), and [CP-9](https://sochan7621-1792216131737.atlassian.net/browse/CP-9), each now estimated at 5 points. Their current estimates total 15. Sprint 2 has five To Do stories: [CP-5](https://sochan7621-1792216131737.atlassian.net/browse/CP-5) 8, [CP-8](https://sochan7621-1792216131737.atlassian.net/browse/CP-8) 8, [CP-10](https://sochan7621-1792216131737.atlassian.net/browse/CP-10) 5, [CP-11](https://sochan7621-1792216131737.atlassian.net/browse/CP-11) 3, and [CP-12](https://sochan7621-1792216131737.atlassian.net/browse/CP-12) 3.

**Why the start-of-sprint values are zero:** Sprint 1's three stories were moved into its sprint after the 31 October start, and their current 5-point estimates were entered on 5 November, after the work reached Done or near the actual close. Sprint 2 began on 7 November with none of the five current stories assigned; they were added on 12 November. CP-8 was raised from 3 to 8 points after it was added. Thus 15 and 27 are **later scope snapshots**, not original commitments. Jira's histories do not support saying the team committed to 15 or 27 points at sprint planning.

**Observed average velocity:** 15 completed story points / 1 closed sprint = **15 points per closed sprint**. Sprint 2 is still active and is excluded. This is a weak planning baseline because there is only one closed sprint and its points were entered retrospectively.

## 2. Burndown and longest flat period

A reliable *story-point* burndown cannot be reconstructed from these Jira records: Sprint 1 points were entered late, and Sprint 2 started with no assigned stories. The longest observed period with stories **assigned but none reaching Done** was in Sprint 1, from **31 October 2026, 21:41** (the three stories were placed in the sprint) until **4 November 2026, 22:12** (CP-7 and CP-6 first moved to Done): about **4 days and 32 minutes**. This is a **Done-story-count proxy**, not a point burndown. CP-9 reached Done on 5 November at 08:35. All dates and times are Phnom Penh local time.

The reason visible in Jira is that work remained in **In Progress** and then **Review** during that interval; no story met the board's Done state. CP-7 entered In Progress on 31 October, CP-9 on 2 November, and CP-6 on 3 November. Two reached Review on 4 November. The planned sprint end was 3 November 20:00, before the first Done transition. The history does **not** establish an underlying blocker, so the team should confirm the cause in its standup notes before claiming a specific reason such as unclear criteria or review delays.

Sprint 2 also has no Done transition from its 7 November start through this 12 November snapshot. Its five current stories were only added on 12 November, so treating the earlier zero-scope interval as a stalled 27-point burndown would be misleading.

## 3. Lead time and cycle time for three finished stories

Definitions: **lead time = Done timestamp − creation timestamp**; **cycle time = Done timestamp − first In Progress timestamp**. Durations use elapsed calendar time, including evenings and weekends.

| Finished story | Created | First In Progress | Done | Lead time | Cycle time |
| --- | --- | --- | --- | ---: | ---: |
| [CP-6](https://sochan7621-1792216131737.atlassian.net/browse/CP-6), income entry | 23 Oct 10:47 | 3 Nov 23:25 | 4 Nov 22:12 | 12.48 days | 0.95 days |
| [CP-7](https://sochan7621-1792216131737.atlassian.net/browse/CP-7), expense entry | 23 Oct 10:47 | 31 Oct 22:25 | 4 Nov 22:12 | 12.48 days | 3.99 days |
| [CP-9](https://sochan7621-1792216131737.atlassian.net/browse/CP-9), categories | 23 Oct 10:59 | 2 Nov 13:27 | 5 Nov 08:35 | 12.90 days | 2.80 days |

Times are rounded to the minute in the table; calculations used Jira's full timestamp including milliseconds and the +07:00 offset.

## 4. Recorded defect rate and product status

Jira currently has **0 Bug issues** in project CP and **3 Done user stories**. The *recorded* defect rate is **0 / 3 = 0 bugs per completed story (0%)**. This measures logged bugs, not the true number of defects. If the team found broken workflows outside Jira, log and count them before submitting this figure.

The repository contains an implemented Home flow for adding, editing, deleting, categorizing, filtering, and summarizing income and expenses with browser-local persistence. Bills, savings, reminders, and dark mode are still planned prototype work, as documented in [PRODUCT.md](../PRODUCT.md). At this snapshot, `npm test` passed 15 tests, `npm run lint` passed, and `npm run build` passed. These checks do not replace a manual defect log or acceptance review.

## 5. High-churn file and likely cause

**`src/App.tsx` is the highest-churn source file** in the available non-merge Git history: **7 commits, 407 added lines and 142 deleted lines (549 changed lines)**. The next highest is `src/home.css` at 265 changed lines. The App file was touched by the initial shell, Figma layout, income and balance changes, expense management, category management, and a later balance correction. The 5 November commit `ee96b24` is explicitly titled **“fixed available balance update”** and replaces sample-budget calculations with totals from actual entries.

The evidence supports **feature growth plus corrective rework around balance calculations** as the reason for this churn. It does not show teammate overwrites or prove AI-generated code was faulty. Jira's acceptance criteria were revised during Sprint 1, but the available records do not prove those revisions caused the balance correction. To reduce future churn, keep calculation rules in focused modules, agree on balance examples before implementation, and review the Home flow against those examples when it changes.
