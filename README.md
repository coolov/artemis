# artemis

experimental gql client

Usage

```javascript
let client = createClient({
  link: createLink({ uri: "http://my-awesom-server.com/graphql" })
});
let query = gql`
  query ArticleQuery($articleId: String!) {
    anyWork(id: $articleId) {
      headline
    }
  }
`;

let Story = () => {
  let { data, loading, refetch } = useQuery(q, {
    variables: { articleId: "12388277" }
  });

  if (loading) {
    return <div>Loading</div>;
  }

  return <data>{data.anyWork.headline}</div>
};

let App = <ArtemisProvider client={client}></ArtemisProvider>;
```
