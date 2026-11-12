// Copy the root CHANGELOG.md into each package (CI workspace only), then pack
// the tarballs into dist/. The release PR already set the versions.
import { copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGES, RELEASE_JSON, sh } from './sh.mjs';

const release = JSON.parse(readFileSync(RELEASE_JSON, 'utf8'));

for (const { name, dir } of PACKAGES) {
  const { version } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  if (version !== release.version) throw new Error(`${name} is at ${version}, but the tag says ${release.version}`);
  copyFileSync('CHANGELOG.md', join(dir, 'CHANGELOG.md'));
}

console.log(sh('pnpm', ['-r', '--filter', './packages/*', 'pack', '--pack-destination', 'dist']));
