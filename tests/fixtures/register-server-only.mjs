import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return {
        shortCircuit: true,
        url: "mock-server-only:module",
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock-server-only:module") {
      return {
        format: "module",
        shortCircuit: true,
        source: "export default undefined;",
      };
    }
    return nextLoad(url, context);
  },
});
