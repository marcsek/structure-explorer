import { defineConfig, mergeConfig, Plugin, UserConfig } from "vite";
import baseConfig from "./vite.config";
import { resolve } from "path";
import { copyFile } from "fs/promises";

const DEV_LIB_ROOT = resolve(__dirname, "../structure-explorer-dev-lib");

function copyPackageJsonPlugin(): Plugin {
  return {
    name: "copy-package-json",
    async closeBundle() {
      await copyFile(
        resolve(__dirname, "package.json"),
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
