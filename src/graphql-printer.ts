import { type ASTNode, visit } from 'graphql';

/**
 * Vendored GraphQL printer
 *
 * This ensure compatibility with generated hash by the Relay compiler.
 * graphql-js' printer is incompatible with Relay's one since v15.4
 *
 * Later Relay team should provide a policy to deal with it.
 *
 * @see https://github.com/cometkim/vite-plugin-relay-lite/issues/53
 * @see https://github.com/facebook/relay/issues/4226
 */
export function print(ast: ASTNode): string {
  return visit<string>(ast, {
    Name: { leave: node => node.value },
    Variable: { leave: node => '$' + node.name },
    Document: { leave: node => join(node.definitions, '\n\n') },
    OperationDefinition: {
      leave(node) {
        const varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
        const prefix = join(
          [
            node.operation,
            join([node.name, varDefs]),
            join(node.directives, ' '),
          ],
          ' ',
        );

        // Anonymous queries with no directives or variable definitions can use
        // the query short form.
        return (prefix === 'query' ? '' : prefix + ' ') + node.selectionSet;
      },
    },
    VariableDefinition: {
      leave: ({ variable, type, defaultValue, directives }) =>
        variable +
        ': ' +
        type +
        wrap(' = ', defaultValue) +
        wrap(' ', join(directives, ' ')),
    },
    SelectionSet: {
      leave: ({ selections }) => block(selections),
    },
    Field: {
      leave: ({ alias, name, arguments: args, directives, selectionSet, }) =>
        join([
          wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'),
          wrap(' ', join(directives, ' ')),
          wrap(' ', selectionSet),
        ]),
    },
    Argument: {
      leave: ({ name, value }) => name + ': ' + value,
    },
    FragmentSpread: {
      leave: ({ name, directives }) =>
        '...' + name + wrap(' ', join(directives, ' ')),
    },
    InlineFragment: {
      leave: ({ typeCondition, directives, selectionSet }) =>
        join(
          [
            '...',
            wrap('on ', typeCondition),
            join(directives, ' '),
            selectionSet,
          ],
          ' ',
        ),
    },
    FragmentDefinition: {
      leave: ({
        name,
        typeCondition,
        variableDefinitions,
        directives,
        selectionSet,
      }) =>
        // Note: fragment variable definitions are experimental and may be changed
        // or removed in the future.
        `fragment ${name}${wrap('(', join(variableDefinitions, ', '), ')')} ` +
        `on ${typeCondition} ${wrap('', join(directives, ' '), ' ')}` +
        selectionSet,
    },
    IntValue: { leave: ({ value }) => value },
    FloatValue: { leave: ({ value }) => value },
    StringValue: {
      leave: ({ value, block: isBlockString }) =>
        isBlockString ? printBlockString(value) : printString(value),
    },
    BooleanValue: { leave: ({ value }) => (value ? 'true' : 'false') },
    NullValue: { leave: () => 'null' },
    EnumValue: { leave: ({ value }) => value },
    ListValue: { leave: ({ values }) => '[' + join(values, ', ') + ']' },
    ObjectValue: { leave: ({ fields }) => '{' + join(fields, ', ') + '}' },
    ObjectField: { leave: ({ name, value }) => name + ': ' + value },
    Directive: {
      leave: ({ name, arguments: args }) =>
        '@' + name + wrap('(', join(args, ', '), ')'),
    },

    NamedType: { leave: ({ name }) => name },
    ListType: { leave: ({ type }) => '[' + type + ']' },
    NonNullType: { leave: ({ type }) => type + '!' },
  });
}

type Maybe<T> = null | undefined | T;

/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print all items together separated by separator if provided
 */
function join(
  maybeArray: Maybe<ReadonlyArray<string | undefined>>,
  separator = '',
): string {
  return maybeArray?.filter((x) => x).join(separator) ?? '';
}

/**
 * Given array, print each item on its own line, wrapped in an indented `{ }` block.
 */
function block(array: Maybe<ReadonlyArray<string | undefined>>): string {
  return wrap('{\n', indent(join(array, '\n')), '\n}');
}

/**
 * If maybeString is not null or empty, then wrap with start and end, otherwise print an empty string.
 */
function wrap(
  start: string,
  maybeString: Maybe<string>,
  end: string = '',
): string {
  return maybeString != null && maybeString !== ''
    ? start + maybeString + end
    : '';
}

function indent(str: string): string {
  return wrap('  ', str.replaceAll('\n', '\n  '));
}

/**
 * Print a block string in the indented block form by adding a leading and
 * trailing blank line. However, if a block string starts with whitespace and is
 * a single-line, adding a leading blank line would strip that whitespace.
 */
function printBlockString(
  value: string,
  options?: { minimize?: boolean },
): string {
  const escapedValue = value.replaceAll('"""', '\\"""');

  // Expand a block string's raw value into independent lines.
  const lines = escapedValue.split(/\r\n|[\n\r]/g);
  const isSingleLine = lines.length === 1;

  // If common indentation is found we can fix some of those cases by adding leading new line
  const forceLeadingNewLine =
    lines.length > 1 &&
    lines
      .slice(1)
      .every((line) => line.length === 0 || isWhiteSpace(line.charCodeAt(0)));

  // Trailing triple quotes just looks confusing but doesn't force trailing new line
  const hasTrailingTripleQuotes = escapedValue.endsWith('\\"""');

  // Trailing quote (single or double) or slash forces trailing new line
  const hasTrailingQuote = value.endsWith('"') && !hasTrailingTripleQuotes;
  const hasTrailingSlash = value.endsWith('\\');
  const forceTrailingNewline = hasTrailingQuote || hasTrailingSlash;

  const printAsMultipleLines =
    !options?.minimize &&
    // add leading and trailing new lines only if it improves readability
    (!isSingleLine ||
      value.length > 70 ||
      forceTrailingNewline ||
      forceLeadingNewLine ||
      hasTrailingTripleQuotes);

  let result = '';

  // Format a multi-line block quote to account for leading space.
  const skipLeadingNewLine = isSingleLine && isWhiteSpace(value.charCodeAt(0));
  if ((printAsMultipleLines && !skipLeadingNewLine) || forceLeadingNewLine) {
    result += '\n';
  }

  result += escapedValue;
  if (printAsMultipleLines || forceTrailingNewline) {
    result += '\n';
  }

  return '"""' + result + '"""';
}

function isWhiteSpace(code: number): boolean {
  return code === 0x0009 || code === 0x0020;
}

/**
 * Prints a string as a GraphQL StringValue literal. Replaces control characters
 * and excluded characters (" U+0022 and \\ U+005C) with escape sequences.
 */
function printString(str: string): string {
  return `"${str.replace(escapedRegExp, escapedReplacer)}"`;
}

// eslint-disable-next-line no-control-regex
const escapedRegExp = /[\x00-\x1f\x22\x5c\x7f-\x9f]/g;

function escapedReplacer(str: string): string {
  return escapeSequences[str.charCodeAt(0)];
}

// prettier-ignore
const escapeSequences = [
  '\\u0000', '\\u0001', '\\u0002', '\\u0003', '\\u0004', '\\u0005', '\\u0006', '\\u0007',
  '\\b',     '\\t',     '\\n',     '\\u000B', '\\f',     '\\r',     '\\u000E', '\\u000F',
  '\\u0010', '\\u0011', '\\u0012', '\\u0013', '\\u0014', '\\u0015', '\\u0016', '\\u0017',
  '\\u0018', '\\u0019', '\\u001A', '\\u001B', '\\u001C', '\\u001D', '\\u001E', '\\u001F',
  '',        '',        '\\"',     '',        '',        '',        '',        '',
  '',        '',        '',        '',        '',        '',        '',        '', // 2F
  '',        '',        '',        '',        '',        '',        '',        '',
  '',        '',        '',        '',        '',        '',        '',        '', // 3F
  '',        '',        '',        '',        '',        '',        '',        '',
  '',        '',        '',        '',        '',        '',        '',        '', // 4F
  '',        '',        '',        '',        '',        '',        '',        '',
  '',        '',        '',        '',        '\\\\',    '',        '',        '', // 5F
  '',        '',        '',        '',        '',        '',        '',        '',
  '',        '',        '',        '',        '',        '',        '',        '', // 6F
  '',        '',        '',        '',        '',        '',        '',        '',
  '',        '',        '',        '',        '',        '',        '',        '\\u007F',
  '\\u0080', '\\u0081', '\\u0082', '\\u0083', '\\u0084', '\\u0085', '\\u0086', '\\u0087',
  '\\u0088', '\\u0089', '\\u008A', '\\u008B', '\\u008C', '\\u008D', '\\u008E', '\\u008F',
  '\\u0090', '\\u0091', '\\u0092', '\\u0093', '\\u0094', '\\u0095', '\\u0096', '\\u0097',
  '\\u0098', '\\u0099', '\\u009A', '\\u009B', '\\u009C', '\\u009D', '\\u009E', '\\u009F',
];
