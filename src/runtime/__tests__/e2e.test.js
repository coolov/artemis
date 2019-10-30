import React from "react";
import {
  createClient,
  gql,
  createLink,
  useQuery,
  ArtemisProvider,
  graphql,
  Query
} from "../";
import { render, unmountComponentAtNode } from "react-dom";
import ReactDOMServer from "react-dom/server";

import { act } from "react-dom/test-utils";
import { exportAllDeclaration } from "@babel/types";

// mock link
const response = op => ({
  data: {
    anyWork: {
      headline: op.variables.articleId
    }
  }
});
const link = fn => {
  return {
    // observable based api
    execute: op => {
      return {
        subscribe(api) {
          fn(op);
          api.next(response(op));
          return { unsubscribe: () => {} };
        }
      };
    },
    executePromise: op => Promise.resolve(response(op))
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

let mutation = gql`
  mutation ArticleMutation($articleId) {
    anywork {
      headline
    }
`;

function ButtonAndHeadline(props) {
  let { data, loading, refetch } = props;

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
}

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

it("Fetches data & re-fetches data using hooks api", () => {
  let renderCounter = jest.fn();
  let executeSpy = jest.fn();

  let client = createClient({ link: link(executeSpy) });

  let App = () => {
    let props = useQuery(q, {
      variables: { articleId: "hola" }
    });

    renderCounter(props);

    return <ButtonAndHeadline {...props} />;
  };

  act(() => {
    render(
      <ArtemisProvider client={client}>
        <App />
      </ArtemisProvider>,
      container
    );
  });

  // initial fetch
  expect(executeSpy.mock.calls).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();
  expect(document.querySelector("#headline").textContent).toBe("hola");

  // refetch
  executeSpy.mockClear();
  renderCounter.mockClear();
  act(() => {
    document
      .querySelector("#button")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(executeSpy.mock.calls).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();
  expect(document.querySelector("#headline").textContent).toBe("hello");
});

it("Renders to string using hooks api", async () => {
  let renderCounter = jest.fn();
  let executeSpy = jest.fn();
  let client = createClient({ link: link(executeSpy) });

  await client.load({ query: q, variables: { articleId: "hola" } });

  let App = () => {
    let props = useQuery(q, {
      variables: { articleId: "hola" }
    });

    renderCounter(props);

    return <ButtonAndHeadline {...props} />;
  };

  let str = ReactDOMServer.renderToString(
    <ArtemisProvider client={client}>
      <App />
    </ArtemisProvider>
  );

  expect(str).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();
});

it("Fetches data & re-fetches data using legacy hoc", () => {
  let renderCounter = jest.fn();
  let executeSpy = jest.fn();

  let client = createClient({ link: link(executeSpy) });

  const Component = props => {
    renderCounter(props);
    return <ButtonAndHeadline {...props.data} data={props.data} />;
  };

  const App = graphql(q, { variables: { articleId: "hola" } })(Component);

  act(() => {
    render(
      <ArtemisProvider client={client}>
        <App />
      </ArtemisProvider>,
      container
    );
  });

  expect(executeSpy.mock.calls).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();

  // refetch
  executeSpy.mockClear();
  renderCounter.mockClear();
  act(() => {
    document
      .querySelector("#button")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(executeSpy.mock.calls).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();
});

it("Fetches data & re-fetches data using the render props api", () => {
  let renderCounter = jest.fn();
  let executeSpy = jest.fn();

  let client = createClient({ link: link(executeSpy) });

  const App = props => {
    return (
      <Query query={q} variables={{ articleId: "hola" }}>
        {props => {
          renderCounter(props);
          return <ButtonAndHeadline {...props} data={props.data} />;
        }}
      </Query>
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

  expect(executeSpy.mock.calls).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();

  // refetch
  executeSpy.mockClear();
  renderCounter.mockClear();
  act(() => {
    document
      .querySelector("#button")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(executeSpy.mock.calls).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();
});

it("mutates data using legacy hoc", () => {
  let renderCounter = jest.fn();
  let executeSpy = jest.fn();

  let client = createClient({ link: link(executeSpy) });

  const Component = props => {
    renderCounter(props);
    return null;
  };

  const App = graphql(mutation, { variables: { articleId: "hola" } })(
    Component
  );

  act(() => {
    render(
      <ArtemisProvider client={client}>
        <App />
      </ArtemisProvider>,
      container
    );
  });

  expect(executeSpy.mock.calls).toMatchSnapshot();
  expect(renderCounter.mock.calls).toMatchSnapshot();
});

// TODO: ADD A REFETCH THAT HITS THE CACHE!
