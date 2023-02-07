import { spawn } from 'node:child_process';
import kleur from 'kleur';

type Options = {
  codegenCommand: string,
  watch: boolean,
};

export async function launchProcess(options: Options): Promise<void> {
  const cmd = options.codegenCommand;
  const args: string[] = [];

  if (options.watch) {
    args.push('--watch');
  }

  const child = spawn(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    windowsHide: false,
  });

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
    await new Promise(resolve => {
      compileOnce = resolve;
    });
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
