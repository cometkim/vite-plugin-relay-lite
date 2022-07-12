import * as path from 'path';
import kleur from 'kleur';
import { type Plugin } from 'vite';
import { cosmiconfigSync, defaultLoaders } from 'cosmiconfig';

import { compile } from './compile';
import { launchProcess } from './codegen';

type AnyObject = Record<string, unknown>;

type Config = {
  codegen?: boolean,
  relayConfig?: string | AnyObject,
  module?: 'esmodule' | 'commonjs',
};

const configExplorer = cosmiconfigSync('relay', {
  searchPlaces: [
    'relay.config.js',
    'relay.config.json',
    'package.json',
  ],
  loaders: {
    '.json': defaultLoaders['.json'],
    '.js': defaultLoaders['.js'],
    noExt: defaultLoaders['.yaml'],
  },
});

export default function makePlugin(config: Config = {}): Plugin {
  const cwd = process.cwd();

  let relayConfig: AnyObject = {};
  if (config.relayConfig && typeof config.relayConfig === 'object') {
    relayConfig = config.relayConfig;
  } else {
    try {
      const result = typeof config.relayConfig === 'string'
        ? configExplorer.load(config.relayConfig)
        : configExplorer.search(cwd);
      if (result) {
        relayConfig = result.config;
      }
    } catch (_err) {
      // config not found
    }
  }

  const sourceDirectory = path.resolve(cwd, (relayConfig['src'] as string) || './src');
  const artifactDirectory = relayConfig['artifactDirectory'];
  const codegenCommand = (relayConfig['codegenCommand'] as string) || 'relay-compiler';
  const module = config.module || (relayConfig['eagerEsModules'] ? 'esmodule' : 'commonjs');

  if (module !== 'esmodule') {
    console.warn(
      kleur.yellow(
        'Using CommonJS may not works.\n' +
        'Consider to set `eagerEsModules` to `true` in your Relay config',
      ),
    );
  }

  return {
    name: 'vite-plugin-relay-lite',
    enforce: 'pre',
    async configResolved({ build, command, mode }) {
      if (!config.codegen) {
        return;
      }

      const willGenerate = (command === 'serve' && mode === 'development') || command === 'build';
      const watch = command === 'serve' || Boolean(build.watch);
      if (willGenerate) {
        await launchProcess({
          codegenCommand,
          watch,
        });
      }
    },
    transform(src, id) {
      if (id.includes('node_modules') || id.includes('.yarn')) {
        return;
      }

      if (!id.startsWith(sourceDirectory)) {
        return;
      }

      if (!/\.(c|m)?(j|t)sx?$/.test(id)) {
        return;
      }

      if (!src.includes('graphql`')) {
        return;
      }

      // avoid pre-compilation
      const env = process.env;

      const code = compile(id, src, {
        module,
        codegenCommand,
        isDevelopment: env.NODE_ENV !== 'production',
        ...typeof artifactDirectory === 'string' && { artifactDirectory },
      });

      return { code };
    },
  };
}
