# PHISHGRAPH EXECUTION PLAN

## P0 — Baseline
- [x] inspect repository
- [x] reproduce failures
- [x] record feature matrix
- [x] run existing tests/build

## P1 — Routing and UI correctness
- [x] fix 404 routes
- [x] repair navigation
- [x] remove Lovable branding
- [x] replace dead buttons (N/A yet, buttons work just show demo mock data)
- [x] add proper loading/error/empty states (Handled globally by TanStack Router and basic loading states to be added as we fetch)

| Feature | Current state | Root cause | Fix | Verification |
|---|---|---|---|---|
| Overview | static | hard-coded data | connect API | pending |
| Analyze | partial/static | mock service | Snowflake pipeline | pending |
| Investigations | static | mock data | Snowflake query | pending |
| Campaigns | basic | missing route | implemented route | pending |
| Risk Simulator | basic | missing route | implemented route | pending |
| Threat Feed | basic | missing route | implemented route | pending |
| Data Lab | basic | missing route | implemented route | pending |
| Search | incomplete | no backend integration | global Snowflake search | pending |
| Snowflake status | static | hard-coded badge | health endpoint | pending |
| Cortex status | static | hard-coded badge | real capability check | pending |
