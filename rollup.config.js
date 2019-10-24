// rollup.config.js
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/runtime/index.js",
  output: [
    { file: __dirname + "/dist/lib.cjs.js", format: "cjs" },
    { file: __dirname + "/dist/lib.esm.js", format: "es" }
  ],
  external: ["react", "zen-observable"],
  plugins: [terser()]
};
