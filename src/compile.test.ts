import * as path from 'node:path';
import { stripIndent as dedent } from 'common-tags';
import { test, expect } from 'vitest';

import { compile } from './compile.ts';

test('compile commonjs', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    const query = graphql\`
      query Test {
        __typename
      }
    \`;
  `;

  const result = compile(
    path.join(basePath, id),
    source,
    {
      module: 'commonjs',
      isDevelopment: false,
      codegenCommand: 'codegen',
    },
  );

  expect(result.code).toMatchInlineSnapshot(
    '"const query = require(\\"./__generated__/Test.graphql\\");"',
  );
});

test('compile commonjs in-development', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    const query = graphql\`
      query Test {
        __typename
      }
    \`;
  `;

  const result = compile(
    path.join(basePath, id),
    source,
    {
      module: 'commonjs',
      isDevelopment: true,
      codegenCommand: 'codegen',
    },
  );

  expect(result.code).toMatchInlineSnapshot(
    '"const query = typeof graphql__f4ce3be5b8e81a99157cd3e378f936b6 === \\"object\\" ? graphql__f4ce3be5b8e81a99157cd3e378f936b6 : (graphql__f4ce3be5b8e81a99157cd3e378f936b6 = require(\\"./__generated__/Test.graphql\\"), graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash && graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash !== \\"f4ce3be5b8e81a99157cd3e378f936b6\\" && console.error(\\"The definition of \'Test\' appears to have changed. Run `codegen` to update the generated files to receive the expected data.\\"), graphql__f4ce3be5b8e81a99157cd3e378f936b6);"',
  );
});

test('compile esmodule', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    const query = graphql\`
      query Test {
        __typename
      }
    \`;
  `;

  const result = compile(
    path.join(basePath, id),
    source,
    {
      module: 'esmodule',
      isDevelopment: false,
      codegenCommand: 'codegen',
    },
  );

  expect(result.code).toMatchInlineSnapshot(
    `
    "import graphql__f4ce3be5b8e81a99157cd3e378f936b6 from \\"./__generated__/Test.graphql\\";
    const query = graphql__f4ce3be5b8e81a99157cd3e378f936b6;"
  `,
  );
});

test('compile esmodule in-development', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    const query = graphql\`
      query Test {
        __typename
      }
    \`;
  `;

  const result = compile(
    path.join(basePath, id),
    source,
    {
      module: 'esmodule',
      isDevelopment: true,
      codegenCommand: 'codegen',
    },
  );

  expect(result.code).toMatchInlineSnapshot(`
    "import graphql__f4ce3be5b8e81a99157cd3e378f936b6 from \\"./__generated__/Test.graphql\\";
    const query = (graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash && graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash !== \\"f4ce3be5b8e81a99157cd3e378f936b6\\" && console.error(\\"The definition of 'Test' appears to have changed. Run \`codegen\` to update the generated files to receive the expected data.\\"), graphql__f4ce3be5b8e81a99157cd3e378f936b6);"
  `);
});

test.each([
  dedent`
    const host = \`\${server}/graphql\`

    const otherTemplate = \`foo\`
  `,
])('false positive test', source => {
  const basePath = '/project';
  const id = '__MODULE__';

  const result = compile(
    path.join(basePath, id),
    source,
    {
      module: 'esmodule',
      isDevelopment: false,
      codegenCommand: 'codegen',
    },
  );

  expect(result.code).toEqual(source);
});

test('comments', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    const query1 = graphql\`
      query Test {
        # This should be compiled
        __typename
      }
    \`;

    // This shouldn't be compiled
    // const query2 = graphql\`
    //   query Test {
    //     __typename
    //   }
    // \`;
  `;

  const result = compile(
    path.join(basePath, id),
    source,
    {
      module: 'commonjs',
      isDevelopment: false,
      codegenCommand: 'codegen',
    },
  );

  expect(result.code).toEqual(dedent`
    const query1 = require("./__generated__/Test.graphql");

    // This shouldn't be compiled
    // const query2 = graphql\`
    //   query Test {
    //     __typename
    //   }
    // \`;
  `);
});


