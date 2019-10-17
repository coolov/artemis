import React, { useState } from "react";
import { gql, useQuery } from "artemis";

const articleFragment = gql`
  fragment AssembledArticlePage_article on Article {
    url
    sourceId
    section {
      id
      name
      url
      displayName
    }
    subsection {
      id
      name
      url
      displayName
    }
    collections {
      id
      uri
    }
  }
`;

const q = gql`
  query ViiArticleQuery($articleId: String!) {
    anyWork(id: $articleId) {
      __typename
      ...AssembledArticlePage_article
      ... on CreativeWork {
        tone
        slug
        summary
        headline {
          default
        }
      }
    }
  }
  ${articleFragment}
`;

function JSONViewer(props) {
  console.log("render data");
  return <pre>{JSON.stringify(props)}</pre>;
}

function Spinner() {
  console.log("render spinner");
  return <div>Loading...</div>;
}

function Story({ articleId }) {
  const { data, loading, refetch, variables } = useQuery(q, {
    variables: { articleId }
  });

  return (
    <div>
      <button
        onClick={() =>
          refetch({
            articleId:
              "/2019/10/14/world/europe/syria-us-assad-kurds-turkey.html"
          })
        }
      >
        INNER /2019/10/14/world/europe/syria-us-assad-kurds-turkey.html
      </button>
      {loading ? <Spinner /> : <JSONViewer variables={variables} data={data} />}
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState(
    "/2019/09/16/health/ilsi-food-policy-india-brazil-china.html"
  );
  return (
    <div className="App">
      <button
        onClick={() => setUrl("/2019/09/16/us/politics/trump-saudi-tweet.html")}
      >
        /2019/09/16/us/politics/trump-saudi-tweet.html
      </button>
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <Story articleId={url} />
    </div>
  );
}
