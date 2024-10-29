import { spawn } from 'node:child_process';
import { defer } from '@cometjs/core';
import kleur from 'kleur';

type Options = {
  codegenCommand: string,
  relayConfigPath: string | null,
  watch: boolean,
  project: string | null,
};

export async function launchProcess(options: Options): Promise<void> {
  const cmd = options.codegenCommand;
  const args: string[] = [];

  if (options.watch) {
    args.push('--watch');
  }

  if (options.project) {
    args.push('--project', options.project);
  }

  if (options.relayConfigPath) {
    args.push(options.relayConfigPath);
  }

  const child = spawn(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    windowsHide: false,
  });

  const deferred = defer();

  child.stdout.on('data', (chunk: string) => {
    const prefix = kleur.green(`[${cmd}]`);
    const output = chunk.toString().trimEnd();
    console.log(prefix, output);

    const watchingMessages = [
      'Compilation completed',
      'Watching for changes to graphql',
    ];
    if (options.watch && watchingMessages.some(message => output.includes(message))) {
      child.kill('SIGTERM');
    }
  });

  child.stderr.on('data', (chunk: string) => {
    const prefix = kleur.red(`[${cmd}]`);
    const output = chunk.toString().trimEnd();
    console.error(prefix, output);
  });

  child.on('close', code => {
    if (code === 0) {
      deferred.resolve(code);
    } else {
      deferred.reject(code);
    }
  });

  await deferred;
}
