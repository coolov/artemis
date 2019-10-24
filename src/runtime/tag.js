// stringify the template tag
function noop(t) {
  for (var o = [t[0]], i = 1, l = arguments.length; i < l; i++)
    o.push(arguments[i], t[i]);
  return o.join("");
}

export function parseQuery(str) {
  const [_, type, name] = str.split(
    /^\s*(fragment|query|mutation) (\w*)( |\()/g
  );

  return { type, name };
}

export function gql(...args) {
  const query = noop(...args);
  const { type, name } = parseQuery(query);

  if (type === "fragment") {
    return query;
  }

  return { type, name, query, kind: "String" };
}
