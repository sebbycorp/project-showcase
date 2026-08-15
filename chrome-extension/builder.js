/* Form → YAML for Agentgateway CRDs. Documented kinds only; secretRef name only. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.AgwBuilder = api;
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

  const LLM_PRESETS = [
    { id: "openai", label: "OpenAI backend + HTTPRoute", provider: "openai" },
    { id: "claude", label: "Claude backend + HTTPRoute", provider: "claude" },
    { id: "grok", label: "Grok (OpenAI-compat) + HTTPRoute", provider: "grok" },
    { id: "bedrock", label: "Bedrock backend + HTTPRoute", provider: "bedrock" },
    { id: "gemini", label: "Gemini backend + HTTPRoute", provider: "gemini" },
    { id: "model-failover", label: "Model failover (same provider)", group: "Policies" },
    {
      id: "provider-failover",
      label: "Provider failover (OpenAI → Claude / Grok)",
      group: "Policies",
    },
    { id: "httproute", label: "HTTPRoute add-on only" },
    { id: "gateway", label: "Gateway (HTTP :80)" },
  ];

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

  function generateLlmYaml(fields) {
    const mode = fields.preset || "backend";
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
    MCP_PRESETS,
    HEALTH_DEFAULTS,
    llmDefaults,
    mcpDefaults,
    generateLlmYaml,
    generateMcpYaml,
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
