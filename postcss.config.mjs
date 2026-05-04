import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";

const env = process.env.NODE_ENV ?? "development";
const isProd = env === "production";

const basePlugins = [
  tailwindcss(),

  postcssPresetEnv({
    stage: 3,
    autoprefixer: false,
    features: {
      "nesting-rules": true,
      "custom-properties": false,
    },
  }),

  autoprefixer({
    flexbox: "no-2009",
  }),
];

const prodPlugins = [
  cssnano({
    preset: [
      "default",
      {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        colormin: true,
        calc: true,
        zindex: false,
      },
    ],
  }),
];

export default {
  plugins: isProd ? [...basePlugins, ...prodPlugins] : basePlugins,
};