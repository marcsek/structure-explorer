import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/structure-explorer/",
  build: {
    sourcemap: "inline",
  },
});
