import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";

const isProd = process.env.NODE_ENV === "production";

const plugins = [
  tailwindcss(),

  postcssPresetEnv({
    stage: 3,
    features: {
      "nesting-rules": true,
    },
  }),

  autoprefixer(),
];

if (isProd) {
  plugins.push(
    cssnano({
      preset: [
        "default",
        {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          zindex: false,
        },
      ],
    })
  );
}

export default {
  plugins,
};