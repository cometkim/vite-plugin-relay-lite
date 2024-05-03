import { stripIndent as dedent } from 'common-tags';
import { test, expect } from 'vitest';

import { parse } from 'graphql';
import { print as print15 } from 'graphql-15';
import { print } from './graphql-printer.ts';

test('https://github.com/facebook/relay/issues/4226', () => {
  const ast = parse(dedent`
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
  `);

  expect(print(ast)).toEqual(print15(ast));
});
