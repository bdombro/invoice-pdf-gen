#!/usr/bin/env bun

import { $ } from 'bun';
import * as fs from 'fs';

/** Which semver segment to increment when cutting a release. */
type Bump = 'major' | 'minor' | 'patch';

/** Runs tests, bumps version, updates changelog, builds, commits, tags, and publishes a GitHub release. */
async function main(): Promise<void> {
  const bump = process.argv[2];
  if (bump !== 'major' && bump !== 'minor' && bump !== 'patch') {
    process.stderr.write('Usage: bun scripts/release.ts <major|minor|patch>\n');
    process.exit(1);
  }

  const testResult = await $`just test`.nothrow();
  if (testResult.exitCode !== 0) process.exit(testResult.exitCode);

  const currentVersion = readCurrentVersion();
  const newVersion = applyBump(currentVersion, bump);
  console.log(`Releasing ${currentVersion} → ${newVersion}`);

  updateConfig(newVersion);
  updateChangelog(newVersion);

  const buildResult = await $`just build`.nothrow();
  if (buildResult.exitCode !== 0) process.exit(buildResult.exitCode);

  await commitAndTag(newVersion);
  await createGithubRelease(`v${newVersion}`);

  console.log(`Released v${newVersion}`);
}

/**
 * Applies a semver bump to `current` and returns the new version string.
 * @param current - Current version, e.g. `"1.2.3"`
 * @param bump - Which segment to increment; trailing segments reset to 0
 */
function applyBump(current: string, bump: Bump): string {
  const [major, minor, patch] = current.split('.').map(Number) as [number, number, number];
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Commits all staged changes, creates an annotated tag, and pushes both to origin. */
async function commitAndTag(newVersion: string): Promise<void> {
  await $`git add -A`;
  await $`git commit -m "chore: release v${newVersion}"`;
  await $`git tag v${newVersion}`;
  await $`git push`;
  await $`git push origin v${newVersion}`;
}

/** Creates a GitHub release for `tag` with the compiled binary attached. */
async function createGithubRelease(tag: string): Promise<void> {
  await $`gh release create ${tag} dist/invoice-pdf-gen.js dist/invoice-pdf-gen-macos dist/invoice-pdf-gen-linux --title ${tag} --generate-notes`;
}

/** Reads and returns the version string from `src/config.ts`. Exits on parse failure. */
function readCurrentVersion(): string {
  const content = fs.readFileSync('src/config.ts', 'utf-8');
  const match = content.match(/static readonly version: string = '([^']+)'/);
  if (!match?.[1]) {
    process.stderr.write('Could not find version in src/config.ts\n');
    process.exit(1);
  }
  const version = match[1];
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    process.stderr.write(`Invalid semver in src/config.ts: ${version}\n`);
    process.exit(1);
  }
  return version;
}

/**
 * Inserts `## [newVersion] - YYYY-MM-DD` below `## [Unreleased]` in `CHANGELOG.md`.
 * Existing unreleased entries remain under the new version heading.
 */
function updateChangelog(newVersion: string): void {
  const changelogPath = 'CHANGELOG.md';
  const content = fs.readFileSync(changelogPath, 'utf-8');
  const date = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    changelogPath,
    content.replace(
      /^## \[Unreleased\]/m,
      `## [Unreleased]\n\n## [${newVersion}] - ${date}`,
    ),
  );
}

/** Overwrites the version literal in `src/config.ts` with `newVersion`. */
function updateConfig(newVersion: string): void {
  const configPath = 'src/config.ts';
  const content = fs.readFileSync(configPath, 'utf-8');
  fs.writeFileSync(
    configPath,
    content.replace(
      /static readonly version: string = '[^']+'/,
      `static readonly version: string = '${newVersion}'`,
    ),
  );
}

await main();
