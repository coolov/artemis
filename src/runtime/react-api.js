/* eslint-disable kyt/no-props-spread */
/* eslint-disable import/prefer-default-export */
/* eslint-disable react/prop-types */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useReducer
} from "react";

import { shallowCompare } from "./util";

const ArtemisContext = createContext();

export function ArtemisProvider(props) {
  const { client } = props;
  return (
    <ArtemisContext.Provider value={client}>
      {props.children}
    </ArtemisContext.Provider>
  );
}

export function useArtemisClient() {
  return useContext(ArtemisContext);
}

// https://overreacted.io/a-complete-guide-to-useeffect/
// https://www.robinwieruch.de/react-hooks-fetch-data
// https://github.com/the-road-to-learn-react/use-data-api/blob/master/src/index.js
function dataFetchReducer(state, action) {
  switch (action.type) {
    case "SET_VARIABLES":
      return {
        ...state,
        loading: true,
        error: false,
        variables: action.payload
      };
    case "FETCH_INIT":
      return { ...state, loading: true, error: false };
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
export function useQuery(query, opts = { variables: {} }) {
  const client = useArtemisClient();
  const [variables, setVariables] = useState(opts.variables);

  // derived state from props
  // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
  const [prevVars, setPrevVars] = useState(opts.variables);
  if (!shallowCompare(opts.variables, prevVars)) {
    setVariables(opts.variables);
    setPrevVars(opts.variables);
  }

  // first hit the cache (runs on init and on state change)
  const op = client.createOperation({ query, variables });
  const initialCacheHit = client.store.get(op);
  const hasData = !!initialCacheHit;
  const isDeferred = false;

  const [state, dispatch] = useReducer(dataFetchReducer, {
    data: initialCacheHit,
    // default loading state to true if there is no initial cache
    // hit and if the query is not defered
    loading: isDeferred ? false : !initialCacheHit,
    isError: false
  });

  useEffect(() => {
    // immdiately start loading the query if it's not in cache
    if (!hasData) {
      dispatch({ type: "FETCH_INIT" });

      const sub = client.execute(op).subscribe({
        next: result => {
          client.store.set(op, result.data);
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
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
  return { ...state, refetch: setVariables, variables };
}

export function useMutation(query, opts) {}
