import { getCacheKey, createStore } from "../client";

const op = { name: "CoolQuery", variables: { data: "rules" } };
const data = { oh: "well" };

it("creates a cache key", () => {
  const key = getCacheKey(op);
  expect(key).toEqual(`CoolQuery{"data":"rules"}`);
});

it("reads and writes to the store", () => {
  const store = createStore();
  store.set(op, data);
  expect(store.get(op)).toEqual(data);
});

it("dehydrates and hydrates", () => {
  const oldStore = createStore();
  oldStore.set(op, data);
  const newStore = createStore(oldStore.extract());
  expect(newStore.get(op)).toEqual(data);
});
