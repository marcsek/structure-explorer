import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import prefixWrap from "postcss-prefixwrap";

export default defineConfig({
  plugins: [
    react(),
    dts({ tsconfigPath: resolve(import.meta.dirname, "tsconfig.lib.json") }),
  ],

  css: {
    postcss: {
      plugins: [
        prefixWrap(".structure-explorer", {
          blacklist: ["bootstrap.min.css", "katex.min.css", "index.css"],
          ignoredSelectors: [/\.structure-explorer.modal/],
        }),
      ],
    },
  },

  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es", "umd"],
      name: "StructureExplorer",
      fileName: (format) => `structure-explorer.${format}.js`,
    },

    rollupOptions: {
      external: ["react", "react-dom"],

      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
