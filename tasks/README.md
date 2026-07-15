# Task Assignments — Start Here

## 1. Find your file

| File | Owner | Area |
|------|-------|------|
| [abhinaya.md](./abhinaya.md) | Abhinaya | Backend — brands/kyc/sub-categories/roles/cms modules |
| [srinitha.md](./srinitha.md) | Srinitha | Backend — delivery-partners/zones/disputes + vendor endpoints |
| [harshitha.md](./harshitha.md) | Harshitha | Backend — Razorpay payouts + inventory module |
| [soumya.md](./soumya.md) | Soumya | Frontend — apps/vendor-dashboard |
| [manaswini.md](./manaswini.md) | Manaswini | Frontend — apps/admin-panel |
| [ashwanth.md](./ashwanth.md) | Ashwanth | Coordination — tracks who's blocked on who |

Open your file. It's a checklist — work through it top to bottom. Some items say "blocked on X" — that means wait for that person to finish first, or check with them.

## 2. Before you start coding, pull the latest

```bash
git checkout main
git pull origin main
```

## 3. Create your own branch — never commit straight to `main`

```bash
git checkout -b yourname/short-task-name
```

Examples:
- `abhinaya/brands-module`
- `soumya/vendor-payouts-page`

One branch per task is fine, or one branch per day of work — just don't mix unrelated tasks in the same branch.

## 4. Check the memory folder before you touch code

`.claude/memory/` has 6 files — read them before starting so you're not re-solving something already decided or already broken:

- **STATUS.md** — what's actually done vs. not done right now (most important, check this every time)
- **ARCHITECTURE.md** — how the system fits together
- **DECISIONS.md** — things the team already decided — don't relitigate these
- **CONVENTIONS.md** — code patterns to follow (naming, folder structure, API response format)
- **GOTCHAS.md** — known traps / weird bugs people already hit
- **PROJECT.md** — overall project context

If you're using Claude (or another AI assistant) to help you code, tell it to read `.claude/memory/` and the root `CLAUDE.md` first — both are already set up for that.

## 5. When you finish a task (or hit something worth remembering)

1. Check the box in your `tasks/yourname.md` file.
2. If what you learned would help someone else on the team (a gotcha, a decision, a new state), add a line to the matching file in `.claude/memory/` — pick whichever of the 6 files above fits best. Keep it short: what changed and why.
3. Update `.claude/memory/STATUS.md` if your change affects the overall "what's done" picture.

## 6. Commit and push your branch

```bash
git add .
git commit -m "short description of what you did"
git push origin yourname/short-task-name
```

Then open a Pull Request on GitHub into `main` — don't push directly to `main`. Someone should look at it before it merges.

## 7. Stuck / blocked?

Ping Ashwanth — he's tracking the dependencies between everyone's tasks (see [ashwanth.md](./ashwanth.md)).

---

**The two files that always have the current big picture:** root `CLAUDE.md` → "Current Task Division", and `.claude/memory/STATUS.md`. If your `tasks/` file and those two ever disagree, those two win — update your file to match.
