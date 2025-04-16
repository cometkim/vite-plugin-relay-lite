# vite-plugin-relay-lite

## 0.11.0

### Minor Changes

- 1cfafb5: Add `cwd` option to allow customizing context path of the plugin.
- e6db2f0: Add `shouldTransform` option to allow customizing which paths should be transformed.

## 0.10.0

### Minor Changes

- bc6faa6: Support Vite 6
- b93f375: Ban multiple query/fragment definitions in a single tag.

### Patch Changes

- 3f343b8: Update magic-string

## 0.9.1

### Patch Changes

- 552114d: Fix process handling

## 0.9.0

### Minor Changes

- d386bee: Allow `.config/relay.{js,json}` for config

### Patch Changes

- 10eeb2c: Fix compilation issue on QueryRenderer component

## 0.8.3

### Patch Changes

- d26f447: Fixed config loader

## 0.8.2

### Patch Changes

- 86f4a98: Check file extensions via URL parsing

## 0.8.1

### Patch Changes

- 9006daf: Fix potential mismatch with the Relay compiler on multiple fragments
- 5b9fd24: fixed issue with backslash and corrected typo

## 0.8.0

### Minor Changes

- a29a250: Add experimental feature to omit `graphql` tag imports
- 77e4fd6: export `PluginOptions` type from entry

### Patch Changes

- a3aef3e: Fix potential edge cases

  - Using `/* ... */` notation before the tag
  - Spreading (`...`) the tag result
  - In minified codes

## 0.7.4

### Patch Changes

- 49d47b2: Fix compilation on a valid usage (e.g. <code>createQueryRenderer(Comp, graphql\`...\`)</code>)

## 0.7.3

### Patch Changes

- 0053627: Dedupe import statements for compiled documents

## 0.7.2

### Patch Changes

- 97c270d: Fix tag detection with tabs

## 0.7.1

### Patch Changes

- 86e024d: Fix mixed parsing cases (#94)

  - Fixed #94
  - See also #96

  - (Thanks @eMerzh for reporting the case)

## 0.7.0

### Minor Changes

- 2df8df2: Use Relay compiler compatible printer instead of graphql-js' built-in (Fixed #53)
- 9eb95ec: Upgrade cosmiconfig to v9

  - No longer implicitly traverses parent directories.
  - Allows configuration files to be placed in the `.config` directory.

### Patch Changes

- dd801c5: Fix `graphql` tag detection (best-effort, Fixed #72)

  Is will works well with on middle of expressions
