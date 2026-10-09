# Dependency Upgrades

Dependabot opens grouped PRs (`.github/dependabot.yml`). Use this when upgrading by hand or reviewing one of those PRs.

## 1. Discover

```shell
npm outdated
```

Split the output into two buckets:

- **Current < Wanted** — inside the declared range, safe to batch.
- **Wanted < Latest** — a major bump, evaluate one by one.

## 2. Semver-compatible updates

```shell
npm update
npm outdated   # only major bumps should remain
```

## 3. Major bumps, one at a time

- Read the changelog for breaking changes.
- Find every usage: `grep -rn "require('<pkg>')" api config scripts test`.
- `npm ls <pkg>` to see whether other packages share it transitively.
- If usage is small and the API is stable, bump the range in `package.json` and `npm install`.

**Do not upgrade ESLint past v8.** `eslint-config-airbnb-base` has no flat-config support. This is intentional.

## 4. Audit

```shell
npm audit
```

Classify each finding:

- **Actionable** — fixed by a direct upgrade or an override.
- **Not actionable** — deep in a dependency we don't control (for example Sails internals or `fixted`). Write down why it is not exploitable here (static routes, test-only code, …).

## 5. Review `overrides`

`package.json` `overrides` force transitive versions to patch vulnerabilities. For each one, run `npm why <pkg>` and `npm info <parent> dependencies`:

- **Keep it** if a parent's declared range would still resolve to a vulnerable version.
- **Remove it** if every parent now resolves to a safe version on its own.

Known reasons:

- `diff` — mocha's declared range includes a ReDoS-vulnerable major.
- `serialize-javascript` — mocha's declared range lacks the security fixes in v7.
- `lodash`, `istanbul-lib-processinfo > uuid` — added during the May 2026 upgrade without a recorded reason; re-derive one before removing.

When you add an override, put its reason in the commit message.

## 6. Test

```shell
PORT=1338 npm run test > .tmp/test_output.txt 2>&1
tail -80 .tmp/test_output.txt
```

Use a free port if the dev server is running. Rate-limiter tests can hang sockets under load and cascade into property-test timeouts; re-run failures in isolation (`npm run test -- --grep "<name>"`) before blaming the upgrade.

After `npm install`, the user has to restart `npm run dev`; nodemon does not watch `node_modules`.

## 7. Ship

Branch, commit and open the PR with the `github-workflow` skill. Use `chore(deps): …`.
