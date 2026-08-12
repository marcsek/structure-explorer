import { defineConfig, mergeConfig, type Plugin, type UserConfig } from "vite";
import baseConfig from "./vite.config.mts";
import { resolve } from "path";
import { copyFile } from "fs/promises";

const DEV_LIB_ROOT = resolve(
  import.meta.dirname,
  "../structure-explorer-dev-lib",
);

function copyPackageJsonPlugin(): Plugin {
  return {
    name: "copy-package-json",
    async closeBundle() {
      await copyFile(
        resolve(import.meta.dirname, "package.json"),
        resolve(DEV_LIB_ROOT, "package.json"),
      );
    },
  };
}

export default defineConfig(
  mergeConfig(baseConfig, {
    mode: "development",

    build: {
      outDir: resolve(DEV_LIB_ROOT, "dist"),
      emptyOutDir: true,
      sourcemap: "inline",
    },

    plugins: [copyPackageJsonPlugin()],
  } as UserConfig),
);
