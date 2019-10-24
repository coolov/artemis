import { parseQuery, gql } from "../tag";

it("parses a query", () => {
  const { name, type } = parseQuery(`query Arrrgh { blargh }`);
  expect(name).toEqual("Arrrgh");
  expect(type).toEqual("query");
});

it("parses a mutation", () => {
  const { name, type } = parseQuery(`mutation Arrrgh { blargh }`);
  expect(name).toEqual("Arrrgh");
  expect(type).toEqual("mutation");
});

it("turns a query into an object", () => {
  const fragment = gql`
    fragment CoolFragment on CoolType {
      coolSchool
    }
  `;
  const query = gql`
    query Arrrgh {
      ...CoolFragment
    }

    ${fragment}
  `;

  expect(query.name).toEqual("Arrrgh");
  expect(query.type).toEqual("query");
  expect(query.kind).toEqual("String");
});
