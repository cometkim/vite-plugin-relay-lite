# vite-plugin-relay

Vite plugin for more convenient Relay experience.

What this plugin does for you:
- Generates artifacts on code changes
- Transform codes without Babel plugin
- Respects project's Relay config file

With only minimum configuration!

## Installation

```bash
yarn add -D vite vite-plugin-relay-lite

yarn add graphql # peer dependency
```

```ts
// vite.config.ts

import { defineConfig, loadEnv } from 'vite';
import relay from 'vite-plugin-relay-lite';

export default defineConfig(() => {
  return {
    plugins: [
      relay(),
    ],
  };
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

Plugin respects the `eagerEsModules` option in the Relay config, so the default output format is `commonjs`.

However, using CommonJS in Vite projects may require additional config to transpile, and it's not recommended to use. Consider to set `eagerEsModules` to `true` in your Relay config, or set `module: 'esmodule'` in plugin options as you require.

## Acknowledgements

The compilation has ported from [esbuild-plugin-relay](https://github.com/smartvokat/esbuild-plugin-relay), which was originally introduced from [a gist by Samuel Cormier-Iijima](https://gist.github.com/sciyoshi/34e5865f2523848f0d60b4cdd49382ee)

## LICENSE

MIT
