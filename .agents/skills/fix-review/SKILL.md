---
name: fix-review
description: Given a PR number, address actionable reviewer feedback across review summaries, general comments, and inline threads; fix relevant asks, push, and reply in each thread or on the PR.
argument-hint: '<pr-number>'
---

You are resolving reviewer feedback on an existing pull request. `$ARGUMENTS` is the PR number — if missing, ask the user for it before doing anything else.

## 0. Prerequisites

```bash
gh --version
gh auth status
```

If `gh` is missing or unauthenticated, stop and tell the user (see `github-workflow` skill for install/auth instructions).

Resolve identity and repo once, reuse throughout:

```bash
gh api user -q .login                                  # my own GitHub login
gh repo view --json nameWithOwner -q .nameWithOwner     # owner/repo
```

## 1. Check out the PR safely

Run `git status` first. If there is uncommitted work that isn't yours to discard, do not check out over it: work from a separate worktree (`git worktree add ../fix-<pr-number>`, then `gh pr checkout <pr-number>` inside it), or ask the user.

```bash
gh pr checkout <pr-number>
```

## 2. Gather all feedback, chronologically

Pull all three comment sources for the PR — a "change request" can live in any of them:

```bash
gh api repos/{owner}/{repo}/issues/{pr-number}/comments --paginate      # general PR comments
gh api repos/{owner}/{repo}/pulls/{pr-number}/reviews --paginate       # review submissions (body + state)
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments --paginate      # inline review comments (path/line/diff_hunk)
```

Merge entries by `created_at`/`submitted_at`. Group inline comments with their replies using `in_reply_to_id`, and check whether each thread is resolved (GitHub GraphQL exposes `reviewThreads.isResolved`). Keep your own replies as context, but do not treat them as reviewer asks. Paginate all sources; a newer summary does not replace inline threads.

To map REST comments to thread state, query GraphQL for each thread's top-level
comment ID. Paginate the query if `hasNextPage` is true, using `endCursor` as
the next `$cursor`; an outdated thread is not necessarily resolved:

```bash
gh api graphql -f query='
  query($owner:String!, $repo:String!, $pr:Int!, $cursor:String) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$pr) {
        reviewThreads(first:100, after:$cursor) {
          nodes {
            isResolved
            isOutdated
            comments(first:1) { nodes { databaseId } }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }' -F owner=<owner> -F repo=<repo> -F pr=<pr-number>
```

## 3. Identify all feedback to address

- Read every unresolved, actionable inline thread from another reviewer, including comments on older commits. Check its replies and the current code before treating it as outstanding.
- Read review bodies and general PR comments for concrete asks. Use the latest actionable comment as the complete checklist **only if it explicitly summarizes all points**. Otherwise include earlier, independent asks too.
- Group duplicate asks so each fix is implemented once, but keep track of every thread that needs an answer. Skip resolved, superseded, or already addressed asks only after verifying their status and current code.

If no actionable feedback exists, tell the user and stop — do not invent work.

## 4. Evaluate relevance before touching anything

A comment may bundle several distinct asks — treat each one separately. For each:

- Read the referenced code (inline comments carry `path` + `line`/`diff_hunk` — read the current state of that file, not just the diff hunk, since the PR may have moved on).
- Judge it against this project's conventions (`AGENTS.md`) and the actual current code — not against how easy it is to apply.
- If an ask is ambiguous, conflicts with a documented convention, requires a product/design call, or its intent doesn't survive contact with the current code, ask the user instead of guessing while continuing independent asks. Never silently skip an ask without recording why.

## 5. Fix what's relevant

Apply only the asks that passed evaluation, following `AGENTS.md` conventions (thin controllers, `ControllerService` responses, `gc_owner` ownership and `test/customSQL.js` indexes for SQL, Swagger kept in sync, tests for every change). Run `npm run lint` and the affected tests (see `AGENTS.md` → Testing) before committing.

## 6. Commit and push

Conventional commit, scope required:

```bash
git add <files>
git commit -m "<type>(<scope>): <description> (#<issue>)"
git push
```

Keep it in one commit unless the fixes are clearly unrelated to each other.

## 7. Reply where each ask was made

Write in English (project convention). For each inline thread, reply with what changed or why the ask was not applied. Reply to the **top-level comment ID**, even when the latest message is a reply, using a JSON file containing `{"body": "<reply>"}`:

```bash
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments/{top-level-comment-id}/replies \
  --method POST --input reply.json
```

For a general PR comment or review body, post a normal PR comment that addresses its distinct asks. A summary comment may report the overall result, but it does not replace replies in the relevant inline threads:

```bash
gh pr comment <pr-number> --body-file reply_body.md
```

State each outcome plainly: fixed and how, or not fixed and the specific reason. Clean up temporary reply files afterward.

## Notes

- If none of the asks survives evaluation, commit nothing, skip step 6, and reply where each ask was made with its reason.
- Never touch comments authored by the user themselves, and never treat their own follow-up remarks as something to "resolve."
