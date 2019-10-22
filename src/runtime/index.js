/**
 * ARTEMIS PUBLIC API
 */

/**
 * Usage
 * let client = createClient({ link: createLink({ uri: 'http://my-awesom-server.com/graphql' }) })
 * let query = gql`
 *  query ArticleQuery($articleId: String!) {
 *        anyWork(id: $articleId) {
 *           __typename
 *       }
 *   }
 * `
 *
 * let App = (
 *      <ArtemisProvider client={client}>
 *
 *      </ArtemisProvider>
 * )
 *
 *
 *
 */

export { createClient } from "./client";
export { useQuery, ArtemisProvider } from "./react-api";
export { gql } from "./tag";
export { executor } from "./link";

/**
 * for the dustbin of history:
 * hoc, render-props, decorator
 */
export { withApollo, Query, compose, graphql } from "./react-api-legacy";
