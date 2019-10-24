# artemis

experimental gql client

### usage

```javascript
import {
  createClient,
  gql,
  createLink,
  useQuery,
  ArtemisProvider
} from 'artemis';

let client = createClient({
  link: createLink({ uri: "http://my-awesom-server.com/graphql" })
});
let query = gql`
  query Article($articleId: String!) {
    article(id: $articleId) {
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

  return <data>{data.article.headline}</div>
};

let App = <ArtemisProvider client={client}></ArtemisProvider>;
```

### roadmap
