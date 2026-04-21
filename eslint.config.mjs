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
    "plugin:import/recommended",
    "plugin:import/typescript"
  ),

  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/coverage/**",
      "**/.env*",
    ],
  },

  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // 🔥 启用 type-aware lint
      },
    },
  },

  {
    rules: {
      /* ================= TS ================= */

      "@typescript-eslint/no-unused-vars": "off", // 用下面的替代

      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],

      "@typescript-eslint/no-explicit-any": [
        "warn",
        { ignoreRestArgs: true },
      ],

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
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      "import/no-duplicates": "warn",
      "import/no-unresolved": "error",
    },
  },
];