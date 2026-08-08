import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const baseDirectory = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Approved editorial media uses governed native-image geometry. Converting
      // it is a separate frontend decision, not an OPS lint migration.
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx,cjs}"],
    rules: {
      // Test doubles intentionally use structural any types to model Prisma
      // transaction surfaces without connecting to a database.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["tests/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["lib/programme/application/programme-presenters.ts"],
    rules: {
      // The compatibility presenter narrows several historical DTO shapes at
      // runtime. Retyping it belongs to the governed Programme workstream.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "lib/casino-builder/bonus-validation.ts",
      "lib/programme/application/programme-claim.service.ts",
      "lib/repositories/affiliate-network.repository.ts",
      "lib/repositories/casino.repository.ts",
    ],
    rules: {
      // These compatibility modules retain type-only aliases/imports that are
      // part of their governed domain shape. OPS-01 does not rewrite them.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["components/programme/ActiveControlProgramme.tsx"],
    linterOptions: {
      // Preserve the existing reviewed native-image directives while the
      // repository-level native-image rule is intentionally disabled.
      reportUnusedDisableDirectives: "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "out/**",
      "public/**",
      "docs/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
];
