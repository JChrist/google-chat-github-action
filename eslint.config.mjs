import { defineConfig, globalIgnores } from "eslint/config";
import jest from "eslint-plugin-jest";
import globals from "globals";
import eslintjs from "@eslint/js";

export default defineConfig([
  globalIgnores([
    "!**/*",
    "**/node_modules/*",
    "**/dist/*",
    "**/coverage/*",
    "**/*.json"
  ]),
  eslintjs.configs.recommended,
  {
    plugins: {
      jest
    },

    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.jest,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
      },

      ecmaVersion: 2023,
      sourceType: "module"
    },

    rules: {
      camelcase: "off",
      "eslint-comments/no-use": "off",
      "eslint-comments/no-unused-disable": "off",
      "i18n-text/no-en": "off",
      "import/no-commonjs": "off",
      "import/no-namespace": "off",
      "no-console": "off",
      "no-unused-vars": "off",
      // "prettier/prettier": "error",
      semi: "off"
    }
  }]);
