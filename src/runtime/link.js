import Observable from "zen-observable";

async function fetchJSON(url, opts) {
  opts.headers["Content-Type"] = "application/json";
  let res = await fetch(url, opts);
  return res.json();
}

function queryGQL(options, operation) {
  return fetchJSON(options.uri, {
    method: "POST",
    ...options.fetchOptions,
    headers: options.headers,
    body: JSON.stringify({
      variables: operation.variables,
      query: operation.query,
      operationName: operation.name
    })
  });
}

function createExecutor(options) {
  return op =>
    new Observable(observer => {
      queryGQL(options, op).then(res => {
        observer.next(res);
        observer.complete();
      });

      // cancel somehow?
      return () => {};
    });
}

export function executor(options) {
  const execute = createExecutor(options);
  return { execute };
}
