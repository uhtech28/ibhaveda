import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore generated/build directories and asset folders containing non-JS files
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "test/**",
      "convex/_generated/**",
      "next-env.d.ts",
      "public/assets/fan-tasy/**",
      "The Fan-tasy Tileset (Free) 1.5.7/**",
      "kenney_sketchdesert/**",
      "public/assets/kenney_sketchdesert/**",
      "public/colorfield-test/**",
      "public/**/*.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
