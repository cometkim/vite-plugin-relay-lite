export type RelayConfig = RelaySingleConfig | RelayMultiProjectConfig;

export type RelaySingleConfig = {
  /**
   * Path to schema
   */
  schema?: string,

  /**
   * Path for the directory where to search for source code
   */
  src?: string,

  /**
   * Path to a directory, where the compiler should write artifacts
   */
  artifactDirectory?: string,

  /**
   * Custom codegen command
   */
  codegenCommand?: string,

  /**
   * Prefer module format for output?
   */
  eagerEsModules?: boolean,
  eagerESModules?: boolean,
};

export type RelayMultiProjectConfig = {
  root?: string,

  sources: Record<string, string>,

  projects: Record<string, RelaySingleConfig>,
};
