import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const isProd = process.env.NODE_ENV === "production";

const config = {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    ...(isProd
      ? [
        cssnano({
          preset: "default",
        }),
      ]
      : []),
  ],
};

export default config;