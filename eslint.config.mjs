import { defineConfig, globalIgnores } from "eslint/config";
import jest from "eslint-plugin-jest";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import eslintjs from "@eslint/js";
import github from "eslint-plugin-github";

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
      jest,
      github
    },

    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.jest,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
      },

      parser: babelParser,
      ecmaVersion: 2023,
      sourceType: "module",

      parserOptions: {
        requireConfigFile: false,

        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ["jest"]
        }
      }
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