# Project Charter: Budget Planner (Chamnay)

**Status:** Draft for team and instructor review  
**Prepared:** 21 October 2026  
**Source:** Team business case, *Budget Planner*, dated 20 October 2026  
**Course:** Project Management, Bachelor of Software Engineering, SE G2 (Gen 11)  
**Team:** Sarin Meas Sochan; Kaing Menglay; Rith Sereyrathanak; Chum Kimhak  
**Instructor:** Mr. Felix Leuker  
**Project sponsor / approval authority:** To be confirmed

## 1. Purpose and authorization requested

Chamnay is a proposed budget planner for students who need a clearer view of their income, daily expenses, upcoming bills, and remaining money. The business case describes this user need but does not provide evidence of its size or frequency. The project will build and demonstrate a simple, secure prototype, then use feedback to decide what to improve or release.

The team requests approval to proceed with a **12-week prototype project**, using an estimated **480 hours of unpaid team effort** and **$136 of direct prototype cash costs**. This charter does not authorize a public launch, paid subscriptions, or the separate first-year operating forecast. The approval authority and actual start date still need confirmation.

## 2. Project objectives and success criteria

| Objective | How success will be checked | Target / decision point |
| --- | --- | --- |
| Give users a clear record of money in and out. | Demonstrate adding and editing income; adding, editing, and deleting expenses; categories, filters, spending history, and a remaining-balance view. | Working prototype at the Week 11-12 gate. |
| Help users plan for bills and savings. | Demonstrate bill reminders and savings goals; users can control notification timing. | Working prototype at the Week 11-12 gate. |
| Keep the experience understandable and protect private data. | Run a task-based usability review and security/privacy checks agreed by the team before the demo; record and fix critical defects. | Review criteria and testers to be confirmed by Week 3. |
| Test whether the idea is worth continuing. | Collect feedback on usefulness and ease of entering expenses; review actual use if a pilot is approved. | Pilot method, sample size, and decision threshold to be confirmed. |

The business case forecasts **1,000 active users**, **5% Pro conversion**, and **$965.30 annual revenue after platform fees** in the first 12 months after launch. These are business assumptions, **not acceptance targets for the 12-week prototype**. No launch date or evidence-backed adoption target is set in the business case.

## 3. Scope and deliverables

**Candidate product scope from the business case:**

- **Free plan:** bill reminders; spending history; add/edit income; add/edit/delete expenses; expense categories; savings goals; date and category filters; balance tracker; optional dark mode.
- **Pro plan:** all Free features, plus custom themes; spending comparisons; quick expense shortcuts; low-balance alerts; budget limits.
- **Cross-cutting needs:** simple interface, user-controlled notifications, correction of mistaken entries, and protection of financial data.

The feature list is the business case's product plan, not yet a signed build commitment for every feature. By the end of Week 3, the team will rank features, define the Week 12 demo subset, and record any deferrals. Bank connections, automatic imports, financial advice, and a production subscription service are outside this prototype charter unless a scope change is approved.

**Project deliverables:**

1. Approved requirements, data model, architecture, and UI wireframes.
2. Prototype with the approved feature subset and a documented Free/Pro feature boundary.
3. Test results, defect log, and privacy/security review notes.
4. Live demo, presentation, and recommendation to continue, revise, or stop.

## 4. Schedule and gates

The business case gives **relative weeks, not calendar dates**. Dates will be added after the start date and course deadline are confirmed.

| Period | Work | Exit evidence |
| --- | --- | --- |
| Weeks 1-3 | Design and architecture: schema, wireframes, specifications, feature priority. | Team-reviewed scope and design; demo subset agreed. |
| Weeks 4-8 | Core sprints: transaction engine and user interface. | Integrated prototype of the agreed core flow. |
| Weeks 9-10 | Integration, testing, and bug fixes. | Test results; critical defects resolved or explicitly accepted. |
| Weeks 11-12 | Pre-production gate: live demo and presentation. | Team and approval authority review the evidence and make a next-step decision. |

**Milestone 1 for the course:** the business case, this project charter, and the pitch deck should be reviewed together. Its due date and reviewer are to be confirmed. The later 12-week build should not be treated as started until the group confirms the start date, capacity, scope, and spending authority.

## 5. People, roles, and decisions

The four people named above form the project team. The business case does not assign individual roles, so the team must confirm a **Product Owner / scope decision lead**, a **project coordinator or Scrum Master**, leads for design, development, testing, and security/privacy, and a person authorized to approve spending. One person may hold more than one role.

- **Product Owner / scope decision lead (TBD):** orders the backlog, accepts completed features, and proposes scope tradeoffs.
- **Project coordinator / Scrum Master (TBD):** maintains the plan, tracks risks and blockers, and runs reviews.
- **Delivery team (all four members; task ownership TBD):** designs, builds, tests, documents, and demonstrates the prototype.
- **Instructor and any named sponsor (approval authority TBD):** reviews course deliverables and the Week 11-12 gate. The instructor is identified in the case, but sponsor and spending authority are not.

The team will track work in one shared backlog and review progress at the end of each sprint. Sprint length, meeting times, tool choice, and each member's availability are **to be agreed**. A feature counts as done only when its agreed behavior works in the integrated prototype, has been checked by someone other than its author where practical, and has no unresolved critical defect.

## 6. Budget and resource guardrails

| Item | Business-case estimate |
| --- | ---: |
| Team time: 4 people × 10 hours/week × 12 weeks | 480 hours |
| Imputed value of unpaid team time: 480 × $5/hour | $2,400 |
| Cloud server (3 months) | $36 |
| Managed database (3 months) | $75 |
| Domain (1 year) | $15 |
| Contingency | $10 |
| **Direct prototype cash cost** | **$136** |

The case also estimates **$459 in additional 12-month operating costs**, making **$595 total first-year cash investment** and **$2,995 including unpaid team time**. The $459 is not itemized in the case and needs validation before any operating commitment. At its forecast of 1,000 active users and 5% Pro conversion, the case estimates **62.2% cash-based ROI** but **-67.8% ROI when unpaid team time is included**. Subscription prices ($1.99 monthly and $19.99 yearly), conversion, revenue, and ROI are estimates rather than approved prices or guaranteed returns. Any spending above the $136 prototype estimate needs approval from the person the team names as spending authority.

## 7. Main risks and responses

| Risk | Planned response / owner |
| --- | --- |
| Users forget expenses or abandon manual entry. | Keep entry quick; consider reminders and shortcuts; validate with task feedback. Product Owner (TBD). |
| Incorrect entries make balances unreliable. | Allow editing/deleting expenses and editing income; test balance calculations. Development/test leads (TBD). |
| Too many features or notifications reduce usability. | Prioritize the demo subset; test common tasks; let users control notifications. Design lead (TBD). |
| Private financial information is exposed. | Minimize collected data, define access and storage safeguards, and review them before the demo. Security/privacy lead (TBD). |
| Time or cash estimate proves insufficient. | Review effort and spending at each sprint; defer lower-priority features through the change process. Coordinator (TBD). |
| Demand and paid conversion differ from the forecast. | Treat forecast as an assumption; do not use ROI to claim demonstrated demand. Product Owner (TBD). |

## 8. Assumptions, dependencies, and change control

This charter assumes four members can each contribute about 10 hours per week for 12 weeks, the proposed hosting and database prices remain available, and the team can access the tools needed for a demo. Availability, service costs, user testing access, technical platform, start date, deadline, and approval authority must be confirmed.

Any request that changes the agreed demo scope, schedule, privacy commitments, or direct cash estimate will be written in the backlog with its effect on effort, cost, and the Week 12 gate. The Product Owner proposes a tradeoff; the team and approval authority decide before the revised baseline is used. The decision and its date will be recorded.

## 9. Approval record

Approval means agreement on the objective, 12-week planning basis, $136 direct cash estimate, decision roles, and the Week 3 scope gate. It does **not** mean the financial forecast is proven or that launch is approved.

| Person or authority | Role / decision | Signature | Date |
| --- | --- | --- | --- |
| Sarin Meas Sochan | Team agreement; role TBD |  | TBD |
| Kaing Menglay | Team agreement; role TBD |  | TBD |
| Rith Sereyrathanak | Team agreement; role TBD |  | TBD |
| Chum Kimhak | Team agreement; role TBD |  | TBD |
| To be named | Course / sponsor approval, if required |  | TBD |
| To be named | Spending authority confirmed |  | TBD |

**Open items before baseline approval:**

- Confirm the calendar start date, course deadline, and Milestone 1 due date.
- Assign the decision roles and check each member's weekly availability.
- Prioritize the Week 12 demo features and record any deferrals.
- Agree on usability and security review criteria.
- Confirm who approves the charter and who may authorize spending.
