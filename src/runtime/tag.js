export function parseQuery(str) {
  const [_, type, name] = str.split(
    /^\s*(fragment|query|mutation) (\w*)( |\()/g
  );

  return { type, name };
}

// this is to flatten the nested fragments
// todo: optimize this
// https://medium.com/dailyjs/functional-js-with-es6-recursive-patterns-b7d0813ef9e3
function flatten([x, ...xs]) {
  if (typeof x === "undefined") {
    return [];
  }

  if (Array.isArray(x)) {
    return [...flatten(x), ...flatten(xs)];
  }

  return [x, ...flatten(xs)];
}

export function gql(strings, ...values) {
  let literal = strings[0];

  // validate that all references to fragments are
  // at the end of the query. if anything else than
  // references follows the query, throw!
  for (let i = 1; i < strings.length; i++) {
    // match any whitespace
    if (strings[i].match(/^\s+$/) === null) {
      // todo: improve this error message!
      throw new Error("Expected Whitespace!");
    }
  }

  const { type, name } = parseQuery(literal);

  if (type === "fragment") {
    // builds a tree of nested fragments
    return [literal, values];
  }

  // flatten the fragments, then deupe them
  const fragmentSet = new Set(flatten(values));

  const query = literal + " " + Array.from(fragmentSet).join(" ");

  return { type, name, query, kind: "String" };
}
