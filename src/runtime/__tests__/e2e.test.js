import React from "react";
import { createClient, gql, createLink, useQuery, ArtemisProvider } from "../";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { exportAllDeclaration } from "@babel/types";

// mock link
const link = fn => {
  return {
    // observable based api
    execute: op => {
      return {
        subscribe(api) {
          fn(op);
          api.next({ data: { anyWork: { headline: op.variables.articleId } } });
          return { unsubscribe: () => {} };
        }
      };
    }
  };
};

// mock query
let q = gql`
  query ArticleQuery($articleId: String!) {
    anyWork(id: $articleId) {
      headline
    }
  }
`;

let container = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

it("Fetches data + re-fetches data", () => {
  let renderCounter = jest.fn();
  let executeSpy = jest.fn();

  let client = createClient({ link: link(executeSpy) });

  let App = () => {
    let { data, loading, refetch } = useQuery(q, {
      variables: { articleId: "hola" }
    });

    renderCounter();

    if (loading) {
      return <b>Loading</b>;
    }

    return (
      <div>
        <h1 id="headline">{data.anyWork.headline}</h1>{" "}
        <button
          onClick={() => {
            refetch({ articleId: "hello" });
          }}
          id="button"
        ></button>
      </div>
    );
  };

  act(() => {
    render(
      <ArtemisProvider client={client}>
        <App />
      </ArtemisProvider>,
      container
    );
  });

  const op = executeSpy.mock.calls[0][0];

  // initial fetch
  expect(executeSpy.mock.calls.length).toBe(1);
  expect(op.name).toBe("ArticleQuery");
  expect(op.type).toBe("query");
  expect(op.kind).toBe("String");
  expect(op.variables.articleId).toBe("hola");
  expect(renderCounter.mock.calls.length).toBe(2);
  expect(document.querySelector("#headline").textContent).toBe("hola");

  const button = document.querySelector("#button");

  // refetch
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const op2 = executeSpy.mock.calls[1][0];
  expect(executeSpy.mock.calls.length).toBe(2);
  expect(op2.variables.articleId).toBe("hello");
  expect(renderCounter.mock.calls.length).toBe(4);
  expect(document.querySelector("#headline").textContent).toBe("hello");
});