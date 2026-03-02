// This file is intentionally excluded from tsconfig.json to avoid the
// dual-vite type conflict (vitest@4 bundles its own vite internally).
// Vitest discovers this file automatically at runtime.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
  },
});
