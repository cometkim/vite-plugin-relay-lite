import * as crypto from 'node:crypto';
import * as path from 'node:path';
import MagicString, { type SourceMap } from 'magic-string';

import { parse, Kind } from 'graphql';
import { print } from './graphql-printer.ts';

export type CompileOptions = {
  module: 'esmodule' | 'commonjs';
  codegenCommand: string;
  isDevelopment: boolean;
  artifactDirectory?: string;
};

export type CompileResult = {
  code: string,
  map: SourceMap,
};

export function compile(
  file: string,
  source: string,
  options: CompileOptions,
): CompileResult {
  const content = new MagicString(source);
  const imports: string[] = [];

  /**
   * Tested on https://regex101.com/r/qfrOft/8
   *
   * groups
   * - 1st `prefix`
   *   - `^` - Tag can appears at the beginning of the source
   *   - `[\=\?\:\|\&\,\;\(\[\}\.\>]` - Or right after any of JS' exp/terminal token
   *   - `\*\/` - Or right after /*...*\/ comment
   * - 2rd `blank`
   *   - `\s*` - blank characters (spaces, tabs, lf, etc) before the `graphql` tag
   * - 3rd `query`
   *   - `[\s\S]*?` - multiline text (lazy) inside of the `graphql` tag
   */
  const pattern = /(?<prefix>^|[\=\?\:\|\&\,\;\(\[\}\.\>]|\*\/)(?<blank>\s*)graphql`(?<query>[\s\S]*?)`/gm;
  content.replace(pattern, (match, prefix: string, blank: string, query: string) => {
    // Guess if it is in JS comment lines
    //
    // Equvilant to:
    // (query.split('\n').some(line => line.trimStart().startsWith('//')))
    //
    // But 1x ~ 3x faster
    if (/^\s*(?!#)\/\//gm.test(query)) {
      return match;
    }

    const ast = parse(query);

    if (ast.definitions.length === 0) {
      throw new Error('Unexpected empty graphql tag.');
    }

    const definition = ast.definitions[0];
    if (
      definition.kind !== Kind.FRAGMENT_DEFINITION &&
      definition.kind !== Kind.OPERATION_DEFINITION
    ) {
      throw new Error(
        'Expected a fragment, mutation, query, or ' +
          'subscription, got `' +
          definition.kind +
          '`.',
      );
    }

    const name = definition.name?.value;
    if (!name) {
      throw new Error('GraphQL operations and fragments must contain names');
    }

    const hash = crypto
      .createHash('md5')
      .update(print(definition), 'utf8')
      .digest('hex');

    const id = `graphql__${hash}`;
    const importFile = `${name}.graphql`;
    const importPath = options.artifactDirectory
      ? getRelativeImportPath(file, importFile, options.artifactDirectory)
      : `./__generated__/${importFile}`;

    let result = id;

    switch (options.module) {
      case 'esmodule': {
        imports.push(`import ${id} from "${importPath}";`);
        break;
      }
      case 'commonjs': {
        result = `require("${importPath}")`;
        break;
      }
    }

    if (options.isDevelopment) {
      const error = getErrorMessage(name, options.codegenCommand);
      switch (options.module) {
        case 'esmodule': {
          result =
            `(${id}.hash && ${id}.hash !== "${hash}" && ` +
            `console.error("${error}"), ${id})`;
          break;
        }
        case 'commonjs': {
          result =
            `typeof ${id} === "object" ? ${id} : (${id} = ${result}, ${id}.hash && ` +
            `${id}.hash !== "${hash}" && console.error("${error}"), ${id})`;
          break;
        }
      }
    }

    return prefix + blank + result;
  });

  content.prepend(
    [...new Set(imports), ''].join('\n'),
  );

  return {
    code: content.toString(),
    map: content.generateMap({ hires: true }),
  };
}

function getErrorMessage(name: string, codegenCommand: string) {
  return (
    `The definition of '${name}' appears to have changed. Run \`${codegenCommand}\` to ` +
    `update the generated files to receive the expected data.`
  );
}

function getRelativeImportPath(
  file: string,
  fileToRequire: string,
  artifactDirectory: string,
): string {
  const relativePath = path.relative(
    path.dirname(file),
    path.resolve(artifactDirectory),
  );

  const relativeReference =
    relativePath.length === 0 || !relativePath.startsWith('.') ? './' : '';

  return relativeReference + path.join(relativePath, fileToRequire);
}
