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

  const dupeFragment = gql`
    fragment CoolerFragment {
      ...CoolFragment
    }
    ${fragment}
  `;

  const query = gql`
    query Arrrgh {
      ...CoolFragment
      ...CoolerFragment
    }

    ${fragment}
    ${dupeFragment}
  `;

  expect(query.name).toEqual("Arrrgh");
  expect(query.type).toEqual("query");
  expect(query.kind).toEqual("String");

  // it should dedupde fragments
  expect(query.query.match(/fragment CoolFragment/g).length).toEqual(1);
});
