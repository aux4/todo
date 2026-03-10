import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "index.js",
  output: {
    file: "package/lib/aux4-todo.js",
    format: "es",
    sourcemap: false,
    inlineDynamicImports: true
  },
  external: (id) => {
    // Mark Node.js built-ins as external
    const builtins = [
      "fs", "path", "process", "stream", "zlib", "util", "events",
      "buffer", "string_decoder", "url", "http", "https", "crypto",
      "os", "child_process", "assert", "worker_threads", "module"
    ];
    return builtins.includes(id);
  },
  plugins: [
    resolve({
      preferBuiltins: true,
      exportConditions: ["node"]
    }),
    commonjs({
      ignoreDynamicRequires: true
    }),
    json()
  ],
  onwarn(warning, warn) {
    if (warning.code === "CIRCULAR_DEPENDENCY") return;
    if (warning.code === "EVAL") return;
    warn(warning);
  }
};