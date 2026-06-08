import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
      phaser3spectorjs: path.resolve(
        __dirname,
        "./test/__mocks__/phaser3spectorjs.js",
      ),
    },
  },
  define: {
    WEBGL_DEBUG: false,
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup/canvas-mock.ts"],
  },
});
