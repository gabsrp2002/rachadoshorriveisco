import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportNamespaceSpecifier",
          message: "Wildcard/star imports ('import * as ...') are forbidden. Use named imports instead.",
        },
        {
          selector: "ExportAllDeclaration",
          message: "Wildcard/star exports ('export * from ...') are forbidden. Use named exports instead.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [".*", "./*", "../*", "./**", "../**"],
              message: "Relative imports are forbidden. Use '@/' alias imports instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
