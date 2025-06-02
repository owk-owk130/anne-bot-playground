import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "~/": path.resolve(__dirname)
    }
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./vitest.setup.ts"
  }
});
