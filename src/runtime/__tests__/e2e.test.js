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

  console.log(props);

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
          console.log(props, "query y");
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
