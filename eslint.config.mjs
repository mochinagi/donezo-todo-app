import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  js.configs.recommended,

  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ),

  {
    plugins: {
      "unused-imports": unusedImports,
    },
  },

  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/coverage/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/.env*",
    ],
  },

  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  },

  {
    rules: {
      /* ================= TS ================= */

      "@typescript-eslint/no-unused-vars": "off",

      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],

      "@typescript-eslint/no-explicit-any": [
        "warn",
        { ignoreRestArgs: true },
      ],

      "@typescript-eslint/no-floating-promises": "warn",

      "@typescript-eslint/await-thenable": "warn",

      /* ================= UNUSED ================= */

      "unused-imports/no-unused-imports": "warn",

      "unused-imports/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      /* ================= REACT ================= */

      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "warn",

      /* ================= GENERAL ================= */

      "no-console": [
        "warn",
        { allow: ["warn", "error"] },
      ],

      "no-debugger": "warn",

      "eqeqeq": ["warn", "always"],

      /* ================= IMPORT ================= */

      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      "import/no-duplicates": "warn",

      // Next + alias
      "import/no-unresolved": "off",
    },
  },
];