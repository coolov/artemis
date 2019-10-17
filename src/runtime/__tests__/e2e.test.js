import React from "react";
import { createClient, gql, createLink, useQuery, ArtemisProvider } from "../";
import renderer from "react-test-renderer";
//import { render, fireEvent, getByTestId } from "react-testing-library";

// mock link
const link = () => {
  return {
    // observable based api
    execute: () => {
      return {
        subscribe() {
          return {
            next() {
              return {};
            }
          };
        },
        unsubscribe() {}
      };
    }
  };
};

it("sets up React", () => {
  let q = gql`
    query ArticleQuery($articleId: String!) {
      anyWork(id: $articleId) {
        headline
      }
    }
  `;

  let client = createClient({ link });

  let App = () => {
    let { data, loading, refetch } = useQuery(q, {
      variables: { articleId: "12388277" }
    });

    return null;
  };

  let root = renderer.create(
    React.createElement(
      ArtemisProvider,
      {
        client
      },
      React.createElement(App, null)
    )
  );
});

//   let query = gql`
//     query ArticleQuery($articleId: String!) {
//       anyWork(id: $articleId) {
//         headline
//       }
//     }
//   `;

//   let Story = () => {
//     let { data, loading, refetch } = useQuery(q, {
//       variables: { articleId: "12388277" }
//     });

//     if (loading) {
//       return <div>Loading</div>;
//     }

//     return <data>{data.anyWork.headline}</div>
//   };
