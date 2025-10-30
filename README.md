# vite-plugin-relay-lite

[![Version on NPM](https://img.shields.io/npm/v/vite-plugin-relay-lite)](https://www.npmjs.com/package/vite-plugin-relay-lite)
[![Downlaods on NPM](https://img.shields.io/npm/dm/vite-plugin-relay-lite)](https://www.npmjs.com/package/vite-plugin-relay-lite)
[![LICENSE - MIT](https://img.shields.io/github/license/cometkim/vite-plugin-relay-lite)](#license)

Vite plugin for more convenient Relay experience. **With no Babel dependencies!**

What this plugin does for you:
- Generates artifacts on code changes
- Transform codes without Babel plugin
- Respects project's Relay config file

> [!WARNING]
> This plugin uses naive RegExp match instead of performing correct parsing for JavaScript.
> So it can fail on syntax that goes beyond the scope of a regular language. (e.g. queries in multiline comments)

## Installation

```bash
yarn add -D vite graphql vite-plugin-relay-lite

# Assumes the project already have relay-compiler and its configuration
```

```ts
// vite.config.ts

import { defineConfig } from 'vite';
import relay from 'vite-plugin-relay-lite';

export default defineConfig({
  plugins: [
    relay(),
  ],
});
```

## Customize Options

### Customize Relay Config

Plugin will automatically load the Relay config file.

You can use custom config file path.

```js
{
  plugins: [
    relay({
      relayConfig: 'path/to/relay.js'
    })
  ]
}
```

Or pass config object.

```js
{
  plugins: [
    relay({
      relayConfig: {
        // ...relay config
      }
    })
  ]
}
```

### ES Module Output

Plugin respects the `eagerEsModules` option in the Relay config, so the default output format is `esmodule`.

The plugin also supports CommonJS outputs with `eagerEsModules` set to `false` or `module: 'esmodule'` in plugin options.
However, using CommonJS in Vite projects may require additional config to transpile, and it's not recommended to use.

### Relay Compiler Integration

Plugin automatically runs `relay-compiler` before transform, so it should be installed in the project.

Or you can set the `codegen` option to `false` to disable it.

```js
{
  plugins: [
    relay({
      codegen: false
    })
  ]
}
```

Plugin respects the `codegenCommand` option in the Relay config, it uses `relay-compiler` if not set.

### (Experimental) Omit `graphql` tag imports

You can set `omitTagImport: true` to omit import/require statements for the `graphql` tag.

```js
{
  plugins: [
    relay({
      omitTagImport: true
    })
  ]
}
```

This might causes the Vite build to fail, allowing early detection of potential transform errors.

## Acknowledgements

The compilation has ported from [esbuild-plugin-relay](https://github.com/smartvokat/esbuild-plugin-relay), which was originally introduced from [a gist by Samuel Cormier-Iijima](https://gist.github.com/sciyoshi/34e5865f2523848f0d60b4cdd49382ee)

## LICENSE

MIT
