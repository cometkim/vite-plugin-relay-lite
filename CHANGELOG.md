# vite-plugin-relay-lite

## 0.7.0

### Minor Changes

- 2df8df2: Use Relay compiler compatible printer instead of graphql-js' built-in (Fixed #53)
- 9eb95ec: Upgrade cosmiconfig to v9

  - No longer implicitly traverses parent directories.
  - Allows configuration files to be placed in the `.config` directory.

### Patch Changes

- dd801c5: Fix `graphql` tag detection (best-effort, Fixed #72)

  Is will works well with on middle of expressions
