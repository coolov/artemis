import React from "react";
import { useQuery, useArtemisClient } from "./react-api";

// https://www.apollographql.com/docs/react/api/react-hoc/#graphqlquery-configcomponent
// graphql(query, [config])(component)
// 1. query
// 2. config
//      options: {} || props =>
//      name:     https://www.apollographql.com/docs/react/api/react-hoc/#configname
export function graphql(query, config = {}) {
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
export function compose() {}

// https://www.apollographql.com/docs/react/api/react-apollo/#withApollo
// withApollo(component)
export function withApollo(ComposedComponent) {
  const client = {
    query: async () => {
      throw new Error("Fail!");
    }
  };
  return props => React.createElement({ ...props, client });
}

// render props api ugh!!!
export function Query(props) {
  const loading = true;
  const error = null;
  const data = null;
  const res = props.children(loading, error, data);
  console.log("res:", res);
  return null;
}
