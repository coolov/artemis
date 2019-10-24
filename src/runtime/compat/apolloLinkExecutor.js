import { execute as linkExecute, makePromise } from "apollo-link";

// wraps link.execute
function createExecutor(link) {
  return op => {
    if (op.query.kind !== "Document") {
      throw new TypeError(
        "You are using Apollo Link, but the provided query is not a valid document"
      );
    }

    // not supported!
    delete op.fetchPolicy;
    delete op.partialRefetch;
    delete op.ssr;
    delete op.name;
    delete op.type;
    delete op.kind;

    return linkExecute(link, op);
  };
}

export default function executor(link) {
  const execute = createExecutor(link);
  return {
    // returns observable
    execute,

    // returns promise
    executePromise(op) {
      return makePromise(execute(op));
    }
  };
}
