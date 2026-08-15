/* node chrome-extension/workshop.test.js */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ctx = {
  DEPLOY_EXAMPLES: { llm: {}, mcp: {}, a2a: {}, api: { policy: { label: "old", yaml: "" } } },
  URL,
  Buffer,
};
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "identity.js"), "utf8"),
  ctx
);
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "workshop.js"), "utf8"),
  ctx
);

const ids = ctx.WORKSHOP_DEMOS.map((demo) => demo.id);
const required = [
  "guardrails",
  "enrichment",
  "token-budget",
  "streaming",
  "embeddings",
  "body-routing",
  "mock-openai",
  "timeouts",
  "openapi-meteo",
  "remote-mcp",
  "mcp-tool-rl",
  "federation",
  "composable",
  "search-mode",
  "code-mode",
  "mcp-jwt-rbac",
  "a2a-task",
  "waf",
  "direct-response",
  "jwt-llm",
  "entra-jwt",
  "keycloak-jwt",
];
for (const id of required) {
  assert.ok(ids.includes(id), `missing workshop demo ${id}`);
}

const hops = {};
for (const demo of ctx.WORKSHOP_DEMOS) {
  hops[demo.id] = demo.hops && demo.hops.gateway;
}
assert.equal(hops.guardrails, "promptGuard");
assert.equal(hops.enrichment, "prompt.prepend");
assert.equal(hops["token-budget"], "rateLimit");
assert.equal(hops["openapi-meteo"], "OpenAPI→REST");
assert.equal(hops.waf, "WAF");
assert.equal(hops["a2a-task"], "A2A task");

const guard = ctx.WORKSHOP_YAML.guardrails;
assert.match(guard, /kind: EnterpriseAgentgatewayPolicy/);
assert.match(guard, /promptGuard:/);
assert.match(guard, /CreditCard/);
assert.match(guard, /statusCode: 403/);
assert.match(guard, /statusCode: 422/);
assert.match(guard, /action: Mask/);

assert.match(ctx.WORKSHOP_YAML.enrichment, /prompt:/);
assert.match(ctx.WORKSHOP_YAML.enrichment, /Return the response in JSON format/);
assert.match(ctx.WORKSHOP_YAML.tokenBudget, /rateLimit:/);
assert.match(ctx.WORKSHOP_YAML.tokenBudget, /tokens: 5/);
assert.match(ctx.WORKSHOP_YAML.openapiMeteo, /protocol: OpenAPI/);
assert.match(ctx.WORKSHOP_YAML.openapiMeteo, /api.open-meteo.com/);
assert.match(ctx.WORKSHOP_YAML.openapiMeteo, /\/mcp-weather/);
assert.match(ctx.WORKSHOP_YAML.waf, /kind: WAFPolicy/);
assert.match(ctx.WORKSHOP_YAML.waf, /entWAF:/);
assert.match(ctx.WORKSHOP_YAML.jwtLlm, /\/openai-jwt/);
assert.match(ctx.WORKSHOP_YAML.mcpJwtRbac, /name: mcp-jwt-backend/);
assert.match(ctx.WORKSHOP_YAML.mcpJwtRbac, /mcp.tool.name == "echo"/);
assert.match(ctx.WORKSHOP_YAML.a2aTask, /gcr.io\/solo-public\/docs\/test-a2a-agent/);
assert.match(ctx.WORKSHOP_YAML.a2aTask, /\/myagent/);
assert.match(ctx.WORKSHOP_YAML.directResponse, /directResponse:/);
assert.match(ctx.WORKSHOP_YAML.federation, /failureMode: FailOpen/);
assert.match(ctx.WORKSHOP_YAML.searchMode, /toolMode: Search/);
assert.match(ctx.WORKSHOP_YAML.codeMode, /toolMode: Code/);
assert.match(ctx.WORKSHOP_YAML.bodyRouting, /phase: PreRouting/);
assert.match(ctx.WORKSHOP_YAML.bodyRouting, /x-gateway-model-name/);
assert.match(ctx.WORKSHOP_YAML.mockOpenai, /llm-d-inference-sim/);

const streaming = ctx.WORKSHOP_DEMOS.find((demo) => demo.id === "streaming");
assert.equal(streaming.yaml, "");

const entraDemo = ctx.WORKSHOP_DEMOS.find((demo) => demo.id === "entra-jwt");
const keycloakDemo = ctx.WORKSHOP_DEMOS.find((demo) => demo.id === "keycloak-jwt");
assert.equal(typeof entraDemo.yaml, "function");
assert.equal(typeof keycloakDemo.yaml, "function");
const entraYaml = entraDemo.yaml({
  ns: "ns1",
  gateway: "gw1",
  tenantId: "tid-1",
});
assert.match(entraYaml, /\/openai-entra/);
assert.match(entraYaml, /entra-jwks/);
const keycloakYaml = keycloakDemo.yaml({
  issuer: "http://10.0.0.5:8080/realms/foo",
});
assert.match(keycloakYaml, /\/openai-keycloak/);
assert.match(keycloakYaml, /jwksPath: realms\/foo\/protocol\/openid-connect\/certs/);

assert.match(ctx.DEPLOY_EXAMPLES.api.policy.yaml, /promptGuard:/);
assert.ok(ctx.WORKSHOP_JWT.length > 80);

console.log("workshop.test.js ok");
