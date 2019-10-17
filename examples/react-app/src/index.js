import React from "react";
import ReactDOM from "react-dom";
import App from "./app";
import "./styles.css";
import { createClient, ArtemisProvider } from "artemis";
//import createLink from "./createApolloLink";
import createLink from "./createArtemisLink";

const initialData = [
  [
    'ViiArticleQuery{"articleId":"/2019/09/16/health/ilsi-food-policy-india-brazil-china.html"}',
    {
      anyWork: {
        __typename: "Article",
        tone: "NEWS",
        slug: "16SCI-ILSI",
        summary:
          "The International Life Sciences Institute, with branches in 17 countries, is funded by giants of the food and drug industries.",
        headline: {
          default:
            "A Shadowy Industry Group Shapes Food Policy Around the World"
        }
      }
    }
  ]
];

const options = {
  uri: "https://samizdat-graphql.nytimes.com/graphql/v2",
  fetchOptions: {
    credentials: "same-origin"
  },
  headers: {
    "nyt-app-type": "project-vi",
    "nyt-app-version": "0.0.5",
    "nyt-token":
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs+/oUCTBmD/cLdmcecrnBMHiU/pxQCn2DDyaPKUOXxi4p0uUSZQzsuq1pJ1m5z1i0YGPd1U1OeGHAChWtqoxC7bFMCXcwnE1oyui9G1uobgpm1GdhtwkR7ta7akVTcsF8zxiXx7DNXIPd2nIJFH83rmkZueKrC4JVaNzjvD+Z03piLn5bHWU6+w+rA+kyJtGgZNTXKyPh6EC6o5N+rknNMG5+CdTq35p8f99WjFawSvYgP9V64kgckbTbtdJ6YhVP58TnuYgr12urtwnIqWP9KSJ1e5vmgf3tunMqWNm6+AnsqNj8mCLdCuc5cEB74CwUeQcP2HQQmbCddBy2y0mEwIDAQAB"
  }
};

const client = createClient({
  link: createLink(options),
  initialState: initialData
});

const rootElement = document.getElementById("root");
ReactDOM.render(
  <ArtemisProvider client={client}>
    <App />
  </ArtemisProvider>,
  rootElement
);
