import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "cjs",
    inlineDynamicImports: true
  },
  plugins: [
    commonjs(),
    json(),
    nodeResolve({ preferBuiltins: true })
  ]
};
