import React, { createContext, useContext, useState, useRef, useMemo, useReducer, useEffect } from 'react';
import Observable from 'zen-observable';

function getCacheKey(op) {
  if (!op.name) {
    throw new Error("The provided operation is missing a name property!");
  }
  return op.name + JSON.stringify(op.variables);
}

function createStore(initialState) {
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

function createOperation({ query, variables = {} }) {
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

function createClient({ link, initialState, ssrMode = false }) {
  const store = createStore(initialState);
  const { execute } = link;

  return {
    execute,
    store,
    ssrMode,
    load: ({ query, variables }) => {
      const op = createOperation({ query, variables });
      return link.executePromise(op).then(res => {
        if (res.data) {
          store.set(op, res.data);
        }
      });
    },
    createOperation
  };
}

/* eslint-disable kyt/no-props-spread */

const ArtemisContext = createContext();

function ArtemisProvider(props) {
  const { client } = props;
  return React.createElement(
    ArtemisContext.Provider,
    {
      value: client
    },
    props.children
  );
}

function useArtemisClient() {
  return useContext(ArtemisContext);
}

// https://overreacted.io/a-complete-guide-to-useeffect/
// https://www.robinwieruch.de/react-hooks-fetch-data
// https://github.com/the-road-to-learn-react/use-data-api/blob/master/src/index.js
function dataFetchReducer(state, action) {
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state, loading: action.payload, error: false };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        error: false,
        data: action.payload
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        loading: false,
        error: true
      };
    default:
      throw new Error();
  }
}

// 1. query	  A GraphQL query document parsed into an AST by graphql-tag.
// 2. options:
//    variables	                    An object containing all of the variables your query needs to execute
//    notifyOnNetworkStatusChange	  Whether updates to the network status or network error should re-render your component. Defaults to false.
//    fetchPolicy	                  FetchPolicy	How you want your component to interact with the Apollo cache. Defaults to "cache-first".
//    errorPolicy	                  How you want your component to handle network and GraphQL errors. Defaults to "none", which means we treat GraphQL errors as runtime errors.
//    ssr	                          Pass in false to skip your query during server-side rendering.
//    displayName	                  The name of your component to be displayed in React DevTools. Defaults to 'Query'.
//    skip	                        If skip is true, the query will be skipped entirely. Not available with useLazyQuery.
//    onCompleted	                  A callback executed once your query successfully completes.
//    onError                       A callback executed in the event of an error.
//    context	                      Shared context between your component and your network interface (Apollo Link). Useful for setting headers from props or sending information to the request function of Apollo Boost.
//    client	                      ApolloClient	An ApolloClient instance. By default useQuery / Query uses the client passed down via context, but a different client can be passed in.
// returns:
// { data, loading, error, variables, networkStatus, refetch, fetchMore, updateQuery }
function useQuery(query, opts = { variables: {} }) {
  // todo, assert in tests that ignoring variables doesn't blow up the test
  opts.variables = opts.variables || {};

  const client = useArtemisClient();
  const [variables, setVariables] = useState(opts.variables);

  // use to hold an `update data` function provided by `fetchMore`
  const updateQueryRef = useRef(null);

  // derived state from props
  // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
  // const [prevVars, setPrevVars] = useState(opts.variables);

  // if (!shallowCompare(opts.variables, prevVars)) {
  //   setVariables(opts.variables);
  //   setPrevVars(opts.variables);
  // }

  const op = useMemo(() => client.createOperation({ query, variables }), [
    query,
    variables
  ]);

  // first hit the cache (runs on init and on state change)
  const initialCacheHit = client.store.get(op);
  const hasData = !!initialCacheHit;

  const [state, dispatch] = useReducer(dataFetchReducer, {
    data: initialCacheHit,
    // default loading state to true if there is no initial cache
    // hit and if the query is not defered
    loading:  !initialCacheHit,
    error: false
  });

  useEffect(() => {
    const isUpdate = typeof updateQueryRef.current === "function";

    // immdiately start loading the query if it's not in cache
    if (!hasData) {
      dispatch({ type: "FETCH_INIT", payload: !isUpdate }); // < --- payload here is a true false value, clean this up

      const sub = client.execute(op).subscribe({
        next: result => {
          client.store.set(op, result.data);

          // if it's availible, use the updateQuery function from `fetchMore`
          // to merge in more data
          const payload = isUpdate
            ? updateQueryRef.current(state.data, {
                fetchMoreResult: result.data
              })
            : result.data;

          updateQueryRef.current = null;
          dispatch({ type: "FETCH_SUCCESS", payload });
        },
        error: error => {
          dispatch({ type: "FETCH_FAILURE" });
        }
      });

      return function cleanup() {
        sub.unsubscribe();
      };
    }
  }, [client, op, hasData]);

  // what happens after set variables?
  return {
    ...state,
    refetch: setVariables,
    variables,
    fetchMore: ({ variables, updateQuery }) => {
      setVariables(variables);
      updateQueryRef.current = updateQuery;
    }
  };
}

function parseQuery(str) {
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

function gql(strings, ...values) {
  let literal = strings[0];

  // validate that all references to fragments are
  // at the end of the query. if anything else than
  // references follows the query, throw!
  // (this is probably not needed)
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

async function fetchJSON(url, opts) {
  opts.headers["Content-Type"] = "application/json";
  let res = await fetch(url, opts);
  return res.json();
}

function queryGQL(options, operation) {
  return fetchJSON(options.uri, {
    method: "POST",
    ...options.fetchOptions,
    headers: options.headers,
    body: JSON.stringify({
      variables: operation.variables,
      query: operation.query,
      operationName: operation.name
    })
  });
}

function createExecutor(options) {
  return op =>
    new Observable(observer => {
      queryGQL(options, op).then(res => {
        observer.next(res);
        observer.complete();
      });

      // cancel somehow?
      return () => {};
    });
}

function executor(options) {
  const execute = createExecutor(options);
  return { execute };
}

// https://www.apollographql.com/docs/react/api/react-hoc/#graphqlquery-configcomponent
// graphql(query, [config])(component)
// 1. query
// 2. config
//      options: {} || props =>
//      name:     https://www.apollographql.com/docs/react/api/react-hoc/#configname
function graphql(query, config = {}) {
  return ComposedComponent => {
    return props => {
      const client = useArtemisClient();

      const defaultOptions = { ssr: true, variables: {} };
      const options =
        // eslint-disable-next-line no-nested-ternary
        typeof config.options === "function"
          ? { ...defaultOptions, ...config.options(props) }
          : { ...defaultOptions, ...(config.options || {}) };

      // for now, return early on mutations
      // todo: implement them!!!
      if (client.createOperation({ query }).type === "mutation") {
        return React.createElement(ComposedComponent, {
          ...props,
          mutate: () => {}
        });
      }

      if (client.ssrMode && !options.ssr) {
        return null;
      }

      const { data, loading, error, refetch } = useQuery(query, options);

      return React.createElement(ComposedComponent, {
        ...props,
        data: { loading, error, refetch, ...(data || {}) }
      });
    };
  };
}

// uses recompose
// https://github.com/acdlite/recompose/blob/master/docs/API.md#compose
function compose() {}

// https://www.apollographql.com/docs/react/api/react-apollo/#withApollo
// withApollo(component)
function withApollo(ComposedComponent) {
  const client = {
    query: async () => {
      throw new Error("Fail!");
    }
  };
  return props => React.createElement(ComposedComponent, { ...props, client });
}

// render props api ugh!!!
// <Query query={GET_DOGS}>{({ loading, error, data }) => { return <MyComponent/> }}</Query>
function Query({ query, variables, children }) {
  return children(useQuery(query, { variables }));
}

export { ArtemisProvider, Query, compose, createClient, executor, gql, graphql, useQuery, withApollo };
