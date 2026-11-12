// Decide whether this commit releases. A release commit is a merged release PR:
// release-please has tagged it vX.Y.Z and created a draft Release.
// Runs before `pnpm install`. Writes dist/release.json and the `release` step output.
import { mkdirSync, writeFileSync } from 'node:fs';
import { RELEASE_JSON, setOutput, sh, trySh } from './sh.mjs';

const { GITHUB_REPOSITORY: repo, GITHUB_SHA: sha } = process.env;

const skip = (reason) => {
  console.log(`No release: ${reason}`);
  setOutput('release', 'false');
  process.exit(0);
};

const stableTags = (args) => sh('git', ['tag', '--list', 'v*', ...args]).split('\n').filter((t) => t && !t.includes('-'));

const tag = stableTags(['--points-at', 'HEAD'])[0];
if (!tag) skip('no v* tag at HEAD, so this is not a release commit');
if (tag === 'v0.0.0') skip('v0.0.0 is the bootstrap tag');

// Published Releases only: this endpoint never returns drafts.
if (trySh('gh', ['api', `repos/${repo}/releases/tags/${tag}`, '--jq', '.id']) !== null) {
  skip(`${tag} is already released`);
}

// Old or out-of-order run: HEAD is already contained in a higher release.
const highest = stableTags(['--sort=-v:refname'])[0];
if (highest !== tag && trySh('git', ['merge-base', '--is-ancestor', 'HEAD', highest]) !== null) {
  skip(`HEAD is already contained in ${highest} (stale run)`);
}

const pr = sh('gh', ['api', `repos/${repo}/commits/${sha}/pulls`, '--jq', '.[0].number // empty']);
const release = { version: tag.slice(1), sha, pr: pr ? Number(pr) : null, distTag: 'latest', tag: true };
mkdirSync('dist', { recursive: true });
writeFileSync(RELEASE_JSON, `${JSON.stringify(release, null, 2)}\n`);
console.log('Release:', release);
setOutput('release', 'true');
