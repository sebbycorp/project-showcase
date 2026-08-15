/* Form → YAML for Agentgateway CRDs. Documented kinds only; secretRef name only. */
(function (root, factory) {
  const api = factory();
  // Always set the browser global. Chrome popups can have `module`.
  root.AgwBuilder = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  const AGW_API = "enterpriseagentgateway.solo.io/v1alpha1";
  const GW_API = "gateway.networking.k8s.io/v1";
  const AGW_GROUP = "enterpriseagentgateway.solo.io";
  const DEFAULT_GATEWAY = "agentgateway-proxy";
  const DEFAULT_NS = "agentgateway-system";
  const KIND_BACKEND = "EnterpriseAgentgatewayBackend";
  const KIND_ROUTE = "HTTPRoute";
  const KIND_GATEWAY = "Gateway";
  const KIND_POLICY = "EnterpriseAgentgatewayPolicy";

  const LLM_DEFAULTS = {
    openai: {
      name: "openai",
      model: "gpt-4o-mini",
      fallbackModel: "gpt-4o",
      secretRef: "openai-secret",
      routePath: "",
      rewriteTo: "",
    },
    claude: {
      name: "anthropic",
      model: "claude-sonnet-4-5",
      fallbackModel: "claude-3-5-sonnet",
      secretRef: "anthropic-secret",
      routePath: "/anthropic",
      rewriteTo: "",
    },
    grok: {
      name: "grok",
      model: "grok-3",
      fallbackModel: "grok-2-latest",
      secretRef: "grok-secret",
      routePath: "/grok",
      host: "api.x.ai",
      port: "443",
      providerPath: "/v1/chat/completions",
      rewriteTo: "",
    },
    bedrock: {
      name: "bedrock",
      model: "amazon.nova-micro-v1:0",
      fallbackModel: "amazon.titan-text-lite-v1",
      secretRef: "bedrock-secret",
      routePath: "/bedrock",
      region: "us-east-1",
      rewriteTo: "",
    },
    gemini: {
      name: "gemini",
      model: "gemini-2.0-flash",
      fallbackModel: "gemini-1.5-flash",
      secretRef: "gemini-secret",
      routePath: "/gemini",
      rewriteTo: "",
    },
  };

  const HEALTH_DEFAULTS = {
    unhealthyCondition: "response.code >= 500 || response.code == 429",
    evictionDuration: "10s",
    consecutiveFailures: 1,
  };

  const LLM_CATALOG = [
    {
      id: "openai",
      group: "Connect",
      label: "OpenAI backend",
      docs: "https://docs.solo.io/agentgateway/latest/llm/providers/openai/",
      blurb: "EnterpriseAgentgatewayBackend + HTTPRoute for OpenAI.",
      provider: "openai",
      fields: ["core", "provider", "model", "secret", "path", "gateway"],
    },
    {
      id: "claude",
      group: "Connect",
      label: "Claude backend",
      docs: "https://docs.solo.io/agentgateway/latest/llm/providers/anthropic/",
      blurb: "Anthropic Claude backend + HTTPRoute.",
      provider: "claude",
      fields: ["core", "provider", "model", "secret", "path", "gateway"],
    },
    {
      id: "grok",
      group: "Connect",
      label: "Grok backend",
      docs: "https://docs.solo.io/agentgateway/latest/llm/providers/openai-compatible/",
      blurb: "OpenAI-compatible Grok backend (host api.x.ai).",
      provider: "grok",
      fields: ["core", "provider", "model", "secret", "path", "gateway", "compat"],
    },
    {
      id: "bedrock",
      group: "Connect",
      label: "Bedrock backend",
      docs: "https://docs.solo.io/agentgateway/latest/llm/providers/bedrock/",
      blurb: "Amazon Bedrock backend + HTTPRoute.",
      provider: "bedrock",
      fields: ["core", "provider", "model", "secret", "path", "gateway", "region"],
    },
    {
      id: "gemini",
      group: "Connect",
      label: "Gemini backend",
      docs: "https://docs.solo.io/agentgateway/latest/llm/providers/google/",
      blurb: "Google Gemini backend + HTTPRoute.",
      provider: "gemini",
      fields: ["core", "provider", "model", "secret", "path", "gateway"],
    },
    {
      id: "secretref",
      group: "Connect",
      label: "API key secretRef",
      docs: "https://docs.solo.io/agentgateway/latest/llm/api-keys/",
      blurb: "Backend auth via secretRef name only. Create the Secret in-cluster first — never paste a key.",
      fields: ["core", "provider", "model", "secret", "path", "gateway"],
    },
    {
      id: "agw-model",
      group: "Connect",
      label: "AgentgatewayModel",
      docs: "https://docs.solo.io/agentgateway/latest/llm/models/serve/",
      blurb: "Model-centric 2026.8 API. Experimental; enable AgentgatewayModel on the control plane first.",
      fields: ["core", "provider", "secret", "gateway"],
    },
    {
      id: "gateway",
      group: "Connect",
      label: "Gateway (HTTP :80)",
      docs: "https://docs.solo.io/agentgateway/latest/llm/",
      blurb: "HTTP listener on agentgateway-proxy.",
      fields: ["core", "gateway"],
    },
    {
      id: "model-failover",
      group: "Route",
      label: "Model failover",
      docs: "https://docs.solo.io/agentgateway/latest/llm/failover/",
      blurb: "Same provider, priority groups, plus the required health policy.",
      fields: ["core", "provider", "model", "fallback", "secret", "path", "gateway", "health"],
    },
    {
      id: "provider-failover",
      group: "Route",
      label: "Provider failover",
      docs: "https://docs.solo.io/agentgateway/latest/llm/failover/",
      blurb: "OpenAI → Claude / Grok on one backend. Health policy evicts 5xx/429.",
      fields: [
        "core",
        "provider",
        "model",
        "fallback",
        "secret",
        "path",
        "gateway",
        "fallbackProvider",
        "health",
      ],
    },
    {
      id: "load-balance",
      group: "Route",
      label: "Load balancing (P2C)",
      docs: "https://docs.solo.io/agentgateway/latest/llm/load-balancing/",
      blurb: "Two providers in one priority group. P2C picks by health and latency.",
      fields: [
        "core",
        "provider",
        "model",
        "secret",
        "path",
        "gateway",
        "fallback",
        "fallbackProvider",
      ],
    },
    {
      id: "content-routing",
      group: "Route",
      label: "Content-based routing",
      docs: "https://docs.solo.io/agentgateway/latest/llm/content-routing/",
      blurb: "Extract json(request.body).model into x-model, then match GPT vs Claude.",
      fields: ["core", "secret", "gateway", "fallbackSecret"],
    },
    {
      id: "httproute",
      group: "Route",
      label: "HTTPRoute add-on",
      docs: "https://docs.solo.io/agentgateway/latest/llm/",
      blurb: "Path rewrite onto an existing backend.",
      fields: ["core", "path", "gateway"],
    },
    {
      id: "virtual-model",
      group: "Route",
      label: "Virtual model failover",
      docs: "https://docs.solo.io/agentgateway/latest/llm/models/virtual/",
      blurb: "Public AgentgatewayModel with virtualModel.failover to Internal targets.",
      fields: ["core", "provider", "model", "fallback", "secret", "gateway"],
    },
    {
      id: "prompt-guard",
      group: "Protect",
      label: "Prompt guard",
      docs: "https://docs.solo.io/agentgateway/latest/llm/guardrails/regex/",
      blurb: "Workshop builtin-guardrails: jailbreak/DAN → 403, PII builtins CreditCard/Ssn/Email/PhoneNumber → 422, response Mask.",
      fields: ["core", "targetRoute", "regex"],
    },
    {
      id: "rbac",
      group: "Protect",
      label: "CEL RBAC",
      docs: "https://docs.solo.io/agentgateway/latest/llm/rbac/",
      blurb: "Allow only requests whose header matches a CEL expression.",
      fields: ["core", "targetRoute", "header"],
    },
    {
      id: "prompt-enrichment",
      group: "Control",
      label: "Prompt enrichment",
      docs: "https://docs.solo.io/agentgateway/latest/llm/prompt-enrichment/",
      blurb: "Prepend a system prompt on an HTTPRoute.",
      fields: ["core", "targetRoute", "prompt"],
    },
    {
      id: "prompt-template",
      group: "Control",
      label: "Prompt template",
      docs: "https://docs.solo.io/agentgateway/latest/llm/prompt-templates/",
      blurb: "Static prepend + append system prompts.",
      fields: ["core", "targetRoute", "prompt", "promptAppend"],
    },
    {
      id: "transformation",
      group: "Control",
      label: "Request transformation",
      docs: "https://docs.solo.io/agentgateway/latest/llm/transformations/",
      blurb: "CEL field transform, e.g. cap max_completion_tokens.",
      fields: ["core", "targetRoute", "transform"],
    },
    {
      id: "rate-limit",
      group: "Control",
      label: "Rate limiting",
      docs: "https://docs.solo.io/agentgateway/latest/llm/rate-limit/",
      blurb: "RateLimitConfig + policy. Request or token counters.",
      fields: ["core", "targetRoute", "rateLimit"],
    },
    {
      id: "alias",
      group: "Control",
      label: "Model aliasing",
      docs: "https://docs.solo.io/agentgateway/latest/llm/alias/",
      blurb: "policies.ai.modelAliases on a provider backend.",
      fields: ["core", "provider", "secret", "path", "gateway", "alias"],
    },
    {
      id: "budget",
      group: "Control",
      label: "Cost budget",
      docs: "https://docs.solo.io/agentgateway/latest/llm/cost-controls/budget-limits/",
      blurb: "EnterpriseAgentgatewayBudget plus entBudgetEnforcement on a route.",
      fields: ["core", "targetRoute", "budget"],
    },
    {
      id: "streaming",
      group: "Control",
      label: "Streaming",
      docs: "https://docs.solo.io/agentgateway/latest/llm/streaming/",
      blurb: "Client sets stream: true. No gateway CRD.",
      apply: false,
      fields: [],
    },
    {
      id: "functions",
      group: "Control",
      label: "Function calling",
      docs: "https://docs.solo.io/agentgateway/latest/llm/functions/",
      blurb: "Tools go in the chat request body. No gateway CRD.",
      apply: false,
      fields: [],
    },
  ];

  const LLM_PRESETS = LLM_CATALOG.filter((item) => item.apply !== false).map((item) => ({
    id: item.id,
    label: item.label,
    provider: item.provider,
    group: item.group,
  }));

  function catalogRecipe(id) {
    const mapped = id === "failover" ? "model-failover" : id;
    return (
      LLM_CATALOG.find((item) => item.id === mapped) ||
      LLM_CATALOG.find((item) => item.id === "openai")
    );
  }

  const MCP_PRESETS = [
    { id: "remote", label: "Remote MCP URL" },
    { id: "openapi", label: "OpenAPI-as-MCP" },
  ];

  const MCP_DEFAULTS = {
    remote: {
      name: "mcp-backend",
      targetName: "mcp-target",
      host: "mcp-website-fetcher.default.svc.cluster.local",
      port: "80",
      protocol: "SSE",
      targetPath: "",
      routePath: "/mcp",
      toolMode: "Standard",
      secretRef: "",
      schemaRef: "",
    },
    openapi: {
      name: "petstore-openapi",
      targetName: "petstore",
      host: "petstore.default.svc.cluster.local",
      port: "8080",
      protocol: "OpenAPI",
      targetPath: "",
      routePath: "/mcp",
      toolMode: "Standard",
      secretRef: "",
      schemaRef: "petstore-schema",
    },
  };

  const PETSTORE_OPENAPI_SCHEMA = {
    openapi: "3.0.0",
    info: { title: "Swagger Petstore", version: "1.0.0" },
    servers: [{ url: "/" }],
    paths: {
      "/api/pets": {
        get: {
          operationId: "findPets",
          summary: "Returns all pets from the system",
          parameters: [
            {
              name: "limit",
              in: "query",
              description: "Maximum number of results to return",
              required: false,
              schema: { type: "integer" },
            },
          ],
          responses: { "200": { description: "A list of pets" } },
        },
        post: {
          operationId: "addPet",
          summary: "Creates a new pet in the store",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    tag: { type: "string" },
                  },
                  required: ["name"],
                },
              },
            },
          },
          responses: { "200": { description: "Pet created successfully" } },
        },
      },
      "/api/pets/{id}": {
        get: {
          operationId: "findPetById",
          summary: "Find pet by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: { "200": { description: "Pet details" } },
        },
        delete: {
          operationId: "deletePet",
          summary: "Delete a pet",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: { "204": { description: "Pet deleted" } },
        },
      },
    },
  };

  // Public JWKS from the JWT auth for services guide (not a secret).
  const MCP_JWT_JWKS =
    '{"keys":[{"use":"sig","kty":"RSA","kid":"5891645032159894383","n":"5Zb1l_vtAp7DhKPNbY5qLzHIxDEIm3lpFYhBTiZyGBcnre8Y8RtNAnHpVPKdWohqhbihbVdb6U7m1E0VhLq7CS7k2Ng1LcQtVN3ekaNyk09NHuhl9LCgqXT4pATt6fYTKtZ__tEw4XKt3QqVcw7hV0YaNVC5xXGYVBh5_2-K5aW9u2LQ7FSax0jPhWdoUB3KbOQfWNOA3RwOqYn4gmc9wVToVLv6bXCVhIYWKnAVcX89C00eM7uBHENvOydD14-ZnLb4pzz2VGbU6U65odpw_i4r_mWXvoUgwogXAXp80TsYwMzLHcFo4GVDNkaH0hjuLJCeISPfYtbUJK6fFaZGBw","e":"AQAB","x5c":["MIIC3jCCAcagAwIBAgIBJTANBgkqhkiG9w0BAQsFADAXMRUwEwYDVQQKEwxrZ2F0ZXdheS5kZXYwHhcNMjUxMjE4MTkzNDQyWhcNMjUxMjE4MjEzNDQyWjAXMRUwEwYDVQQKEwxrZ2F0ZXdheS5kZXYwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDllvWX++0CnsOEo81tjmovMcjEMQibeWkViEFOJnIYFyet7xjxG00CcelU8p1aiGqFuKFtV1vpTubUTRWEursJLuTY2DUtxC1U3d6Ro3KTT00e6GX0sKCpdPikBO3p9hMq1n/+0TDhcq3dCpVzDuFXRho1ULnFcZhUGHn/b4rlpb27YtDsVJrHSM+FZ2hQHcps5B9Y04DdHA6pifiCZz3BVOhUu/ptcJWEhhYqcBVxfz0LTR4zu4EcQ287J0PXj5mctvinPPZUZtTpTrmh2nD+Liv+ZZe+hSDCiBcBenzROxjAzMsdwWjgZUM2RofSGO4skJ4hI99i1tQkrp8VpkYHAgMBAAGjNTAzMA4GA1UdDwEB/wQEAwIFoDATBgNVHSUEDDAKBggrBgEFBQcDATAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQBeA8lKrnfRjo18RkLBqVKuO441nZLFGKrJwpJu+G5cVOJ06txKsZEXE3qu2Yh9abeOJkC+SsWMELWHYNJlip4JGE0Oby7chol+ahrwBILUixBG/qvhwJG6YntoDZi0wbNFqQiQ6FZt89awcs2pdxL5thYR/Pqx4QXN8oKd4DNkcX5vWdz9P6nstLUmrEBV4EFs7fY0L/n3ssDvyZ3xfpM1Q/CQFz4OqB4U20+Qt6x7eap6qhTSBZt8rZWIiy57BsSww12gLYYU1x+Klg1AdPsVrcuvVdiZM1ru232Ihip0rYH7Mf7vcN+HLUrjpXvMoeyWRwbB61GPsXz+BTksqoql"]}]}';

  const MCP_DEPLOYS = [
    {
      id: "everything",
      group: "virtual",
      label: "Deploy everything server",
      blurb: "mcp-server-everything (npx @modelcontextprotocol/server-everything streamableHttp, port 3001).",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/virtual/",
      run: "echo",
    },
    {
      id: "fetcher",
      group: "virtual",
      label: "Deploy website fetcher",
      blurb: "mcp-website-fetcher (ghcr.io/peterj/mcp-website-fetcher:main).",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/virtual/",
      run: "fetch",
    },
    {
      id: "virtual",
      group: "virtual",
      label: "Deploy virtual MCP",
      blurb: "Federate both targets + HTTPRoute /mcp. failureMode: FailOpen.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/virtual/",
      run: "initialize",
      runAll: true,
    },
    {
      id: "openapi",
      group: "more",
      label: "Deploy OpenAPI-as-MCP",
      blurb: "Petstore + ConfigMap schema + OpenAPI backend + /mcp route.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/openapi/",
    },
    {
      id: "jwt",
      group: "more",
      label: "Deploy JWT auth",
      blurb: "JWT Strict on Gateway agentgateway-proxy (all routes). Inline JWKS from the docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/mcp-access/",
    },
    {
      id: "tool-access",
      group: "more",
      label: "Deploy tool access",
      blurb: "CEL RBAC on github-mcp-backend: alice + get_me only.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/tool-access/",
    },
    {
      id: "rate-limit",
      group: "more",
      label: "Deploy rate limiting",
      blurb: "Local rate limit on HTTPRoute mcp (5/s, burst 10).",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/rate-limit/",
    },
    {
      id: "search-mode",
      group: "more",
      label: "Deploy search mode",
      blurb: "entMcp toolMode Search + HTTPRoute /mcp/search.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/tool-mode/search-mode/",
    },
    {
      id: "code-mode",
      group: "more",
      label: "Deploy code mode",
      blurb: "entMcp toolMode Code + HTTPRoute /mcp/code.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/tool-mode/code-mode/",
    },
    {
      id: "guardrails",
      group: "more",
      label: "Deploy guardrails",
      blurb: "Sample ExtMCP server + mcp-guardrails policy on mcp-backend.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/guardrails/setup/",
    },
    {
      id: "auth",
      group: "docs",
      label: "MCP auth",
      apply: false,
      blurb: "OAuth / Keycloak / Entra — needs an IdP. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/auth/",
    },
    {
      id: "token-exchange",
      group: "docs",
      label: "Token exchange",
      apply: false,
      blurb: "OBO, elicitations, and proxy-side OAuth. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/token-exchange/overview/",
    },
    {
      id: "apps",
      group: "docs",
      label: "MCP Apps",
      apply: false,
      blurb: "Interactive MCP UI resources. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/apps/",
    },
    {
      id: "composable",
      group: "docs",
      label: "Composable MCP",
      apply: false,
      blurb: "Multi-step tool pipelines. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/composable/",
    },
    {
      id: "https",
      group: "docs",
      label: "Connect via HTTPS",
      apply: false,
      blurb: "TLS to an upstream MCP server. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/https/",
    },
    {
      id: "code-search-mode",
      group: "docs",
      label: "Code and search mode",
      apply: false,
      blurb: "Combined meta tools. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/tool-mode/code-search-mode/",
    },
    {
      id: "spec",
      group: "docs",
      label: "MCP spec compatibility",
      apply: false,
      blurb: "Version translation. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/spec-compatibility/",
    },
    {
      id: "session",
      group: "docs",
      label: "Stateful MCP",
      apply: false,
      blurb: "Session routing. See docs.",
      docs: "https://docs.solo.io/agentgateway/latest/mcp/session/",
    },
  ];

  function quoteKey(key) {
    const s = String(key);
    if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(s)) {
      return s;
    }
    return JSON.stringify(s);
  }

  function quoteScalar(value) {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    const s = String(value);
    if (
      s === "" ||
      /[:#{}[\],&*?|<>=!%@`'"]/.test(s) ||
      /^\s|\s$/.test(s) ||
      /[\n\r]/.test(s) ||
      /^-/.test(s) ||
      /^(true|false|null|yes|no|on|off)$/i.test(s)
    ) {
      return JSON.stringify(s);
    }
    return s;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function emitYaml(value, indent) {
    const pad = " ".repeat(indent);
    if (value === null || value === undefined) {
      return "null";
    }
    if (typeof value !== "object") {
      return quoteScalar(value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "[]";
      }
      return value
        .map((item) => {
          if (isPlainObject(item)) {
            const inner = emitMapping(item, indent + 2);
            const lines = inner.split("\n");
            return `${pad}- ${lines[0].replace(/^\s+/, "")}${
              lines.length > 1 ? `\n${lines.slice(1).join("\n")}` : ""
            }`;
          }
          if (Array.isArray(item)) {
            const inner = emitYaml(item, indent + 2);
            return `${pad}-\n${inner}`;
          }
          return `${pad}- ${quoteScalar(item)}`;
        })
        .join("\n");
    }
    return emitMapping(value, indent);
  }

  function emitMapping(obj, indent) {
    const pad = " ".repeat(indent);
    const keys = Object.keys(obj).filter((key) => obj[key] !== undefined);
    if (keys.length === 0) {
      return `${pad}{}`.trimStart();
    }
    return keys
      .map((key) => {
        const child = obj[key];
        const left = `${pad}${quoteKey(key)}:`;
        if (child === null) {
          return `${left} null`;
        }
        if (isPlainObject(child)) {
          const childKeys = Object.keys(child).filter(
            (k) => child[k] !== undefined
          );
          if (childKeys.length === 0) {
            return `${left} {}`;
          }
          return `${left}\n${emitMapping(child, indent + 2)}`;
        }
        if (Array.isArray(child)) {
          if (child.length === 0) {
            return `${left} []`;
          }
          return `${left}\n${emitYaml(child, indent + 2)}`;
        }
        return `${left} ${quoteScalar(child)}`;
      })
      .join("\n");
  }

  function toYaml(doc) {
    return emitYaml(doc, 0).replace(/^\s+$/gm, "").trim() + "\n";
  }

  function joinDocs(docs, header) {
    const body = docs.map((doc) => toYaml(doc).trimEnd()).join("\n---\n");
    return `${header}${body}\n`;
  }

  function cleanName(raw, fallback) {
    const value = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-+|-+$/g, "");
    return value || fallback;
  }

  function cleanNs(raw) {
    return String(raw || "").trim() || DEFAULT_NS;
  }

  function meta(name, namespace) {
    return { name, namespace };
  }

  function backendRef(name, namespace) {
    return {
      name,
      namespace,
      group: AGW_GROUP,
      kind: KIND_BACKEND,
    };
  }

  function llmAuth(provider, secretRef) {
    if (!secretRef) {
      return undefined;
    }
    if (provider === "bedrock") {
      return { aws: { secretRef: { name: secretRef } } };
    }
    return { secretRef: { name: secretRef } };
  }

  function llmProviderBlock(fields) {
    const model = String(fields.model || "").trim();
    if (fields.provider === "claude") {
      return { anthropic: model ? { model } : {} };
    }
    if (fields.provider === "bedrock") {
      const region = String(fields.region || "").trim() || "us-east-1";
      return {
        bedrock: model ? { model, region } : { region },
      };
    }
    if (fields.provider === "gemini") {
      return { gemini: model ? { model } : {} };
    }
    const openai = model ? { model } : {};
    const block = { openai };
    const host = String(fields.host || "").trim();
    if (host) {
      block.host = host;
      const port = Number(fields.port);
      block.port = Number.isFinite(port) && port > 0 ? port : 443;
      const path = String(fields.providerPath || "").trim();
      if (path) {
        block.path = path;
      }
    }
    return block;
  }

  function llmPolicies(fields) {
    const policies = {};
    const auth = llmAuth(fields.provider, String(fields.secretRef || "").trim());
    if (auth) {
      policies.auth = auth;
    }
    const host = String(fields.host || "").trim();
    if (host) {
      policies.tls = { sni: host };
    }
    if (fields.provider === "openai" && !fields.failover) {
      policies.ai = {
        routes: {
          "/v1/responses": "Responses",
          "/v1/chat/completions": "Completions",
          "/v1/models": "Models",
          "*": "Passthrough",
        },
      };
    }
    return Object.keys(policies).length ? policies : undefined;
  }

  function httpRouteDoc(fields) {
    const name = cleanName(fields.name, "route");
    const namespace = cleanNs(fields.namespace);
    const gateway = cleanName(fields.gateway, DEFAULT_GATEWAY);
    const routePath = String(fields.routePath || "").trim();
    const rewriteTo = String(fields.rewriteTo || "").trim();
    const rule = {};
    if (routePath) {
      rule.matches = [{ path: { type: "PathPrefix", value: routePath } }];
    }
    if (rewriteTo) {
      rule.filters = [
        {
          type: "URLRewrite",
          urlRewrite: {
            path: {
              type: "ReplacePrefixMatch",
              replacePrefixMatch: rewriteTo,
            },
          },
        },
      ];
    }
    rule.backendRefs = [backendRef(name, namespace)];
    return {
      apiVersion: GW_API,
      kind: KIND_ROUTE,
      metadata: meta(name, namespace),
      spec: {
        parentRefs: [{ name: gateway, namespace }],
        rules: [rule],
      },
    };
  }

  function gatewayDoc(fields) {
    const name = cleanName(fields.gateway || fields.name, DEFAULT_GATEWAY);
    const namespace = cleanNs(fields.namespace);
    return {
      apiVersion: GW_API,
      kind: KIND_GATEWAY,
      metadata: meta(name, namespace),
      spec: {
        gatewayClassName: "enterprise-agentgateway",
        listeners: [
          {
            protocol: "HTTP",
            port: 80,
            name: "http",
            allowedRoutes: { namespaces: { from: "All" } },
          },
        ],
      },
    };
  }

  function isFailoverPreset(preset) {
    return (
      preset === "failover" ||
      preset === "model-failover" ||
      preset === "provider-failover"
    );
  }

  function normalizeFailoverPreset(preset, providerFailover) {
    if (preset === "provider-failover" || providerFailover) {
      return "provider-failover";
    }
    if (preset === "failover" || preset === "model-failover") {
      return "model-failover";
    }
    return preset;
  }

  function parseModelList(raw) {
    return String(raw || "")
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function llmHeader(fields) {
    const docs =
      fields.provider === "claude"
        ? "https://docs.solo.io/agentgateway/latest/llm/providers/anthropic/"
        : fields.provider === "grok"
          ? "https://docs.solo.io/agentgateway/latest/llm/providers/openai-compatible/"
          : fields.provider === "bedrock"
            ? "https://docs.solo.io/agentgateway/latest/llm/providers/bedrock/"
            : fields.provider === "gemini"
              ? "https://docs.solo.io/agentgateway/latest/llm/providers/google/"
              : "https://docs.solo.io/agentgateway/latest/llm/providers/openai/";
    const extra = isFailoverPreset(fields.preset) || fields.failover
      ? "# Failover groups: https://docs.solo.io/agentgateway/latest/llm/failover/\n# Health policy is required — without it, backends are not evicted and failover does not occur.\n"
      : "";
    return `# Docs: ${docs}\n# secretRef name only — create the Secret in the cluster first.\n${extra}`;
  }

  function llmGroupProvider(fields, { name, model }) {
    const local = { ...fields, model, failover: true };
    const block = {
      name,
      ...llmProviderBlock(local),
    };
    const policies = {};
    const auth = llmAuth(local.provider, String(local.secretRef || "").trim());
    if (auth) {
      policies.auth = auth;
    }
    const host = String(local.host || "").trim();
    if (host) {
      policies.tls = { sni: host };
    }
    if (Object.keys(policies).length) {
      block.policies = policies;
    }
    return block;
  }

  function fallbackProviderFields(fields) {
    const provider = String(fields.fallbackProvider || "").trim() || "claude";
    const defaults = llmDefaults(provider);
    return {
      ...defaults,
      provider,
      model: String(fields.fallbackModel || "").trim() || defaults.model,
      secretRef:
        String(fields.fallbackSecretRef || "").trim() || defaults.secretRef,
      namespace: fields.namespace,
      gateway: fields.gateway,
    };
  }

  function llmBackendDoc(fields) {
    const failover = isFailoverPreset(fields.preset) || fields.failover;
    const name = cleanName(
      fields.name,
      failover
        ? normalizeFailoverPreset(fields.preset, fields.preset === "provider-failover")
        : "openai"
    );
    const namespace = cleanNs(fields.namespace);
    const spec = {};
    if (failover) {
      const primaryFields = { ...fields, failover: true };
      const primary = llmGroupProvider(primaryFields, {
        name: `${primaryFields.provider || "openai"}-primary`,
        model: fields.model,
      });
      const groups = [{ providers: [primary] }];
      if (normalizeFailoverPreset(fields.preset) === "provider-failover") {
        const fallbackFields = fallbackProviderFields(fields);
        groups.push({
          providers: [
            llmGroupProvider(fallbackFields, {
              name: `${fallbackFields.provider}-fallback`,
              model: fallbackFields.model,
            }),
          ],
        });
      } else {
        const fallbacks = parseModelList(fields.fallbackModel);
        const models = fallbacks.length
          ? fallbacks
          : [String(fields.fallbackModel || "").trim() || "gpt-4o"];
        models.forEach((model, index) => {
          groups.push({
            providers: [
              llmGroupProvider(primaryFields, {
                name:
                  index === 0
                    ? `${primaryFields.provider || "openai"}-fallback`
                    : `${primaryFields.provider || "openai"}-fallback-${index + 1}`,
                model,
              }),
            ],
          });
        });
      }
      spec.ai = { groups };
    } else {
      spec.ai = { provider: llmProviderBlock(fields) };
      const policies = llmPolicies(fields);
      if (policies) {
        spec.policies = policies;
      }
    }
    return {
      apiVersion: AGW_API,
      kind: KIND_BACKEND,
      metadata: meta(name, namespace),
      spec,
    };
  }

  function healthPolicyDoc(fields) {
    const failover = isFailoverPreset(fields.preset) || fields.failover;
    const name = cleanName(
      fields.name,
      failover
        ? normalizeFailoverPreset(fields.preset, fields.preset === "provider-failover")
        : "openai"
    );
    const namespace = cleanNs(fields.namespace);
    const condition =
      String(fields.unhealthyCondition || "").trim() ||
      HEALTH_DEFAULTS.unhealthyCondition;
    const duration =
      String(fields.evictionDuration || "").trim() ||
      HEALTH_DEFAULTS.evictionDuration;
    const failures = Number(fields.consecutiveFailures);
    return {
      apiVersion: AGW_API,
      kind: KIND_POLICY,
      metadata: meta(`${name}-health`, namespace),
      spec: {
        targetRefs: [
          {
            group: AGW_GROUP,
            kind: KIND_BACKEND,
            name,
          },
        ],
        backend: {
          health: {
            unhealthyCondition: condition,
            eviction: {
              duration,
              consecutiveFailures:
                Number.isFinite(failures) && failures > 0
                  ? Math.floor(failures)
                  : HEALTH_DEFAULTS.consecutiveFailures,
            },
          },
        },
      },
    };
  }

  function routeTarget(fields, fallback) {
    return {
      group: "gateway.networking.k8s.io",
      kind: KIND_ROUTE,
      name: cleanName(fields.targetRoute || fields.name, fallback),
    };
  }

  function gatewayTarget(fields) {
    return {
      group: "gateway.networking.k8s.io",
      kind: KIND_GATEWAY,
      name: cleanName(fields.gateway, DEFAULT_GATEWAY),
    };
  }

  function policyDoc(name, namespace, spec) {
    return {
      apiVersion: AGW_API,
      kind: KIND_POLICY,
      metadata: meta(name, namespace),
      spec,
    };
  }

  function loadBalanceDocs(fields) {
    const name = cleanName(fields.name, "loadbalanced-backend");
    const namespace = cleanNs(fields.namespace);
    const primary = llmGroupProvider(fields, {
      name: `${fields.provider || "openai"}-primary`,
      model: fields.model,
    });
    const fallbackFields = fallbackProviderFields(fields);
    const secondary = llmGroupProvider(fallbackFields, {
      name: `${fallbackFields.provider}-secondary`,
      model: fallbackFields.model,
    });
    const backend = {
      apiVersion: AGW_API,
      kind: KIND_BACKEND,
      metadata: meta(name, namespace),
      spec: { ai: { groups: [{ providers: [primary, secondary] }] } },
    };
    const route = httpRouteDoc({
      ...fields,
      name,
      routePath: String(fields.routePath || "").trim() || "/chat",
    });
    return [backend, route];
  }

  function contentRoutingDocs(fields) {
    const namespace = cleanNs(fields.namespace);
    const gateway = cleanName(fields.gateway, DEFAULT_GATEWAY);
    const openaiSecret = String(fields.secretRef || "").trim() || "openai-secret";
    const claudeSecret =
      String(fields.fallbackSecretRef || "").trim() || "anthropic-secret";
    const openai = {
      apiVersion: AGW_API,
      kind: KIND_BACKEND,
      metadata: meta("openai-backend", namespace),
      spec: {
        ai: { provider: { openai: { model: "gpt-4o" } } },
        policies: { auth: { secretRef: { name: openaiSecret } } },
      },
    };
    const anthropic = {
      apiVersion: AGW_API,
      kind: KIND_BACKEND,
      metadata: meta("anthropic-backend", namespace),
      spec: {
        ai: { provider: { anthropic: { model: "claude-3-5-sonnet-latest" } } },
        policies: { auth: { secretRef: { name: claudeSecret } } },
      },
    };
    const route = {
      apiVersion: GW_API,
      kind: KIND_ROUTE,
      metadata: meta("content-routing", namespace),
      spec: {
        parentRefs: [{ name: gateway, namespace }],
        rules: [
          {
            matches: [
              {
                path: { type: "PathPrefix", value: "/v1/chat/completions" },
                headers: [
                  { type: "RegularExpression", name: "x-model", value: "^gpt-.*" },
                ],
              },
            ],
            backendRefs: [backendRef("openai-backend", namespace)],
          },
          {
            matches: [
              {
                path: { type: "PathPrefix", value: "/v1/chat/completions" },
                headers: [
                  {
                    type: "RegularExpression",
                    name: "x-model",
                    value: "^claude-.*",
                  },
                ],
              },
            ],
            backendRefs: [backendRef("anthropic-backend", namespace)],
          },
        ],
      },
    };
    const extract = policyDoc("extract-model", namespace, {
      targetRefs: [gatewayTarget(fields)],
      traffic: {
        phase: "PreRouting",
        transformation: {
          request: { set: [{ name: "x-model", value: "json(request.body).model" }] },
        },
      },
    });
    return [openai, anthropic, route, extract];
  }

  function promptGuardDoc(fields) {
    const namespace = cleanNs(fields.namespace);
    const name = cleanName(fields.name, "openai-prompt-guard");
    const extra = String(fields.regex || "").trim();
    const request = [
      {
        regex: {
          action: "Reject",
          matches: [
            "(?i)(ignore|disregard|forget|override|bypass).{0,40}(previous|prior|earlier).{0,20}(instructions|rules|guidelines)",
            "(?i)(do anything now|DAN mode|enable DAN|activate DAN|STAN mode|DUDE mode|AIM mode)",
          ],
        },
        response: {
          message:
            "Request blocked: jailbreak attempt detected. Role hijacking and persona manipulation are not permitted.",
          statusCode: 403,
        },
      },
      {
        regex: {
          action: "Reject",
          builtins: ["CreditCard", "Ssn", "Email", "PhoneNumber"],
        },
        response: {
          message:
            "Request blocked: personally identifiable information (PII) detected.",
          statusCode: 422,
        },
      },
    ];
    if (extra) {
      request.push({
        regex: { action: "Reject", matches: [extra] },
        response: {
          message: "Rejected due to inappropriate content",
          statusCode: 403,
        },
      });
    }
    return policyDoc(name, namespace, {
      targetRefs: [routeTarget(fields, "openai")],
      backend: {
        ai: {
          promptGuard: {
            request,
            response: [
              {
                regex: {
                  action: "Mask",
                  builtins: ["CreditCard", "Ssn", "Email", "PhoneNumber"],
                },
                response: {
                  message: "Response filtered: PII redacted from model output.",
                },
              },
            ],
          },
        },
      },
    });
  }

  function promptEnrichmentDoc(fields) {
    const namespace = cleanNs(fields.namespace);
    const name = cleanName(fields.name, "openai-opt");
    const content =
      String(fields.prompt || "").trim() ||
      "Parse the unstructured text into CSV format.";
    return policyDoc(name, namespace, {
      targetRefs: [routeTarget(fields, "openai")],
      backend: {
        ai: {
          prompt: { prepend: [{ role: "system", content }] },
        },
      },
    });
  }

  function promptTemplateDoc(fields) {
    const namespace = cleanNs(fields.namespace);
    const name = cleanName(fields.name, "static-prompt-template");
    const prepend =
      String(fields.prompt || "").trim() ||
      "You are a helpful customer service assistant. Always be polite and professional.";
    const append =
      String(fields.promptAppend || "").trim() ||
      "If you cannot answer a question, say so clearly rather than making up information.";
    return policyDoc(name, namespace, {
      targetRefs: [routeTarget(fields, "openai")],
      backend: {
        ai: {
          prompt: {
            prepend: [{ role: "system", content: prepend }],
            append: [{ role: "system", content: append }],
          },
        },
      },
    });
  }

  function transformationDoc(fields) {
    const namespace = cleanNs(fields.namespace);
    const name = cleanName(fields.name, "cap-max-tokens");
    const field = String(fields.transformField || "").trim() || "max_completion_tokens";
    const expression =
      String(fields.cel || "").trim() || "min(llmRequest.max_completion_tokens, 10)";
    return policyDoc(name, namespace, {
      targetRefs: [routeTarget(fields, "openai")],
      backend: {
        ai: { transformations: [{ field, expression }] },
      },
    });
  }

  function rateLimitDocs(fields) {
    const namespace = cleanNs(fields.namespace);
    const name = cleanName(fields.name, "openai-rate-limit");
    const count = Number(fields.rateLimitCount);
    const unit = String(fields.rateLimitUnit || "").trim() || "MINUTE";
    const type = String(fields.rateLimitType || "").trim() || "REQUEST";
    const config = {
      apiVersion: "ratelimit.solo.io/v1alpha1",
      kind: "RateLimitConfig",
      metadata: meta(name, namespace),
      spec: {
        raw: {
          descriptors: [
            {
              key: "generic_key",
              value: "counter",
              rateLimit: {
                requestsPerUnit:
                  Number.isFinite(count) && count > 0 ? Math.floor(count) : 5,
                unit,
              },
            },
          ],
          rateLimits: [
            {
              actions: [{ genericKey: { descriptorValue: "counter" } }],
              type,
            },
          ],
        },
      },
    };
    const policy = policyDoc(name, namespace, {
      targetRefs: [routeTarget(fields, "openai")],
      traffic: {
        entRateLimit: {
          global: { rateLimitConfigRefs: [{ name }] },
        },
      },
    });
    return [config, policy];
  }

  function aliasDocs(fields) {
    const name = cleanName(fields.name, "openai");
    const namespace = cleanNs(fields.namespace);
    const alias = String(fields.aliasName || "").trim() || "fast";
    const target = String(fields.aliasTarget || "").trim() || "gpt-3.5-turbo";
    const backend = llmBackendDoc({ ...fields, name, failover: false, preset: "openai" });
    backend.spec.policies = backend.spec.policies || {};
    backend.spec.policies.ai = backend.spec.policies.ai || {};
    backend.spec.policies.ai.modelAliases = { [alias]: target };
    return [backend, httpRouteDoc({ ...fields, name })];
  }

  function rbacDoc(fields) {
    const namespace = cleanNs(fields.namespace);
    const name = cleanName(fields.name, "rbac-policy");
    const header = String(fields.headerName || "").trim() || "x-llm";
    const value = String(fields.headerValue || "").trim() || "gemini";
    return policyDoc(name, namespace, {
      targetRefs: [routeTarget(fields, "google")],
      traffic: {
        authorization: {
          action: "Allow",
          policy: {
            matchExpressions: [`request.headers['${header}'] == '${value}'`],
          },
        },
      },
    });
  }

  function agwModelDoc(fields) {
    const name = cleanName(fields.name, "gpt-4");
    const namespace = cleanNs(fields.namespace);
    const providerLabel =
      fields.provider === "claude"
        ? "Anthropic"
        : fields.provider === "gemini"
          ? "Gemini"
          : fields.provider === "bedrock"
            ? "Bedrock"
            : "OpenAI";
    const spec = {
      parentRefs: [
        {
          group: "gateway.networking.k8s.io",
          kind: KIND_GATEWAY,
          name: cleanName(fields.gateway, DEFAULT_GATEWAY),
          sectionName: "http",
        },
      ],
      provider: providerLabel,
    };
    const secretRef = String(fields.secretRef || "").trim();
    if (secretRef) {
      spec.policies = { auth: { secretRef: { name: secretRef } } };
    }
    return {
      apiVersion: "agentgateway.dev/v1alpha1",
      kind: "AgentgatewayModel",
      metadata: meta(name, namespace),
      spec,
    };
  }

  function virtualModelDocs(fields) {
    const namespace = cleanNs(fields.namespace);
    const gateway = cleanName(fields.gateway, DEFAULT_GATEWAY);
    const parentRefs = [
      {
        group: "gateway.networking.k8s.io",
        kind: KIND_GATEWAY,
        name: gateway,
        sectionName: "http",
      },
    ];
    const secretRef = String(fields.secretRef || "").trim();
    const providerLabel =
      fields.provider === "claude"
        ? "Anthropic"
        : fields.provider === "gemini"
          ? "Gemini"
          : "OpenAI";
    const primaryName = cleanName(`${fields.name || "resilient"}-primary`, "primary-model");
    const fallbackName = cleanName(
      `${fields.name || "resilient"}-fallback`,
      "fallback-model"
    );
    const virtualName = cleanName(fields.name, "resilient");
    const auth = secretRef ? { auth: { secretRef: { name: secretRef } } } : undefined;
    const primary = {
      apiVersion: "agentgateway.dev/v1alpha1",
      kind: "AgentgatewayModel",
      metadata: meta(primaryName, namespace),
      spec: {
        parentRefs,
        visibility: "Internal",
        provider: providerLabel,
        policies: {
          ...(auth || {}),
          health: { eviction: { consecutiveFailures: 1 } },
        },
      },
    };
    const fallback = {
      apiVersion: "agentgateway.dev/v1alpha1",
      kind: "AgentgatewayModel",
      metadata: meta(fallbackName, namespace),
      spec: {
        parentRefs,
        visibility: "Internal",
        provider: providerLabel,
        policies: auth,
      },
    };
    const virtual = {
      apiVersion: "agentgateway.dev/v1alpha1",
      kind: "AgentgatewayModel",
      metadata: meta(virtualName, namespace),
      spec: {
        parentRefs,
        virtualModel: {
          failover: {
            targets: [
              { modelRef: { name: primaryName }, priority: 0 },
              { modelRef: { name: fallbackName }, priority: 1 },
            ],
          },
        },
      },
    };
    return [primary, fallback, virtual];
  }

  function budgetDocs(fields) {
    const namespace = cleanNs(fields.namespace);
    const name = cleanName(fields.name, "route-budget");
    const amount = Number(fields.budgetAmount);
    const budget = {
      apiVersion: AGW_API,
      kind: "EnterpriseAgentgatewayBudget",
      metadata: meta(name, namespace),
      spec: {
        budgets: [
          {
            name: `${name}-tokens`,
            limit: {
              unit: String(fields.budgetUnit || "").trim() || "Tokens",
              amount: Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 100000,
            },
            window: { unit: String(fields.budgetWindow || "").trim() || "Day" },
            onBudgetExceeded: "Block",
          },
        ],
      },
    };
    const policy = policyDoc(`${name}-enforcement`, namespace, {
      targetRefs: [routeTarget(fields, "openai")],
      traffic: { entBudgetEnforcement: {} },
    });
    return [budget, policy];
  }

  function generateLlmYaml(fields) {
    const recipe = catalogRecipe(fields.preset || "openai");
    const mode = recipe.id;
    if (recipe.apply === false) {
      return `# ${recipe.label}\n# ${recipe.blurb}\n# Docs: ${recipe.docs}\n`;
    }
    if (mode === "gateway") {
      return joinDocs(
        [gatewayDoc(fields)],
        "# From manifests/gateway.yaml\n# Apply after Solo Enterprise for Agentgateway is installed.\n"
      );
    }
    if (mode === "httproute") {
      const routeFields = {
        ...fields,
        rewriteTo:
          String(fields.rewriteTo || "").trim() || "/v1/chat/completions",
        routePath:
          String(fields.routePath || "").trim() ||
          `/${cleanName(fields.name, "openai")}`,
      };
      return joinDocs(
        [httpRouteDoc(routeFields)],
        `# HTTPRoute add-on. Docs: https://docs.solo.io/agentgateway/latest/llm/\n`
      );
    }
    if (mode === "load-balance") {
      return joinDocs(
        loadBalanceDocs(fields),
        `# Docs: ${recipe.docs}\n# secretRef name only — create the Secrets in the cluster first.\n`
      );
    }
    if (mode === "content-routing") {
      return joinDocs(
        contentRoutingDocs(fields),
        `# Docs: ${recipe.docs}\n# PreRouting is required so x-model is set before route match.\n# secretRef names only.\n`
      );
    }
    if (mode === "prompt-guard") {
      return joinDocs(
        [promptGuardDoc(fields)],
        `# Docs: ${recipe.docs}\n# Workshop builtin-guardrails: jailbreak Reject 403, PII builtins Reject 422, response Mask.\n`
      );
    }
    if (mode === "prompt-enrichment") {
      return joinDocs([promptEnrichmentDoc(fields)], `# Docs: ${recipe.docs}\n`);
    }
    if (mode === "prompt-template") {
      return joinDocs([promptTemplateDoc(fields)], `# Docs: ${recipe.docs}\n`);
    }
    if (mode === "transformation") {
      return joinDocs([transformationDoc(fields)], `# Docs: ${recipe.docs}\n`);
    }
    if (mode === "rate-limit") {
      return joinDocs(
        rateLimitDocs(fields),
        `# Docs: ${recipe.docs}\n# RateLimitConfig + EnterpriseAgentgatewayPolicy.\n`
      );
    }
    if (mode === "alias") {
      return joinDocs(
        aliasDocs(fields),
        `# Docs: ${recipe.docs}\n# secretRef name only.\n`
      );
    }
    if (mode === "rbac") {
      return joinDocs([rbacDoc(fields)], `# Docs: ${recipe.docs}\n`);
    }
    if (mode === "agw-model") {
      return joinDocs(
        [agwModelDoc(fields)],
        `# Docs: ${recipe.docs}\n# Experimental AgentgatewayModel API. secretRef name only.\n`
      );
    }
    if (mode === "virtual-model") {
      return joinDocs(
        virtualModelDocs(fields),
        `# Docs: ${recipe.docs}\n# Virtual models must be Public and cannot set spec.policies.\n# secretRef name only.\n`
      );
    }
    if (mode === "budget") {
      return joinDocs(
        budgetDocs(fields),
        `# Docs: ${recipe.docs}\n# Omit subject = one budget for all requests on the target route.\n`
      );
    }
    const docs = [llmBackendDoc(fields), httpRouteDoc(fields)];
    if (isFailoverPreset(fields.preset) || fields.failover) {
      docs.push(healthPolicyDoc(fields));
    }
    return joinDocs(docs, llmHeader(fields));
  }

  function parseTargetUrl(raw) {
    const value = String(raw || "").trim();
    if (!value) {
      return { host: "", port: "", path: "" };
    }
    try {
      const url = new URL(value.includes("://") ? value : `http://${value}`);
      const port =
        url.port ||
        (url.protocol === "https:" ? "443" : url.protocol === "http:" ? "80" : "");
      return {
        host: url.hostname,
        port,
        path: url.pathname && url.pathname !== "/" ? url.pathname : "",
      };
    } catch {
      const match = value.match(/^([^:/]+)(?::(\d+))?(\/.*)?$/);
      if (!match) {
        return { host: value, port: "", path: "" };
      }
      return {
        host: match[1],
        port: match[2] || "",
        path: match[3] || "",
      };
    }
  }

  function mcpUsesEnt(fields) {
    const protocol = String(fields.protocol || "SSE");
    const toolMode = String(fields.toolMode || "Standard");
    return protocol === "OpenAPI" || (toolMode && toolMode !== "Standard");
  }

  function mcpTargetStatic(fields) {
    const parsed = parseTargetUrl(fields.host);
    const host = parsed.host || String(fields.host || "").trim();
    const port = Number(fields.port || parsed.port);
    const staticTarget = {
      host,
      port: Number.isFinite(port) && port > 0 ? port : 80,
      protocol: String(fields.protocol || "SSE"),
    };
    const targetPath = String(fields.targetPath || parsed.path || "").trim();
    if (targetPath) {
      staticTarget.path = targetPath;
    }
    if (staticTarget.protocol === "OpenAPI") {
      staticTarget.openAPI = {
        schemaRef: { name: String(fields.schemaRef || "").trim() || "schema" },
      };
    }
    return staticTarget;
  }

  function mcpBackendDoc(fields) {
    const name = cleanName(fields.name, "mcp-backend");
    const namespace = cleanNs(fields.namespace);
    const targetName = cleanName(fields.targetName, "mcp-target");
    const target = { name: targetName, static: mcpTargetStatic(fields) };
    const spec = {};
    if (mcpUsesEnt(fields)) {
      spec.entMcp = { targets: [target] };
      const toolMode = String(fields.toolMode || "Standard");
      if (toolMode && toolMode !== "Standard") {
        spec.entMcp.toolMode = toolMode;
      }
    } else {
      spec.mcp = { targets: [target] };
    }
    const secretRef = String(fields.secretRef || "").trim();
    if (secretRef) {
      spec.policies = { auth: { secretRef: { name: secretRef } } };
    }
    return {
      apiVersion: AGW_API,
      kind: KIND_BACKEND,
      metadata: meta(name, namespace),
      spec,
    };
  }

  function generateMcpYaml(fields) {
    const header =
      fields.protocol === "OpenAPI"
        ? "# Docs: https://docs.solo.io/agentgateway/latest/mcp/openapi/\n# OpenAPI schema lives in a ConfigMap (data.schema). secretRef name only.\n"
        : "# Docs: https://docs.solo.io/agentgateway/latest/quickstart/mcp/\n# Tool modes: https://docs.solo.io/agentgateway/latest/mcp/tool-mode/\n# secretRef name only — create the Secret in the cluster first.\n";
    return joinDocs([mcpBackendDoc(fields), httpRouteDoc(fields)], header);
  }

  function svcHost(name, namespace) {
    return `${name}.${cleanNs(namespace)}.svc.cluster.local`;
  }

  function cloneDoc(doc) {
    return JSON.parse(JSON.stringify(doc));
  }

  function walkReplaceDefaultSvc(value, namespace) {
    if (typeof value === "string") {
      return value.replace(/\.default\.svc\.cluster\.local/g, `.${namespace}.svc.cluster.local`);
    }
    if (Array.isArray(value)) {
      return value.map((item) => walkReplaceDefaultSvc(item, namespace));
    }
    if (isPlainObject(value)) {
      const out = {};
      for (const key of Object.keys(value)) {
        out[key] = walkReplaceDefaultSvc(value[key], namespace);
      }
      return out;
    }
    return value;
  }

  function alignAgwGroup(docs, group) {
    const apiVersion = `${group}/v1alpha1`;
    return docs.map((doc) => {
      const next = cloneDoc(doc);
      if (
        next.kind === KIND_BACKEND ||
        next.kind === KIND_POLICY
      ) {
        if (
          next.apiVersion === "agentgateway.dev/v1alpha1" ||
          next.apiVersion === AGW_API
        ) {
          next.apiVersion = apiVersion;
        }
      }
      const rules = pick(next, ["spec", "rules"]) || [];
      rules.forEach((rule) => {
        (rule.backendRefs || []).forEach((ref) => {
          if (
            ref &&
            ref.kind === KIND_BACKEND &&
            (ref.group === "agentgateway.dev" || ref.group === AGW_GROUP)
          ) {
            ref.group = group;
          }
        });
      });
      (pick(next, ["spec", "targetRefs"]) || []).forEach((ref) => {
        if (
          ref &&
          ref.kind === KIND_BACKEND &&
          (ref.group === "agentgateway.dev" || ref.group === AGW_GROUP)
        ) {
          ref.group = group;
        }
      });
      return next;
    });
  }

  function everythingServerDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: "mcp-server-everything",
          namespace: ns,
          labels: { app: "mcp-server-everything" },
        },
        spec: {
          replicas: 1,
          selector: { matchLabels: { app: "mcp-server-everything" } },
          template: {
            metadata: { labels: { app: "mcp-server-everything" } },
            spec: {
              containers: [
                {
                  name: "mcp-server-everything",
                  image: "node:20-alpine",
                  command: ["npx"],
                  args: [
                    "-y",
                    "@modelcontextprotocol/server-everything",
                    "streamableHttp",
                  ],
                  ports: [{ containerPort: 3001 }],
                  readinessProbe: {
                    tcpSocket: { port: 3001 },
                    initialDelaySeconds: 2,
                    periodSeconds: 2,
                    failureThreshold: 30,
                  },
                },
              ],
            },
          },
        },
      },
      {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "mcp-server-everything",
          namespace: ns,
          labels: { app: "mcp-server-everything" },
        },
        spec: {
          selector: { app: "mcp-server-everything" },
          ports: [
            {
              protocol: "TCP",
              port: 3001,
              targetPort: 3001,
              appProtocol: "agentgateway.dev/mcp",
            },
          ],
          type: "ClusterIP",
        },
      },
    ];
  }

  function websiteFetcherDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: { name: "mcp-website-fetcher", namespace: ns },
        spec: {
          selector: { matchLabels: { app: "mcp-website-fetcher" } },
          template: {
            metadata: { labels: { app: "mcp-website-fetcher" } },
            spec: {
              containers: [
                {
                  name: "mcp-website-fetcher",
                  image: "ghcr.io/peterj/mcp-website-fetcher:main",
                  imagePullPolicy: "Always",
                },
              ],
            },
          },
        },
      },
      {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "mcp-website-fetcher",
          namespace: ns,
          labels: { app: "mcp-website-fetcher" },
        },
        spec: {
          selector: { app: "mcp-website-fetcher" },
          ports: [
            {
              port: 80,
              targetPort: 8000,
              appProtocol: "agentgateway.dev/mcp",
            },
          ],
        },
      },
    ];
  }

  function virtualMcpDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: "agentgateway.dev/v1alpha1",
        kind: KIND_BACKEND,
        metadata: { name: "mcp", namespace: ns },
        spec: {
          mcp: {
            failureMode: "FailOpen",
            targets: [
              {
                name: "mcp-server-everything",
                selector: {
                  services: { matchLabels: { app: "mcp-server-everything" } },
                },
              },
              {
                name: "mcp-website-fetcher",
                static: {
                  host: svcHost("mcp-website-fetcher", ns),
                  port: 80,
                  protocol: "SSE",
                },
              },
            ],
          },
        },
      },
      {
        apiVersion: GW_API,
        kind: KIND_ROUTE,
        metadata: { name: "mcp", namespace: ns },
        spec: {
          parentRefs: [
            { name: DEFAULT_GATEWAY, namespace: DEFAULT_NS },
          ],
          rules: [
            {
              backendRefs: [
                {
                  name: "mcp",
                  group: "agentgateway.dev",
                  kind: KIND_BACKEND,
                },
              ],
              matches: [{ path: { type: "PathPrefix", value: "/mcp" } }],
            },
          ],
        },
      },
    ];
  }

  function openapiMcpDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: { name: "petstore", namespace: ns },
        spec: {
          replicas: 1,
          selector: { matchLabels: { app: "petstore" } },
          template: {
            metadata: { labels: { app: "petstore" } },
            spec: {
              containers: [
                {
                  name: "petstore",
                  image: "soloio/petstore-example:latest",
                  ports: [{ containerPort: 8080 }],
                },
              ],
            },
          },
        },
      },
      {
        apiVersion: "v1",
        kind: "Service",
        metadata: { name: "petstore", namespace: ns },
        spec: {
          selector: { app: "petstore" },
          ports: [{ port: 8080, targetPort: 8080 }],
        },
      },
      {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: { name: "petstore-schema", namespace: ns },
        data: { schema: JSON.stringify(PETSTORE_OPENAPI_SCHEMA, null, 2) },
      },
      {
        apiVersion: AGW_API,
        kind: KIND_BACKEND,
        metadata: { name: "petstore-openapi", namespace: ns },
        spec: {
          entMcp: {
            targets: [
              {
                name: "petstore",
                static: {
                  host: svcHost("petstore", ns),
                  port: 8080,
                  protocol: "OpenAPI",
                  openAPI: { schemaRef: { name: "petstore-schema" } },
                },
              },
            ],
          },
        },
      },
      {
        apiVersion: GW_API,
        kind: KIND_ROUTE,
        metadata: { name: "openapi-mcp", namespace: ns },
        spec: {
          parentRefs: [
            { name: DEFAULT_GATEWAY, namespace: DEFAULT_NS },
          ],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/mcp" } }],
              backendRefs: [
                {
                  name: "petstore-openapi",
                  group: AGW_GROUP,
                  kind: KIND_BACKEND,
                },
              ],
            },
          ],
        },
      },
    ];
  }

  function jwtAuthDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: AGW_API,
        kind: KIND_POLICY,
        metadata: { name: "jwt", namespace: ns },
        spec: {
          targetRefs: [
            {
              group: "gateway.networking.k8s.io",
              kind: KIND_GATEWAY,
              name: DEFAULT_GATEWAY,
            },
          ],
          traffic: {
            jwtAuthentication: {
              mode: "Strict",
              providers: [
                { issuer: "solo.io", jwks: { inline: MCP_JWT_JWKS } },
              ],
            },
          },
        },
      },
    ];
  }

  function toolAccessDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: AGW_API,
        kind: KIND_POLICY,
        metadata: { name: "jwt-rbac", namespace: ns },
        spec: {
          targetRefs: [
            {
              group: "agentgateway.dev",
              kind: KIND_BACKEND,
              name: "github-mcp-backend",
            },
          ],
          backend: {
            mcp: {
              authorization: {
                action: "Allow",
                policy: {
                  matchExpressions: [
                    'jwt.sub == "alice" && mcp.tool.name == "get_me"',
                  ],
                },
              },
            },
          },
        },
      },
    ];
  }

  function mcpRateLimitDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: AGW_API,
        kind: KIND_POLICY,
        metadata: { name: "mcp-rate-limit", namespace: ns },
        spec: {
          targetRefs: [
            {
              group: "gateway.networking.k8s.io",
              kind: KIND_ROUTE,
              name: "mcp",
            },
          ],
          traffic: {
            rateLimit: {
              local: [{ requests: 5, unit: "Seconds", burst: 10 }],
            },
          },
        },
      },
    ];
  }

  function searchModeDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: AGW_API,
        kind: KIND_BACKEND,
        metadata: { name: "mcp-search-backend", namespace: ns },
        spec: {
          entMcp: {
            toolMode: "Search",
            targets: [
              {
                name: "fetcher",
                static: {
                  host: svcHost("mcp-website-fetcher", ns),
                  port: 80,
                  protocol: "SSE",
                },
              },
            ],
          },
        },
      },
      {
        apiVersion: GW_API,
        kind: KIND_ROUTE,
        metadata: { name: "mcp-search", namespace: ns },
        spec: {
          parentRefs: [
            { name: DEFAULT_GATEWAY, namespace: DEFAULT_NS },
          ],
          rules: [
            {
              matches: [
                { path: { type: "PathPrefix", value: "/mcp/search" } },
              ],
              filters: [
                {
                  type: "URLRewrite",
                  urlRewrite: {
                    path: {
                      type: "ReplacePrefixMatch",
                      replacePrefixMatch: "/mcp",
                    },
                  },
                },
              ],
              backendRefs: [
                {
                  name: "mcp-search-backend",
                  group: AGW_GROUP,
                  kind: KIND_BACKEND,
                },
              ],
            },
          ],
        },
      },
    ];
  }

  function codeModeDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: AGW_API,
        kind: KIND_BACKEND,
        metadata: { name: "mcp-code-backend", namespace: ns },
        spec: {
          entMcp: {
            toolMode: "Code",
            codeMode: { timeout: "7s" },
            targets: [
              {
                name: "fetcher",
                static: {
                  host: svcHost("mcp-website-fetcher", ns),
                  port: 80,
                  protocol: "SSE",
                },
              },
            ],
          },
        },
      },
      {
        apiVersion: GW_API,
        kind: KIND_ROUTE,
        metadata: { name: "mcp-code", namespace: ns },
        spec: {
          parentRefs: [
            { name: DEFAULT_GATEWAY, namespace: DEFAULT_NS },
          ],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/mcp/code" } }],
              filters: [
                {
                  type: "URLRewrite",
                  urlRewrite: {
                    path: {
                      type: "ReplacePrefixMatch",
                      replacePrefixMatch: "/mcp",
                    },
                  },
                },
              ],
              backendRefs: [
                {
                  name: "mcp-code-backend",
                  group: AGW_GROUP,
                  kind: KIND_BACKEND,
                },
              ],
            },
          ],
        },
      },
    ];
  }

  function guardrailsDocs(namespace) {
    const ns = cleanNs(namespace);
    return [
      {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: { name: "ext-mcp-server", namespace: ns },
        spec: {
          selector: { matchLabels: { app: "ext-mcp-server" } },
          template: {
            metadata: { labels: { app: "ext-mcp-server" } },
            spec: {
              securityContext: {
                sysctls: [
                  {
                    name: "net.ipv4.ip_unprivileged_port_start",
                    value: "0",
                  },
                ],
              },
              containers: [
                {
                  name: "ext-mcp-server",
                  image: "gcr.io/solo-public/docs/testbox:latest",
                  readinessProbe: {
                    httpGet: { path: "/", port: 80 },
                    periodSeconds: 5,
                    failureThreshold: 3,
                  },
                },
              ],
            },
          },
        },
      },
      {
        apiVersion: "v1",
        kind: "Service",
        metadata: { name: "ext-mcp", namespace: ns, labels: { app: "ext-mcp" } },
        spec: {
          selector: { app: "ext-mcp-server" },
          ports: [
            {
              port: 4445,
              targetPort: 9001,
              protocol: "TCP",
              appProtocol: "kubernetes.io/h2c",
            },
          ],
        },
      },
      {
        apiVersion: AGW_API,
        kind: KIND_BACKEND,
        metadata: { name: "mcp-backend", namespace: ns },
        spec: {
          mcp: {
            targets: [
              {
                name: "mcp-target",
                static: {
                  host: svcHost("mcp-website-fetcher", ns),
                  port: 80,
                  protocol: "SSE",
                },
              },
            ],
          },
        },
      },
      {
        apiVersion: GW_API,
        kind: KIND_ROUTE,
        metadata: { name: "mcp", namespace: ns },
        spec: {
          parentRefs: [
            { name: DEFAULT_GATEWAY, namespace: DEFAULT_NS },
          ],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/mcp" } }],
              backendRefs: [
                {
                  name: "mcp-backend",
                  group: AGW_GROUP,
                  kind: KIND_BACKEND,
                },
              ],
            },
          ],
        },
      },
      {
        apiVersion: AGW_API,
        kind: KIND_POLICY,
        metadata: { name: "mcp-guardrails", namespace: ns },
        spec: {
          targetRefs: [
            {
              group: AGW_GROUP,
              kind: KIND_BACKEND,
              name: "mcp-backend",
            },
          ],
          backend: {
            mcp: {
              guardrails: {
                processors: [
                  {
                    remote: {
                      backendRef: { name: "ext-mcp", port: 4445 },
                      failureMode: "FailClosed",
                    },
                    methods: {
                      "tools/call": "Request",
                      "tools/list": "Response",
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ];
  }

  const MCP_DEPLOY_BUILDERS = {
    everything: everythingServerDocs,
    fetcher: websiteFetcherDocs,
    virtual: virtualMcpDocs,
    openapi: openapiMcpDocs,
    jwt: jwtAuthDocs,
    "tool-access": toolAccessDocs,
    "rate-limit": mcpRateLimitDocs,
    "search-mode": searchModeDocs,
    "code-mode": codeModeDocs,
    guardrails: guardrailsDocs,
  };

  function mcpDeployRecipe(id) {
    return MCP_DEPLOYS.find((item) => item.id === id) || null;
  }

  function mcpDeployDocs(id, options) {
    const build = MCP_DEPLOY_BUILDERS[id];
    if (!build) {
      return [];
    }
    const namespace = cleanNs(options && options.namespace);
    let docs = build(namespace).map(cloneDoc);
    if (namespace !== "default") {
      docs = docs.map((doc) => walkReplaceDefaultSvc(doc, namespace));
    }
    if (options && options.backendGroup) {
      docs = alignAgwGroup(docs, options.backendGroup);
    }
    return docs;
  }

  function generateMcpDeployYaml(id, options) {
    const recipe = mcpDeployRecipe(id);
    const docs = mcpDeployDocs(id, options);
    if (!recipe || docs.length === 0) {
      return "";
    }
    return joinDocs(docs, `# Docs: ${recipe.docs}\n`);
  }

  const MCP_STATUS_DEPLOYS = ["everything", "fetcher", "virtual"];
  const MCP_STATUS_RANK = {
    Error: 0,
    Missing: 1,
    Pending: 2,
    Running: 3,
  };

  function conditionStatus(conditions, type) {
    if (!Array.isArray(conditions)) {
      return null;
    }
    const found = conditions.find((item) => item && item.type === type);
    return found ? String(found.status || "") : null;
  }

  function parentConditions(resource) {
    const parents = resource && resource.status && resource.status.parents;
    if (!Array.isArray(parents)) {
      return [];
    }
    return parents.flatMap((parent) =>
      parent && Array.isArray(parent.conditions) ? parent.conditions : []
    );
  }

  function resourceConditions(resource) {
    const fromParents = parentConditions(resource);
    if (fromParents.length) {
      return fromParents;
    }
    const status = resource && resource.status;
    return (status && Array.isArray(status.conditions) && status.conditions) || [];
  }

  function mcpResourceState(kind, getResult) {
    if (getResult && getResult.error) {
      return { state: "Error", detail: String(getResult.error) };
    }
    const status = getResult && getResult.status;
    if (status == null) {
      return { state: "Error", detail: "no response" };
    }
    if (status === 404) {
      return { state: "Missing", detail: `${kind} not found` };
    }
    if (status >= 400) {
      return { state: "Error", detail: `HTTP ${status}` };
    }
    const resource = (getResult && getResult.payload) || {};
    if (kind === "Deployment") {
      const desired =
        (resource.spec && resource.spec.replicas) != null
          ? resource.spec.replicas
          : resource.status && resource.status.replicas != null
            ? resource.status.replicas
            : 1;
      const ready =
        resource.status && resource.status.readyReplicas != null
          ? resource.status.readyReplicas
          : 0;
      const detail = `${ready}/${desired} ready`;
      if (desired > 0 && ready >= desired) {
        return { state: "Running", detail };
      }
      return { state: "Pending", detail };
    }
    if (kind === "HTTPRoute") {
      const conditions = resourceConditions(resource);
      const accepted = conditionStatus(conditions, "Accepted");
      const programmed = conditionStatus(conditions, "Programmed");
      const parts = [];
      if (accepted != null) {
        parts.push(`Accepted=${accepted}`);
      }
      if (programmed != null) {
        parts.push(`Programmed=${programmed}`);
      }
      if (accepted === "False" || programmed === "False") {
        return { state: "Pending", detail: parts.join(" ") || "not accepted" };
      }
      if (accepted === "True" && (programmed == null || programmed === "True")) {
        return { state: "Running", detail: parts.join(" ") || "Accepted" };
      }
      return { state: "Pending", detail: parts.join(" ") || "no parent conditions" };
    }
    const conditions = resourceConditions(resource);
    const ready =
      conditionStatus(conditions, "Accepted") ||
      conditionStatus(conditions, "Ready") ||
      conditionStatus(conditions, "Programmed");
    if (ready === "False") {
      return { state: "Pending", detail: `${kind} not ready` };
    }
    return { state: "Running", detail: kind };
  }

  function mcpRollupState(parts) {
    const listed = Array.isArray(parts) ? parts : [];
    if (!listed.length) {
      return { state: "Missing", detail: "no resources", parts: listed };
    }
    let worst = listed[0];
    for (const part of listed) {
      const rank = MCP_STATUS_RANK[part.state];
      const worstRank = MCP_STATUS_RANK[worst.state];
      if (rank != null && (worstRank == null || rank < worstRank)) {
        worst = part;
      }
    }
    const detail = listed
      .map((part) => `${part.kind}/${part.name}: ${part.detail || part.state}`)
      .join(" · ");
    return { state: worst.state, detail, parts: listed };
  }

  function llmDefaults(provider) {
    const spec = LLM_DEFAULTS[provider] || LLM_DEFAULTS.openai;
    const fallbackProvider = provider === "openai" ? "claude" : "openai";
    const fallbackSpec = LLM_DEFAULTS[fallbackProvider] || LLM_DEFAULTS.claude;
    return {
      provider: LLM_DEFAULTS[provider] ? provider : "openai",
      gateway: DEFAULT_GATEWAY,
      namespace: DEFAULT_NS,
      failover: false,
      host: "",
      port: "",
      providerPath: "",
      region: "",
      rewriteTo: "",
      fallbackProvider,
      fallbackSecretRef: fallbackSpec.secretRef,
      ...HEALTH_DEFAULTS,
      ...spec,
    };
  }

  function mcpDefaults(preset) {
    const spec = MCP_DEFAULTS[preset] || MCP_DEFAULTS.remote;
    return {
      preset: MCP_DEFAULTS[preset] ? preset : "remote",
      gateway: DEFAULT_GATEWAY,
      namespace: DEFAULT_NS,
      ...spec,
    };
  }

  function pick(obj, path) {
    let cur = obj;
    for (const key of path) {
      if (!cur || typeof cur !== "object") {
        return undefined;
      }
      cur = cur[key];
    }
    return cur;
  }

  function detectProviderFromBlock(block) {
    if (!block || typeof block !== "object") {
      return "openai";
    }
    if (block.bedrock) {
      return "bedrock";
    }
    if (block.anthropic) {
      return "claude";
    }
    if (block.gemini) {
      return "gemini";
    }
    if (block.host) {
      return "grok";
    }
    if (block.openai) {
      return "openai";
    }
    return "openai";
  }

  function detectLlmProvider(spec) {
    const provider = pick(spec, ["ai", "provider"]) || {};
    const firstGroup = pick(spec, ["ai", "groups", 0, "providers", 0]) || {};
    const src = provider.openai || provider.anthropic || provider.bedrock || provider.gemini
      ? provider
      : firstGroup;
    return detectProviderFromBlock(src);
  }

  function groupsAreProviderFailover(spec) {
    const groups = pick(spec, ["ai", "groups"]) || [];
    const providers = groups
      .map((group) => detectProviderFromBlock((group && group.providers && group.providers[0]) || {}))
      .filter(Boolean);
    return providers.length > 1 && providers.some((item) => item !== providers[0]);
  }

  function secretFromProvider(block) {
    return (
      pick(block, ["policies", "auth", "secretRef", "name"]) ||
      pick(block, ["policies", "auth", "aws", "secretRef", "name"]) ||
      ""
    );
  }

  function secretNameFromSpec(spec) {
    return (
      pick(spec, ["policies", "auth", "secretRef", "name"]) ||
      pick(spec, ["policies", "auth", "aws", "secretRef", "name"]) ||
      secretFromProvider(pick(spec, ["ai", "groups", 0, "providers", 0]) || {}) ||
      ""
    );
  }

  function modelFromProvider(block) {
    if (!block || typeof block !== "object") {
      return "";
    }
    if (block.openai && block.openai.model) {
      return block.openai.model;
    }
    if (block.anthropic && block.anthropic.model) {
      return block.anthropic.model;
    }
    if (block.bedrock && block.bedrock.model) {
      return block.bedrock.model;
    }
    if (block.gemini && block.gemini.model) {
      return block.gemini.model;
    }
    return "";
  }

  function fieldsFromHealthPolicy(item) {
    const health = pick(item, ["spec", "backend", "health"]) || {};
    const eviction = health.eviction || {};
    return {
      unhealthyCondition:
        health.unhealthyCondition || HEALTH_DEFAULTS.unhealthyCondition,
      evictionDuration: eviction.duration || HEALTH_DEFAULTS.evictionDuration,
      consecutiveFailures:
        eviction.consecutiveFailures != null
          ? eviction.consecutiveFailures
          : HEALTH_DEFAULTS.consecutiveFailures,
      policyName: pick(item, ["metadata", "name"]) || "",
      targetBackend: pick(item, ["spec", "targetRefs", 0, "name"]) || "",
    };
  }

  function isHealthPolicy(item) {
    return Boolean(pick(item, ["spec", "backend", "health"]));
  }

  function fieldsFromLlmResource(item, route, policy) {
    const spec = (item && item.spec) || {};
    const provider = detectLlmProvider(spec);
    const defaults = llmDefaults(provider);
    const providerBlock = pick(spec, ["ai", "provider"]) || {};
    const groups = pick(spec, ["ai", "groups"]) || [];
    const primary = pick(spec, ["ai", "groups", 0, "providers", 0]) || {};
    const fallback = pick(spec, ["ai", "groups", 1, "providers", 0]) || {};
    const src = providerBlock.openai || providerBlock.anthropic || providerBlock.bedrock || providerBlock.gemini
      ? providerBlock
      : primary;
    const routeSpec = (route && route.spec) || {};
    const match = pick(routeSpec, ["rules", 0, "matches", 0, "path", "value"]);
    const rewrite = pick(routeSpec, [
      "rules",
      0,
      "filters",
      0,
      "urlRewrite",
      "path",
      "replacePrefixMatch",
    ]);
    const providerFailover = groupsAreProviderFailover(spec);
    const failover = Boolean(groups.length);
    const fallbackModels = groups
      .slice(1)
      .map((group) => modelFromProvider((group && group.providers && group.providers[0]) || {}))
      .filter(Boolean);
    const health = policy ? fieldsFromHealthPolicy(policy) : {};
    return {
      ...defaults,
      name: pick(item, ["metadata", "name"]) || defaults.name,
      namespace: pick(item, ["metadata", "namespace"]) || defaults.namespace,
      provider,
      model: modelFromProvider(src) || defaults.model,
      fallbackModel: fallbackModels.join(", ") || modelFromProvider(fallback) || defaults.fallbackModel,
      fallbackProvider: providerFailover
        ? detectProviderFromBlock(fallback)
        : defaults.fallbackProvider,
      fallbackSecretRef: providerFailover
        ? secretFromProvider(fallback) || defaults.fallbackSecretRef
        : defaults.fallbackSecretRef,
      secretRef: secretNameFromSpec(spec) || defaults.secretRef,
      routePath: match || defaults.routePath,
      rewriteTo: rewrite || "",
      gateway:
        pick(routeSpec, ["parentRefs", 0, "name"]) || defaults.gateway,
      host: src.host || primary.host || defaults.host || "",
      port: src.port != null ? String(src.port) : defaults.port || "",
      providerPath: src.path || primary.path || defaults.providerPath || "",
      region: pick(src, ["bedrock", "region"]) || defaults.region || "",
      failover,
      preset: failover
        ? providerFailover
          ? "provider-failover"
          : "model-failover"
        : provider,
      unhealthyCondition:
        health.unhealthyCondition || defaults.unhealthyCondition,
      evictionDuration: health.evictionDuration || defaults.evictionDuration,
      consecutiveFailures:
        health.consecutiveFailures != null
          ? health.consecutiveFailures
          : defaults.consecutiveFailures,
    };
  }

  function fieldsFromMcpResource(item, route) {
    const spec = (item && item.spec) || {};
    const mcp = spec.entMcp || spec.mcp || {};
    const target = pick(mcp, ["targets", 0]) || {};
    const staticTarget = target.static || {};
    const protocol = staticTarget.protocol || "SSE";
    const preset = protocol === "OpenAPI" ? "openapi" : "remote";
    const defaults = mcpDefaults(preset);
    const routeSpec = (route && route.spec) || {};
    return {
      ...defaults,
      name: pick(item, ["metadata", "name"]) || defaults.name,
      namespace: pick(item, ["metadata", "namespace"]) || defaults.namespace,
      targetName: target.name || defaults.targetName,
      host: staticTarget.host || defaults.host,
      port: staticTarget.port != null ? String(staticTarget.port) : defaults.port,
      protocol,
      targetPath: staticTarget.path || "",
      routePath:
        pick(routeSpec, ["rules", 0, "matches", 0, "path", "value"]) ||
        defaults.routePath,
      gateway: pick(routeSpec, ["parentRefs", 0, "name"]) || defaults.gateway,
      toolMode: mcp.toolMode || "Standard",
      secretRef: secretNameFromSpec(spec) || "",
      schemaRef: pick(staticTarget, ["openAPI", "schemaRef", "name"]) || "",
      preset,
    };
  }

  function fieldsFromRoute(item) {
    const spec = (item && item.spec) || {};
    const backend = pick(spec, ["rules", 0, "backendRefs", 0]) || {};
    return {
      name: pick(item, ["metadata", "name"]) || backend.name || "",
      namespace: pick(item, ["metadata", "namespace"]) || DEFAULT_NS,
      routePath: pick(spec, ["rules", 0, "matches", 0, "path", "value"]) || "",
      rewriteTo:
        pick(spec, [
          "rules",
          0,
          "filters",
          0,
          "urlRewrite",
          "path",
          "replacePrefixMatch",
        ]) || "",
      gateway: pick(spec, ["parentRefs", 0, "name"]) || DEFAULT_GATEWAY,
      backendName: backend.name || "",
    };
  }

  function stripResource(item) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const metadata = item.metadata || {};
    return {
      apiVersion: item.apiVersion,
      kind: item.kind,
      metadata: {
        name: metadata.name,
        namespace: metadata.namespace,
      },
      spec: item.spec,
    };
  }

  function resourceToYaml(item) {
    const doc = stripResource(item);
    if (!doc || !doc.kind) {
      return "";
    }
    return toYaml(doc);
  }

  function isAiBackend(item) {
    return Boolean(pick(item, ["spec", "ai"]));
  }

  function isMcpBackend(item) {
    return Boolean(pick(item, ["spec", "mcp"]) || pick(item, ["spec", "entMcp"]));
  }

  function matchingRoute(routes, backendName) {
    return (routes || []).find((route) => {
      const refs = pick(route, ["spec", "rules"]) || [];
      return refs.some((rule) =>
        (rule.backendRefs || []).some((ref) => ref && ref.name === backendName)
      );
    });
  }

  return {
    AGW_API,
    GW_API,
    AGW_GROUP,
    DEFAULT_GATEWAY,
    DEFAULT_NS,
    KIND_BACKEND,
    KIND_ROUTE,
    KIND_GATEWAY,
    KIND_POLICY,
    LLM_PRESETS,
    LLM_CATALOG,
    catalogRecipe,
    MCP_PRESETS,
    MCP_DEPLOYS,
    HEALTH_DEFAULTS,
    llmDefaults,
    mcpDefaults,
    generateLlmYaml,
    generateMcpYaml,
    mcpDeployRecipe,
    mcpDeployDocs,
    generateMcpDeployYaml,
    MCP_STATUS_DEPLOYS,
    mcpResourceState,
    mcpRollupState,
    alignAgwGroup,
    isFailoverPreset,
    normalizeFailoverPreset,
    parseModelList,
    fieldsFromHealthPolicy,
    isHealthPolicy,
    generateGatewayYaml(fields) {
      return generateLlmYaml({ ...fields, preset: "gateway" });
    },
    parseTargetUrl,
    fieldsFromLlmResource,
    fieldsFromMcpResource,
    fieldsFromRoute,
    resourceToYaml,
    stripResource,
    isAiBackend,
    isMcpBackend,
    matchingRoute,
    toYaml,
  };
});
