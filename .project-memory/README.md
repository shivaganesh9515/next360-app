# .project-memory/

Local development memory system for Ashwanth (PM/Coordinator + Backend Developer).

## Purpose
- Persistent context for stopping/resuming work at any time
- Never affects application code, build, runtime, deployment, or Git history
- Local only — not committed to repository

## Structure
| File | Purpose |
|------|---------|
| PROJECT_OVERVIEW.md | What the project is, team, tech stack |
| PROJECT_FLOW.md | How the system works end-to-end |
| ARCHITECTURE.md | Backend architecture, patterns, conventions |
| MODULES.md | All NestJS modules and their responsibilities |
| API_FLOW.md | API routes, response format, auth flow |
| DATABASE.md | Prisma schema, models, relationships |
| SECURITY.md | Current security posture, hardcoded risks |
| DEPENDENCIES.md | NPM packages, external services |
| TEAM_STATUS.md | Team assignments, blockers, progress |
| MY_TASKS.md | Ashwanth's assigned tasks |
| IMPLEMENTATION_PLAN.md | Phase-by-phase execution plan |
| DAILY_PROGRESS.md | What was done each session |
| DECISIONS.md | Architectural decisions made |
| KNOWN_ISSUES.md | Bugs, stale comments, gaps |
| TESTING.md | How to verify changes |
| COMPLETED.md | Finished work |
| NEXT_STEPS.md | What to do after current tasks |

## Rules
- Only Markdown documentation inside this folder
- Never modify application code while updating memory
- Update after every completed task
- Keep synchronized with latest project state
