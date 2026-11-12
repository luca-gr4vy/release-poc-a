# Results

Live observations from running option A (release-please + release PR). One section per check: what was run, raw output, date.

## Repo setting that contradicts the spec (2026-11-12)

- "Allow GitHub Actions to create and approve pull requests" is on (`can_approve_pull_request_reviews: true`), so release-please can open the release PR with `GITHUB_TOKEN`.
- It's one switch: turning it on also lets Actions approve PRs. The spec's hardening says "Actions can't approve PRs". The real setup opens the release PR with an Octo STS token instead and leaves this off.

## A: bootstrap tag (2026-11-12)

- A lightweight `v0.0.0` tag sits on the scaffold commit `e4ddff9`. The manifest says `0.0.0`.
- First run with the release jobs (run 43186389573, commit `52a4928 ci: …`), release-please 17.6.0:
  - `⚠ Could not find releases.` then `❯ looking for tagName: v0.0.0` / `❯ found: v0.0.0 e4ddff9…`
  - `✔ No user facing commits found since e4ddff9… - skipping`
- `decide`: `No release: no v* tag at HEAD, so this is not a release commit`.
- Without the tag, release-please 17.6 has no previous release, and its first release is `1.0.0` whatever the commit types (`initialReleaseVersion()` in `src/strategies/base.ts`).

## A: release PR from two merges (2026-11-12)

- Merged #1 `fix(react): guard missing greet` (`2cf5047`), then #2 `feat(core): add shout` (`8ffdd59`). Both main runs passed, one after the other.
- Result: one release PR, #3 `chore(main): release 0.1.0`, branch `release-please--branches--main`, label `autorelease: pending`.
- It changes `.release-please-manifest.json`, the root `CHANGELOG.md` (new), both `package.json` versions and `packages/version.txt`, all to `0.1.0`. Nothing under `packages/internal`.
- Changelog and PR body list `**core:** add shout` under Features and `**react:** guard missing greet` under Bug Fixes, linked to the PRs and commits.

## A: CI on the release PR (2026-11-12)

- Right after release-please opened #3, the PR showed 0 checks.
- But two runs did exist on its head `4e35eea`, triggered by `github-actions[bot]` at 08:54:34Z: `ci` (43186821074) and `pr-title` (43186821102), each with 0 jobs. They turned to `failure` when the PR was closed.
  - Likely cause, not confirmed: they were waiting for approval, since this public repo asks first-time contributors for approval, and the bot is one. To confirm on the next release-PR update.
- Closed and reopened #3 with a personal token (`gh pr close` / `gh pr reopen`). New runs by `luca-gr4vy`: `ci`, `scan` and `pr-title` all `success`. The release jobs are skipped on PRs. Merge state `CLEAN`.

## A: first release, 0.1.0 (2026-11-12)

- Merged release PR #3 at 09:46:15Z → commit `80514f1 chore(main): release 0.1.0 (#3)`. Run 43194404032, all green:

  | Job | Time (UTC) |
  | --- | --- |
  | `ci` / `scan` | 09:46:20–09:46:34 |
  | `release-please` | 09:46:36–09:46:45 |
  | `release-pack` | 09:46:48–09:46:59 |
  | `release-stage` | 09:47:04–09:47:33 |

- `release-please`: `✔ Creating 1 releases for pull #3`, then swapped the label `autorelease: pending` → `autorelease: tagged`. The tag `v0.1.0` is a lightweight ref on `80514f1`, created up front because of `force-tag-creation`.
- `release-pack`: `decide` found the tag at HEAD with no published Release and wrote `{ version: '0.1.0', pr: 3, distTag: 'latest', tag: true }`. Both tarballs contain `CHANGELOG.md`, `index.js` and `package.json`.
- `release-stage`:
  - `v0.1.0 already claimed by this commit, resuming`
  - `✅ Staged package @luca-gr4vy/release-poc-a@0.1.0` (5.0 s), `…-a-react@0.1.0` (4.4 s)
  - Then it published release-please's draft: `draft=false immutable=true`, published 09:47:29Z, notes = release-please's changelog section.
  - Then it commented on #3 with the approval steps.
- Merge to staged: about 80 s.
- release-please's own "Created releases" comment on #3 links to the draft URL (`…/releases/tag/untagged-d474e40d493fb4ae053c`). That link returns 404 once the draft is published. The approval comment that follows is the one to use.

## A: re-run after a successful release (2026-11-12)

- `gh run rerun 43194404032` (attempt 2): all green, `release-stage` skipped.
- `release-please`: `✔ No commits for path: packages, skipping`.
- `decide`: `No release: v0.1.0 is already released`.

## A: approval (2026-11-12)

- The user approved core, then react, on npmjs.com with 2FA.
- `npm view @luca-gr4vy/release-poc-a-react@0.1.0 dependencies dist-tags` → `{"@luca-gr4vy/release-poc-a":"^0.1.0"}`, `latest: 0.1.0`. Core: `latest: 0.1.0`.

## A: what doesn't release (2026-11-12)

- Merged #4 `chore(core): tidy greet` (touches `packages/core/index.js`) and #5 `fix: correct internal flag` (touches only `packages/internal/index.js`). Each main run passed, and no release PR was opened.
- release-please, in each of the three runs (`d53821d`, `f1623d8`, `35c7f70`): `✔ Splitting 3 commits by path`, `❯ commits: 2`, `✔ No user facing commits found since 80514f1… - skipping`.
  - The `fix:` in #5 would release if it counted, so `exclude-paths: ["packages/internal"]` dropped it. The `chore` never counts.
  - Even the first run (`d53821d`, the docs commit) already saw all three commits: release-please reads main's current HEAD through the API, not the run's own commit.
- #6, titled `Update thing`: `pr-title` failed with `No release type found in pull request title "Update thing". Add a prefix to indicate what kind of release this pull request corresponds to.` Closed without merging.
