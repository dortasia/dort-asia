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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Root-level scratch/test scripts (plain Node.js CJS files)
    "test_*.js",
    "check_deps.js",
    "scratch_palette.js",
  ]),
  // Project-wide rule overrides — loosen rules that need incremental cleanup
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      // React Hooks plugin — downgraded while codebase is incrementally refactored
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      // dangerouslySetInnerHTML + children — downgraded while pages are refactored
      "react/no-danger-with-children": "warn",
      // Unescaped entities in JSX — downgraded, prefer fixing at source
      "react/no-unescaped-entities": "warn",
      // Use Next.js Link component — downgraded for incremental migration
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
]);

export default eslintConfig;
