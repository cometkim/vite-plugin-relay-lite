import { spawn, type ChildProcess } from 'node:child_process';
import kleur from 'kleur';

type Options = {
  cwd: string,
  codegenCommand: string,
  relayConfigPath: string | null,
  watch: boolean,
};

// Vite calls `configResolved` again on every server restart (config/env change, branch switch...),
// so keep track of the running watchers instead of spawning a new one each time.
const watchers = new Map<string, Promise<unknown>>();
const children = new Set<ChildProcess>();

export function killProcesses(): void {
  for (const child of children) {
    if (!child.pid) continue;
    try {
      if (process.platform === 'win32') {
        child.kill();
      } else {
        // Kill the whole group, relay-compiler's node wrapper doesn't forward signals to the actual binary
        process.kill(-child.pid);
      }
    } catch {
      // already gone
    }
  }
  children.clear();
  watchers.clear();
}

process.once('exit', killProcesses);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
  process.once(signal, () => {
    killProcesses();
    if (process.listenerCount(signal) === 0) {
      process.kill(process.pid, signal);
    }
  });
}

export async function launchProcess(options: Options): Promise<void> {
  const cwd = options.cwd;
  const cmd = options.codegenCommand;
  const key = `${cwd}:${cmd}:${options.relayConfigPath}`;
  const watcher = watchers.get(key);
  if (watcher) {
    // Already up to date, whether we wanted to watch or not
    await watcher;
    return;
  }

  const args: string[] = [];

  if (options.watch) {
    args.push('--watch');
  }

  if (options.relayConfigPath) {
    args.push(options.relayConfigPath);
  }

  const child = spawn(cmd, args, {
    cwd,
    shell: true,
    windowsHide: false,
    // Own process group, so `killProcesses` can kill the whole tree at once.
    // Not on Windows, where it would open a separate console window instead.
    detached: process.platform !== 'win32',
  });
  children.add(child);
  child.on('close', () => children.delete(child));

  let compileOnce = (_value: unknown) => {};

  child.stdout.on('data', (chunk: string) => {
    const prefix = kleur.green(`[${cmd}]`);
    const output = chunk.toString().trimEnd();
    console.log(prefix, output);

    const watchingMessages = [
      'Compilation completed',
      'Watching for changes to graphql',
    ];
    if (options.watch && watchingMessages.some(message => output.includes(message))) {
      compileOnce(true);
    }
  });

  child.stderr.on('data', (chunk: string) => {
    const prefix = kleur.red(`[${cmd}]`);
    const output = chunk.toString().trimEnd();
    console.error(prefix, output);
  });

  if (options.watch) {
    const ready = new Promise((resolve, reject) => {
      compileOnce = resolve;
      child.on('close', code => {
        if (watchers.get(key) === ready) {
          watchers.delete(key);
        }
        reject(new Error(`${cmd} exited with code ${code}`));
      });
    });
    watchers.set(key, ready);
    await ready;
  } else {
    await new Promise((resolve, reject) => {
      child.on('close', code => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }
}
