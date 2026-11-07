import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { killProcesses, launchProcess } from './codegen.ts';

// Behaves like relay-compiler: a node wrapper spawning the real compiler, without forwarding signals
const fakeCompiler = `
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const watch = process.argv.includes('--watch');

if (process.env.CHILD) {
  fs.appendFileSync('pids', process.pid + '\\n');
  console.log(watch ? 'Watching for changes to graphql' : 'Compilation completed');
  if (watch) setInterval(() => {}, 1000);
} else {
  spawn(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, CHILD: '1' } })
    .on('exit', code => process.exit(code));
}
`;

let cwd: string;

const launch = (watch: boolean) => launchProcess({
  cwd,
  codegenCommand: `"${process.execPath}" compiler.cjs`,
  relayConfigPath: null,
  watch,
});

const compilerPids = () => fs.readFileSync(path.join(cwd, 'pids'), 'utf8').trim().split('\n').map(Number);

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-lite-'));
  fs.writeFileSync(path.join(cwd, 'compiler.cjs'), fakeCompiler);
});

afterEach(() => {
  killProcesses();
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('reuses the running watcher', async () => {
  await Promise.all([launch(true), launch(true)]);
  await launch(true);
  await launch(false);

  expect(compilerPids()).toHaveLength(1);
});

test.skipIf(process.platform === 'win32')('kills the actual compiler, not only the wrapper', async () => {
  await launch(true);
  const [pid] = compilerPids();

  killProcesses();

  await expect.poll(() => isAlive(pid!)).toBe(false);
});
