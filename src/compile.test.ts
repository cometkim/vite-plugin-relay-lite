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
    `"const query = require("./__generated__/Test.graphql");"`,
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
    `"const query = typeof graphql__f4ce3be5b8e81a99157cd3e378f936b6 === "object" ? graphql__f4ce3be5b8e81a99157cd3e378f936b6 : (graphql__f4ce3be5b8e81a99157cd3e378f936b6 = require("./__generated__/Test.graphql"), graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash && graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash !== "f4ce3be5b8e81a99157cd3e378f936b6" && console.error("The definition of 'Test' appears to have changed. Run \`codegen\` to update the generated files to receive the expected data."), graphql__f4ce3be5b8e81a99157cd3e378f936b6);"`,
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
    "import graphql__f4ce3be5b8e81a99157cd3e378f936b6 from "./__generated__/Test.graphql";
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
    "import graphql__f4ce3be5b8e81a99157cd3e378f936b6 from "./__generated__/Test.graphql";
    const query = (graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash && graphql__f4ce3be5b8e81a99157cd3e378f936b6.hash !== "f4ce3be5b8e81a99157cd3e378f936b6" && console.error("The definition of 'Test' appears to have changed. Run \`codegen\` to update the generated files to receive the expected data."), graphql__f4ce3be5b8e81a99157cd3e378f936b6);"
  `);
});

test('mixed case', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    import external from 'x/y';

    const host = \`\${host}/graphql\`;

    graphql\`
      query Test {
        # This should be compiled
        __typename
      }
    \`;

    useFragment(graphql\`
      fragment TestFragment on Query {
        # This should be compiled
        __typename
      }
    \`, props.query);

    const data = useFragment(
      graphql\`
        fragment TestFragment on Query {
          # This should be compiled
          __typename
        }
      \`,
      props.query,
    );

    // leading comment
    const testQuery = graphql\`
      query Test {
        # This should be compiled
        __typename
      }
    \`;

    const conditionalQuery = condition ? graphql\`
      query TestTruthy {
        __typename
      }
    \` : graphql\`
      query TestFalsy {
        __typename
      }
    \`;

    // Commented query
    // This shouldn't be compiled
    //
    // const testQuery = graphql\`
    //   query Test {
    //     # This should be compiled
    //     __typename
    //   }
    // \`;
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

  expect(result.code).toMatchInlineSnapshot(`
    "import graphql__f4ce3be5b8e81a99157cd3e378f936b6 from "./__generated__/Test.graphql";
    import graphql__be4d44055d9f79bc8ffc68b6e8277222 from "./__generated__/TestFragment.graphql";
    import graphql__be4d44055d9f79bc8ffc68b6e8277222 from "./__generated__/TestFragment.graphql";
    import graphql__f4ce3be5b8e81a99157cd3e378f936b6 from "./__generated__/Test.graphql";
    import graphql__37866396c946bd011298fc64841dcb46 from "./__generated__/TestTruthy.graphql";
    import graphql__60fd06bd826b4b4bd4d4bb065b9f6e73 from "./__generated__/TestFalsy.graphql";
    import external from 'x/y';

    const host = \`\${host}/graphql\`;

    graphql__f4ce3be5b8e81a99157cd3e378f936b6;

    useFragment(graphql__be4d44055d9f79bc8ffc68b6e8277222, props.query);

    const data = useFragment(
      graphql__be4d44055d9f79bc8ffc68b6e8277222,
      props.query,
    );

    // leading comment
    const testQuery = graphql__f4ce3be5b8e81a99157cd3e378f936b6;

    const conditionalQuery = condition ? graphql__37866396c946bd011298fc64841dcb46 : graphql__60fd06bd826b4b4bd4d4bb065b9f6e73;

    // Commented query
    // This shouldn't be compiled
    //
    // const testQuery = graphql\`
    //   query Test {
    //     # This should be compiled
    //     __typename
    //   }
    // \`;"
  `);
});


test('https://github.com/cometkim/vite-plugin-relay-lite/issues/53', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
const query = graphql\`
	query MentionSelectQuery {
		me {
			mention(
				query: ""
				storyId: ""
				groups: false
				users: false
				teams: false
				exclude: []
			) {
				__typename
			}
		}
	}
\``;

  const result = compile(
    path.join(basePath, id),
    source,
    {
      module: 'esmodule',
      isDevelopment: false,
      codegenCommand: 'codegen',
    },
  );

  expect(result.code).toMatchInlineSnapshot(`
    "import graphql__3742279b5e660168bd0c416c594e14c7 from "./__generated__/MentionSelectQuery.graphql";
    const query = graphql__3742279b5e660168bd0c416c594e14c7"
  `);
});

test('https://github.com/facebook/relay/issues/4226', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    const data = useFragment(
      graphql\`
        fragment SellingProductListFragmentContainer_store_representActiveProducts on Store
          @argumentDefinitions(
            count: { type: "Int", defaultValue: 10 }
            cursor: { type: "ID" }
            filter: { type: "ProductFilter", defaultValue: { statuses: [ACTIVE], representStatus: ACTIVE } }
          )
          @refetchable(queryName: "SellingProductListFragmentContatinerRepresentActiveProducts") {
            representActiveProducts: products(first: $count, after: $cursor, filter: $filter)
              @connection(key: "SellingProductListFragmentContainer_store_representActiveProducts") {
              edges {
                node {
                  _id
                }
              }
            }
          }
      \`,
      props.store,
    );
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

  expect(result.code).toMatchInlineSnapshot(`
    "import graphql__377c0c6e599b36af97db2c55671f4c42 from "./__generated__/SellingProductListFragmentContainer_store_representActiveProducts.graphql";
    const data = useFragment(
      graphql__377c0c6e599b36af97db2c55671f4c42,
      props.store,
    );"
  `);
});

test('https://github.com/cometkim/vite-plugin-relay-lite/issues/72', () => {
  const basePath = '/project';
  const id = '__MODULE__';

  const source = dedent`
    const result = useFragment(
      tagOrHashtag.__typename === 'Tag' ? graphql\`
        fragment SearchResult_Tag on Tag {
          facet {
            name
          }
          name
          id
        }
      \` : graphql\`
        fragment SearchResult_Hashtag on Hashtag {
          name
          id
        }
      \`,
      tagOrHashtag,
    );
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

  expect(result.code).toMatchInlineSnapshot(`
    "import graphql__dfaca053239e85e3436a93e14ce47e06 from "./__generated__/SearchResult_Tag.graphql";
    import graphql__07216d96dd965b1cda8ea0c1df38fb2b from "./__generated__/SearchResult_Hashtag.graphql";
    const result = useFragment(
      tagOrHashtag.__typename === 'Tag' ? graphql__dfaca053239e85e3436a93e14ce47e06 : graphql__07216d96dd965b1cda8ea0c1df38fb2b,
      tagOrHashtag,
    );"
  `);
});
