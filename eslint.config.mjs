import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // React 19 stricter hook rules warnen bei patterns die wir bewusst
  // einsetzen (mount-setState für Hydration, new Date() in Server
  // Components, animation-state). Downgrade auf warn — sichtbar aber nicht
  // build-blocking. Refactor kommt später wenn sich die Rules stabilisieren.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude-Worktree-Artefakte — Shadow-Kopien der Source.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
