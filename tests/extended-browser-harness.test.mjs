import assert from "node:assert/strict";
import test from "node:test";

import { assertDisposableExtendedBrowserEnvironment } from "../scripts/run-extended-browser-tests.mjs";

const disposable = {
  CI: "true",
  VERCEL_ENV: "",
  DATABASE_URL: "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci",
  DIRECT_URL: "postgresql://sevenbet:sevenbet@localhost:5432/sevenbet_ci",
};

test("extended browser fixture guard accepts only explicit disposable local CI databases", () => {
  assert.doesNotThrow(() => assertDisposableExtendedBrowserEnvironment(disposable));
  assert.throws(() => assertDisposableExtendedBrowserEnvironment({ ...disposable, CI: "false" }), /CI=true/);
  assert.throws(() => assertDisposableExtendedBrowserEnvironment({ ...disposable, VERCEL_ENV: "preview" }), /deployed Vercel/);
  assert.throws(() => assertDisposableExtendedBrowserEnvironment({ ...disposable, DATABASE_URL: "postgresql://user:pass@db.example.com:5432/sevenbet" }), /localhost/);
  assert.throws(() => assertDisposableExtendedBrowserEnvironment({ ...disposable, DIRECT_URL: "postgresql://user:pass@127.0.0.1:54329/sevenbet" }), /_ci/);
});
