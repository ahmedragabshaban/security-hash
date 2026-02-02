#!/usr/bin/env node
const { copyFileSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../../..');
const outDir = path.join(packageRoot, '.tmp-tests');

rmSync(outDir, { recursive: true, force: true });

const tsc = path.resolve(repoRoot, 'node_modules/.bin/tsc');
const tscArgs = [
  '--outDir',
  outDir,
  '--module',
  'CommonJS',
  '--target',
  'ES2021',
  '--moduleResolution',
  'Node',
  '--esModuleInterop',
  '--skipLibCheck',
  '--typeRoots',
  path.join(packageRoot, 'node_modules/@types'),
  '--types',
  'node',
  '--lib',
  'ES2021,DOM',
  'packages/shared/src/index.ts',
  'apps/web/lib/hibp.ts',
  'apps/web/lib/hibp.test.ts',
  'apps/web/lib/risk.ts',
  'apps/web/lib/risk.test.ts',
];

const compileResult = spawnSync(tsc, tscArgs, { stdio: 'inherit', cwd: repoRoot, shell: false });

if (compileResult.status !== 0) {
  process.exit(compileResult.status ?? 1);
}

const compiledSharedEntry = path.join(outDir, 'packages/shared/src/index.js');
const sharedPackageDir = path.join(outDir, 'node_modules/@security-hash/shared');

mkdirSync(sharedPackageDir, { recursive: true });
writeFileSync(
  path.join(sharedPackageDir, 'package.json'),
  JSON.stringify({ name: '@security-hash/shared', main: './index.js' }, null, 2),
);
copyFileSync(compiledSharedEntry, path.join(sharedPackageDir, 'index.js'));

const testFile = path.join(outDir, 'apps/web/lib/hibp.test.js');
const riskTestFile = path.join(outDir, 'apps/web/lib/risk.test.js');
const testResult = spawnSync('node', ['--test', testFile, riskTestFile], {
  stdio: 'inherit',
  cwd: repoRoot,
  shell: false,
});

process.exit(testResult.status ?? 1);
