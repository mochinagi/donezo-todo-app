import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  js.configs.recommended,

  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended"
  ),

  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "out",
      "coverage",
      ".env*",
    ],
  },

  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/consistent-type-imports": "warn",

      "@typescript-eslint/no-explicit-any": [
        "warn",
        { ignoreRestArgs: true },
      ],

      "react-hooks/exhaustive-deps": "warn",

      "react/jsx-key": "warn",

      "no-console": ["warn", { allow: ["warn", "error"] }],

      "no-debugger": "warn",

      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      "import/no-duplicates": "warn",
    },
  },
];