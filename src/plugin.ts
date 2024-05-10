import * as path from 'node:path';

import kleur from 'kleur';
import type { Plugin } from 'vite';
import { cosmiconfigSync, defaultLoaders } from 'cosmiconfig';

import { compile } from './compile.ts';
import { launchProcess } from './codegen.ts';

type AnyObject = Record<string, unknown>;

export type PluginOptions = {
  /**
   * Automatically execute `relay-compiler` command as necessary.
   *
   * @default true
   */
  codegen?: boolean,

  /**
   * Path to the Relay config file.
   * Or pass config object directly to customize behavior.
   *
   * @default Will be searched in the project automatically.
   */
  relayConfig?: string | AnyObject,

  /**
   * Module format on outputs
   *
   * @default follows the `eagerESModules` in the Relay config.
   */
  module?: 'esmodule' | 'commonjs',

  /**
   * (Experimental) omit import statement of the `graphql` tag.
   */
  omitTagImport?: boolean,
};

const configExplorer = cosmiconfigSync('relay', {
  searchStrategy: 'none',
  searchPlaces: [
    'relay.config.js',
    'relay.config.json',
    '.config/relay.config.js',
    '.config/relay.config.json',
    'package.json',
  ],
  loaders: {
    '.json': defaultLoaders['.json'],
    '.js': defaultLoaders['.js'],
  },
});

export default function makePlugin(options: PluginOptions = {}): Plugin {
  const cwd = process.cwd();

  let relayConfig: AnyObject = {};
  let relayConfigPath: string | null = null;
  if (options.relayConfig && typeof options.relayConfig === 'object') {
    relayConfig = options.relayConfig;
  } else {
    try {
      const result = typeof options.relayConfig === 'string'
        ? configExplorer.load(options.relayConfig)
        : configExplorer.search(cwd);
      if (result) {
        relayConfig = result.config;
        relayConfigPath = result.filepath;
      }
    } catch (_err) {
      // config not found
    }
  }

  const sourceDirectory = path.resolve(cwd, (relayConfig['src'] as string) || './src').split(path.sep).join(path.posix.sep);
  const artifactDirectory = relayConfig['artifactDirectory'];
  const codegenCommand = (relayConfig['codegenCommand'] as string) || 'relay-compiler';
  const module = options.module || ((relayConfig['eagerESModules'] || relayConfig['eagerEsModules']) ? 'esmodule' : 'commonjs');
  const omitTagImport = options.omitTagImport ?? false;

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
      if (options.codegen === false) {
        return;
      }

      const willGenerate = (command === 'serve' && mode === 'development') || command === 'build';
      const watch = command === 'serve' || Boolean(build.watch);
      if (willGenerate) {
        await launchProcess({
          codegenCommand,
          relayConfigPath,
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
      const result = compile(id, src, {
        module,
        codegenCommand,
        omitTagImport,
        isDevelopment: env.NODE_ENV !== 'production',
        ...typeof artifactDirectory === 'string' && { artifactDirectory },
      });

      return result;
    },
  };
}
