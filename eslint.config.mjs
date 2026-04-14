import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  js.configs.recommended,

  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:react-hooks/recommended"
  ),

  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "out",
    ],
  },

  {
    rules: {
      /* -----------------------------
         TypeScript
      ----------------------------- */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/consistent-type-imports": "warn",

      "@typescript-eslint/no-explicit-any": "off", // 可根据你需求改 strict

      /* -----------------------------
         React
      ----------------------------- */
      "react-hooks/exhaustive-deps": "warn",

      /* -----------------------------
         General
      ----------------------------- */
      "no-console": ["warn", { allow: ["warn", "error"] }],

      "no-debugger": "warn",

      /* -----------------------------
         Import（🔥加分项）
      ----------------------------- */
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
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
];

export default eslintConfig;