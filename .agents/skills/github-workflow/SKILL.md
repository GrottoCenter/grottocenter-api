---
name: github-workflow
description: Grottocenter API GitHub conventions — conventional commits with scope, branch from an updated develop, open a PR using the project template, and stack PRs when one depends on another.
---

## Prerequisites

Verify that `gh` is installed and authenticated:

```bash
gh --version
gh auth status
```

- If `gh` is **not installed**, stop and tell the user:

  > `gh` CLI is required. Install it from https://cli.github.com or via:
  >
  > - macOS: `brew install gh`
  > - Windows: `winget install --id GitHub.cli`
  > - Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

- If several accounts are logged in, check that the active one can write to `GrottoCenter/grottocenter-api` before any write (a wrong account fails with `422 User is blocked` or a permission error). Ask the user which account to use rather than guessing.
- If `gh` is **not authenticated**, stop and tell the user to run `gh auth login`.
- Do not print remote URLs (`git remote -v` may expose an embedded token). Use `gh repo view` to identify the repository.

## Language

All generated content (commit messages, PR titles and bodies, comments) is written in English.

## Commits

Format: `type(scope): description (#issue)`

- Types (enforced by commitlint): `feat`, `fix`, `tech`, `refactor`, `improvement`, `chore`, `docs`, `style`, `test`, `revert`.
- The scope is **required** and camelCase or PascalCase: `massif`, `rateLimit`, `geoloc`, `db`, `api`.
- End the subject with the issue reference when there is one.

Example: `fix(massif): clear all t_massif references before permanent delete (#1846)`

Never pass `--no-verify`. If a hook fails, fix the cause.

Keep tests in the same commit as the code they cover. Several commits per PR are fine when each one stands on its own (a refactor, then the feature).

## Branching

Branch from an updated `develop`:

```bash
git fetch origin
git checkout -b <type>/<issue>-<slug> origin/develop
```

Examples: `fix/1857-health-503`, `feat/1863-coordinates-filter-criteria`, `chore/superset-role-grants` (no issue).

If the working tree holds someone else's uncommitted work, do not switch over it: use `git worktree add` or ask the user.

## Pull Request

**1. Write the body.** Read `.github/pull_request_template.md`, fill in every section, and save it to `pr_body.md` at the repo root.

- Link the issue in **What** (`Closes #1234`).
- In **🧪 Testing**, write each check as a checklist item: `- [x]` only for checks that were actually run and passed, `- [ ]` for anything pending or not run.
- If the PR includes a SQL migration, App Service setting or anything else production needs applied by hand, add a **Deployment** note saying what and in which order. Merging into `develop` deploys immediately.
- Delete the **📸 Previews** section when there is nothing visual to show.

**2. Show and confirm.** Display the title and the actual content of `pr_body.md`. Wait for explicit approval unless the user has already authorized pushing and creating the PR.

**3. Push and create:**

```bash
git push -u origin <branch-name>
gh pr create --repo GrottoCenter/grottocenter-api --base develop \
  --title "<type(scope): description>" --body-file pr_body.md --assignee "@me"
```

Request reviewers the user asks for, one per command, skipping the PR author (GitHub rejects self-review requests):

```bash
gh pr edit <pr-number> --repo GrottoCenter/grottocenter-api --add-reviewer <login>
```

Verify with `gh pr view <pr-number> --json reviewRequests,assignees,url`.

**4. Clean up:** `rm pr_body.md`.

## Stacked PRs

When PR B cannot work without PR A, base B on A's branch instead of `develop`:

```bash
git checkout -b <type>/<issue>-second <type>/<issue>-first
gh pr create --base <type>/<issue>-first ...
```

- **Stack only when B would break `develop` on its own** — could someone merge B first and still get a working `npm run dev:clean` and a green suite? If yes, base it on `develop`. The typical trigger is SQL referencing an object an earlier PR creates.
- **Prefer a base branch over a "merge #A first" note.** GitHub enforces the base; prose is advisory.
- **Keep the file sets disjoint** so each diff shows only its own changes.
- **Test each branch alone.** A combined working tree passing proves neither branch passes by itself.
- **Cross-reference both bodies** ("Part 1 of 2 for #1234"), and say on B which branch it is stacked on and why.
- **After A merges**, GitHub retargets B to `develop`. PRs here usually land by rebase, which rewrites A's commits, so B still carries the old copies. Rebase it and push:

  ```bash
  git fetch origin
  git rebase --onto origin/develop <A-branch> <B-branch>
  git push --force-with-lease
  ```

  Do the same onto A's branch whenever A changes during review.

Worked example: [#1830](https://github.com/GrottoCenter/grottocenter-api/pull/1830) → [#1831](https://github.com/GrottoCenter/grottocenter-api/pull/1831).

## Multi-line arguments

For any multi-line or heavily quoted content (PR bodies, comments, review payloads), write it to a file at the repo root, pass it with `--body-file` / `--input`, and delete the file afterwards.
