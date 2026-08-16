/* node chrome-extension/portforward.test.js */
const assert = require("assert");
const PortForward = require("./portforward.js");

assert.strictEqual(PortForward.DEFAULTS.resource, "service");
assert.strictEqual(PortForward.DEFAULTS.name, "agentgateway-proxy");
assert.strictEqual(PortForward.DEFAULTS.namespace, "agentgateway-system");
assert.strictEqual(PortForward.DEFAULTS.localPort, 8080);
assert.strictEqual(PortForward.DEFAULTS.remotePort, 80);

assert.strictEqual(PortForward.resourceArg("service"), "svc");
assert.strictEqual(PortForward.resourceArg("Service"), "svc");
assert.strictEqual(PortForward.resourceArg(""), "svc");
assert.strictEqual(PortForward.resourceArg("deployment"), "deploy");
assert.strictEqual(PortForward.resourceArg("deploy"), "deploy");

assert.strictEqual(PortForward.normalizePort("8080", 80), 8080);
assert.strictEqual(PortForward.normalizePort("0", 8080), 8080);
assert.strictEqual(PortForward.normalizePort("65536", 8080), 8080);
assert.strictEqual(PortForward.normalizePort("nope", 80), 80);
assert.strictEqual(PortForward.normalizePort("", 80), 80);

assert.strictEqual(
  PortForward.buildCommand({}),
  "kubectl -n agentgateway-system port-forward svc/agentgateway-proxy 8080:80"
);

assert.strictEqual(
  PortForward.buildCommand({
    resource: "service",
    name: "agentgateway-proxy",
    namespace: "agentgateway-system",
    localPort: 8080,
    remotePort: 80,
  }),
  "kubectl -n agentgateway-system port-forward svc/agentgateway-proxy 8080:80"
);

assert.strictEqual(
  PortForward.buildCommand({
    resource: "deployment",
    name: "agentgateway-proxy",
    namespace: "agentgateway-system",
    localPort: 8080,
    remotePort: 80,
  }),
  "kubectl -n agentgateway-system port-forward deploy/agentgateway-proxy 8080:80"
);

assert.strictEqual(
  PortForward.buildCommand({
    namespace: "demo",
    name: "gw",
    localPort: "9090",
    remotePort: "8080",
    context: "omni-prod",
  }),
  "kubectl --context omni-prod -n demo port-forward svc/gw 9090:8080"
);

assert.strictEqual(
  PortForward.buildCommand({
    context: "ctx with space",
    namespace: "ns-one",
  }),
  "kubectl --context 'ctx with space' -n ns-one port-forward svc/agentgateway-proxy 8080:80"
);

assert.strictEqual(PortForward.localhostOrigin(8080), "http://127.0.0.1:8080");
assert.strictEqual(PortForward.chatEndpoint("9090"), "http://127.0.0.1:9090");
assert.strictEqual(PortForward.apiEndpoint(8080), "http://127.0.0.1:8080");
assert.strictEqual(
  PortForward.mcpEndpoint(8080, true),
  "http://127.0.0.1:8080/mcp"
);
assert.strictEqual(PortForward.mcpEndpoint(8080, false), "http://127.0.0.1:8080");
assert.strictEqual(PortForward.checkUrl(8080, false), "http://127.0.0.1:8080/");
assert.strictEqual(PortForward.checkUrl(8080, true), "http://127.0.0.1:8080/mcp");

assert.strictEqual(
  PortForward.isLocalhostUrl("http://127.0.0.1:8080/v1/chat/completions"),
  true
);
assert.strictEqual(PortForward.isLocalhostUrl("http://localhost:8080/mcp"), true);
assert.strictEqual(
  PortForward.isLocalhostUrl("http://10.0.0.5/v1/chat/completions"),
  false
);

// Chrome popups can have a CommonJS `module` object. The UMD must still
// assign the browser global so popup.js can read PortForward.DEFAULTS.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const sandbox = { self: {}, module: { exports: {} } };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "portforward.js"), "utf8"),
  sandbox
);
assert.ok(sandbox.self.PortForward, "UMD must set self.PortForward when module exists");
assert.strictEqual(sandbox.self.PortForward.DEFAULTS.localPort, 8080);
assert.strictEqual(
  sandbox.module.exports.buildCommand({}),
  "kubectl -n agentgateway-system port-forward svc/agentgateway-proxy 8080:80"
);

console.log("portforward.test.js: ok");
