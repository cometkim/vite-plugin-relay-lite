import * as crypto from 'node:crypto';
import * as path from 'node:path';

import { print, parse, Kind } from 'graphql';

export type CompileOptions = {
  module: 'esmodule' | 'commonjs';
  codegenCommand: string;
  isDevelopment: boolean;
  artifactDirectory?: string;
}

export function compile(
  file: string,
  content: string,
  options: CompileOptions,
): string {
  const imports: string[] = [];

  content = content.replace(/graphql`([\s\S]*?)`/gm, (_match, query) => {
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
            `${id} !== void 0 ? ${id} : (${id} = ${result}, ${id}.hash && ` +
            `${id}.hash !== "${hash}" && console.error("${error}"), ${id})`;
          break;
        }
      }
    }

    return result;
  });

  return [...imports, content].join('\n');
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
