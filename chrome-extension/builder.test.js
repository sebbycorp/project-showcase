/* node chrome-extension/builder.test.js */
const assert = require("assert");
const AgwBuilder = require("./builder.js");

function docsFrom(yaml) {
  return yaml
    .split(/\n---\n/)
    .map((block) => {
      const kind = (block.match(/^kind:\s*(.+)$/m) || [])[1];
      return { kind, yaml: block };
    });
}

function section(yaml, kind) {
  const found = docsFrom(yaml).find((doc) => doc.kind === kind);
  assert.ok(found, `expected ${kind} document`);
  return found.yaml;
}

const healthDefaults = AgwBuilder.HEALTH_DEFAULTS;
assert.strictEqual(
  healthDefaults.unhealthyCondition,
  "response.code >= 500 || response.code == 429"
);

const modelYaml = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "model-failover",
  failover: true,
  name: "model-failover",
  model: "gpt-4o-mini",
  fallbackModel: "gpt-4o, gpt-3.5-turbo",
  secretRef: "openai-secret",
  routePath: "/model",
  gateway: "agentgateway-proxy",
});

assert.match(modelYaml, /kind: EnterpriseAgentgatewayBackend/);
assert.match(modelYaml, /kind: HTTPRoute/);
assert.match(modelYaml, /kind: EnterpriseAgentgatewayPolicy/);
assert.match(modelYaml, /name: model-failover-health/);
assert.match(modelYaml, /unhealthyCondition: "response.code >= 500 \|\| response.code == 429"/);
assert.match(modelYaml, /duration: 10s/);
assert.match(modelYaml, /consecutiveFailures: 1/);
assert.match(modelYaml, /model: gpt-4o-mini/);
assert.match(modelYaml, /model: gpt-4o/);
assert.match(modelYaml, /model: gpt-3.5-turbo/);
assert.match(modelYaml, /name: openai-primary/);
assert.match(modelYaml, /name: openai-fallback/);
assert.match(modelYaml, /name: openai-fallback-2/);
assert.match(modelYaml, /# Health policy is required/);
assert.doesNotMatch(section(modelYaml, "EnterpriseAgentgatewayBackend"), /anthropic:/);

const customHealth = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "model-failover",
  name: "model-failover",
  model: "gpt-4o-mini",
  fallbackModel: "gpt-4o",
  secretRef: "openai-secret",
  routePath: "/model",
  unhealthyCondition: "response.code >= 500",
  evictionDuration: "30s",
  consecutiveFailures: 3,
});
assert.match(customHealth, /unhealthyCondition: "response.code >= 500"/);
assert.match(customHealth, /duration: 30s/);
assert.match(customHealth, /consecutiveFailures: 3/);

const providerYaml = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "provider-failover",
  name: "provider-failover",
  model: "gpt-4o-mini",
  secretRef: "openai-secret",
  fallbackProvider: "claude",
  fallbackModel: "claude-sonnet-4-5",
  fallbackSecretRef: "anthropic-secret",
  routePath: "/model",
  gateway: "agentgateway-proxy",
});
assert.match(providerYaml, /name: openai-primary/);
assert.match(providerYaml, /name: claude-fallback/);
assert.match(providerYaml, /anthropic:\n\s+model: claude-sonnet-4-5/);
assert.match(providerYaml, /name: anthropic-secret/);
assert.match(providerYaml, /name: openai-secret/);
assert.match(providerYaml, /kind: EnterpriseAgentgatewayPolicy/);
assert.match(providerYaml, /name: provider-failover-health/);
assert.match(section(providerYaml, "HTTPRoute"), /kind: EnterpriseAgentgatewayBackend/);

const grokFallback = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "provider-failover",
  name: "provider-failover",
  model: "gpt-4o-mini",
  secretRef: "openai-secret",
  fallbackProvider: "grok",
  fallbackModel: "grok-3",
  fallbackSecretRef: "grok-secret",
  routePath: "/model",
});
assert.match(grokFallback, /host: api.x.ai/);
assert.match(grokFallback, /name: grok-secret/);
assert.match(grokFallback, /name: grok-fallback/);

const parsed = AgwBuilder.fieldsFromLlmResource(
  {
    metadata: { name: "provider-failover", namespace: "agentgateway-system" },
    spec: {
      ai: {
        groups: [
          {
            providers: [
              {
                name: "openai-primary",
                openai: { model: "gpt-4o-mini" },
                policies: { auth: { secretRef: { name: "openai-secret" } } },
              },
            ],
          },
          {
            providers: [
              {
                name: "claude-fallback",
                anthropic: { model: "claude-sonnet-4-5" },
                policies: { auth: { secretRef: { name: "anthropic-secret" } } },
              },
            ],
          },
        ],
      },
    },
  },
  {
    spec: {
      parentRefs: [{ name: "agentgateway-proxy" }],
      rules: [{ matches: [{ path: { value: "/model" } }] }],
    },
  },
  {
    spec: {
      targetRefs: [{ name: "provider-failover" }],
      backend: {
        health: {
          unhealthyCondition: "response.code >= 500",
          eviction: { duration: "30s", consecutiveFailures: 3 },
        },
      },
    },
  }
);
assert.strictEqual(parsed.preset, "provider-failover");
assert.strictEqual(parsed.provider, "openai");
assert.strictEqual(parsed.fallbackProvider, "claude");
assert.strictEqual(parsed.fallbackModel, "claude-sonnet-4-5");
assert.strictEqual(parsed.fallbackSecretRef, "anthropic-secret");
assert.strictEqual(parsed.unhealthyCondition, "response.code >= 500");
assert.strictEqual(parsed.evictionDuration, "30s");
assert.strictEqual(parsed.consecutiveFailures, 3);

const modelFields = AgwBuilder.fieldsFromLlmResource({
  metadata: { name: "model-failover" },
  spec: {
    ai: {
      groups: [
        { providers: [{ openai: { model: "gpt-4o-mini" } }] },
        { providers: [{ openai: { model: "gpt-4o" } }] },
        { providers: [{ openai: { model: "gpt-3.5-turbo" } }] },
      ],
    },
  },
});
assert.strictEqual(modelFields.preset, "model-failover");
assert.strictEqual(modelFields.fallbackModel, "gpt-4o, gpt-3.5-turbo");

assert.strictEqual(AgwBuilder.isFailoverPreset("failover"), true);
assert.strictEqual(AgwBuilder.isFailoverPreset("model-failover"), true);
assert.strictEqual(AgwBuilder.normalizeFailoverPreset("failover"), "model-failover");
assert.deepStrictEqual(AgwBuilder.parseModelList("gpt-4o, gpt-3.5-turbo"), [
  "gpt-4o",
  "gpt-3.5-turbo",
]);

const single = AgwBuilder.generateLlmYaml(AgwBuilder.llmDefaults("openai"));
assert.doesNotMatch(single, /kind: EnterpriseAgentgatewayPolicy/);
assert.match(single, /kind: EnterpriseAgentgatewayBackend/);

assert.ok(AgwBuilder.LLM_CATALOG.some((item) => item.id === "load-balance"));
assert.strictEqual(AgwBuilder.catalogRecipe("streaming").apply, false);

const lb = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "load-balance",
  name: "loadbalanced-backend",
  fallbackProvider: "claude",
  fallbackModel: "claude-3-5-sonnet-latest",
  fallbackSecretRef: "anthropic-secret",
  routePath: "/chat",
});
assert.match(lb, /name: loadbalanced-backend/);
assert.match(lb, /anthropic:/);
assert.doesNotMatch(lb, /kind: EnterpriseAgentgatewayPolicy/);

const routing = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "content-routing",
  gateway: "agentgateway-proxy",
});
assert.match(routing, /phase: PreRouting/);
assert.match(routing, /json\(request.body\)\.model/);
assert.match(routing, /name: x-model/);

const guard = AgwBuilder.generateLlmYaml({
  preset: "prompt-guard",
  name: "openai-prompt-guard",
  targetRoute: "openai",
  regex: "credit card",
  namespace: "agentgateway-system",
});
assert.match(guard, /promptGuard:/);
assert.match(guard, /action: Reject/);
assert.match(guard, /credit card/);

const enrich = AgwBuilder.generateLlmYaml({
  preset: "prompt-enrichment",
  name: "openai-opt",
  targetRoute: "openai",
  prompt: "Parse the unstructured text into CSV format.",
  namespace: "agentgateway-system",
});
assert.match(enrich, /prepend:/);
assert.match(enrich, /role: system/);

const tmpl = AgwBuilder.generateLlmYaml({
  preset: "prompt-template",
  name: "static-prompt-template",
  targetRoute: "openai",
  namespace: "agentgateway-system",
});
assert.match(tmpl, /append:/);

const xform = AgwBuilder.generateLlmYaml({
  preset: "transformation",
  name: "cap-max-tokens",
  targetRoute: "openai",
  namespace: "agentgateway-system",
});
assert.match(xform, /field: max_completion_tokens/);
assert.match(xform, /min\(llmRequest.max_completion_tokens, 10\)/);

const rl = AgwBuilder.generateLlmYaml({
  preset: "rate-limit",
  name: "openai-rate-limit",
  targetRoute: "openai",
  namespace: "agentgateway-system",
  rateLimitCount: 5,
  rateLimitUnit: "MINUTE",
  rateLimitType: "REQUEST",
});
assert.match(rl, /kind: RateLimitConfig/);
assert.match(rl, /entRateLimit:/);

const alias = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "alias",
  aliasName: "fast",
  aliasTarget: "gpt-3.5-turbo",
});
assert.match(alias, /modelAliases:/);
assert.match(alias, /fast: gpt-3.5-turbo/);

const rbac = AgwBuilder.generateLlmYaml({
  preset: "rbac",
  name: "rbac-policy",
  targetRoute: "google",
  headerName: "x-llm",
  headerValue: "gemini",
  namespace: "agentgateway-system",
});
assert.match(rbac, /authorization:/);
assert.match(rbac, /request.headers\['x-llm'\] == 'gemini'/);

const modelApi = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "agw-model",
  name: "gpt-4",
});
assert.match(modelApi, /kind: AgentgatewayModel/);
assert.match(modelApi, /provider: OpenAI/);

const virtual = AgwBuilder.generateLlmYaml({
  ...AgwBuilder.llmDefaults("openai"),
  preset: "virtual-model",
  name: "resilient",
});
assert.match(virtual, /virtualModel:/);
assert.match(virtual, /failover:/);
assert.match(virtual, /visibility: Internal/);

const budget = AgwBuilder.generateLlmYaml({
  preset: "budget",
  name: "route-budget",
  targetRoute: "openai",
  namespace: "agentgateway-system",
  budgetAmount: 100000,
  budgetWindow: "Day",
});
assert.match(budget, /kind: EnterpriseAgentgatewayBudget/);
assert.match(budget, /entBudgetEnforcement: \{\}/);

const streaming = AgwBuilder.generateLlmYaml({ preset: "streaming" });
assert.match(streaming, /No gateway CRD/);
assert.doesNotMatch(streaming, /kind: EnterpriseAgentgateway/);

console.log("builder.test.js: ok");
