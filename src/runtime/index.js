/**
 * ARTEMIS PUBLIC API
 */

export { createClient } from "./client";
export { useQuery, ArtemisProvider } from "./react-api";
export { gql } from "./tag";
export { executor } from "./link";

/**
 * on the dustbin of history:
 * hoc, render-props, decorator
 */
export { withApollo, Query, compose, graphql } from "./react-api-legacy";
