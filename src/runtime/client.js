export function getCacheKey(op) {
  if (!op.name) {
    throw new Error("The provided operation is missing a name property!");
  }
  return op.name + JSON.stringify(op.variables);
}

export function createStore(initialState) {
  const store = new Map(initialState);

  return {
    get: op => {
      const key = getCacheKey(op);
      return store.get(key) || null;
    },
    set: (op, data) => {
      const key = getCacheKey(op);
      store.set(key, data);
    },
    extract: () => {
      return [...store];
    }
  };
}

export function createClient({ link, initialState, ssrMode = false }) {
  const store = createStore(initialState);
  const { execute } = link;

  return {
    execute,
    store,
    ssrMode,
    load: op => {
      return link.executePromise(op).then(res => {
        if (res.data) {
          store.set(op, res.data);
        }
      });
    },
    createOperation({ query, variables = {} }) {
      // query is coming from a gql tag
      if (query.kind === "Document") {
        return {
          name: query.definitions[0].name.value,
          type: query.definitions[0].operation,
          kind: query.kind,
          query,
          variables
        };
      }

      // query is coming from an artemis tag
      if (query.kind === "String") {
        return {
          name: query.name,
          type: query.type,
          kind: query.kind,
          query: query.query,
          variables
        };
      }

      throw new TypeError("Unknown Query!");
    }
  };
}
