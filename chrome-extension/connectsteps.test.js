/* node chrome-extension/connectsteps.test.js */
const assert = require("assert");
const ConnectSteps = require("./connectsteps.js");

function states(result) {
  return result.steps.map((step) => step.state);
}

// --- methods -----------------------------------------------------------

const methods = ConnectSteps.methods();
assert.deepStrictEqual(
  methods.map((m) => m.id),
  ["proxy", "manual", "omni"],
  "proxy leads because it works for every cluster"
);
assert.ok(
  methods.every((m) => m.label && m.blurb),
  "every method card needs a label and a one-line blurb"
);

// --- kubectl proxy -----------------------------------------------------

let result = ConnectSteps.build({ source: "proxy", proxyPort: 8001 });
assert.strictEqual(result.steps.length, 3);
assert.deepStrictEqual(result.steps.map((s) => s.key), [
  "context",
  "run",
  "test",
]);
// Context is optional (blank means current-context), so step 1 starts satisfied
// and the user is pointed straight at the command they have to run.
assert.deepStrictEqual(states(result), ["done", "current", "pending"]);

result = ConnectSteps.build({ source: "proxy", proxyPort: 8001, connected: true });
assert.deepStrictEqual(states(result), ["done", "done", "done"]);

// The command shown must match what the user has to paste.
result = ConnectSteps.build({ source: "proxy", proxyPort: 9000, proxyContext: "maniak-goose" });
assert.strictEqual(
  result.steps[1].command,
  "kubectl proxy --port=9000 --context=maniak-goose"
);
result = ConnectSteps.build({ source: "proxy", proxyPort: 8001 });
assert.strictEqual(result.steps[1].command, "kubectl proxy --port=8001");

// --- manual ------------------------------------------------------------

result = ConnectSteps.build({ source: "manual" });
assert.deepStrictEqual(result.steps.map((s) => s.key), ["type", "creds", "test"]);
assert.deepStrictEqual(states(result), ["done", "current", "pending"]);

// Both halves of the credential are required before the step is satisfied.
result = ConnectSteps.build({ source: "manual", apiServer: "https://k8s:443" });
assert.deepStrictEqual(states(result), ["done", "current", "pending"]);
result = ConnectSteps.build({
  source: "manual",
  apiServer: "https://k8s:443",
  token: "abc",
});
assert.deepStrictEqual(states(result), ["done", "done", "current"]);

// --- omni --------------------------------------------------------------

result = ConnectSteps.build({ source: "omni", omniUrl: "https://omni.example" });
assert.deepStrictEqual(result.steps.map((s) => s.key), ["url", "kubeconfig", "test"]);
assert.deepStrictEqual(states(result), ["done", "current", "pending"]);

// A pasted kubeconfig only counts once a context with a token is selected.
result = ConnectSteps.build({
  source: "omni",
  omniUrl: "https://omni.example",
  hasKubeconfigToken: true,
});
assert.deepStrictEqual(states(result), ["done", "done", "current"]);

result = ConnectSteps.build({ source: "omni" });
assert.deepStrictEqual(states(result), ["current", "pending", "pending"]);

// --- errors ------------------------------------------------------------

// A failed test marks the test step, not the setup steps - the credentials
// are wrong, not the flow.
result = ConnectSteps.build({
  source: "manual",
  apiServer: "https://k8s:443",
  token: "abc",
  error: "HTTP 401",
});
assert.deepStrictEqual(states(result), ["done", "done", "error"]);
assert.strictEqual(result.steps[2].detail, "HTTP 401");

// Connected wins over a stale error.
result = ConnectSteps.build({
  source: "manual",
  apiServer: "https://k8s:443",
  token: "abc",
  error: "HTTP 401",
  connected: true,
});
assert.deepStrictEqual(states(result), ["done", "done", "done"]);

// --- unknown source falls back rather than throwing ---------------------

result = ConnectSteps.build({ source: "nonsense" });
assert.strictEqual(result.source, "manual");
assert.strictEqual(result.steps.length, 3);

// Numbering is 1-based and contiguous for every method.
for (const id of ["proxy", "manual", "omni"]) {
  const built = ConnectSteps.build({ source: id });
  assert.deepStrictEqual(
    built.steps.map((s) => s.n),
    [1, 2, 3],
    `${id} steps are numbered 1..3`
  );
}

console.log("connectsteps.test.js passed");
