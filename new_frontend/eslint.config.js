import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["public/assets/vendor/**", "node_modules/**", "vendor/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, jQuery: "readonly" },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];
