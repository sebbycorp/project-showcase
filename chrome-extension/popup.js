const DEFAULT_ENDPOINT = "http://35.226.209.32/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_FALLBACK_MODEL = "gpt-4o";
const DEFAULT_MCP_ENDPOINT = "http://35.226.209.32/mcp";
const DEFAULT_A2A_ENDPOINT = "http://35.226.209.32/.well-known/agent-card.json";
const DEFAULT_CLUSTER_NAMESPACE = "agentgateway-system";
const DEFAULT_OMNI_URL = "https://maniak.na-west-1.omni.siderolabs.io";
const DEFAULT_SOLO_UI = "http://35.225.111.45/age/";
const CHAT_PATH = "/v1/chat/completions";
const TEST_MESSAGE = { role: "user", content: "Reply with the word pong." };
const JUNK_PROMPT = `policy-probe ${"x".repeat(1024)}`;
const BODY_SNIPPET = 400;
const AREAS = ["chat", "llm", "mcp", "a2a", "api", "settings"];
const STORAGE_KEYS = [
  "endpoint",
  "model",
  "provider",
  "primaryModel",
  "fallbackModel",
  "mcpEndpoint",
  "a2aEndpoint",
  "httpUrl",
  "httpMethod",
  "area",
  "scenario",
  "chosenModel",
  "llmExample",
  "mcpExample",
  "a2aExample",
  "securityExample",
  "apiExample",
  "llmPreset",
  "llmName",
  "llmBuilderNamespace",
  "llmBuilderModel",
  "llmBuilderFallback",
  "llmSecret",
  "llmPath",
  "llmGateway",
  "llmHost",
  "llmPort",
  "llmProviderPath",
  "llmRegion",
  "llmFallbackProvider",
  "llmFallbackSecret",
  "llmUnhealthyCondition",
  "llmEvictionDuration",
  "llmConsecutiveFailures",
  "failoverPrimaryProvider",
  "failoverFallbackProvider",
  "llmTargetRoute",
  "llmPrompt",
  "llmPromptAppend",
  "llmRegex",
  "llmHeaderName",
  "llmHeaderValue",
  "llmTransformField",
  "llmCel",
  "llmAliasName",
  "llmAliasTarget",
  "llmRateLimitCount",
  "llmRateLimitUnit",
  "llmRateLimitType",
  "llmBudgetAmount",
  "llmBudgetWindow",
  "mcpPreset",
  "mcpName",
  "mcpBuilderNamespace",
  "mcpHost",
  "mcpPort",
  "mcpProtocol",
  "mcpPath",
  "mcpGateway",
  "mcpToolMode",
  "mcpSecret",
  "mcpSchema",
  "llmYaml",
  "mcpYaml",
  "a2aYaml",
  "securityYaml",
  "apiYaml",
  "clusterType",
  "clusterSource",
  "clusterApiServer",
  "clusterToken",
  "clusterNamespace",
  "clusterKubeconfig",
  "omniUrl",
  "omniServiceAccountKey",
  "omniContext",
  "clusterConnected",
  "clusterKind",
  "clusterManifest",
  "hooray",
  "soloUi",
  "demoStage",
  "settingsFocus",
  "llmDeployOpen",
  "mcpDeployOpen",
  "a2aDeployOpen",
  "apiDeployOpen",
];
const PROVIDERS = {
  openai: {
    id: "openai",
    label: "OpenAI",
    model: "gpt-4o-mini",
    fallback: "gpt-4o",
    example: "openai",
    failoverExample: "failover",
    httprouteExample: "httproute",
  },
  claude: {
    id: "claude",
    label: "Claude",
    model: "claude-sonnet-4-5",
    fallback: "claude-3-5-sonnet",
    example: "claude",
    failoverExample: "failoverClaude",
    httprouteExample: "httprouteClaude",
  },
  grok: {
    id: "grok",
    label: "Grok",
    model: "grok-3",
    fallback: "grok-2-latest",
    example: "grok",
    failoverExample: "failoverGrok",
    httprouteExample: "httprouteGrok",
  },
  bedrock: {
    id: "bedrock",
    label: "Bedrock",
    model: "amazon.nova-micro-v1:0",
    fallback: "amazon.titan-text-lite-v1",
    example: "bedrock",
    failoverExample: "failoverBedrock",
    httprouteExample: "httprouteBedrock",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    model: "gemini-2.0-flash",
    fallback: "gemini-1.5-flash",
    example: "gemini",
    failoverExample: "failoverGemini",
    httprouteExample: "httprouteGemini",
  },
};
// USD per 1M tokens. In-extension estimate only — not a bill.
const MODEL_RATES = [
  { match: /^gpt-4o-mini/i, prompt: 0.15, completion: 0.6 },
  { match: /^gpt-4o/i, prompt: 2.5, completion: 10 },
  { match: /claude-3-5-haiku|claude-haiku/i, prompt: 0.8, completion: 4 },
  { match: /claude-opus/i, prompt: 15, completion: 75 },
  { match: /claude-sonnet-4|claude-3-5-sonnet|claude-3\.5-sonnet|claude/i, prompt: 3, completion: 15 },
  { match: /grok-3/i, prompt: 3, completion: 15 },
  { match: /grok/i, prompt: 2, completion: 10 },
  { match: /titan-text-lite/i, prompt: 0.15, completion: 0.2 },
  { match: /nova-micro/i, prompt: 0.035, completion: 0.14 },
  { match: /nova-lite/i, prompt: 0.06, completion: 0.24 },
  { match: /anthropic\.claude|us\.anthropic/i, prompt: 3, completion: 15 },
  { match: /gemini-2\.0-flash|gemini-2\.5-flash|gemini-1\.5-flash/i, prompt: 0.1, completion: 0.4 },
  { match: /gemini/i, prompt: 0.15, completion: 0.6 },
  { match: /amazon\.|bedrock/i, prompt: 0.15, completion: 0.6 },
];
const CLUSTER_HELP = {
  gke: "API server from kubectl cluster-info or gcloud container clusters describe. Token from gcloud auth print-access-token. Chrome cannot run gke-gcloud-auth-plugin.",
  aks: "API server from az aks show. Token from a service account or az/kubelogin output — not the exec kubeconfig alone.",
  eks: "API server from aws eks describe-cluster. Token from aws eks get-token --cluster-name …. Chrome cannot run the AWS exec plugin.",
  local:
    "API server + bearer token (for example kubectl create token). Chrome rejects self-signed CAs, so kind/minikube often fail unless the CA is trusted.",
};
const CLUSTER_SOURCE_HELP = {
  manual:
    "API server + bearer token. Chrome cannot run kubeconfig exec plugins.",
  omni:
    "Paste a service-account kubeconfig from omnictl. Human/OIDC kubeconfigs use exec and will not work in Chrome.",
};
const K8S_KINDS = {
  Gateway: {
    group: "gateway.networking.k8s.io",
    version: "v1",
    plural: "gateways",
  },
  HTTPRoute: {
    group: "gateway.networking.k8s.io",
    version: "v1",
    plural: "httproutes",
  },
  EnterpriseAgentgatewayBackend: {
    group: "enterpriseagentgateway.solo.io",
    version: "v1alpha1",
    plural: "enterpriseagentgatewaybackends",
  },
  EnterpriseAgentgatewayPolicy: {
    group: "enterpriseagentgateway.solo.io",
    version: "v1alpha1",
    plural: "enterpriseagentgatewaypolicies",
  },
  AgentgatewayModel: {
    group: "agentgateway.dev",
    version: "v1alpha1",
    plural: "agentgatewaymodels",
  },
  RateLimitConfig: {
    group: "ratelimit.solo.io",
    version: "v1alpha1",
    plural: "ratelimitconfigs",
  },
  EnterpriseAgentgatewayBudget: {
    group: "enterpriseagentgateway.solo.io",
    version: "v1alpha1",
    plural: "enterpriseagentgatewaybudgets",
  },
  Deployment: {
    group: "apps",
    version: "v1",
    plural: "deployments",
  },
  Service: {
    core: true,
    group: "",
    version: "v1",
    plural: "services",
  },
  ConfigMap: {
    core: true,
    group: "",
    version: "v1",
    plural: "configmaps",
  },
};
const EXAMPLE_MANIFEST = `apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: agentgateway-proxy
  namespace: agentgateway-system
spec:
  gatewayClassName: enterprise-agentgateway
  listeners:
    - protocol: HTTP
      port: 80
      name: http
      allowedRoutes:
        namespaces:
          from: All
---
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: openai
  namespace: agentgateway-system
spec:
  ai:
    provider:
      openai: {}
  policies:
    auth:
      secretRef:
        name: openai-secret
    ai:
      routes:
        "/v1/responses": "Responses"
        "/v1/chat/completions": "Completions"
        "/v1/models": "Models"
        "*": "Passthrough"
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: openai
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - backendRefs:
        - name: openai
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`;

const els = {
  tabChat: document.getElementById("tab-chat"),
  tabLlm: document.getElementById("tab-llm"),
  tabMcp: document.getElementById("tab-mcp"),
  tabA2a: document.getElementById("tab-a2a"),
  tabApi: document.getElementById("tab-api"),
  areaChat: document.getElementById("area-chat"),
  areaLlm: document.getElementById("area-llm"),
  areaMcp: document.getElementById("area-mcp"),
  areaA2a: document.getElementById("area-a2a"),
  areaApi: document.getElementById("area-api"),
  endpoint: document.getElementById("endpoint"),
  provider: document.getElementById("provider"),
  llmProvider: document.getElementById("llm-provider"),
  model: document.getElementById("model"),
  test: document.getElementById("test"),
  testResult: document.getElementById("test-result"),
  log: document.getElementById("log"),
  form: document.getElementById("chat-form"),
  message: document.getElementById("message"),
  send: document.getElementById("send"),
  primaryModel: document.getElementById("primary-model"),
  fallbackModel: document.getElementById("fallback-model"),
  chosenModel: document.getElementById("chosen-model"),
  runChatPing: document.getElementById("run-chat-ping"),
  runFailover: document.getElementById("run-failover"),
  runListCall: document.getElementById("run-list-call"),
  llmHint: document.getElementById("llm-endpoint-hint"),
  llmExample: document.getElementById("llm-example"),
  llmPreset: document.getElementById("llm-preset"),
  llmCatalog: document.getElementById("llm-catalog"),
  llmCatalogSearch: document.getElementById("llm-catalog-search"),
  llmCatalogTitle: document.getElementById("llm-catalog-title"),
  llmCatalogBlurb: document.getElementById("llm-catalog-blurb"),
  llmDocsLink: document.getElementById("llm-docs-link"),
  llmDocsOnly: document.getElementById("llm-docs-only"),
  llmFormWrap: document.getElementById("llm-form-wrap"),
  llmApplyWrap: document.getElementById("llm-apply-wrap"),
  llmBuilderProvider: document.getElementById("llm-builder-provider"),
  llmName: document.getElementById("llm-name"),
  llmNamespace: document.getElementById("llm-namespace"),
  llmBuilderModel: document.getElementById("llm-model"),
  llmFallbackWrap: document.getElementById("llm-fallback-wrap"),
  llmBuilderFallback: document.getElementById("llm-fallback"),
  llmSecret: document.getElementById("llm-secret"),
  llmPath: document.getElementById("llm-path"),
  llmGateway: document.getElementById("llm-gateway"),
  llmHostWrap: document.getElementById("llm-host-wrap"),
  llmHost: document.getElementById("llm-host"),
  llmPortWrap: document.getElementById("llm-port-wrap"),
  llmPort: document.getElementById("llm-port"),
  llmProviderPathWrap: document.getElementById("llm-provider-path-wrap"),
  llmProviderPath: document.getElementById("llm-provider-path"),
  llmRegionWrap: document.getElementById("llm-region-wrap"),
  llmRegion: document.getElementById("llm-region"),
  llmPolicyHint: document.getElementById("llm-policy-hint"),
  llmModelLabel: document.getElementById("llm-model-label"),
  llmFallbackProviderWrap: document.getElementById("llm-fallback-provider-wrap"),
  llmFallbackProvider: document.getElementById("llm-fallback-provider"),
  llmFallbackSecret: document.getElementById("llm-fallback-secret"),
  llmHealthWrap: document.getElementById("llm-health-wrap"),
  llmUnhealthy: document.getElementById("llm-unhealthy"),
  llmEviction: document.getElementById("llm-eviction"),
  llmFailures: document.getElementById("llm-failures"),
  llmTargetWrap: document.getElementById("llm-target-wrap"),
  llmTargetRoute: document.getElementById("llm-target-route"),
  llmPromptWrap: document.getElementById("llm-prompt-wrap"),
  llmPrompt: document.getElementById("llm-prompt"),
  llmPromptAppendWrap: document.getElementById("llm-prompt-append-wrap"),
  llmPromptAppend: document.getElementById("llm-prompt-append"),
  llmRegexWrap: document.getElementById("llm-regex-wrap"),
  llmRegex: document.getElementById("llm-regex"),
  llmHeaderWrap: document.getElementById("llm-header-wrap"),
  llmHeaderName: document.getElementById("llm-header-name"),
  llmHeaderValue: document.getElementById("llm-header-value"),
  llmTransformWrap: document.getElementById("llm-transform-wrap"),
  llmTransformField: document.getElementById("llm-transform-field"),
  llmCel: document.getElementById("llm-cel"),
  llmAliasWrap: document.getElementById("llm-alias-wrap"),
  llmAliasName: document.getElementById("llm-alias-name"),
  llmAliasTarget: document.getElementById("llm-alias-target"),
  llmRatelimitWrap: document.getElementById("llm-ratelimit-wrap"),
  llmRlCount: document.getElementById("llm-rl-count"),
  llmRlUnit: document.getElementById("llm-rl-unit"),
  llmRlType: document.getElementById("llm-rl-type"),
  llmBudgetWrap: document.getElementById("llm-budget-wrap"),
  llmBudgetAmount: document.getElementById("llm-budget-amount"),
  llmBudgetWindow: document.getElementById("llm-budget-window"),
  llmRegen: document.getElementById("llm-regen"),
  llmInvRefresh: document.getElementById("llm-inv-refresh"),
  llmInventory: document.getElementById("llm-inventory"),
  llmYaml: document.getElementById("llm-yaml"),
  applyLlm: document.getElementById("apply-llm"),
  llmApplyResult: document.getElementById("llm-apply-result"),
  mcpEndpoint: document.getElementById("mcp-endpoint"),
  mcpJwtToken: document.getElementById("mcp-jwt-token"),
  mcpDeployPrimary: document.getElementById("mcp-deploy-primary"),
  mcpDeployMore: document.getElementById("mcp-deploy-more"),
  mcpDocsCards: document.getElementById("mcp-docs-cards"),
  mcpDeployResult: document.getElementById("mcp-deploy-result"),
  probeMcp: document.getElementById("probe-mcp"),
  probeMcpList: document.getElementById("probe-mcp-list"),
  probeMcpEcho: document.getElementById("probe-mcp-echo"),
  probeMcpFetch: document.getElementById("probe-mcp-fetch"),
  probeMcpJwt: document.getElementById("probe-mcp-jwt"),
  probeMcpTools: document.getElementById("probe-mcp-tools"),
  a2aEndpoint: document.getElementById("a2a-endpoint"),
  probeA2a: document.getElementById("probe-a2a"),
  mcpExample: document.getElementById("mcp-example"),
  mcpPreset: document.getElementById("mcp-preset"),
  mcpName: document.getElementById("mcp-name"),
  mcpNamespace: document.getElementById("mcp-namespace"),
  mcpHost: document.getElementById("mcp-host"),
  mcpPort: document.getElementById("mcp-port"),
  mcpProtocol: document.getElementById("mcp-protocol"),
  mcpPath: document.getElementById("mcp-path"),
  mcpGateway: document.getElementById("mcp-gateway"),
  mcpToolMode: document.getElementById("mcp-tool-mode"),
  mcpSecret: document.getElementById("mcp-secret"),
  mcpSchemaWrap: document.getElementById("mcp-schema-wrap"),
  mcpSchema: document.getElementById("mcp-schema"),
  mcpRegen: document.getElementById("mcp-regen"),
  mcpInvRefresh: document.getElementById("mcp-inv-refresh"),
  mcpInventory: document.getElementById("mcp-inventory"),
  mcpYaml: document.getElementById("mcp-yaml"),
  applyMcp: document.getElementById("apply-mcp"),
  mcpApplyResult: document.getElementById("mcp-apply-result"),
  a2aExample: document.getElementById("a2a-example"),
  a2aYaml: document.getElementById("a2a-yaml"),
  applyA2a: document.getElementById("apply-a2a"),
  a2aApplyResult: document.getElementById("a2a-apply-result"),
  httpMethod: document.getElementById("http-method"),
  httpUrl: document.getElementById("http-url"),
  runHttp: document.getElementById("run-http"),
  runUnauth: document.getElementById("run-unauth"),
  runJunk: document.getElementById("run-junk"),
  apiHint: document.getElementById("api-endpoint-hint"),
  apiExample: document.getElementById("api-example"),
  apiYaml: document.getElementById("api-yaml"),
  applyApi: document.getElementById("apply-api"),
  apiApplyResult: document.getElementById("api-apply-result"),
  resultChatPing: document.getElementById("result-chat-ping"),
  resultFailover: document.getElementById("result-failover"),
  resultListCall: document.getElementById("result-list-call"),
  resultMcp: document.getElementById("result-mcp"),
  resultMcpList: document.getElementById("result-mcp-list"),
  resultMcpEcho: document.getElementById("result-mcp-echo"),
  resultMcpFetch: document.getElementById("result-mcp-fetch"),
  resultMcpJwt: document.getElementById("result-mcp-jwt"),
  resultMcpTools: document.getElementById("result-mcp-tools"),
  resultA2a: document.getElementById("result-a2a"),
  resultHttp: document.getElementById("result-http"),
  resultUnauth: document.getElementById("result-unauth"),
  resultJunk: document.getElementById("result-junk"),
  seqChat: document.getElementById("seq-chat"),
  seqChatPing: document.getElementById("seq-chat-ping"),
  seqFailover: document.getElementById("seq-failover"),
  seqListCall: document.getElementById("seq-list-call"),
  seqMcpInit: document.getElementById("seq-mcp-init"),
  seqMcpList: document.getElementById("seq-mcp-list"),
  seqMcpEcho: document.getElementById("seq-mcp-echo"),
  seqMcpFetch: document.getElementById("seq-mcp-fetch"),
  seqMcpJwt: document.getElementById("seq-mcp-jwt"),
  seqMcpTools: document.getElementById("seq-mcp-tools"),
  seqA2a: document.getElementById("seq-a2a"),
  seqHttp: document.getElementById("seq-http"),
  seqUnauth: document.getElementById("seq-unauth"),
  seqJunk: document.getElementById("seq-junk"),
  clusterSource: document.getElementById("cluster-source"),
  clusterSourceHelp: document.getElementById("cluster-source-help"),
  clusterManualFields: document.getElementById("cluster-manual-fields"),
  clusterOmniFields: document.getElementById("cluster-omni-fields"),
  clusterType: document.getElementById("cluster-type"),
  clusterHelp: document.getElementById("cluster-help"),
  clusterApiServer: document.getElementById("cluster-api-server"),
  clusterToken: document.getElementById("cluster-token"),
  omniUrl: document.getElementById("omni-url"),
  omniSaKey: document.getElementById("omni-sa-key"),
  clusterNamespace: document.getElementById("cluster-namespace"),
  clusterKubeconfig: document.getElementById("cluster-kubeconfig"),
  clusterKubeconfigLabel: document.getElementById("cluster-kubeconfig-label"),
  clusterContext: document.getElementById("cluster-context"),
  clusterContextLabel: document.getElementById("cluster-context-label"),
  parseKubeconfig: document.getElementById("parse-kubeconfig"),
  kubeconfigResult: document.getElementById("kubeconfig-result"),
  testCluster: document.getElementById("test-cluster"),
  clusterTestResult: document.getElementById("cluster-test-result"),
  crdKind: document.getElementById("crd-kind"),
  listCrds: document.getElementById("list-crds"),
  clusterInventory: document.getElementById("cluster-inventory"),
  crdListResult: document.getElementById("crd-list-result"),
  crdYaml: document.getElementById("crd-yaml"),
  loadExample: document.getElementById("load-example"),
  applyCrds: document.getElementById("apply-crds"),
  crdApplyResult: document.getElementById("crd-apply-result"),
  tabSettings: document.getElementById("tab-settings"),
  areaSettings: document.getElementById("area-settings"),
  soloUi: document.getElementById("solo-ui"),
  hooray: document.getElementById("hooray"),
  demoStage: document.getElementById("demo-stage"),
  demoToggle: document.getElementById("demo-toggle"),
  clusterChip: document.getElementById("cluster-chip"),
  clusterChipLabel: document.getElementById("cluster-chip-label"),
  clusterChipHint: document.getElementById("cluster-chip-hint"),
  clusterPanel: document.getElementById("cluster-panel"),
  confetti: document.getElementById("confetti"),
};

let hoorayOn = true;
let demoStageOn = false;
let clusterConnected = false;
let settingsFocus = "";
let clusterProbeToken = 0;

function seqStepMs() {
  return demoStageOn ? 840 : 560;
}

function seqReturnMs() {
  return demoStageOn ? 720 : 480;
}

function setDemoStage(on, persistIt = false) {
  demoStageOn = Boolean(on);
  document.documentElement.classList.toggle("demo-stage", demoStageOn);
  document.body.classList.toggle("demo-stage", demoStageOn);
  if (els.demoStage) {
    els.demoStage.checked = demoStageOn;
  }
  if (els.demoToggle) {
    els.demoToggle.classList.toggle("is-active", demoStageOn);
    els.demoToggle.setAttribute("aria-pressed", demoStageOn ? "true" : "false");
  }
  if (persistIt) {
    persist({ demoStage: demoStageOn });
  }
}

function clusterHintLabel() {
  const settings = currentClusterSettings();
  if (settings.clusterSource === "omni") {
    const name =
      settings.omniContext ||
      (els.clusterContext && els.clusterContext.value) ||
      "";
    if (name) {
      return name;
    }
  }
  const server = settings.clusterApiServer;
  if (!server) {
    return "";
  }
  try {
    return new URL(server).host;
  } catch {
    return "";
  }
}

function setClusterChip(state) {
  const chip = els.clusterChip;
  if (!chip) {
    return;
  }
  const label =
    state === "checking"
      ? "Checking"
      : state === "connected"
        ? "Connected"
        : "Not connected";
  const hint = clusterHintLabel();
  chip.classList.toggle("is-checking", state === "checking");
  chip.classList.toggle("is-connected", state === "connected");
  chip.classList.toggle("is-disconnected", state === "disconnected");
  if (els.clusterChipLabel) {
    els.clusterChipLabel.textContent = label;
  }
  if (els.clusterChipHint) {
    els.clusterChipHint.textContent = hint;
    els.clusterChipHint.hidden = !hint;
  }
  chip.title = hint
    ? `${label} — ${hint}. Open Settings → Cluster.`
    : `${label}. Open Settings → Cluster.`;
}

function scrollToCluster() {
  const panel = els.clusterPanel;
  if (!panel) {
    return;
  }
  requestAnimationFrame(() => {
    panel.scrollIntoView({ block: "start" });
  });
}

function openClusterSettings() {
  settingsFocus = "cluster";
  switchArea("settings");
  persist({ settingsFocus: "cluster" });
  scrollToCluster();
}

function restoreDeployViews(stored) {
  document.querySelectorAll("details.deploy[data-deploy-key]").forEach((node) => {
    const key = node.dataset.deployKey;
    if (key && stored[key] === true) {
      node.open = true;
    }
  });
}

function bindDeployViews() {
  document.querySelectorAll("details.deploy[data-deploy-key]").forEach((node) => {
    node.addEventListener("toggle", () => {
      const key = node.dataset.deployKey;
      if (key) {
        persist({ [key]: node.open });
      }
    });
  });
}

function celebrate() {
  if (!hoorayOn) {
    return;
  }
  burstConfetti(els.confetti);
}

const AREA_TABS = {
  chat: els.tabChat,
  llm: els.tabLlm,
  mcp: els.tabMcp,
  a2a: els.tabA2a,
  api: els.tabApi,
  settings: els.tabSettings,
};

const AREA_PANELS = {
  chat: els.areaChat,
  llm: els.areaLlm,
  mcp: els.areaMcp,
  a2a: els.areaA2a,
  api: els.areaApi,
  settings: els.areaSettings,
};

const messages = [];

function normalizeEndpoint(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return DEFAULT_ENDPOINT;
  }

  try {
    const url = new URL(trimmed);
    if (!url.pathname.includes(CHAT_PATH)) {
      const base = url.pathname.replace(/\/+$/, "");
      url.pathname = `${base}${CHAT_PATH}`;
    }
    return url.toString();
  } catch {
    return trimmed;
  }
}

function defaultMcpEndpoint(chatUrl) {
  try {
    const raw = (chatUrl || "").trim() || DEFAULT_ENDPOINT;
    const url = new URL(raw.includes("://") ? raw : `http://${raw}`);
    return `${url.origin}/mcp`;
  } catch {
    return DEFAULT_MCP_ENDPOINT;
  }
}

function currentMcpEndpoint() {
  return (els.mcpEndpoint.value || "").trim() || defaultMcpEndpoint(els.endpoint.value);
}

function normalizeModel(raw, fallback = DEFAULT_MODEL) {
  return (raw || "").trim() || fallback;
}

function snippet(text) {
  const value = text || "";
  if (value.length <= BODY_SNIPPET) {
    return value;
  }
  return `${value.slice(0, BODY_SNIPPET)}…`;
}

function appendBubble(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;

  const label = document.createElement("span");
  label.className = "role";
  label.textContent = role;

  const body = document.createElement("div");
  body.textContent = text;
  bubble.append(label, body);
  els.log.appendChild(bubble);
  els.log.scrollTop = els.log.scrollHeight;
}

function extractAssistantText(payload) {
  const choice = payload && payload.choices && payload.choices[0];
  if (choice && choice.message && typeof choice.message.content === "string") {
    return choice.message.content;
  }
  if (payload && payload.error && payload.error.message) {
    throw new Error(payload.error.message);
  }
  throw new Error("Unexpected response from gateway");
}

function errorDetail(payload, raw, status) {
  if (payload && payload.error && payload.error.message) {
    return payload.error.message;
  }
  return raw || `HTTP ${status}`;
}

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

async function persist(partial) {
  await chrome.storage.local.set(partial);
}

function providerSpec(id) {
  return PROVIDERS[id] || PROVIDERS.openai;
}

function currentProvider() {
  const active =
    els.provider && els.provider.querySelector(".provider-pill.is-active");
  const raw = (active && active.dataset.provider) || "";
  return PROVIDERS[raw] ? raw : providerFromModel(els.model.value);
}

function setProviderSelect(root, id) {
  if (!root) {
    return;
  }
  const spec = providerSpec(id);
  root.querySelectorAll(".provider-pill").forEach((btn) => {
    const on = btn.dataset.provider === spec.id;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-checked", on ? "true" : "false");
  });
}

function setProviderSelects(id) {
  document.querySelectorAll(".provider-switch:not([data-scope])").forEach((root) => {
    setProviderSelect(root, id);
  });
}

function fillProviderSwitch(root, selected, onPick) {
  if (!root) {
    return;
  }
  const spec = providerSpec(selected);
  root.replaceChildren();
  for (const item of Object.values(PROVIDERS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "provider-pill";
    btn.dataset.provider = item.id;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", item.id === spec.id ? "true" : "false");
    if (item.id === spec.id) {
      btn.classList.add("is-active");
    }
    const img = document.createElement("img");
    img.src = SEQ_ICONS[item.id] || SEQ_ICONS.openai;
    img.alt = "";
    const name = document.createElement("span");
    name.textContent = item.label;
    btn.append(img, name);
    btn.addEventListener("click", () => {
      onPick(item.id);
    });
    root.append(btn);
  }
}

function buildProviderSwitches(selected) {
  document.querySelectorAll(".provider-switch:not([data-scope])").forEach((root) => {
    const handler =
      root.id === "llm-builder-provider" ? onBuilderProviderChange : onProviderChange;
    fillProviderSwitch(root, selected, handler);
  });
  fillProviderSwitch(
    els.llmFallbackProvider,
    "claude",
    onFallbackProviderChange
  );
}

function providerDeployOptions(id) {
  const spec = providerSpec(id);
  return [
    ["gateway", "Gateway (HTTP :80)"],
    [spec.example, `${spec.label} backend + HTTPRoute`],
    [spec.failoverExample, "Failover backend (primary + fallback)"],
    [
      spec.httprouteExample,
      (DEPLOY_EXAMPLES.llm[spec.httprouteExample] &&
        DEPLOY_EXAMPLES.llm[spec.httprouteExample].label) ||
        "HTTPRoute add-on",
    ],
  ];
}

function refreshLlmExampleOptions(id, selectedKey) {
  if (!els.llmExample) {
    return selectedKey;
  }
  const options = providerDeployOptions(id);
  const valid = new Set(options.map(([value]) => value));
  els.llmExample.replaceChildren();
  for (const [value, label] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.llmExample.append(option);
  }
  const next = valid.has(selectedKey) ? selectedKey : options[1][0];
  els.llmExample.value = next;
  return next;
}

function applyProvider(id, { setModels = true, loadYaml = true } = {}) {
  const spec = providerSpec(id);
  setProviderSelects(spec.id);
  if (setModels) {
    els.model.value = spec.model;
    els.primaryModel.value = spec.model;
    els.fallbackModel.value = spec.fallback;
    els.chosenModel.value = spec.model;
  }
  const exampleKey = refreshLlmExampleOptions(
    spec.id,
    loadYaml ? spec.example : (els.llmExample && els.llmExample.value) || spec.example
  );
  if (loadYaml) {
    if (els.llmExample) {
      els.llmExample.value = spec.example;
    }
    applyLlmProviderDefaults(spec.id);
  }
  refreshSeqDiagrams();
  persist({
    provider: spec.id,
    model: els.model.value,
    primaryModel: els.primaryModel.value,
    fallbackModel: els.fallbackModel.value,
    chosenModel: els.chosenModel.value,
    llmExample: exampleKey,
    llmYaml: els.llmYaml.value,
  });
}

function normalizeSoloUi(raw) {
  const trimmed = (raw || "").trim() || DEFAULT_SOLO_UI;
  try {
    const url = new URL(trimmed);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/age/";
    } else if (!url.pathname.endsWith("/")) {
      url.pathname = `${url.pathname}/`;
    }
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}

function currentSoloUi() {
  const soloUi = normalizeSoloUi(els.soloUi.value);
  els.soloUi.value = soloUi;
  return soloUi;
}

function headerValue(headers, name) {
  if (!headers) {
    return "";
  }
  if (typeof headers.get === "function") {
    return headers.get(name) || "";
  }
  return headers[name.toLowerCase()] || "";
}

function traceIdFromHeaders(headers) {
  const parent = headerValue(headers, "traceparent");
  if (parent) {
    const parts = parent.split("-");
    if (parts[1] && /^[0-9a-f]{16,32}$/i.test(parts[1])) {
      return parts[1];
    }
  }
  for (const name of [
    "x-b3-traceid",
    "x-trace-id",
    "trace-id",
    "x-datadog-trace-id",
  ]) {
    const value = (headerValue(headers, name) || "").trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function traceIdFromResult(result) {
  if (!result) {
    return "";
  }
  return (
    result.traceId ||
    traceIdFromHeaders(result.headers) ||
    traceIdFromHeaders(result.response && result.response.headers)
  );
}

function soloTracesUrl(base, traceId) {
  const root = normalizeSoloUi(base);
  const id = (traceId || "").trim();
  if (id && /^[0-9a-fA-F-]{8,64}$/.test(id)) {
    return new URL(`tracing/${encodeURIComponent(id)}`, root).toString();
  }
  return new URL("tracing", root).toString();
}

function soloUiLink(result) {
  const link = document.createElement("a");
  link.className = "solo-ui-link";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open in Solo UI";
  link.href = soloTracesUrl(currentSoloUi(), traceIdFromResult(result));
  return link;
}

function usageFromPayload(payload) {
  const usage = payload && payload.usage;
  if (!usage || typeof usage !== "object") {
    return null;
  }
  if (usage.prompt_tokens == null && usage.completion_tokens == null) {
    return null;
  }
  const prompt = Number(usage.prompt_tokens);
  const completion = Number(usage.completion_tokens);
  return {
    promptTokens: Number.isFinite(prompt) ? prompt : 0,
    completionTokens: Number.isFinite(completion) ? completion : 0,
  };
}

function rateForModel(model) {
  const name = String(model || "");
  return MODEL_RATES.find((row) => row.match.test(name)) || null;
}

function formatUsd(amount) {
  if (amount >= 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  if (amount >= 0.0001) {
    return `$${amount.toFixed(6)}`;
  }
  return `$${amount.toFixed(8)}`;
}

function formatCost(usage, model) {
  if (!usage) {
    return "";
  }
  const prompt = usage.promptTokens;
  const completion = usage.completionTokens;
  const parts = [
    `${prompt.toLocaleString()} prompt`,
    `${completion.toLocaleString()} completion`,
  ];
  const rate = rateForModel(model);
  if (rate) {
    const usd =
      (prompt * rate.prompt + completion * rate.completion) / 1_000_000;
    parts.push(`${formatUsd(usd)} estimated (not a bill)`);
  } else {
    parts.push("no rate for this model (not a bill)");
  }
  return `Tokens ${parts.join(" · ")}`;
}

function costNode(usage, model) {
  const text = formatCost(usage, model);
  if (!text) {
    return null;
  }
  const node = document.createElement("div");
  node.className = "cost-line";
  node.textContent = text;
  return node;
}

function traceStrip(result) {
  if (!result) {
    return null;
  }
  const headersMs =
    result.headersMs != null && Number.isFinite(result.headersMs)
      ? result.headersMs
      : null;
  const latencyMs =
    result.latencyMs != null && Number.isFinite(result.latencyMs)
      ? result.latencyMs
      : null;
  const agentMs =
    result.agentMs != null && Number.isFinite(result.agentMs) && result.agentMs > 0
      ? result.agentMs
      : null;
  const modelMs =
    latencyMs == null
      ? null
      : headersMs != null
        ? Math.max(0, latencyMs - headersMs)
        : latencyMs;
  const rows = [
    { name: "Agent", ms: agentMs },
    { name: "Gateway", ms: headersMs },
    { name: "Model", ms: modelMs },
  ];
  if (!rows.some((row) => row.ms != null)) {
    return null;
  }
  const max = Math.max(...rows.map((row) => (row.ms == null ? 0 : row.ms)), 1);
  const wrap = document.createElement("div");
  wrap.className = "trace-strip";
  for (const row of rows) {
    const line = document.createElement("div");
    line.className = "trace-row";
    const name = document.createElement("span");
    name.className = "trace-name";
    name.textContent = row.name;
    const track = document.createElement("span");
    track.className = "trace-track";
    const bar = document.createElement("i");
    if (row.ms != null) {
      bar.style.width = `${Math.max(6, Math.round((row.ms / max) * 100))}%`;
    } else {
      bar.style.width = "0";
      bar.style.opacity = "0";
    }
    track.append(bar);
    const ms = document.createElement("span");
    ms.className = "trace-ms";
    ms.textContent = row.ms != null ? formatHopMs(row.ms) : "";
    line.append(name, track, ms);
    wrap.append(line);
  }
  return wrap;
}

function headerMap(response) {
  const out = {};
  if (!response || !response.headers || typeof response.headers.forEach !== "function") {
    return out;
  }
  response.headers.forEach((value, key) => {
    out[String(key).toLowerCase()] = value;
  });
  return out;
}

function hopFromUsage(result) {
  const usage = usageFromPayload(result && result.payload);
  const model =
    (result && result.payload && result.payload.model) ||
    (result && result.requestedModel) ||
    "";
  if (!usage && !(result && result.status)) {
    return null;
  }
  return {
    agent: "request sent",
    gateway:
      result && result.status != null
        ? `HTTP ${result.status}`
        : "headers",
    provider: model || "provider",
    usage,
  };
}

let seqProgress = null;

function notifySeqProgress(stage, detail) {
  if (typeof seqProgress === "function") {
    seqProgress(stage, detail);
  }
}

function lightHopFromStage(seq, stage, viaGateway, target, token, extras = {}) {
  if (seqTokens[seq.id] !== token) {
    return;
  }
  const targetRole = extras.targetRole || "target";
  if (stage === "start") {
    markSeq(seq, ["client"], [], "is-on");
    setSeqHop(seq, "client", null);
    setHopLabel(seq, "client", "Agent sends");
    return;
  }
  if (stage === "headers") {
    markSeq(seq, viaGateway ? ["client", "gateway"] : ["client"], [1], "is-on");
    if (viaGateway) {
      setSeqHop(seq, "gateway", 1);
      setHopLabel(seq, "gateway", "Gateway routes");
    }
    applySeqTimings(seq, viaGateway, extras);
    return;
  }
  if (stage === "body") {
    markSeq(
      seq,
      viaGateway
        ? ["client", "gateway", targetRole]
        : ["client", targetRole],
      viaGateway ? [1, 2] : [1],
      "is-on"
    );
    setSeqHop(seq, targetRole, viaGateway ? 2 : 1);
    setHopLabel(
      seq,
      "target",
      extras.phase === "fallback" ? `Failover → ${target}` : `${target} replies`
    );
    applySeqTimings(seq, viaGateway, extras);
  }
}

async function trySoloTracesApi(uiBase) {
  try {
    const root = new URL(normalizeSoloUi(uiBase));
    const candidates = [
      `${root.origin}/api/rpc.agentgateway.solo.io.AgentgatewayTracingAPI/ListChatSpans`,
      `${root.origin}/api/rpc.kagent.solo.io.TracingAPI/ListChatTraces`,
    ];
    for (const url of candidates) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.status === 401 || response.status === 403) {
          return null;
        }
        if (!response.ok) {
          continue;
        }
        const payload = await response.json();
        if (payload && (payload.spans || payload.traces)) {
          return payload;
        }
      } catch {
        clearTimeout(timer);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function currentChatSettings() {
  const endpoint = normalizeEndpoint(els.endpoint.value);
  const model = normalizeModel(els.model.value);
  els.endpoint.value = endpoint;
  els.model.value = model;
  return { endpoint, model };
}

function updateEndpointHints() {
  const endpoint = normalizeEndpoint(els.endpoint.value);
  const text = `Uses chat endpoint ${endpoint}`;
  els.llmHint.textContent = text;
  els.apiHint.textContent = text;
  if (els.httpUrl && !(els.httpUrl.value || "").trim()) {
    els.httpUrl.value = endpoint;
  }
  refreshSeqDiagrams();
}

const seqTokens = {
  "seq-chat": 0,
  "seq-chat-ping": 0,
  "seq-failover": 0,
  "seq-list-call": 0,
  "seq-mcp-init": 0,
  "seq-a2a": 0,
  "seq-http": 0,
  "seq-unauth": 0,
  "seq-junk": 0,
};

const SEQ_ICONS = {
  openai: "icons/openai.svg",
  claude: "icons/claude.svg",
  grok: "icons/grok.svg",
  bedrock: "icons/bedrock.svg",
  gemini: "icons/gemini.svg",
  mcp: "icons/mcp.svg",
  a2a: "icons/a2a.svg",
  security: "icons/policy.svg",
  api: "icons/policy.svg",
};

const SEQ_LABELS = {
  openai: "OpenAI",
  claude: "Claude",
  grok: "Grok",
  bedrock: "Bedrock",
  gemini: "Gemini",
  mcp: "MCP",
  a2a: "A2A",
  security: "Policy",
  api: "API",
};

function providerFromModel(raw) {
  const model = String(raw || "").trim().toLowerCase();
  if (
    model.includes("bedrock") ||
    model.includes("amazon") ||
    model.includes("titan") ||
    model.includes("anthropic-on-bedrock")
  ) {
    return "bedrock";
  }
  if (model.includes("claude")) {
    return "claude";
  }
  if (model.includes("grok")) {
    return "grok";
  }
  if (model.includes("gemini")) {
    return "gemini";
  }
  return "openai";
}

function providerLabel(kind) {
  return SEQ_LABELS[kind] || SEQ_LABELS.openai;
}

function pathCaption(viaGateway, target) {
  return viaGateway
    ? `AI Agent → Agentgateway → ${target}`
    : `AI Agent → ${target}`;
}

function mcpUsesGateway(mcpUrl, chatUrl) {
  try {
    const mcp = new URL((mcpUrl || "").trim() || DEFAULT_MCP_ENDPOINT);
    const chat = new URL(normalizeEndpoint(chatUrl));
    return mcp.host === chat.host;
  } catch {
    return true;
  }
}

function setSeqCaption(seq, text) {
  seq.setAttribute("aria-label", text);
}

function requestPath(url) {
  try {
    return new URL(url).pathname || "";
  } catch {
    return "";
  }
}

function formatHopMs(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) {
    return "";
  }
  if (ms >= 1000) {
    const rounded = (ms / 1000).toFixed(1).replace(/\.0$/, "");
    return `${rounded}s`;
  }
  return `${Math.round(ms)}ms`;
}

function setHopLabel(seq, role, text) {
  const hop = role === "primary" || role === "fallback" ? "target" : role;
  const node = seq.querySelector(`[data-hop="${hop}"]`);
  if (!node) {
    return;
  }
  if (!text) {
    node.hidden = true;
    node.textContent = "";
    return;
  }
  node.hidden = false;
  node.textContent = text;
}

function setArrowMs(seq, step, ms) {
  const arrow = seq.querySelector(`[data-step="${step}"]`);
  const node = arrow && arrow.querySelector(".seq-ms");
  if (!node) {
    return;
  }
  const text = formatHopMs(ms);
  if (!text) {
    node.hidden = true;
    node.textContent = "";
    return;
  }
  node.hidden = false;
  node.textContent = text;
}

function setSeqWire(seq, path, model) {
  const text = [path, model].filter(Boolean).join(" · ");
  seq.querySelectorAll(".seq-wire").forEach((node) => {
    if (!text) {
      node.hidden = true;
      node.textContent = "";
    } else {
      node.hidden = false;
      node.textContent = text;
    }
  });
}

function clearSeqNarration(seq) {
  seq.querySelectorAll(".seq-hop, .seq-ms, .seq-wire").forEach((node) => {
    node.hidden = true;
    node.textContent = "";
  });
}

function applySeqTimings(seq, viaGateway, detail) {
  if (!detail) {
    return;
  }
  if (detail.headersMs != null) {
    setArrowMs(seq, 1, detail.headersMs);
  }
  if (detail.latencyMs != null && detail.headersMs != null) {
    setArrowMs(seq, viaGateway ? 2 : 1, Math.max(0, detail.latencyMs - detail.headersMs));
  } else if (detail.latencyMs != null && !viaGateway) {
    setArrowMs(seq, 1, detail.latencyMs);
  }
}

function configureSeq(seq, { viaGateway, target, targetKind, primaryKind, fallbackKind }) {
  seq.dataset.mode = viaGateway ? "via-gw" : "direct";
  setSeqCaption(seq, pathCaption(viaGateway, target));
  if (seq.dataset.failover === "1") {
    const pKind = primaryKind || targetKind;
    const fKind = fallbackKind || targetKind;
    const primaryBox = seq.querySelector('[data-role="primary"]');
    const fallbackBox = seq.querySelector('[data-role="fallback"]');
    const primaryIcon = seq.querySelector("[data-primary-icon]");
    const fallbackIcon = seq.querySelector("[data-fallback-icon]");
    if (primaryBox) {
      primaryBox.title = providerLabel(pKind);
    }
    if (fallbackBox) {
      fallbackBox.title = providerLabel(fKind);
    }
    if (primaryIcon) {
      primaryIcon.src = SEQ_ICONS[pKind] || SEQ_ICONS.openai;
    }
    if (fallbackIcon) {
      fallbackIcon.src = SEQ_ICONS[fKind] || SEQ_ICONS.openai;
    }
  } else {
    const targetBox = seq.querySelector('[data-role="target"]');
    if (targetBox) {
      targetBox.title = target;
      const icon = targetBox.querySelector("[data-target-icon]");
      const src = SEQ_ICONS[targetKind] || SEQ_ICONS.openai;
      if (icon) {
        icon.src = src;
      }
    }
  }
  if (!seq.classList.contains("is-run")) {
    clearSeqNarration(seq);
  }
}

function llmSeqConfig(model) {
  const kind = currentProvider() || providerFromModel(model || els.model.value);
  return {
    viaGateway: true,
    target: providerLabel(kind),
    targetKind: kind,
  };
}

function mcpSeqConfig() {
  const mcpUrl = currentMcpEndpoint();
  const viaGateway = mcpUsesGateway(mcpUrl, els.endpoint.value);
  return { viaGateway, target: "MCP", targetKind: "mcp" };
}

function securitySeqConfig() {
  return { viaGateway: true, target: "Policy", targetKind: "security" };
}

function httpSeqConfig() {
  const url = (els.httpUrl.value || "").trim() || els.endpoint.value;
  const viaGateway = mcpUsesGateway(url, els.endpoint.value);
  return { viaGateway, target: "API", targetKind: "api" };
}

const appliedFailoverProviders = { primary: "", fallback: "" };

function failoverSeqConfig() {
  const fields = els.llmPreset ? currentLlmBuilderFields() : {};
  const failover = AgwBuilder.isFailoverPreset(fields.preset);
  const primaryKind = failover
    ? fields.provider
    : appliedFailoverProviders.primary ||
      providerFromModel(els.primaryModel.value);
  const fallbackKind = failover
    ? fields.preset === "provider-failover"
      ? fields.fallbackProvider
      : fields.provider
    : appliedFailoverProviders.fallback ||
      providerFromModel(els.fallbackModel.value);
  return {
    viaGateway: true,
    target: providerLabel(primaryKind),
    targetKind: primaryKind,
    primaryKind,
    fallbackKind,
    fallbackTarget: providerLabel(fallbackKind),
  };
}

function firstFallbackModel(raw, fallback) {
  const listed = AgwBuilder.parseModelList(raw);
  return listed[0] || fallback;
}

function syncFailoverTestFromBuilder() {
  if (!els.primaryModel || !els.llmPreset) {
    return;
  }
  const fields = currentLlmBuilderFields();
  if (!AgwBuilder.isFailoverPreset(fields.preset)) {
    return;
  }
  const fallbackModel =
    fields.preset === "provider-failover"
      ? fields.fallbackModel
      : firstFallbackModel(fields.fallbackModel, fields.fallbackModel);
  els.primaryModel.value = fields.model || els.primaryModel.value;
  els.fallbackModel.value = fallbackModel || els.fallbackModel.value;
  appliedFailoverProviders.primary = fields.provider;
  appliedFailoverProviders.fallback =
    fields.preset === "provider-failover"
      ? fields.fallbackProvider
      : fields.provider;
  persist({
    primaryModel: els.primaryModel.value,
    fallbackModel: els.fallbackModel.value,
    failoverPrimaryProvider: appliedFailoverProviders.primary,
    failoverFallbackProvider: appliedFailoverProviders.fallback,
  });
  refreshSeqDiagrams();
}

function refreshSeqDiagrams() {
  configureSeq(els.seqChat, llmSeqConfig(els.model.value));
  configureSeq(els.seqChatPing, llmSeqConfig(els.model.value));
  configureSeq(els.seqFailover, failoverSeqConfig());
  configureSeq(els.seqListCall, llmSeqConfig(els.chosenModel.value));
  configureSeq(els.seqMcpInit, mcpSeqConfig());
  [
    els.seqMcpList,
    els.seqMcpEcho,
    els.seqMcpFetch,
    els.seqMcpJwt,
    els.seqMcpTools,
  ].forEach((seq) => {
    if (seq) {
      configureSeq(seq, mcpSeqConfig());
    }
  });
  configureSeq(els.seqA2a, a2aSeqConfig());
  configureSeq(els.seqHttp, httpSeqConfig());
  configureSeq(els.seqUnauth, securitySeqConfig());
  configureSeq(els.seqJunk, securitySeqConfig());
}

function clearSeqMarks(seq) {
  seq.querySelectorAll(".seq-box, .seq-arrow").forEach((node) => {
    node.classList.remove("is-on", "is-fail", "is-back", "is-hop", "is-transit");
  });
}

function setSeqHop(seq, role, step) {
  seq.querySelectorAll(".seq-box").forEach((box) => {
    box.classList.toggle("is-hop", role != null && box.dataset.role === role);
  });
  seq.querySelectorAll(".seq-arrow").forEach((arrow) => {
    arrow.classList.toggle(
      "is-transit",
      step != null && Number(arrow.dataset.step) === step
    );
  });
}

function resetSeq(seq) {
  seq.classList.remove("is-run", "is-ok", "is-fail");
  clearSeqMarks(seq);
  seq.querySelectorAll(".seq-box").forEach((box) => {
    box.classList.remove("is-dim");
  });
  clearSeqNarration(seq);
}

function markSeq(seq, roles, steps, className) {
  roles.forEach((role) => {
    const box = seq.querySelector(`[data-role="${role}"]`);
    if (box) {
      box.classList.add(className);
    }
  });
  steps.forEach((step) => {
    const arrow = seq.querySelector(`[data-step="${step}"]`);
    if (arrow) {
      arrow.classList.add(className);
    }
  });
}

function waitSeq(ms, seqId, token) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(seqTokens[seqId] === token), ms);
  });
}

function failHopFromResult(result, viaGateway) {
  if (result.error || result.status == null) {
    return 1;
  }
  if (result.status < 400) {
    return null;
  }
  if (viaGateway && (result.status === 502 || result.status === 503 || result.status === 504)) {
    return 3;
  }
  return 2;
}

function failSeq(seq, hop, viaGateway, target, extras = {}) {
  seq.classList.remove("is-run");
  seq.classList.add("is-fail");
  const targetRole = extras.targetRole || "target";
  seq.querySelectorAll(".seq-wire").forEach((node) => {
    node.hidden = true;
  });

  if (hop <= 1) {
    clearSeqMarks(seq);
    markSeq(seq, ["client"], [1], "is-fail");
    setHopLabel(seq, "client", "Agent sends");
    setSeqCaption(seq, "Failed at agent");
    return;
  }

  if (!viaGateway) {
    clearSeqMarks(seq);
    markSeq(seq, ["client"], [1], "is-on");
    markSeq(seq, [targetRole], [1], "is-fail");
    setHopLabel(
      seq,
      "target",
      extras.phase === "primary" ? "Primary failed" : `Failed at ${target}`
    );
    setSeqCaption(seq, `Failed at ${target}`);
    return;
  }

  if (hop === 2) {
    clearSeqMarks(seq);
    markSeq(seq, ["client"], [1], "is-on");
    markSeq(seq, ["gateway"], [], "is-fail");
    setHopLabel(seq, "gateway", "Gateway routes");
    setSeqCaption(seq, "Failed at gateway");
    return;
  }

  seq.querySelectorAll(".seq-arrow, .seq-box").forEach((node) => {
    if (node.dataset.role === "primary" && extras.phase === "fallback") {
      return;
    }
    node.classList.remove("is-on", "is-fail", "is-back", "is-hop", "is-transit");
  });
  markSeq(seq, ["client", "gateway"], [1, 2], "is-on");
  markSeq(seq, [targetRole], [2], "is-fail");
  setHopLabel(
    seq,
    "target",
    extras.phase === "primary" ? "Primary failed" : `Failed at ${target}`
  );
  setSeqCaption(
    seq,
    extras.phase === "primary" ? "Primary failed" : `Failed at ${target}`
  );
}

async function animateSeqForward(seq, viaGateway, target, token, extras = {}) {
  const id = seq.id;
  const targetRole = extras.targetRole || "target";
  markSeq(seq, ["client"], [], "is-on");
  setSeqHop(seq, "client", null);
  setHopLabel(seq, "client", "Agent sends");
  if (!(await waitSeq(seqStepMs(), id, token))) {
    return false;
  }

  markSeq(seq, [], [1], "is-on");
  setSeqHop(seq, null, 1);
  if (!(await waitSeq(seqStepMs(), id, token))) {
    return false;
  }

  if (viaGateway) {
    markSeq(seq, ["gateway"], [], "is-on");
    setSeqHop(seq, "gateway", null);
    setHopLabel(seq, "gateway", "Gateway routes");
    if (!(await waitSeq(seqStepMs(), id, token))) {
      return false;
    }
    markSeq(seq, [], [2], "is-on");
    setSeqHop(seq, null, 2);
    if (!(await waitSeq(seqStepMs(), id, token))) {
      return false;
    }
    markSeq(seq, [targetRole], [], "is-on");
    setSeqHop(seq, targetRole, 2);
    setHopLabel(
      seq,
      "target",
      extras.phase === "fallback" ? `Failover → ${target}` : `${target} replies`
    );
    return true;
  }

  markSeq(seq, [targetRole], [], "is-on");
  setSeqHop(seq, targetRole, 1);
  setHopLabel(seq, "target", `${target} replies`);
  return true;
}

async function animateSeqReturn(seq, viaGateway, target, token) {
  seq.querySelectorAll(".seq-arrow").forEach((arrow) => {
    arrow.classList.add("is-back");
  });
  if (viaGateway) {
    markSeq(seq, [], [1, 2], "is-on");
    setSeqHop(seq, "gateway", 2);
    if (!(await waitSeq(seqReturnMs(), seq.id, token))) {
      return false;
    }
    setSeqHop(seq, "client", 1);
    return waitSeq(seqReturnMs(), seq.id, token);
  }
  markSeq(seq, [], [1], "is-on");
  setSeqHop(seq, "client", 1);
  return waitSeq(seqReturnMs(), seq.id, token);
}

async function runWithSeq(seq, requestFn, opts) {
  const {
    viaGateway,
    target,
    targetKind,
    ok,
    path,
    model,
    phase,
    targetRole = "target",
    reset = true,
    primaryKind,
    fallbackKind,
  } = opts;
  const token = ++seqTokens[seq.id];
  configureSeq(seq, { viaGateway, target, targetKind, primaryKind, fallbackKind });
  if (reset) {
    resetSeq(seq);
  } else {
    seq.classList.remove("is-ok", "is-fail");
    seq.querySelectorAll(".seq-arrow").forEach((arrow) => {
      arrow.classList.remove("is-back", "is-transit", "is-on", "is-fail");
    });
  }
  seq.classList.add("is-run");
  if (path || model) {
    setSeqWire(seq, path, model);
  }

  const previousProgress = seqProgress;
  seqProgress = (stage, detail) => {
    lightHopFromStage(seq, stage, viaGateway, target, token, {
      targetRole,
      phase,
      headersMs: detail && detail.headersMs,
      latencyMs: detail && detail.latencyMs,
    });
    if (detail && detail.response && seqTokens[seq.id] === token) {
      seq.dataset.traceId = traceIdFromHeaders(detail.response.headers) || "";
    }
  };

  const request = Promise.resolve().then(requestFn);
  const forward = animateSeqForward(seq, viaGateway, target, token, {
    targetRole,
    phase,
  });
  let result;
  try {
    result = await request;
  } finally {
    seqProgress = previousProgress;
  }
  if (result) {
    applySeqTimings(seq, viaGateway, result);
    if (hopFromUsage(result)) {
      lightHopFromStage(seq, "body", viaGateway, target, token, {
        targetRole,
        phase,
        headersMs: result.headersMs,
        latencyMs: result.latencyMs,
      });
    }
  }
  void trySoloTracesApi(els.soloUi ? els.soloUi.value : DEFAULT_SOLO_UI);
  const stillCurrent = await forward;
  if (!stillCurrent || seqTokens[seq.id] !== token) {
    return result;
  }

  if (ok(result)) {
    const returned = await animateSeqReturn(seq, viaGateway, target, token);
    if (!returned || seqTokens[seq.id] !== token) {
      return result;
    }
    seq.classList.remove("is-run");
    seq.classList.add("is-ok");
    seq.querySelectorAll(".seq-arrow").forEach((arrow) => {
      arrow.classList.remove("is-back", "is-transit");
    });
    seq.querySelectorAll(".seq-box").forEach((box) => {
      box.classList.remove("is-hop");
    });
    seq.querySelectorAll(".seq-wire").forEach((node) => {
      node.hidden = true;
    });
    markSeq(
      seq,
      viaGateway
        ? ["client", "gateway", targetRole]
        : ["client", targetRole],
      viaGateway ? [1, 2] : [1],
      "is-on"
    );
    setHopLabel(
      seq,
      "target",
      phase === "fallback" ? `Failover → ${target}` : `${target} replies`
    );
    setSeqCaption(seq, pathCaption(viaGateway, target));
    return result;
  }

  failSeq(seq, failHopFromResult(result, viaGateway), viaGateway, target, {
    targetRole,
    phase,
  });
  return result;
}

function llmRequestOk(result) {
  return Boolean(result.response && result.response.ok);
}

function mcpRequestOk(result) {
  return !result.error && result.status != null && result.status < 400;
}

async function saveChatSettings() {
  const { endpoint, model } = currentChatSettings();
  await persist({ endpoint, model });
  updateEndpointHints();
  return { endpoint, model };
}

async function timedFetch(url, options) {
  const started = performance.now();
  notifySeqProgress("start", { started });
  try {
    const response = await fetch(url, options);
    const headersMs = Math.round(performance.now() - started);
    notifySeqProgress("headers", { response, status: response.status, headersMs });
    const raw = await response.text();
    const payload = parseJson(raw);
    const latencyMs = Math.round(performance.now() - started);
    notifySeqProgress("body", { response, raw, payload, headersMs, latencyMs });
    return {
      response,
      status: response.status,
      latencyMs,
      headersMs,
      raw,
      payload,
      headers: headerMap(response),
      traceId: traceIdFromHeaders(response.headers),
      error: null,
    };
  } catch (error) {
    return {
      response: null,
      status: null,
      latencyMs: Math.round(performance.now() - started),
      headersMs: null,
      raw: "",
      payload: null,
      headers: {},
      traceId: "",
      error: error.message || String(error),
    };
  }
}

function postCompletions(endpoint, model, requestMessages) {
  return timedFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: requestMessages,
    }),
  });
}

function summarizeCompletion(result, requestedModel) {
  if (result.error) {
    return {
      ok: false,
      status: null,
      latencyMs: result.latencyMs,
      model: requestedModel,
      body: result.error,
    };
  }

  const status = result.status;
  const ok = Boolean(result.response && result.response.ok);
  let body;
  if (!result.payload) {
    body = result.raw || `HTTP ${status}`;
  } else if (!ok) {
    body = errorDetail(result.payload, result.raw, status);
  } else {
    try {
      body = extractAssistantText(result.payload);
    } catch (error) {
      body = error.message || String(error);
    }
  }

  return {
    ok,
    status,
    latencyMs: result.latencyMs,
    model: (result.payload && result.payload.model) || requestedModel,
    body,
    usage: usageFromPayload(result.payload),
    result,
  };
}

function showBox(target, { status, latencyMs, model, body, isError, usage, result }) {
  target.hidden = false;
  target.classList.toggle("is-error", Boolean(isError));
  target.replaceChildren();

  const meta = document.createElement("div");
  meta.className = "result-meta";
  const statusText = status == null ? "no response" : `HTTP ${status}`;
  const parts = [`${statusText} · ${latencyMs} ms`];
  if (model) {
    parts.push(`model ${model}`);
  }
  meta.textContent = parts.join(" · ");

  const detail = document.createElement("div");
  detail.className = "result-body";
  detail.textContent = body;
  target.append(meta, detail);
  const cost = costNode(usage, model);
  if (cost) {
    target.append(cost);
  }
  if (result) {
    const strip = traceStrip(result);
    if (strip) {
      target.append(strip);
    }
    target.append(soloUiLink(result));
  }
}

function card(className, extraClass, metaText, bodyText, extras = []) {
  const wrap = document.createElement("div");
  wrap.className = `${className} ${extraClass}`.trim();

  const meta = document.createElement("div");
  meta.className = `${className}-meta`;
  meta.textContent = metaText;

  const body = document.createElement("div");
  body.className = `${className}-body`;
  body.textContent = bodyText;
  wrap.append(meta, body);
  extras.filter(Boolean).forEach((node) => wrap.append(node));
  return wrap;
}

function normalizeArea(name, scenario) {
  if (name === "cluster") {
    return "settings";
  }
  if (name === "services" || name === "scenarios") {
    if (scenario === "security") {
      return "api";
    }
    if (scenario === "a2a") {
      return "a2a";
    }
    if (scenario === "mcp") {
      return "mcp";
    }
    return "llm";
  }
  if (name === "security") {
    return "api";
  }
  return AREAS.includes(name) ? name : "chat";
}

function drawerStatus(state) {
  const badge = document.createElement("span");
  badge.className = `status-badge is-${state}`;
  badge.textContent =
    state === "running" ? "Running" : state === "ok" ? "OK" : "Fail";
  return badge;
}

function drawerMeta(text) {
  const meta = document.createElement("span");
  meta.className = "drawer-meta";
  meta.textContent = text;
  return meta;
}

function collapseButton(target) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "drawer-collapse";
  button.textContent = "Collapse";
  button.addEventListener("click", () => {
    closeTestDrawer(target);
  });
  return button;
}

function setTestDrawer(target, nodes, state) {
  const card = target.closest(".test-card");
  target.hidden = false;
  target.classList.toggle("is-running", state === "running");
  target.classList.toggle("is-ok", state === "ok");
  target.classList.toggle("is-error", state === "fail");
  if (card) {
    card.classList.toggle("is-running", state === "running");
    card.classList.toggle("is-ok", state === "ok");
    card.classList.toggle("is-fail", state === "fail");
    card.scrollIntoView({ block: "nearest" });
  }
  target.replaceChildren(...nodes);
}

function closeTestDrawer(target) {
  const card = target.closest(".test-card");
  target.hidden = true;
  target.classList.remove("is-running", "is-ok", "is-error");
  target.replaceChildren();
  if (card) {
    card.classList.remove("is-running", "is-ok", "is-fail");
  }
}

function runningDrawer(target, text) {
  const row = document.createElement("div");
  row.className = "drawer-status";
  row.append(drawerStatus("running"), drawerMeta(text));
  setTestDrawer(target, [row], "running");
}

function resultDrawer(target, { ok, meta, nodes, result }) {
  const row = document.createElement("div");
  row.className = "drawer-status";
  const state = ok ? "ok" : "fail";
  const actions = document.createElement("div");
  actions.className = "drawer-actions";
  if (result !== undefined) {
    actions.append(soloUiLink(result));
  }
  actions.append(collapseButton(target));
  row.append(drawerStatus(state), drawerMeta(meta), actions);
  const extras = [];
  const strip = traceStrip(result);
  if (strip) {
    extras.push(strip);
  }
  setTestDrawer(target, [row, ...extras, ...nodes], state);
}

function setArea(area, scenario) {
  const selected = normalizeArea(area, scenario);
  for (const [key, tab] of Object.entries(AREA_TABS)) {
    if (tab) {
      tab.classList.toggle("is-active", selected === key);
    }
  }
  for (const [key, panel] of Object.entries(AREA_PANELS)) {
    const active = selected === key;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  }
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS);
  els.endpoint.value = stored.endpoint || DEFAULT_ENDPOINT;
  els.model.value = stored.model || DEFAULT_MODEL;
  const provider = PROVIDERS[stored.provider]
    ? stored.provider
    : providerFromModel(stored.model || DEFAULT_MODEL);
  buildProviderSwitches(provider);
  setProviderSelects(provider);
  els.primaryModel.value = stored.primaryModel || DEFAULT_MODEL;
  els.fallbackModel.value = stored.fallbackModel || DEFAULT_FALLBACK_MODEL;
  els.chosenModel.value = stored.chosenModel || stored.model || DEFAULT_MODEL;
  els.soloUi.value = stored.soloUi || DEFAULT_SOLO_UI;
  els.mcpEndpoint.value =
    stored.mcpEndpoint || defaultMcpEndpoint(els.endpoint.value);
  els.mcpEndpoint.dataset.fromChat = els.endpoint.value;
  els.a2aEndpoint.value = stored.a2aEndpoint || DEFAULT_A2A_ENDPOINT;
  els.httpMethod.value =
    stored.httpMethod === "POST" || stored.httpMethod === "GET"
      ? stored.httpMethod
      : "GET";
  els.httpUrl.value = stored.httpUrl || stored.endpoint || DEFAULT_ENDPOINT;
  els.clusterSource.value =
    stored.clusterSource === "omni" ? "omni" : "manual";
  els.clusterType.value = CLUSTER_HELP[stored.clusterType]
    ? stored.clusterType
    : "gke";
  els.clusterApiServer.value = stored.clusterApiServer || "";
  els.clusterToken.value = stored.clusterToken || "";
  els.omniUrl.value = stored.omniUrl || DEFAULT_OMNI_URL;
  els.omniSaKey.value = stored.omniServiceAccountKey || "";
  els.clusterNamespace.value =
    stored.clusterNamespace || DEFAULT_CLUSTER_NAMESPACE;
  els.clusterKubeconfig.value = stored.clusterKubeconfig || "";
  els.clusterContext.dataset.preferred = stored.omniContext || "";
  els.crdKind.value = K8S_KINDS[stored.clusterKind]
    ? stored.clusterKind
    : "Gateway";
  els.crdYaml.value = stored.clusterManifest || EXAMPLE_MANIFEST;
  loadDeployExamples(stored);
  updateClusterHelp();
  updateClusterSourceUi();
  if (els.clusterKubeconfig.value.trim()) {
    try {
      const parsed = Kubeconfig.parse(els.clusterKubeconfig.value);
      const selected = Kubeconfig.pickContext(parsed, stored.omniContext || "");
      fillContextOptions(parsed, selected);
    } catch {
      fillContextOptions({ contexts: [] }, "");
    }
  }
  clusterConnected = Boolean(stored.clusterConnected);
  if (clusterConnected) {
    els.clusterTestResult.hidden = false;
    els.clusterTestResult.classList.remove("is-error");
    els.clusterTestResult.replaceChildren();
    const detail = document.createElement("div");
    detail.className = "result-body";
    detail.textContent =
      "Last test succeeded. Re-test if the token may have expired.";
    els.clusterTestResult.append(detail);
  }
  hoorayOn = stored.hooray !== false;
  els.hooray.checked = hoorayOn;
  setDemoStage(stored.demoStage === true);
  settingsFocus = stored.settingsFocus === "cluster" ? "cluster" : "";
  restoreDeployViews(stored);
  const area = normalizeArea(stored.area, stored.scenario);
  setArea(area);
  if (area !== stored.area) {
    persist({ area });
  }
  updateEndpointHints();
  updateDeployHints();
  setClusterChip(clusterConnected ? "connected" : "disconnected");
  if (area === "settings" && settingsFocus === "cluster") {
    scrollToCluster();
  }
  if (
    clusterIsReady() &&
    (area === "llm" || area === "mcp" || area === "settings")
  ) {
    refreshInventory(area === "settings" ? "cluster" : area);
  }
  probeClusterConnection({ interactive: false });
}

function switchArea(area) {
  setArea(area);
  if (area !== "settings") {
    settingsFocus = "";
  }
  if (area !== "chat" && area !== "settings") {
    updateEndpointHints();
    updateDeployHints();
    refreshSeqDiagrams();
  }
  if (area === "llm" || area === "mcp" || area === "settings") {
    updateDeployHints();
    if (clusterIsReady()) {
      refreshInventory(area === "settings" ? "cluster" : area);
    }
  }
  persist({ area, settingsFocus });
}

els.tabChat.addEventListener("click", () => {
  switchArea("chat");
});

els.tabLlm.addEventListener("click", () => {
  switchArea("llm");
});

els.tabMcp.addEventListener("click", () => {
  switchArea("mcp");
});

els.tabA2a.addEventListener("click", () => {
  switchArea("a2a");
});

els.tabApi.addEventListener("click", () => {
  switchArea("api");
});

els.tabSettings.addEventListener("click", () => {
  settingsFocus = "";
  switchArea("settings");
});

if (els.clusterChip) {
  els.clusterChip.addEventListener("click", () => {
    openClusterSettings();
  });
}

els.hooray.addEventListener("change", () => {
  hoorayOn = els.hooray.checked;
  persist({ hooray: hoorayOn });
});

els.demoStage.addEventListener("change", () => {
  setDemoStage(els.demoStage.checked, true);
});

els.demoToggle.addEventListener("click", () => {
  setDemoStage(!demoStageOn, true);
});

els.soloUi.addEventListener("change", () => {
  persist({ soloUi: currentSoloUi() });
});

function onProviderChange(id) {
  applyProvider(id, { setModels: true, loadYaml: true });
}

function onBuilderProviderChange(id) {
  const preset = (els.llmPreset && els.llmPreset.value) || "";
  if (AgwBuilder.isFailoverPreset(preset)) {
    setProviderSelect(els.llmBuilderProvider, id);
    const defaults = AgwBuilder.llmDefaults(id);
    els.llmBuilderModel.value = defaults.model;
    if (preset !== "provider-failover") {
      els.llmBuilderFallback.value = defaults.fallbackModel;
    }
    els.llmSecret.value = defaults.secretRef;
    els.llmHost.value = defaults.host || "";
    els.llmPort.value = defaults.port || "";
    els.llmProviderPath.value = defaults.providerPath || "";
    els.llmRegion.value = defaults.region || "";
    updateLlmBuilderVisibility();
    regenLlmYaml();
    syncFailoverTestFromBuilder();
    return;
  }
  onProviderChange(id);
}

function onFallbackProviderChange(id) {
  setProviderSelect(els.llmFallbackProvider, id);
  const defaults = AgwBuilder.llmDefaults(id);
  if (els.llmBuilderFallback) {
    els.llmBuilderFallback.value = defaults.model;
  }
  if (els.llmFallbackSecret) {
    els.llmFallbackSecret.value = defaults.secretRef;
  }
  updateLlmBuilderVisibility();
  regenLlmYaml();
  syncFailoverTestFromBuilder();
}

els.endpoint.addEventListener("change", () => {
  const previousDefault = defaultMcpEndpoint(
    els.mcpEndpoint.dataset.fromChat || DEFAULT_ENDPOINT
  );
  saveChatSettings();
  const nextDefault = defaultMcpEndpoint(els.endpoint.value);
  if (
    !els.mcpEndpoint.value.trim() ||
    els.mcpEndpoint.value.trim() === previousDefault
  ) {
    els.mcpEndpoint.value = nextDefault;
    persist({ mcpEndpoint: nextDefault });
  }
  els.mcpEndpoint.dataset.fromChat = els.endpoint.value;
  refreshSeqDiagrams();
});

els.endpoint.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.model.addEventListener("change", () => {
  saveChatSettings();
});

els.model.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.primaryModel.addEventListener("change", () => {
  const primaryModel = normalizeModel(els.primaryModel.value);
  els.primaryModel.value = primaryModel;
  persist({ primaryModel });
  refreshSeqDiagrams();
});

els.primaryModel.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.fallbackModel.addEventListener("change", () => {
  const fallbackModel = normalizeModel(
    els.fallbackModel.value,
    providerSpec(currentProvider()).fallback
  );
  els.fallbackModel.value = fallbackModel;
  persist({ fallbackModel });
  refreshSeqDiagrams();
});

els.fallbackModel.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.chosenModel.addEventListener("change", () => {
  const chosenModel = normalizeModel(els.chosenModel.value);
  els.chosenModel.value = chosenModel;
  persist({ chosenModel });
  refreshSeqDiagrams();
});

els.chosenModel.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.mcpEndpoint.addEventListener("change", () => {
  const mcpEndpoint = currentMcpEndpoint();
  els.mcpEndpoint.value = mcpEndpoint;
  persist({ mcpEndpoint });
  refreshSeqDiagrams();
});

els.mcpEndpoint.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.a2aEndpoint.addEventListener("change", () => {
  const a2aEndpoint = els.a2aEndpoint.value.trim() || DEFAULT_A2A_ENDPOINT;
  els.a2aEndpoint.value = a2aEndpoint;
  persist({ a2aEndpoint });
  refreshSeqDiagrams();
});

els.a2aEndpoint.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.test.addEventListener("click", async () => {
  const { endpoint, model } = await saveChatSettings();
  els.test.disabled = true;
  els.testResult.hidden = false;
  els.testResult.classList.remove("is-error");
  els.testResult.replaceChildren();
  const pending = document.createElement("div");
  pending.className = "result-body";
  pending.textContent = "Testing…";
  els.testResult.append(pending);

  const result = await runWithSeq(
    els.seqChat,
    () => postCompletions(endpoint, model, [TEST_MESSAGE]),
    { ...llmSeqConfig(model), ok: llmRequestOk, path: requestPath(endpoint), model }
  );
  const summary = summarizeCompletion(result, model);
  showBox(els.testResult, {
    status: summary.status,
    latencyMs: summary.latencyMs,
    model: summary.model,
    body: summary.body,
    isError: !summary.ok,
    usage: summary.usage,
    result,
  });
  if (summary.ok) {
    celebrate();
  }
  els.test.disabled = false;
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = els.message.value.trim();
  if (!content) {
    return;
  }

  const { endpoint, model } = await saveChatSettings();
  messages.push({ role: "user", content });
  appendBubble("user", content);
  els.message.value = "";
  els.send.disabled = true;

  try {
    const result = await runWithSeq(
      els.seqChat,
      () => postCompletions(endpoint, model, messages),
      { ...llmSeqConfig(model), ok: llmRequestOk, path: requestPath(endpoint), model }
    );
    if (result.error) {
      throw new Error(result.error);
    }
    if (!result.payload) {
      throw new Error(result.raw || `HTTP ${result.status}`);
    }
    if (!result.response.ok) {
      throw new Error(errorDetail(result.payload, result.raw, result.status));
    }
    const assistant = extractAssistantText(result.payload);
    messages.push({ role: "assistant", content: assistant });
    appendBubble("assistant", assistant);
  } catch (error) {
    messages.pop();
    appendBubble("error", error.message || String(error));
  } finally {
    els.send.disabled = false;
    els.message.focus();
  }
});

els.message.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    els.form.requestSubmit();
  }
});

els.runChatPing.addEventListener("click", async () => {
  const { endpoint, model } = await saveChatSettings();
  els.runChatPing.disabled = true;
  runningDrawer(els.resultChatPing, "Chat ping");
  const result = await runWithSeq(
    els.seqChatPing,
    () => postCompletions(endpoint, model, [TEST_MESSAGE]),
    { ...llmSeqConfig(model), ok: llmRequestOk, path: requestPath(endpoint), model }
  );
  const summary = summarizeCompletion(result, model);
  const statusText =
    summary.status == null ? "no response" : `HTTP ${summary.status}`;
  resultDrawer(els.resultChatPing, {
    ok: summary.ok,
    meta: `${summary.model} · ${statusText} · ${summary.latencyMs} ms`,
    result,
    nodes: [
      card(
        "check",
        summary.ok ? "is-ok" : "is-error",
        `Chat ping · ${summary.model} · ${statusText} · ${summary.latencyMs} ms`,
        summary.body,
        [costNode(summary.usage, summary.model)]
      ),
    ],
  });
  if (summary.ok) {
    celebrate();
  }
  els.runChatPing.disabled = false;
});

els.runFailover.addEventListener("click", async () => {
  const { endpoint } = await saveChatSettings();
  const primaryModel = normalizeModel(els.primaryModel.value);
  const fallbackModel = normalizeModel(
    els.fallbackModel.value,
    providerSpec(currentProvider()).fallback
  );
  els.primaryModel.value = primaryModel;
  els.fallbackModel.value = fallbackModel;
  await persist({ primaryModel, fallbackModel });

  els.runFailover.disabled = true;
  runningDrawer(els.resultFailover, "Running primary model…");

  const attempts = [];
  const failoverCfg = failoverSeqConfig();
  const chatPath = requestPath(endpoint);
  const primary = summarizeCompletion(
    await runWithSeq(
      els.seqFailover,
      () => postCompletions(endpoint, primaryModel, [TEST_MESSAGE]),
      {
        ...failoverCfg,
        ok: llmRequestOk,
        path: chatPath,
        model: primaryModel,
        phase: "primary",
        targetRole: "primary",
      }
    ),
    primaryModel
  );
  attempts.push({ label: "primary", ...primary });

  if (!primary.ok) {
    const primaryBox = els.seqFailover.querySelector('[data-role="primary"]');
    if (primaryBox) {
      primaryBox.classList.remove("is-on", "is-hop");
      primaryBox.classList.add("is-fail", "is-dim");
    }
    setHopLabel(els.seqFailover, "target", "Primary failed");
    runningDrawer(els.resultFailover, "Primary failed · trying fallback…");
    await new Promise((resolve) => setTimeout(resolve, 450));
    const fallback = summarizeCompletion(
      await runWithSeq(
        els.seqFailover,
        () => postCompletions(endpoint, fallbackModel, [TEST_MESSAGE]),
        {
          ...failoverCfg,
          target: failoverCfg.fallbackTarget,
          targetKind: failoverCfg.fallbackKind,
          ok: llmRequestOk,
          path: chatPath,
          model: fallbackModel,
          phase: "fallback",
          targetRole: "fallback",
          reset: false,
        }
      ),
      fallbackModel
    );
    attempts.push({ label: "fallback", ...fallback });
  }

  const winner = attempts.find((attempt) => attempt.ok);
  const summary = document.createElement("div");
  summary.className = "summary";
  if (winner) {
    summary.textContent = `Succeeded with ${winner.label} (${winner.model})`;
  } else {
    summary.textContent = "Neither model succeeded";
  }

  const cards = attempts.map((attempt) => {
    const statusText =
      attempt.status == null ? "no response" : `HTTP ${attempt.status}`;
    return card(
      "attempt",
      attempt.ok ? "is-ok" : "is-error",
      `${attempt.label} · ${attempt.model} · ${statusText} · ${attempt.latencyMs} ms`,
      attempt.body,
      [costNode(attempt.usage, attempt.model)]
    );
  });

  resultDrawer(els.resultFailover, {
    ok: Boolean(winner),
    meta: winner
      ? `${winner.model} · ${winner.latencyMs} ms`
      : "Neither model succeeded",
    result: attempts[attempts.length - 1] && attempts[attempts.length - 1].result,
    nodes: [summary, ...cards],
  });
  if (winner) {
    celebrate();
  }
  els.runFailover.disabled = false;
});

function modelsUrl(chatEndpoint) {
  try {
    const url = new URL(normalizeEndpoint(chatEndpoint));
    if (url.pathname.includes(CHAT_PATH)) {
      url.pathname = url.pathname.replace(CHAT_PATH, "/v1/models");
    } else {
      const base = url.pathname.replace(/\/+$/, "");
      url.pathname = `${base}/v1/models`;
    }
    return url.toString();
  } catch {
    return "";
  }
}

function listModelNames(payload) {
  const data = payload && Array.isArray(payload.data) ? payload.data : [];
  const names = data
    .map((item) => (item && item.id) || "")
    .filter(Boolean);
  if (names.length) {
    return names.join("\n");
  }
  return snippet(JSON.stringify(payload || {}, null, 2) || "(empty body)");
}

els.runListCall.addEventListener("click", async () => {
  const { endpoint } = await saveChatSettings();
  const chosenModel = normalizeModel(els.chosenModel.value);
  els.chosenModel.value = chosenModel;
  await persist({ chosenModel });
  const listUrl = modelsUrl(endpoint);
  els.runListCall.disabled = true;
  runningDrawer(els.resultListCall, "Listing models…");

  const listed = await runWithSeq(
    els.seqListCall,
    () => timedFetch(listUrl, { method: "GET", headers: { Accept: "application/json" } }),
    {
      ...llmSeqConfig(chosenModel),
      ok: mcpRequestOk,
      path: requestPath(listUrl) || "/v1/models",
    }
  );
  const listOk = !listed.error && listed.status != null && listed.status < 400;
  const listStatus =
    listed.status == null ? "no response" : `HTTP ${listed.status}`;
  const listBody = listed.error
    ? listed.error
    : listOk
      ? listModelNames(listed.payload)
      : snippet(listed.raw || `HTTP ${listed.status}`);

  runningDrawer(els.resultListCall, "Calling chosen model…");
  await new Promise((resolve) => setTimeout(resolve, 350));
  const called = summarizeCompletion(
    await runWithSeq(
      els.seqListCall,
      () => postCompletions(endpoint, chosenModel, [TEST_MESSAGE]),
      {
        ...llmSeqConfig(chosenModel),
        ok: llmRequestOk,
        path: requestPath(endpoint),
        model: chosenModel,
      }
    ),
    chosenModel
  );
  const callStatus =
    called.status == null ? "no response" : `HTTP ${called.status}`;

  resultDrawer(els.resultListCall, {
    ok: listOk && called.ok,
    meta: `List ${listStatus} · Call ${callStatus} · ${called.model}`,
    result: called.result || listed,
    nodes: [
      card(
        "check",
        listOk ? "is-ok" : "is-error",
        `List models · ${listStatus} · ${listed.latencyMs} ms`,
        listBody
      ),
      card(
        "check",
        called.ok ? "is-ok" : "is-error",
        `Call ${called.model} · ${callStatus} · ${called.latencyMs} ms`,
        called.body,
        [costNode(called.usage, called.model)]
      ),
    ],
  });
  if (listOk && called.ok) {
    celebrate();
  }
  els.runListCall.disabled = false;
});

async function probeWithFallback(url, primary, secondary, secondaryNote) {
  const first = await timedFetch(url, primary);
  if (!first.error && first.status !== 405) {
    return { ...first, method: primary.method, note: null };
  }
  const second = await timedFetch(url, secondary);
  return { ...second, method: secondary.method, note: secondaryNote };
}

function parseMcpPayload(raw, fallback) {
  if (fallback && typeof fallback === "object") {
    if (fallback.jsonrpc || fallback.result || fallback.error || fallback.tools) {
      return fallback;
    }
  }
  const text = String(raw || "").trim();
  if (!text) {
    return fallback || null;
  }
  const direct = parseJson(text);
  if (direct) {
    return direct;
  }
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("data:")) {
      const parsed = parseJson(trimmed.slice(5).trim());
      if (parsed) {
        return parsed;
      }
    }
  }
  return fallback || null;
}

function mcpSessionId(result) {
  const headers = (result && result.headers) || {};
  return headers["mcp-session-id"] || headers["mcp-session-id"] || "";
}

function mcpClientInfo() {
  return { name: "agentgateway-extension", version: "0.9.6" };
}

function mcpHeaders(sessionId, extra) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": "2024-11-05",
  };
  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }
  if (extra) {
    Object.assign(headers, extra);
  }
  return headers;
}

function mcpInitializeBody() {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: mcpClientInfo(),
    },
  };
}

function mcpRpcError(payload) {
  return payload && payload.error && (payload.error.message || payload.error.code);
}

function mcpAuthDenied(result, payload) {
  const status = result && result.status;
  if (status === 401 || status === 403) {
    return true;
  }
  const text = `${(result && result.raw) || ""} ${
    (payload && payload.error && payload.error.message) || ""
  }`.toLowerCase();
  return /auth|unauthorized|unauthorised|no bearer|jwt|forbidden|denied/.test(
    text
  );
}

function mcpToolNames(payload) {
  const tools =
    (payload && payload.result && payload.result.tools) ||
    (payload && payload.tools) ||
    [];
  if (!Array.isArray(tools)) {
    return [];
  }
  return tools.map((tool) => tool && tool.name).filter(Boolean);
}

function mcpCallContent(payload) {
  const result = payload && payload.result;
  if (!result) {
    return snippet(JSON.stringify(payload || {}, null, 2));
  }
  const content = result.content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && (part.text || part.type)) || "")
      .filter(Boolean)
      .join("\n");
  }
  return snippet(JSON.stringify(result, null, 2));
}

async function saveMcpEndpoint() {
  const url = currentMcpEndpoint();
  els.mcpEndpoint.value = url;
  await persist({ mcpEndpoint: url });
  return url;
}

async function mcpInitializeSession(url, extraHeaders) {
  const first = await timedFetch(url, {
    method: "POST",
    headers: mcpHeaders("", extraHeaders),
    body: JSON.stringify(mcpInitializeBody()),
  });
  let result = first;
  if (first.error || first.status === 405) {
    const second = await timedFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/event-stream",
        ...(extraHeaders || {}),
      },
    });
    result = {
      ...second,
      method: "GET",
      note: "POST initialize unavailable; used GET",
    };
  } else {
    result = { ...first, method: "POST", note: null };
  }
  const sessionId = mcpSessionId(result);
  if (sessionId && !result.error && result.status != null && result.status < 400) {
    await timedFetch(url, {
      method: "POST",
      headers: mcpHeaders(sessionId, extraHeaders),
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });
  }
  return {
    result,
    sessionId,
    payload: parseMcpPayload(result.raw, result.payload),
  };
}

async function mcpRpc(url, sessionId, id, method, params, extraHeaders) {
  const result = await timedFetch(url, {
    method: "POST",
    headers: mcpHeaders(sessionId, extraHeaders),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params: params || {},
    }),
  });
  return {
    result: { ...result, method: "POST" },
    payload: parseMcpPayload(result.raw, result.payload),
  };
}

function pickMcpTool(names, preferred) {
  const have = new Set(names || []);
  for (const name of preferred) {
    if (have.has(name)) {
      return name;
    }
  }
  return preferred[0] || "";
}

els.probeMcp.addEventListener("click", async () => {
  els.probeMcp.disabled = true;
  const url = await saveMcpEndpoint();
  runningDrawer(els.resultMcp, "Probing…");
  const { result } = await runWithSeq(
    els.seqMcpInit,
    () => mcpInitializeSession(url).then((session) => session.result),
    { ...mcpSeqConfig(), ok: mcpRequestOk, path: requestPath(url) }
  );
  const ok = mcpRequestOk(result);
  const statusText = result.status == null ? "no response" : `HTTP ${result.status}`;
  const meta = [`MCP ${result.method}`, statusText, `${result.latencyMs} ms`];
  if (result.note) {
    meta.push(result.note);
  }
  resultDrawer(els.resultMcp, {
    ok,
    meta: meta.join(" · "),
    result,
    nodes: [
      card(
        "check",
        ok ? "is-ok" : "is-error",
        meta.join(" · "),
        snippet(result.error || result.raw || "(empty body)")
      ),
    ],
  });
  if (!result.error && result.status >= 200 && result.status < 300) {
    celebrate();
  }
  els.probeMcp.disabled = false;
});

els.probeMcpList.addEventListener("click", async () => {
  const url = await saveMcpEndpoint();
  els.probeMcpList.disabled = true;
  runningDrawer(els.resultMcpList, "Listing tools…");
  const listed = await runWithSeq(
    els.seqMcpList,
    async () => {
      const session = await mcpInitializeSession(url);
      if (!mcpRequestOk(session.result)) {
        return session.result;
      }
      const call = await mcpRpc(url, session.sessionId, 2, "tools/list", {});
      return {
        ...call.result,
        toolNames: mcpToolNames(call.payload),
        rpcError: mcpRpcError(call.payload),
      };
    },
    { ...mcpSeqConfig(), ok: mcpRequestOk, path: requestPath(url) }
  );
  const names = listed.toolNames || [];
  const rpcError = listed.rpcError;
  const ok = mcpRequestOk(listed) && !rpcError;
  const statusText = listed.status == null ? "no response" : `HTTP ${listed.status}`;
  resultDrawer(els.resultMcpList, {
    ok,
    meta: `tools/list · ${statusText} · ${listed.latencyMs} ms`,
    result: listed,
    nodes: [
      card(
        "check",
        ok ? "is-ok" : "is-error",
        names.length ? `${names.length} tool(s)` : "tools/list",
        ok
          ? names.join(", ") || "(no tools)"
          : snippet(listed.error || rpcError || listed.raw || "(empty body)")
      ),
    ],
  });
  if (ok) {
    celebrate();
  }
  els.probeMcpList.disabled = false;
});

async function runMcpToolCall({
  button,
  drawer,
  seq,
  preferredNames,
  args,
  label,
}) {
  const url = await saveMcpEndpoint();
  button.disabled = true;
  runningDrawer(drawer, label);
  const called = await runWithSeq(
    seq,
    async () => {
      const session = await mcpInitializeSession(url);
      if (!mcpRequestOk(session.result)) {
        return { ...session.result, attempted: [] };
      }
      const listed = await mcpRpc(url, session.sessionId, 2, "tools/list", {});
      const names = mcpToolNames(listed.payload);
      const attempts = names.length
        ? preferredNames.filter((name) => names.includes(name))
        : preferredNames.slice();
      if (attempts.length === 0) {
        attempts.push(...preferredNames);
      }
      let last = listed.result;
      let lastPayload = listed.payload;
      let used = attempts[0] || preferredNames[0];
      for (const name of attempts) {
        used = name;
        const call = await mcpRpc(url, session.sessionId, 3, "tools/call", {
          name,
          arguments: args,
        });
        last = call.result;
        lastPayload = call.payload;
        if (mcpRequestOk(call.result) && !mcpRpcError(call.payload)) {
          return {
            ...call.result,
            toolName: name,
            toolNames: names,
            payload: call.payload,
            attempted: attempts,
          };
        }
      }
      return {
        ...last,
        toolName: used,
        toolNames: names,
        payload: lastPayload,
        rpcError: mcpRpcError(lastPayload),
        attempted: attempts,
      };
    },
    { ...mcpSeqConfig(), ok: mcpRequestOk, path: requestPath(url) }
  );
  const rpcError = called.rpcError || mcpRpcError(called.payload);
  const ok = mcpRequestOk(called) && !rpcError;
  const statusText = called.status == null ? "no response" : `HTTP ${called.status}`;
  const tool = called.toolName || preferredNames[0];
  resultDrawer(drawer, {
    ok,
    meta: `tools/call ${tool} · ${statusText} · ${called.latencyMs} ms`,
    result: called,
    nodes: [
      card(
        "check",
        ok ? "is-ok" : "is-error",
        tool,
        ok
          ? snippet(mcpCallContent(called.payload) || "(empty result)")
          : snippet(called.error || rpcError || called.raw || "(empty body)")
      ),
    ],
  });
  if (ok) {
    celebrate();
  }
  button.disabled = false;
}

els.probeMcpEcho.addEventListener("click", () => {
  return runMcpToolCall({
    button: els.probeMcpEcho,
    drawer: els.resultMcpEcho,
    seq: els.seqMcpEcho,
    preferredNames: ["mcp-server-everything-3001_echo", "echo"],
    args: { message: "Hello world" },
    label: "Calling echo…",
  });
});

els.probeMcpFetch.addEventListener("click", () => {
  return runMcpToolCall({
    button: els.probeMcpFetch,
    drawer: els.resultMcpFetch,
    seq: els.seqMcpFetch,
    preferredNames: ["mcp-website-fetcher_fetch", "fetch"],
    args: { url: "https://example.com" },
    label: "Calling fetch…",
  });
});

els.probeMcpJwt.addEventListener("click", async () => {
  const url = await saveMcpEndpoint();
  const token = (els.mcpJwtToken && els.mcpJwtToken.value.trim()) || "";
  els.probeMcpJwt.disabled = true;
  runningDrawer(els.resultMcpJwt, "Probing unauthenticated…");
  const unauth = await runWithSeq(
    els.seqMcpJwt,
    () => mcpInitializeSession(url).then((session) => session.result),
    { ...mcpSeqConfig(), ok: () => true, path: requestPath(url) }
  );
  const unauthPayload = parseMcpPayload(unauth.raw, unauth.payload);
  const denied = mcpAuthDenied(unauth, unauthPayload);
  const nodes = [
    card(
      "check",
      denied ? "is-ok" : "is-error",
      `Without token · ${
        unauth.status == null ? "no response" : `HTTP ${unauth.status}`
      } · ${unauth.latencyMs} ms`,
      denied
        ? snippet(unauth.error || unauth.raw || "denied")
        : "Expected deny (401/403 or auth failure). JWT policy may not be applied."
    ),
  ];
  let tokenOk = true;
  if (token) {
    runningDrawer(els.resultMcpJwt, "Probing with token…");
    const authed = await runWithSeq(
      els.seqMcpJwt,
      () =>
        mcpInitializeSession(url, {
          Authorization: `Bearer ${token}`,
        }).then((session) => session.result),
      { ...mcpSeqConfig(), ok: mcpRequestOk, path: requestPath(url) }
    );
    tokenOk = mcpRequestOk(authed);
    nodes.push(
      card(
        "check",
        tokenOk ? "is-ok" : "is-error",
        `With token · ${
          authed.status == null ? "no response" : `HTTP ${authed.status}`
        } · ${authed.latencyMs} ms`,
        snippet(authed.error || authed.raw || "(empty body)")
      )
    );
  } else {
    nodes.push(
      card(
        "check",
        "is-ok",
        "With token",
        "No token pasted — skipped. Paste a bearer token to retry with Authorization."
      )
    );
  }
  const ok = denied && tokenOk;
  resultDrawer(els.resultMcpJwt, {
    ok,
    meta: token
      ? `Unauth ${denied ? "denied" : "allowed"} · token ${tokenOk ? "OK" : "fail"}`
      : `Unauth ${denied ? "denied" : "allowed"}`,
    result: unauth,
    nodes,
  });
  if (ok) {
    celebrate();
  }
  els.probeMcpJwt.disabled = false;
});

els.probeMcpTools.addEventListener("click", async () => {
  const url = await saveMcpEndpoint();
  els.probeMcpTools.disabled = true;
  runningDrawer(els.resultMcpTools, "initialize + list + call…");
  const outcome = await runWithSeq(
    els.seqMcpTools,
    async () => {
      const session = await mcpInitializeSession(url);
      if (!mcpRequestOk(session.result)) {
        return {
          ...session.result,
          step: "initialize",
          toolNames: [],
        };
      }
      const listed = await mcpRpc(url, session.sessionId, 2, "tools/list", {});
      const names = mcpToolNames(listed.payload);
      if (!mcpRequestOk(listed.result) || mcpRpcError(listed.payload)) {
        return {
          ...listed.result,
          step: "tools/list",
          toolNames: names,
          rpcError: mcpRpcError(listed.payload),
        };
      }
      const echo = pickMcpTool(names, [
        "mcp-server-everything-3001_echo",
        "echo",
      ]);
      const fetchTool = pickMcpTool(names, [
        "mcp-website-fetcher_fetch",
        "fetch",
      ]);
      const toolName = names.includes(echo)
        ? echo
        : names.includes(fetchTool)
          ? fetchTool
          : names[0] || echo;
      const args = /fetch/i.test(toolName)
        ? { url: "https://example.com" }
        : { message: "Hello world" };
      const call = await mcpRpc(url, session.sessionId, 3, "tools/call", {
        name: toolName,
        arguments: args,
      });
      return {
        ...call.result,
        step: "tools/call",
        toolName,
        toolNames: names,
        payload: call.payload,
        rpcError: mcpRpcError(call.payload),
      };
    },
    { ...mcpSeqConfig(), ok: mcpRequestOk, path: requestPath(url) }
  );
  const names = outcome.toolNames || [];
  const rpcError = outcome.rpcError;
  const ok = mcpRequestOk(outcome) && !rpcError;
  const statusText =
    outcome.status == null ? "no response" : `HTTP ${outcome.status}`;
  resultDrawer(els.resultMcpTools, {
    ok,
    meta: `${outcome.step || "tool calling"} · ${statusText} · ${outcome.latencyMs} ms`,
    result: outcome,
    nodes: [
      card(
        "check",
        names.length ? "is-ok" : "is-error",
        names.length ? `${names.length} tool(s)` : "tools/list",
        names.join(", ") || "(no tools)"
      ),
      card(
        "check",
        ok ? "is-ok" : "is-error",
        outcome.toolName ? `tools/call ${outcome.toolName}` : "tools/call",
        ok
          ? snippet(mcpCallContent(outcome.payload) || "(empty result)")
          : snippet(outcome.error || rpcError || outcome.raw || "(empty body)")
      ),
    ],
  });
  if (ok) {
    celebrate();
  }
  els.probeMcpTools.disabled = false;
});

function a2aSeqConfig() {
  const a2aUrl = els.a2aEndpoint.value.trim() || DEFAULT_A2A_ENDPOINT;
  const viaGateway = mcpUsesGateway(a2aUrl, els.endpoint.value);
  return { viaGateway, target: "A2A", targetKind: "a2a" };
}

els.probeA2a.addEventListener("click", async () => {
  const url = els.a2aEndpoint.value.trim() || DEFAULT_A2A_ENDPOINT;
  els.a2aEndpoint.value = url;
  await persist({ a2aEndpoint: url });
  els.probeA2a.disabled = true;
  runningDrawer(els.resultA2a, "Probing…");

  const result = await runWithSeq(
    els.seqA2a,
    () =>
      probeWithFallback(
    url,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ probe: "health" }),
    },
        "GET unavailable; used POST health"
      ),
    { ...a2aSeqConfig(), ok: mcpRequestOk, path: requestPath(url) }
  );

  const ok = !result.error && result.status != null && result.status < 400;
  const statusText = result.status == null ? "no response" : `HTTP ${result.status}`;
  const meta = [
    `A2A ${result.method}`,
    statusText,
    `${result.latencyMs} ms`,
  ];
  if (result.note) {
    meta.push(result.note);
  }

  resultDrawer(els.resultA2a, {
    ok,
    meta: meta.join(" · "),
    result,
    nodes: [
      card(
        "check",
        ok ? "is-ok" : "is-error",
        meta.join(" · "),
        snippet(result.error || result.raw || "(empty body)")
      ),
    ],
  });
  if (!result.error && result.status >= 200 && result.status < 300) {
    celebrate();
  }
  els.probeA2a.disabled = false;
});

async function runSecurityProbe(button, drawer, seq, label, messages) {
  const { endpoint, model } = await saveChatSettings();
  button.disabled = true;
  runningDrawer(drawer, label);
  const result = await runWithSeq(
    seq,
    () => postCompletions(endpoint, model, messages),
    {
      ...securitySeqConfig(),
      ok: llmRequestOk,
      path: requestPath(endpoint),
      model,
    }
  );
  const summary = summarizeCompletion(result, model);
  const statusText =
    summary.status == null ? "no response" : `HTTP ${summary.status}`;
  resultDrawer(drawer, {
    ok: summary.ok,
    meta: `${statusText} · ${summary.latencyMs} ms · ${summary.model}`,
    result,
    nodes: [
      card(
        "check",
        summary.ok ? "is-ok" : "is-error",
        `${label} · ${statusText} · ${summary.latencyMs} ms`,
        summary.body,
        [costNode(summary.usage, summary.model)]
      ),
    ],
  });
  celebrate();
  button.disabled = false;
}

els.runUnauth.addEventListener("click", () => {
  runSecurityProbe(
    els.runUnauth,
    els.resultUnauth,
    els.seqUnauth,
    "Unauthenticated",
    [TEST_MESSAGE]
  );
});

els.runJunk.addEventListener("click", () => {
  runSecurityProbe(
    els.runJunk,
    els.resultJunk,
    els.seqJunk,
    "Junk / policy-probe",
    [{ role: "user", content: JUNK_PROMPT }]
  );
});

function currentHttpSettings() {
  const method = els.httpMethod.value === "POST" ? "POST" : "GET";
  const url =
    (els.httpUrl.value || "").trim() ||
    normalizeEndpoint(els.endpoint.value);
  els.httpMethod.value = method;
  els.httpUrl.value = url;
  return { method, url };
}

els.httpMethod.addEventListener("change", () => {
  persist({ httpMethod: currentHttpSettings().method });
  refreshSeqDiagrams();
});

els.httpUrl.addEventListener("change", () => {
  persist({ httpUrl: currentHttpSettings().url });
  refreshSeqDiagrams();
});

els.httpUrl.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.runHttp.addEventListener("click", async () => {
  const { method, url } = currentHttpSettings();
  await persist({ httpMethod: method, httpUrl: url });
  els.runHttp.disabled = true;
  runningDrawer(els.resultHttp, `${method} ${requestPath(url) || url}`);
  const options =
    method === "POST"
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: "{}",
        }
      : {
          method: "GET",
          headers: { Accept: "application/json, text/plain, */*" },
        };
  const result = await runWithSeq(
    els.seqHttp,
    () => timedFetch(url, options),
    {
      ...httpSeqConfig(),
      ok: (detail) => !detail.error && detail.status != null,
      path: requestPath(url),
    }
  );
  const ok = !result.error && result.status != null;
  const statusText =
    result.status == null ? "no response" : `HTTP ${result.status}`;
  const meta = [`HTTP ${method}`, statusText, `${result.latencyMs} ms`];
  resultDrawer(els.resultHttp, {
    ok,
    meta: meta.join(" · "),
    result,
    nodes: [
      card(
        "check",
        ok ? "is-ok" : "is-error",
        meta.join(" · "),
        snippet(result.error || result.raw || "(empty body)")
      ),
    ],
  });
  if (ok) {
    celebrate();
  }
  els.runHttp.disabled = false;
});

function currentClusterSource() {
  return els.clusterSource.value === "omni" ? "omni" : "manual";
}

function updateClusterHelp() {
  const type = CLUSTER_HELP[els.clusterType.value] ? els.clusterType.value : "gke";
  els.clusterType.value = type;
  els.clusterHelp.textContent = CLUSTER_HELP[type];
}

function updateClusterSourceUi() {
  const source = currentClusterSource();
  const isOmni = source === "omni";
  els.clusterSource.value = source;
  els.clusterSourceHelp.textContent = CLUSTER_SOURCE_HELP[source];
  els.clusterManualFields.hidden = isOmni;
  els.clusterOmniFields.hidden = !isOmni;
  if (!els.omniUrl.value.trim()) {
    els.omniUrl.value = DEFAULT_OMNI_URL;
  }
  els.clusterKubeconfigLabel.textContent = isOmni
    ? "Omni kubeconfig"
    : "Kubeconfig YAML (optional)";
  els.clusterKubeconfig.placeholder = isOmni
    ? "Paste omnictl kubeconfig --service-account output"
    : "Paste kubeconfig to fill server and token";
  updateContextVisibility();
}

function updateContextVisibility() {
  const hasOptions = els.clusterContext.options.length > 0;
  const show =
    hasOptions &&
    (currentClusterSource() === "omni" || els.clusterContext.options.length > 1);
  els.clusterContext.hidden = !show;
  els.clusterContextLabel.hidden = !show;
}

function fillContextOptions(parsed, selected) {
  els.clusterContext.replaceChildren();
  for (const entry of parsed.contexts) {
    const option = document.createElement("option");
    option.value = entry.context;
    option.textContent = entry.cluster
      ? `${entry.context} · ${entry.cluster}`
      : entry.context;
    els.clusterContext.append(option);
  }
  if (selected && parsed.contexts.some((item) => item.context === selected)) {
    els.clusterContext.value = selected;
  }
  updateContextVisibility();
}

function applyContextEntry(entry) {
  if (entry.server) {
    els.clusterApiServer.value = normalizeApiServer(entry.server);
  }
  if (entry.token) {
    els.clusterToken.value = entry.token;
  } else if (currentClusterSource() === "omni") {
    els.clusterToken.value = "";
  }
  if (entry.namespace) {
    els.clusterNamespace.value = entry.namespace;
  }
  els.clusterContext.dataset.preferred = entry.context || "";
}

function kubeconfigParseMessage(entry, source) {
  const lines = [];
  if (!entry) {
    lines.push("Select a context / cluster.");
    return { body: lines.join(" "), isError: true };
  }
  lines.push(`Parsed context ${entry.context}.`);
  if (entry.server) {
    lines.push("API server filled from the selected cluster.");
  } else {
    lines.push("No cluster.server found for this context.");
  }
  const authError = Kubeconfig.authError(entry, source);
  if (entry.token) {
    lines.push(
      entry.authProvider
        ? "Bearer token filled from the auth-provider."
        : "Bearer token filled from the user block."
    );
  } else if (authError) {
    lines.push(authError);
  }
  return { body: lines.join(" "), isError: !entry.token };
}

function applyKubeconfigText(text, preferredContext, options = {}) {
  const persistSettings = options.persistSettings !== false;
  const quiet = options.quiet === true;
  const source = currentClusterSource();
  try {
    const parsed = Kubeconfig.parse(text);
    const selected = Kubeconfig.pickContext(
      parsed,
      preferredContext || els.clusterContext.dataset.preferred || ""
    );
    fillContextOptions(parsed, selected);
    if (!selected) {
      if (!quiet) {
        showBox(els.kubeconfigResult, {
          status: null,
          latencyMs: 0,
          body: "Multiple contexts found. Choose one from Context / cluster.",
          isError: true,
        });
      }
      return null;
    }
    const entry = Kubeconfig.contextEntry(parsed, selected);
    applyContextEntry(entry);
    if (persistSettings) {
      saveClusterSettings({ omniContext: selected });
    }
    if (!quiet) {
      const message = kubeconfigParseMessage(entry, source);
      showBox(els.kubeconfigResult, {
        status: entry.token ? 200 : null,
        latencyMs: 0,
        body: message.body,
        isError: message.isError,
      });
    }
    return entry;
  } catch (error) {
    fillContextOptions({ contexts: [] }, "");
    if (!quiet) {
      showBox(els.kubeconfigResult, {
        status: null,
        latencyMs: 0,
        body: error.message || String(error),
        isError: true,
      });
    }
    return null;
  }
}

function normalizeApiServer(raw) {
  return (raw || "").trim().replace(/\/+$/, "");
}

function normalizeOmniUrl(raw) {
  return (raw || "").trim().replace(/\/+$/, "") || DEFAULT_OMNI_URL;
}

function currentClusterSettings() {
  return {
    clusterSource: currentClusterSource(),
    clusterType: CLUSTER_HELP[els.clusterType.value]
      ? els.clusterType.value
      : "gke",
    clusterApiServer: normalizeApiServer(els.clusterApiServer.value),
    clusterToken: (els.clusterToken.value || "").trim(),
    omniUrl: normalizeOmniUrl(els.omniUrl.value),
    omniServiceAccountKey: (els.omniSaKey.value || "").trim(),
    omniContext:
      els.clusterContext.value || els.clusterContext.dataset.preferred || "",
    clusterNamespace:
      (els.clusterNamespace.value || "").trim() || DEFAULT_CLUSTER_NAMESPACE,
    clusterKubeconfig: els.clusterKubeconfig.value,
    clusterKind: K8S_KINDS[els.crdKind.value] ? els.crdKind.value : "Gateway",
    clusterManifest: els.crdYaml.value,
  };
}

const CONNECT_CLUSTER_MSG = "Connect a cluster in Settings first.";
const INVENTORY_KINDS = [
  "Gateway",
  "EnterpriseAgentgatewayBackend",
  "HTTPRoute",
  "EnterpriseAgentgatewayPolicy",
  "AgentgatewayModel",
  "RateLimitConfig",
  "EnterpriseAgentgatewayBudget",
];
const KIND_LABELS = {
  Gateway: "Gateway",
  HTTPRoute: "HTTPRoute",
  EnterpriseAgentgatewayBackend: "Backend",
  EnterpriseAgentgatewayPolicy: "Policy",
  AgentgatewayModel: "Model",
  RateLimitConfig: "RateLimit",
  EnterpriseAgentgatewayBudget: "Budget",
};
const inventoryCache = { llm: [], mcp: [], cluster: [] };
let mcpTargetName = "mcp-target";

function exampleYaml(section, key) {
  const group = DEPLOY_EXAMPLES[section] || {};
  const item = group[key] || Object.values(group)[0];
  return item ? item.yaml : "";
}

function clusterNamespaceOrDefault() {
  return (els.clusterNamespace.value || "").trim() || DEFAULT_CLUSTER_NAMESPACE;
}

function fillPresetSelect(select, presets, selected) {
  if (!select) {
    return;
  }
  select.replaceChildren();
  const ungrouped = [];
  const groups = new Map();
  for (const preset of presets) {
    if (preset.group) {
      if (!groups.has(preset.group)) {
        groups.set(preset.group, []);
      }
      groups.get(preset.group).push(preset);
    } else {
      ungrouped.push(preset);
    }
  }
  const addOption = (parent, preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    parent.append(option);
  };
  for (const preset of ungrouped) {
    addOption(select, preset);
  }
  for (const [label, items] of groups) {
    const group = document.createElement("optgroup");
    group.label = label;
    for (const preset of items) {
      addOption(group, preset);
    }
    select.append(group);
  }
  const mapped =
    selected === "failover" ? "model-failover" : selected;
  const valid = presets.some((preset) => preset.id === mapped);
  select.value = valid ? mapped : presets[0].id;
}

function renderLlmCatalog(query) {
  if (!els.llmCatalog) {
    return;
  }
  const needle = String(query || "").trim().toLowerCase();
  const selected = (els.llmPreset && els.llmPreset.value) || "openai";
  const groups = new Map();
  for (const item of AgwBuilder.LLM_CATALOG) {
    const hay = `${item.group} ${item.label} ${item.blurb}`.toLowerCase();
    if (needle && !hay.includes(needle)) {
      continue;
    }
    if (!groups.has(item.group)) {
      groups.set(item.group, []);
    }
    groups.get(item.group).push(item);
  }
  els.llmCatalog.replaceChildren();
  for (const [label, items] of groups) {
    const heading = document.createElement("div");
    heading.className = "catalog-group";
    heading.textContent = label;
    els.llmCatalog.append(heading);
    for (const item of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "catalog-item";
      if (item.id === selected) {
        btn.classList.add("is-active");
      }
      if (item.apply === false) {
        btn.classList.add("is-docs");
        btn.textContent = `${item.label} — see docs`;
      } else {
        btn.textContent = item.label;
      }
      btn.addEventListener("click", () => {
        applyLlmPreset(item.id);
      });
      els.llmCatalog.append(btn);
    }
  }
}

function currentBuilderProvider() {
  const active =
    els.llmBuilderProvider &&
    els.llmBuilderProvider.querySelector(".provider-pill.is-active");
  const raw = (active && active.dataset.provider) || "";
  return PROVIDERS[raw] ? raw : currentProvider();
}

function currentFallbackProvider() {
  const active =
    els.llmFallbackProvider &&
    els.llmFallbackProvider.querySelector(".provider-pill.is-active");
  const raw = (active && active.dataset.provider) || "";
  return PROVIDERS[raw] ? raw : "claude";
}

function fillLlmBuilder(fields) {
  if (!els.llmName) {
    return;
  }
  els.llmName.value = fields.name || "";
  els.llmNamespace.value = fields.namespace || clusterNamespaceOrDefault();
  els.llmBuilderModel.value = fields.model || "";
  els.llmBuilderFallback.value = fields.fallbackModel || "";
  els.llmSecret.value = fields.secretRef || "";
  els.llmPath.value = fields.routePath || "";
  els.llmGateway.value = fields.gateway || AgwBuilder.DEFAULT_GATEWAY;
  els.llmHost.value = fields.host || "";
  els.llmPort.value = fields.port || "";
  els.llmProviderPath.value = fields.providerPath || "";
  els.llmRegion.value = fields.region || "";
  if (els.llmFallbackSecret) {
    els.llmFallbackSecret.value = fields.fallbackSecretRef || "";
  }
  if (els.llmUnhealthy) {
    els.llmUnhealthy.value =
      fields.unhealthyCondition || AgwBuilder.HEALTH_DEFAULTS.unhealthyCondition;
  }
  if (els.llmEviction) {
    els.llmEviction.value =
      fields.evictionDuration || AgwBuilder.HEALTH_DEFAULTS.evictionDuration;
  }
  if (els.llmFailures) {
    els.llmFailures.value =
      fields.consecutiveFailures != null
        ? fields.consecutiveFailures
        : AgwBuilder.HEALTH_DEFAULTS.consecutiveFailures;
  }
  if (els.llmTargetRoute) {
    els.llmTargetRoute.value = fields.targetRoute || fields.name || "openai";
  }
  if (els.llmPrompt) {
    els.llmPrompt.value = fields.prompt || "";
  }
  if (els.llmPromptAppend) {
    els.llmPromptAppend.value = fields.promptAppend || "";
  }
  if (els.llmRegex) {
    els.llmRegex.value = fields.regex || "credit card";
  }
  if (els.llmHeaderName) {
    els.llmHeaderName.value = fields.headerName || "x-llm";
  }
  if (els.llmHeaderValue) {
    els.llmHeaderValue.value = fields.headerValue || "gemini";
  }
  if (els.llmTransformField) {
    els.llmTransformField.value = fields.transformField || "max_completion_tokens";
  }
  if (els.llmCel) {
    els.llmCel.value = fields.cel || "min(llmRequest.max_completion_tokens, 10)";
  }
  if (els.llmAliasName) {
    els.llmAliasName.value = fields.aliasName || "fast";
  }
  if (els.llmAliasTarget) {
    els.llmAliasTarget.value = fields.aliasTarget || "gpt-3.5-turbo";
  }
  if (els.llmRlCount) {
    els.llmRlCount.value = fields.rateLimitCount || 5;
  }
  if (els.llmRlUnit) {
    els.llmRlUnit.value = fields.rateLimitUnit || "MINUTE";
  }
  if (els.llmRlType) {
    els.llmRlType.value = fields.rateLimitType || "REQUEST";
  }
  if (els.llmBudgetAmount) {
    els.llmBudgetAmount.value = fields.budgetAmount || 100000;
  }
  if (els.llmBudgetWindow) {
    els.llmBudgetWindow.value = fields.budgetWindow || "Day";
  }
  if (fields.provider && els.llmBuilderProvider) {
    setProviderSelect(els.llmBuilderProvider, fields.provider);
  }
  if (fields.fallbackProvider && els.llmFallbackProvider) {
    setProviderSelect(els.llmFallbackProvider, fields.fallbackProvider);
  }
  if (fields.preset && els.llmPreset) {
    const mapped =
      fields.preset === "failover" ? "model-failover" : fields.preset;
    const known = AgwBuilder.LLM_PRESETS.some((preset) => preset.id === mapped);
    if (known) {
      els.llmPreset.value = mapped;
    }
  }
}

function currentLlmBuilderFields() {
  const provider = currentBuilderProvider();
  const preset = (els.llmPreset && els.llmPreset.value) || provider;
  const failover = AgwBuilder.isFailoverPreset(preset);
  return {
    provider,
    preset,
    failover,
    name: els.llmName.value,
    namespace: els.llmNamespace.value || clusterNamespaceOrDefault(),
    model: els.llmBuilderModel.value,
    fallbackModel: els.llmBuilderFallback.value,
    fallbackProvider: currentFallbackProvider(),
    fallbackSecretRef: els.llmFallbackSecret ? els.llmFallbackSecret.value : "",
    secretRef: els.llmSecret.value,
    routePath: els.llmPath.value,
    gateway: els.llmGateway.value || AgwBuilder.DEFAULT_GATEWAY,
    host: els.llmHost.value,
    port: els.llmPort.value,
    providerPath: els.llmProviderPath.value,
    region: els.llmRegion.value,
    unhealthyCondition: els.llmUnhealthy ? els.llmUnhealthy.value : "",
    evictionDuration: els.llmEviction ? els.llmEviction.value : "",
    consecutiveFailures: els.llmFailures ? els.llmFailures.value : "",
    targetRoute: els.llmTargetRoute ? els.llmTargetRoute.value : "",
    prompt: els.llmPrompt ? els.llmPrompt.value : "",
    promptAppend: els.llmPromptAppend ? els.llmPromptAppend.value : "",
    regex: els.llmRegex ? els.llmRegex.value : "",
    headerName: els.llmHeaderName ? els.llmHeaderName.value : "",
    headerValue: els.llmHeaderValue ? els.llmHeaderValue.value : "",
    transformField: els.llmTransformField ? els.llmTransformField.value : "",
    cel: els.llmCel ? els.llmCel.value : "",
    aliasName: els.llmAliasName ? els.llmAliasName.value : "",
    aliasTarget: els.llmAliasTarget ? els.llmAliasTarget.value : "",
    rateLimitCount: els.llmRlCount ? els.llmRlCount.value : "",
    rateLimitUnit: els.llmRlUnit ? els.llmRlUnit.value : "",
    rateLimitType: els.llmRlType ? els.llmRlType.value : "",
    budgetAmount: els.llmBudgetAmount ? els.llmBudgetAmount.value : "",
    budgetWindow: els.llmBudgetWindow ? els.llmBudgetWindow.value : "",
    rewriteTo: preset === "httproute" ? "/v1/chat/completions" : "",
  };
}

function recipeFields(preset) {
  const recipe = AgwBuilder.catalogRecipe(preset);
  return new Set(recipe && recipe.fields ? recipe.fields : ["core"]);
}

function updateLlmBuilderVisibility() {
  if (!els.llmFallbackWrap) {
    return;
  }
  const provider = currentBuilderProvider();
  const preset = (els.llmPreset && els.llmPreset.value) || provider;
  const recipe = AgwBuilder.catalogRecipe(preset);
  const wanted = recipeFields(preset);
  const docsOnly = recipe && recipe.apply === false;
  const failover = AgwBuilder.isFailoverPreset(preset);
  const providerFailover =
    preset === "provider-failover" || preset === "load-balance";
  if (els.llmFormWrap) {
    els.llmFormWrap.hidden = Boolean(docsOnly);
  }
  if (els.llmApplyWrap) {
    els.llmApplyWrap.hidden = Boolean(docsOnly);
  }
  if (els.llmDocsOnly) {
    els.llmDocsOnly.hidden = !docsOnly;
    els.llmDocsOnly.textContent = docsOnly
      ? `${recipe.blurb} Open the Docs link for the client example.`
      : "";
  }
  if (els.applyLlm) {
    els.applyLlm.disabled = docsOnly || !clusterIsReady();
  }
  const show = (node, on) => {
    if (node) {
      node.hidden = !on;
    }
  };
  const showCore = wanted.has("core") && !docsOnly;
  const nameWrap = els.llmName && els.llmName.closest("div");
  const nsWrap = els.llmNamespace && els.llmNamespace.closest("div");
  const modelWrap = els.llmBuilderModel && els.llmBuilderModel.closest("div");
  const secretWrap = els.llmSecret && els.llmSecret.closest("div");
  const pathWrap = els.llmPath && els.llmPath.closest("div");
  const gwWrap = els.llmGateway && els.llmGateway.closest("div");
  show(nameWrap, showCore);
  show(nsWrap, showCore);
  show(modelWrap, wanted.has("model"));
  show(secretWrap, wanted.has("secret"));
  show(pathWrap, wanted.has("path"));
  show(gwWrap, wanted.has("gateway"));
  show(els.llmBuilderProvider, wanted.has("provider"));
  const providerLabel = document.getElementById("llm-builder-provider-label");
  if (providerLabel) {
    providerLabel.hidden = !wanted.has("provider");
    providerLabel.textContent = providerFailover ? "Primary provider" : "Provider";
  }
  els.llmFallbackWrap.hidden = !wanted.has("fallback");
  const fallbackLabel = document.querySelector('label[for="llm-fallback"]');
  if (fallbackLabel) {
    fallbackLabel.textContent =
      preset === "model-failover" ? "Fallback model(s)" : "Fallback model";
  }
  show(
    els.llmFallbackProviderWrap,
    wanted.has("fallbackProvider") || wanted.has("fallbackSecret")
  );
  if (els.llmFallbackProvider) {
    els.llmFallbackProvider.hidden = !wanted.has("fallbackProvider");
  }
  const fallbackProviderLabel = document.getElementById(
    "llm-fallback-provider-label"
  );
  if (fallbackProviderLabel) {
    fallbackProviderLabel.hidden = !wanted.has("fallbackProvider");
  }
  show(els.llmHealthWrap, wanted.has("health"));
  if (els.llmPolicyHint) {
    els.llmPolicyHint.hidden = !wanted.has("health");
  }
  if (els.llmModelLabel) {
    els.llmModelLabel.textContent = failover || providerFailover ? "Primary model" : "Model";
  }
  const compat = wanted.has("compat") || (provider === "grok" && wanted.has("provider"));
  const bedrock = wanted.has("region") || (provider === "bedrock" && wanted.has("provider"));
  show(els.llmHostWrap, compat);
  show(els.llmPortWrap, compat);
  show(els.llmProviderPathWrap, compat);
  show(els.llmRegionWrap, bedrock);
  show(els.llmTargetWrap, wanted.has("targetRoute"));
  show(els.llmPromptWrap, wanted.has("prompt"));
  show(els.llmPromptAppendWrap, wanted.has("promptAppend"));
  show(els.llmRegexWrap, wanted.has("regex"));
  show(els.llmHeaderWrap, wanted.has("header"));
  show(els.llmTransformWrap, wanted.has("transform"));
  show(els.llmAliasWrap, wanted.has("alias"));
  show(els.llmRatelimitWrap, wanted.has("rateLimit"));
  show(els.llmBudgetWrap, wanted.has("budget"));
  if (els.llmCatalogTitle && recipe) {
    els.llmCatalogTitle.textContent = recipe.label;
  }
  if (els.llmCatalogBlurb && recipe) {
    els.llmCatalogBlurb.textContent = recipe.blurb || "";
  }
  if (els.llmDocsLink && recipe) {
    els.llmDocsLink.href = recipe.docs;
  }
}

function persistLlmBuilder() {
  persist({
    llmPreset: els.llmPreset ? els.llmPreset.value : "",
    llmName: els.llmName.value,
    llmBuilderNamespace: els.llmNamespace.value,
    llmBuilderModel: els.llmBuilderModel.value,
    llmBuilderFallback: els.llmBuilderFallback.value,
    llmSecret: els.llmSecret.value,
    llmPath: els.llmPath.value,
    llmGateway: els.llmGateway.value,
    llmHost: els.llmHost.value,
    llmPort: els.llmPort.value,
    llmProviderPath: els.llmProviderPath.value,
    llmRegion: els.llmRegion.value,
    llmFallbackProvider: currentFallbackProvider(),
    llmFallbackSecret: els.llmFallbackSecret ? els.llmFallbackSecret.value : "",
    llmUnhealthyCondition: els.llmUnhealthy ? els.llmUnhealthy.value : "",
    llmEvictionDuration: els.llmEviction ? els.llmEviction.value : "",
    llmConsecutiveFailures: els.llmFailures ? els.llmFailures.value : "",
    llmTargetRoute: els.llmTargetRoute ? els.llmTargetRoute.value : "",
    llmPrompt: els.llmPrompt ? els.llmPrompt.value : "",
    llmPromptAppend: els.llmPromptAppend ? els.llmPromptAppend.value : "",
    llmRegex: els.llmRegex ? els.llmRegex.value : "",
    llmHeaderName: els.llmHeaderName ? els.llmHeaderName.value : "",
    llmHeaderValue: els.llmHeaderValue ? els.llmHeaderValue.value : "",
    llmTransformField: els.llmTransformField ? els.llmTransformField.value : "",
    llmCel: els.llmCel ? els.llmCel.value : "",
    llmAliasName: els.llmAliasName ? els.llmAliasName.value : "",
    llmAliasTarget: els.llmAliasTarget ? els.llmAliasTarget.value : "",
    llmRateLimitCount: els.llmRlCount ? els.llmRlCount.value : "",
    llmRateLimitUnit: els.llmRlUnit ? els.llmRlUnit.value : "",
    llmRateLimitType: els.llmRlType ? els.llmRlType.value : "",
    llmBudgetAmount: els.llmBudgetAmount ? els.llmBudgetAmount.value : "",
    llmBudgetWindow: els.llmBudgetWindow ? els.llmBudgetWindow.value : "",
    llmYaml: els.llmYaml.value,
  });
}

function regenLlmYaml() {
  els.llmYaml.value = AgwBuilder.generateLlmYaml(currentLlmBuilderFields());
  persistLlmBuilder();
}

function applyLlmProviderDefaults(provider) {
  const fields = AgwBuilder.llmDefaults(provider);
  fields.namespace = clusterNamespaceOrDefault();
  fields.preset = provider;
  fillLlmBuilder(fields);
  updateLlmBuilderVisibility();
  regenLlmYaml();
  renderLlmCatalog(els.llmCatalogSearch ? els.llmCatalogSearch.value : "");
}

function applyLlmPreset(presetId) {
  const recipe = AgwBuilder.catalogRecipe(presetId);
  const preset = recipe || AgwBuilder.LLM_PRESETS[0];
  els.llmPreset.value = preset.id;
  renderLlmCatalog(els.llmCatalogSearch ? els.llmCatalogSearch.value : "");
  if (preset.provider && ["openai", "claude", "grok", "bedrock", "gemini"].includes(preset.id)) {
    applyProvider(preset.provider, { setModels: true, loadYaml: true });
    return;
  }
  if (AgwBuilder.isFailoverPreset(preset.id)) {
    const primary = currentBuilderProvider();
    const fields = AgwBuilder.llmDefaults(primary);
    fields.namespace = clusterNamespaceOrDefault();
    fields.failover = true;
    fields.preset = preset.id;
    fields.name = preset.id;
    fields.routePath = "/model";
    if (preset.id === "provider-failover") {
      const fallbackId = primary === "openai" ? "claude" : "openai";
      const fallback = AgwBuilder.llmDefaults(fallbackId);
      fields.fallbackProvider = fallbackId;
      fields.fallbackModel = fallback.model;
      fields.fallbackSecretRef = fallback.secretRef;
    }
    fillLlmBuilder(fields);
    syncFailoverTestFromBuilder();
  } else if (preset.id === "load-balance") {
    const primary = currentBuilderProvider();
    const fields = AgwBuilder.llmDefaults(primary);
    fields.namespace = clusterNamespaceOrDefault();
    fields.preset = "load-balance";
    fields.name = "loadbalanced-backend";
    fields.routePath = "/chat";
    const fallbackId = primary === "openai" ? "claude" : "openai";
    const fallback = AgwBuilder.llmDefaults(fallbackId);
    fields.fallbackProvider = fallbackId;
    fields.fallbackModel = fallback.model;
    fields.fallbackSecretRef = fallback.secretRef;
    fillLlmBuilder(fields);
  } else if (preset.id === "content-routing") {
    const fields = AgwBuilder.llmDefaults("openai");
    fields.namespace = clusterNamespaceOrDefault();
    fields.preset = "content-routing";
    fields.name = "content-routing";
    fields.fallbackSecretRef = "anthropic-secret";
    fillLlmBuilder(fields);
  } else if (preset.id === "secretref") {
    const fields = AgwBuilder.llmDefaults(currentBuilderProvider());
    fields.namespace = clusterNamespaceOrDefault();
    fields.preset = "secretref";
    fillLlmBuilder(fields);
  } else if (preset.id === "agw-model") {
    const fields = AgwBuilder.llmDefaults(currentBuilderProvider());
    fields.namespace = clusterNamespaceOrDefault();
    fields.preset = "agw-model";
    fields.name = fields.model || "gpt-4";
    fillLlmBuilder(fields);
  } else if (preset.id === "virtual-model") {
    const fields = AgwBuilder.llmDefaults(currentBuilderProvider());
    fields.namespace = clusterNamespaceOrDefault();
    fields.preset = "virtual-model";
    fields.name = "resilient";
    fillLlmBuilder(fields);
  } else if (preset.id === "prompt-guard") {
    const fields = currentLlmBuilderFields();
    fields.preset = "prompt-guard";
    fields.name = "openai-prompt-guard";
    fields.targetRoute = "openai";
    fields.regex = "credit card";
    fillLlmBuilder(fields);
  } else if (preset.id === "prompt-enrichment") {
    const fields = currentLlmBuilderFields();
    fields.preset = "prompt-enrichment";
    fields.name = "openai-opt";
    fields.targetRoute = "openai";
    fields.prompt = "Parse the unstructured text into CSV format.";
    fillLlmBuilder(fields);
  } else if (preset.id === "prompt-template") {
    const fields = currentLlmBuilderFields();
    fields.preset = "prompt-template";
    fields.name = "static-prompt-template";
    fields.targetRoute = "openai";
    fields.prompt =
      "You are a helpful customer service assistant. Always be polite and professional.";
    fields.promptAppend =
      "If you cannot answer a question, say so clearly rather than making up information.";
    fillLlmBuilder(fields);
  } else if (preset.id === "transformation") {
    const fields = currentLlmBuilderFields();
    fields.preset = "transformation";
    fields.name = "cap-max-tokens";
    fields.targetRoute = "openai";
    fields.transformField = "max_completion_tokens";
    fields.cel = "min(llmRequest.max_completion_tokens, 10)";
    fillLlmBuilder(fields);
  } else if (preset.id === "rate-limit") {
    const fields = currentLlmBuilderFields();
    fields.preset = "rate-limit";
    fields.name = "openai-rate-limit";
    fields.targetRoute = "openai";
    fields.rateLimitCount = 5;
    fields.rateLimitUnit = "MINUTE";
    fields.rateLimitType = "REQUEST";
    fillLlmBuilder(fields);
  } else if (preset.id === "alias") {
    const fields = AgwBuilder.llmDefaults(currentBuilderProvider());
    fields.namespace = clusterNamespaceOrDefault();
    fields.preset = "alias";
    fields.aliasName = "fast";
    fields.aliasTarget = "gpt-3.5-turbo";
    fillLlmBuilder(fields);
  } else if (preset.id === "rbac") {
    const fields = currentLlmBuilderFields();
    fields.preset = "rbac";
    fields.name = "rbac-policy";
    fields.targetRoute = "google";
    fields.headerName = "x-llm";
    fields.headerValue = "gemini";
    fillLlmBuilder(fields);
  } else if (preset.id === "budget") {
    const fields = currentLlmBuilderFields();
    fields.preset = "budget";
    fields.name = "route-budget";
    fields.targetRoute = "openai";
    fields.budgetAmount = 100000;
    fields.budgetWindow = "Day";
    fillLlmBuilder(fields);
  } else if (preset.id === "httproute") {
    const fields = AgwBuilder.llmDefaults(currentBuilderProvider());
    fields.namespace = clusterNamespaceOrDefault();
    fields.preset = "httproute";
    fields.rewriteTo = "/v1/chat/completions";
    if (!fields.routePath) {
      fields.routePath = `/${fields.name}`;
    }
    fillLlmBuilder(fields);
  } else if (preset.id === "gateway") {
    const fields = currentLlmBuilderFields();
    fields.preset = "gateway";
    fields.gateway = fields.gateway || AgwBuilder.DEFAULT_GATEWAY;
    fillLlmBuilder(fields);
  }
  updateLlmBuilderVisibility();
  regenLlmYaml();
}

function fillMcpBuilder(fields) {
  if (!els.mcpName) {
    return;
  }
  els.mcpName.value = fields.name || "";
  els.mcpNamespace.value = fields.namespace || clusterNamespaceOrDefault();
  els.mcpHost.value = fields.host || "";
  els.mcpPort.value = fields.port || "";
  els.mcpProtocol.value = fields.protocol || "SSE";
  els.mcpPath.value = fields.routePath || "/mcp";
  els.mcpGateway.value = fields.gateway || AgwBuilder.DEFAULT_GATEWAY;
  els.mcpToolMode.value = fields.toolMode || "Standard";
  els.mcpSecret.value = fields.secretRef || "";
  els.mcpSchema.value = fields.schemaRef || "";
  mcpTargetName = fields.targetName || "mcp-target";
  if (fields.preset && els.mcpPreset) {
    const known = AgwBuilder.MCP_PRESETS.some((preset) => preset.id === fields.preset);
    if (known) {
      els.mcpPreset.value = fields.preset;
    }
  }
}

function currentMcpBuilderFields() {
  const parsed = AgwBuilder.parseTargetUrl(els.mcpHost.value);
  return {
    preset: (els.mcpPreset && els.mcpPreset.value) || "remote",
    name: els.mcpName.value,
    namespace: els.mcpNamespace.value || clusterNamespaceOrDefault(),
    targetName: mcpTargetName,
    host: parsed.host || els.mcpHost.value,
    port: els.mcpPort.value || parsed.port,
    protocol: els.mcpProtocol.value || "SSE",
    targetPath: parsed.path || "",
    routePath: els.mcpPath.value || "/mcp",
    gateway: els.mcpGateway.value || AgwBuilder.DEFAULT_GATEWAY,
    toolMode: els.mcpToolMode.value || "Standard",
    secretRef: els.mcpSecret.value,
    schemaRef: els.mcpSchema.value,
  };
}

function updateMcpBuilderVisibility() {
  if (!els.mcpSchemaWrap) {
    return;
  }
  els.mcpSchemaWrap.hidden = els.mcpProtocol.value !== "OpenAPI";
}

function persistMcpBuilder() {
  persist({
    mcpPreset: els.mcpPreset ? els.mcpPreset.value : "",
    mcpName: els.mcpName.value,
    mcpBuilderNamespace: els.mcpNamespace.value,
    mcpHost: els.mcpHost.value,
    mcpPort: els.mcpPort.value,
    mcpProtocol: els.mcpProtocol.value,
    mcpPath: els.mcpPath.value,
    mcpGateway: els.mcpGateway.value,
    mcpToolMode: els.mcpToolMode.value,
    mcpSecret: els.mcpSecret.value,
    mcpSchema: els.mcpSchema.value,
    mcpYaml: els.mcpYaml.value,
  });
}

function regenMcpYaml() {
  els.mcpYaml.value = AgwBuilder.generateMcpYaml(currentMcpBuilderFields());
  persistMcpBuilder();
}

function applyMcpPreset(presetId) {
  const fields = AgwBuilder.mcpDefaults(presetId);
  fields.namespace = clusterNamespaceOrDefault();
  fillMcpBuilder(fields);
  updateMcpBuilderVisibility();
  regenMcpYaml();
}

function loadDeployExamples(stored) {
  const provider = currentProvider();
  fillPresetSelect(
    els.llmPreset,
    AgwBuilder.LLM_PRESETS.concat(
      AgwBuilder.LLM_CATALOG.filter((item) => item.apply === false)
    ),
    stored.llmPreset || provider
  );
  renderLlmCatalog("");
  fillPresetSelect(
    els.mcpPreset,
    AgwBuilder.MCP_PRESETS,
    stored.mcpPreset || "remote"
  );
  const a2aStored =
    stored.a2aExample || (stored.mcpExample === "a2a" ? "a2a" : "a2a");
  const a2aKey = DEPLOY_EXAMPLES.a2a[a2aStored] ? a2aStored : "a2a";
  const apiStored = stored.apiExample || stored.securityExample;
  const apiKey = DEPLOY_EXAMPLES.api[apiStored] ? apiStored : "policy";
  if (els.a2aExample) {
    els.a2aExample.value = a2aKey;
  }
  if (els.apiExample) {
    els.apiExample.value = apiKey;
  }
  const llmFields = AgwBuilder.llmDefaults(provider);
  llmFields.namespace = stored.llmBuilderNamespace || clusterNamespaceOrDefault();
  llmFields.name = stored.llmName || llmFields.name;
  llmFields.model = stored.llmBuilderModel || llmFields.model;
  llmFields.fallbackModel = stored.llmBuilderFallback || llmFields.fallbackModel;
  llmFields.secretRef = stored.llmSecret || llmFields.secretRef;
  llmFields.routePath =
    stored.llmPath !== undefined && stored.llmPath !== null
      ? stored.llmPath
      : llmFields.routePath;
  llmFields.gateway = stored.llmGateway || llmFields.gateway;
  llmFields.host = stored.llmHost || llmFields.host;
  llmFields.port = stored.llmPort || llmFields.port;
  llmFields.providerPath = stored.llmProviderPath || llmFields.providerPath;
  llmFields.region = stored.llmRegion || llmFields.region;
  llmFields.fallbackProvider =
    stored.llmFallbackProvider || llmFields.fallbackProvider;
  llmFields.fallbackSecretRef =
    stored.llmFallbackSecret || llmFields.fallbackSecretRef;
  llmFields.unhealthyCondition =
    stored.llmUnhealthyCondition || llmFields.unhealthyCondition;
  llmFields.evictionDuration =
    stored.llmEvictionDuration || llmFields.evictionDuration;
  llmFields.consecutiveFailures =
    stored.llmConsecutiveFailures || llmFields.consecutiveFailures;
  llmFields.preset = (els.llmPreset && els.llmPreset.value) || provider;
  llmFields.failover = AgwBuilder.isFailoverPreset(llmFields.preset);
  fillLlmBuilder(llmFields);
  if (stored.failoverPrimaryProvider || stored.failoverFallbackProvider) {
    appliedFailoverProviders.primary = stored.failoverPrimaryProvider || "";
    appliedFailoverProviders.fallback = stored.failoverFallbackProvider || "";
  }
  updateLlmBuilderVisibility();
  els.llmYaml.value =
    stored.llmYaml || AgwBuilder.generateLlmYaml(currentLlmBuilderFields());

  const mcpFields = AgwBuilder.mcpDefaults(
    (els.mcpPreset && els.mcpPreset.value) || "remote"
  );
  mcpFields.namespace = stored.mcpBuilderNamespace || clusterNamespaceOrDefault();
  mcpFields.name = stored.mcpName || mcpFields.name;
  mcpFields.host = stored.mcpHost || mcpFields.host;
  mcpFields.port = stored.mcpPort || mcpFields.port;
  mcpFields.protocol = stored.mcpProtocol || mcpFields.protocol;
  mcpFields.routePath = stored.mcpPath || mcpFields.routePath;
  mcpFields.gateway = stored.mcpGateway || mcpFields.gateway;
  mcpFields.toolMode = stored.mcpToolMode || mcpFields.toolMode;
  mcpFields.secretRef = stored.mcpSecret || "";
  mcpFields.schemaRef = stored.mcpSchema || mcpFields.schemaRef;
  fillMcpBuilder(mcpFields);
  updateMcpBuilderVisibility();
  els.mcpYaml.value =
    stored.mcpYaml || AgwBuilder.generateMcpYaml(currentMcpBuilderFields());

  els.a2aYaml.value =
    stored.a2aYaml ||
    (stored.mcpExample === "a2a" ? stored.mcpYaml : "") ||
    exampleYaml("a2a", a2aKey);
  els.apiYaml.value =
    stored.apiYaml || stored.securityYaml || exampleYaml("api", apiKey);
  renderMcpDeploys();
}

function clusterIsReady() {
  const settings = currentClusterSettings();
  return Boolean(
    clusterConnected && settings.clusterApiServer && settings.clusterToken
  );
}

function updateDeployHints() {
  const connected = clusterIsReady();
  const text = connected
    ? "Apply uses the Settings cluster API server, token, and namespace."
    : CONNECT_CLUSTER_MSG;
  document.querySelectorAll("[data-deploy-hint]").forEach((node) => {
    node.textContent = text;
  });
  const recipe = AgwBuilder.catalogRecipe(
    (els.llmPreset && els.llmPreset.value) || "openai"
  );
  els.applyLlm.disabled = !connected || (recipe && recipe.apply === false);
  els.applyMcp.disabled = !connected;
  els.applyA2a.disabled = !connected;
  els.applyApi.disabled = !connected;
  if (els.llmInvRefresh) {
    els.llmInvRefresh.disabled = !connected;
  }
  if (els.mcpInvRefresh) {
    els.mcpInvRefresh.disabled = !connected;
  }
  document.querySelectorAll("[data-mcp-deploy]").forEach((btn) => {
    btn.disabled = !connected;
  });
  if (els.listCrds) {
    els.listCrds.disabled = !connected;
  }
  if (!connected) {
    showInventoryDisconnected(els.llmInventory);
    showInventoryDisconnected(els.mcpInventory);
    showInventoryDisconnected(els.clusterInventory);
  }
  if (els.clusterChip && els.clusterChip.classList.contains("is-checking")) {
    setClusterChip("checking");
  } else {
    setClusterChip(clusterConnected ? "connected" : "disconnected");
  }
}

async function applyYamlDocuments(yaml, resultEl, applyBtn, onDone) {
  if (!clusterIsReady()) {
    showBox(resultEl, {
      status: null,
      latencyMs: 0,
      body: CONNECT_CLUSTER_MSG,
      isError: true,
    });
    return;
  }

  const settings = await saveClusterSettings();
  let docs;
  try {
    docs = parseManifestText(yaml);
  } catch (error) {
    showBox(resultEl, {
      status: null,
      latencyMs: 0,
      body: error.message || String(error),
      isError: true,
    });
    return;
  }

  applyBtn.disabled = true;
  showPending(resultEl, `Applying ${docs.length} document(s)…`);

  const applied = [];
  for (const doc of docs) {
    try {
      applied.push(await applyManifest(settings, doc));
    } catch (error) {
      applied.push({
        name: (doc.metadata && doc.metadata.name) || "unknown",
        kind: doc.kind || "Unknown",
        method: "validate",
        result: {
          error: error.message || String(error),
          status: null,
          latencyMs: 0,
          raw: "",
          payload: null,
          response: null,
        },
      });
    }
  }

  const nodes = applied.map((item) => {
    const ok =
      !item.result.error && item.result.response && item.result.response.ok;
    const statusText =
      item.result.status == null ? "no response" : `HTTP ${item.result.status}`;
    return card(
      "check",
      ok ? "is-ok" : "is-error",
      `${item.method} ${item.kind}/${item.name} · ${statusText} · ${item.result.latencyMs} ms`,
      ok
        ? `${item.kind} ${item.name} ${item.method === "POST" ? "created" : "updated"}`
        : k8sStatusMessage(item.result)
    );
  });

  resultEl.hidden = false;
  resultEl.classList.toggle(
    "is-error",
    applied.some(
      (item) =>
        item.result.error || !item.result.response || !item.result.response.ok
    )
  );
  resultEl.replaceChildren(...nodes);
  updateDeployHints();
  if (typeof onDone === "function") {
    onDone();
  }
}

function mcpApplyBackendGroup() {
  const groups = []
    .concat(inventoryCache.mcp || [])
    .concat(inventoryCache.cluster || []);
  for (const group of groups) {
    if (group.kind !== "EnterpriseAgentgatewayBackend") {
      continue;
    }
    for (const item of group.items || []) {
      const api = String(item.apiVersion || "");
      if (api.startsWith("enterpriseagentgateway.solo.io")) {
        return "enterpriseagentgateway.solo.io";
      }
      if (api.startsWith("agentgateway.dev")) {
        return "agentgateway.dev";
      }
    }
  }
  return K8S_KINDS.EnterpriseAgentgatewayBackend.group;
}

function renderMcpDeploys() {
  const recipes = (typeof AgwBuilder !== "undefined" && AgwBuilder.MCP_DEPLOYS) || [];
  const connected = clusterIsReady();
  const fill = (container, items, kind) => {
    if (!container) {
      return;
    }
    container.replaceChildren();
    for (const item of items) {
      if (kind === "docs") {
        const link = document.createElement("a");
        link.className = "mcp-docs-card";
        link.href = item.docs;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const title = document.createElement("strong");
        title.textContent = `${item.label} — see docs`;
        const blurb = document.createElement("span");
        blurb.textContent = item.blurb || "";
        link.append(title, blurb);
        container.append(link);
        continue;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        kind === "virtual" ? "btn mcp-deploy-btn" : "btn btn-secondary mcp-deploy-btn";
      btn.dataset.mcpDeploy = item.id;
      btn.dataset.label = item.label;
      btn.textContent = item.label;
      btn.title = item.blurb || item.label;
      btn.disabled = !connected;
      btn.addEventListener("click", () => applyMcpDeploy(item.id, btn));
      container.append(btn);
    }
  };
  fill(
    els.mcpDeployPrimary,
    recipes.filter((item) => item.group === "virtual" && item.apply !== false),
    "virtual"
  );
  fill(
    els.mcpDeployMore,
    recipes.filter((item) => item.group === "more" && item.apply !== false),
    "more"
  );
  fill(
    els.mcpDocsCards,
    recipes.filter((item) => item.apply === false || item.group === "docs"),
    "docs"
  );
}

async function applyMcpDeploy(id, button) {
  const resultEl = els.mcpDeployResult;
  if (!clusterIsReady()) {
    showBox(resultEl, {
      status: null,
      latencyMs: 0,
      body: CONNECT_CLUSTER_MSG,
      isError: true,
    });
    return;
  }
  const recipe = AgwBuilder.mcpDeployRecipe(id);
  if (!recipe || recipe.apply === false) {
    return;
  }
  const settings = await saveClusterSettings();
  const docs = AgwBuilder.mcpDeployDocs(id, {
    namespace: settings.clusterNamespace,
    backendGroup: mcpApplyBackendGroup(),
  });
  if (!docs.length) {
    showBox(resultEl, {
      status: null,
      latencyMs: 0,
      body: "No documented YAML for this deploy.",
      isError: true,
    });
    return;
  }
  const label = (button && button.dataset.label) || recipe.label;
  if (button) {
    button.disabled = true;
    button.classList.add("is-busy");
    button.classList.remove("is-ok", "is-fail");
    button.textContent = `${label} — deploying…`;
  }
  showPending(resultEl, `Applying ${docs.length} document(s)…`);
  const applied = [];
  for (const doc of docs) {
    try {
      applied.push(await applyManifest(settings, doc));
    } catch (error) {
      applied.push({
        name: (doc.metadata && doc.metadata.name) || "unknown",
        kind: doc.kind || "Unknown",
        method: "validate",
        result: {
          error: error.message || String(error),
          status: null,
          latencyMs: 0,
          raw: "",
          payload: null,
          response: null,
        },
      });
    }
  }
  const failed = applied.some(
    (item) =>
      item.result.error || !item.result.response || !item.result.response.ok
  );
  const names = applied.map((item) => `${item.kind}/${item.name}`).join(", ");
  const nodes = applied.map((item) => {
    const ok =
      !item.result.error && item.result.response && item.result.response.ok;
    const statusText =
      item.result.status == null ? "no response" : `HTTP ${item.result.status}`;
    return card(
      "check",
      ok ? "is-ok" : "is-error",
      `${item.method} ${item.kind}/${item.name} · ${statusText} · ${item.result.latencyMs} ms`,
      ok
        ? `${item.kind} ${item.name} ${item.method === "POST" ? "created" : "updated"}`
        : k8sStatusMessage(item.result)
    );
  });
  resultEl.hidden = false;
  resultEl.classList.toggle("is-error", failed);
  resultEl.replaceChildren(...nodes);
  if (button) {
    button.classList.remove("is-busy");
    button.classList.toggle("is-ok", !failed);
    button.classList.toggle("is-fail", failed);
    button.textContent = failed ? `${label} — fail` : `${label} — OK`;
    button.title = names;
    button.disabled = !clusterIsReady();
  }
  updateDeployHints();
  if (!failed) {
    refreshInventory("mcp");
  }
}

async function saveClusterSettings(extra = {}) {
  const settings = currentClusterSettings();
  els.clusterApiServer.value = settings.clusterApiServer;
  els.clusterNamespace.value = settings.clusterNamespace;
  els.omniUrl.value = settings.omniUrl;
  await persist({ ...settings, ...extra });
  return settings;
}

function k8sHeaders(token, contentType) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

function clusterTargetError(settings) {
  if (!settings.clusterApiServer || !settings.clusterToken) {
    return "API server URL and bearer token are required.";
  }
  try {
    const url = new URL(settings.clusterApiServer);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "API server URL must start with http:// or https://.";
    }
  } catch {
    return "API server URL is invalid.";
  }
  return "";
}

function k8sUrl(apiServer, path, query) {
  const url = new URL(path, `${apiServer}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function manifestBody(doc, namespace, resourceVersion) {
  const body = {
    apiVersion: doc.apiVersion,
    kind: doc.kind,
    metadata: {
      name: doc.metadata.name,
      namespace,
    },
  };
  if (doc.spec !== undefined) {
    body.spec = doc.spec;
  }
  if (doc.data !== undefined) {
    body.data = doc.data;
  }
  if (resourceVersion) {
    body.metadata.resourceVersion = resourceVersion;
  }
  if (doc.metadata.labels) {
    body.metadata.labels = doc.metadata.labels;
  }
  if (doc.metadata.annotations) {
    body.metadata.annotations = doc.metadata.annotations;
  }
  return body;
}

function kindSpecFromManifest(doc) {
  if (!doc || !doc.kind) {
    return null;
  }
  const known = K8S_KINDS[doc.kind];
  if (known) {
    return { kind: doc.kind, ...known };
  }
  const apiVersion = String(doc.apiVersion || "");
  const slash = apiVersion.lastIndexOf("/");
  if (slash === -1) {
    if (apiVersion === "v1") {
      return {
        kind: doc.kind,
        core: true,
        group: "",
        version: "v1",
        plural: `${String(doc.kind).toLowerCase()}s`,
      };
    }
    return null;
  }
  return {
    kind: doc.kind,
    group: apiVersion.slice(0, slash),
    version: apiVersion.slice(slash + 1),
    plural: `${String(doc.kind).toLowerCase()}s`,
  };
}

function collectionPath(spec, namespace) {
  const ns = encodeURIComponent(namespace);
  if (spec.core || spec.group === "") {
    return `/api/${spec.version}/namespaces/${ns}/${spec.plural}`;
  }
  return `/apis/${spec.group}/${spec.version}/namespaces/${ns}/${spec.plural}`;
}

function k8sStatusMessage(result) {
  if (result.error) {
    if (/CERT|SSL|certificate|authority|ERR_CERT/i.test(result.error)) {
      return `${result.error} Chrome rejects untrusted or self-signed API server certificates.`;
    }
    return result.error;
  }
  const payload = result.payload;
  if (payload && typeof payload.message === "string" && payload.message) {
    return payload.message;
  }
  return snippet(result.raw || `HTTP ${result.status}`);
}

function showPending(target, text) {
  target.hidden = false;
  target.classList.remove("is-error");
  target.replaceChildren();
  const pending = document.createElement("div");
  pending.className = "result-body";
  pending.textContent = text;
  target.append(pending);
}

function parseManifestText(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    throw new Error("YAML is empty.");
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  const docs = parseYamlDocuments(trimmed).filter(
    (doc) => doc && typeof doc === "object" && !Array.isArray(doc)
  );
  if (docs.length === 0) {
    throw new Error("No Kubernetes documents found in YAML.");
  }
  return docs;
}

async function applyManifest(settings, doc) {
  const spec = kindSpecFromManifest(doc);
  if (!spec) {
    throw new Error("Manifest is missing kind or apiVersion.");
  }
  const name = doc.metadata && doc.metadata.name;
  if (!name) {
    throw new Error(`${spec.kind} is missing metadata.name.`);
  }
  const namespace =
    (doc.metadata && doc.metadata.namespace) || settings.clusterNamespace;
  const collection = k8sUrl(
    settings.clusterApiServer,
    collectionPath(spec, namespace)
  );
  const item = k8sUrl(
    settings.clusterApiServer,
    `${collectionPath(spec, namespace)}/${encodeURIComponent(name)}`
  );
  const headers = k8sHeaders(settings.clusterToken, "application/json");
  const existing = await timedFetch(item, { method: "GET", headers });
  if (existing.error) {
    return { name, kind: spec.kind, result: existing, method: "GET" };
  }
  if (existing.status === 404) {
    const created = await timedFetch(collection, {
      method: "POST",
      headers,
      body: JSON.stringify(manifestBody(doc, namespace)),
    });
    return { name, kind: spec.kind, result: created, method: "POST" };
  }
  if (!existing.response || !existing.response.ok) {
    return { name, kind: spec.kind, result: existing, method: "GET" };
  }
  const updated = await timedFetch(item, {
    method: "PUT",
    headers,
    body: JSON.stringify(
      manifestBody(
        doc,
        namespace,
        existing.payload &&
          existing.payload.metadata &&
          existing.payload.metadata.resourceVersion
      )
    ),
  });
  return { name, kind: spec.kind, result: updated, method: "PUT" };
}

async function listKind(settings, kind) {
  const spec = K8S_KINDS[kind];
  const result = await timedFetch(
    k8sUrl(
      settings.clusterApiServer,
      collectionPath(spec, settings.clusterNamespace)
    ),
    { method: "GET", headers: k8sHeaders(settings.clusterToken) }
  );
  const items =
    result.payload && Array.isArray(result.payload.items)
      ? result.payload.items
      : [];
  return { kind, label: KIND_LABELS[kind] || kind, result, items };
}

async function deleteResource(settings, kind, name, namespace) {
  const spec = K8S_KINDS[kind];
  const item = k8sUrl(
    settings.clusterApiServer,
    `${collectionPath(spec, namespace)}/${encodeURIComponent(name)}`
  );
  return timedFetch(item, {
    method: "DELETE",
    headers: k8sHeaders(settings.clusterToken),
  });
}

function showInventoryDisconnected(container) {
  if (!container) {
    return;
  }
  container.hidden = false;
  container.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "inventory-error";
  empty.textContent = CONNECT_CLUSTER_MSG;
  container.append(empty);
}

function renderInventory(container, groups, options) {
  if (!container) {
    return;
  }
  container.hidden = false;
  container.replaceChildren();
  if (!clusterIsReady()) {
    showInventoryDisconnected(container);
    return;
  }
  let total = 0;
  for (const group of groups) {
    const failed =
      group.result &&
      (group.result.error || !group.result.response || !group.result.response.ok);
    if (failed) {
      const err = document.createElement("div");
      err.className = "inventory-error";
      err.textContent = `${group.label || group.kind}: ${k8sStatusMessage(group.result)}`;
      container.append(err);
      continue;
    }
    const items = group.items || [];
    if (items.length === 0) {
      continue;
    }
    const heading = document.createElement("div");
    heading.className = "inventory-group";
    heading.textContent = group.label || group.kind;
    container.append(heading);
    for (const item of items) {
      total += 1;
      const row = document.createElement("div");
      row.className = "inventory-row";
      const name = document.createElement("span");
      name.className = "inventory-name";
      const itemName = (item.metadata && item.metadata.name) || "(unnamed)";
      name.textContent = itemName;
      name.title = itemName;
      const actions = document.createElement("div");
      actions.className = "inventory-actions";
      if (options && options.onLoad) {
        const load = document.createElement("button");
        load.type = "button";
        load.className = "btn btn-secondary btn-tiny";
        load.textContent = "Load";
        load.addEventListener("click", () => options.onLoad(group.kind, item, groups));
        actions.append(load);
      }
      if (options && options.onDelete) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "btn btn-secondary btn-tiny";
        del.textContent = "Delete";
        del.addEventListener("click", () => options.onDelete(group.kind, item));
        actions.append(del);
      }
      row.append(name, actions);
      container.append(row);
    }
  }
  if (total === 0 && !container.querySelector(".inventory-error")) {
    const empty = document.createElement("div");
    empty.className = "inventory-empty";
    empty.textContent = "No resources found.";
    container.append(empty);
  }
}

function filterInventoryGroups(groups, mode) {
  return groups
    .map((group) => {
      if (group.kind !== "EnterpriseAgentgatewayBackend") {
        return group;
      }
      const items = (group.items || []).filter((item) =>
        mode === "mcp" ? AgwBuilder.isMcpBackend(item) : AgwBuilder.isAiBackend(item)
      );
      return { ...group, items };
    })
    .filter((group) => {
      if (group.kind !== "EnterpriseAgentgatewayPolicy") {
        return true;
      }
      return mode === "cluster" || mode === "llm";
    });
}

async function refreshInventory(which) {
  if (!clusterIsReady()) {
    const target =
      which === "llm"
        ? els.llmInventory
        : which === "mcp"
          ? els.mcpInventory
          : els.clusterInventory;
    showInventoryDisconnected(target);
    return;
  }
  const settings = await saveClusterSettings();
  const kinds =
    which === "cluster"
      ? INVENTORY_KINDS
      : which === "llm"
        ? [
            "Gateway",
            "HTTPRoute",
            "EnterpriseAgentgatewayBackend",
            "EnterpriseAgentgatewayPolicy",
            "AgentgatewayModel",
            "RateLimitConfig",
            "EnterpriseAgentgatewayBudget",
          ]
        : ["Gateway", "HTTPRoute", "EnterpriseAgentgatewayBackend"];
  const groups = [];
  for (const kind of kinds) {
    groups.push(await listKind(settings, kind));
  }
  inventoryCache[which] = groups;
  if (which === "llm") {
    renderInventory(els.llmInventory, filterInventoryGroups(groups, "llm"), {
      onLoad: loadLlmInventoryItem,
      onDelete: (kind, item) => confirmDelete(kind, item, "llm"),
    });
  } else if (which === "mcp") {
    renderInventory(els.mcpInventory, filterInventoryGroups(groups, "mcp"), {
      onLoad: loadMcpInventoryItem,
      onDelete: (kind, item) => confirmDelete(kind, item, "mcp"),
    });
  } else {
    renderInventory(els.clusterInventory, groups, {
      onLoad: loadClusterInventoryItem,
      onDelete: (kind, item) => confirmDelete(kind, item, "cluster"),
    });
    if (els.crdListResult) {
      els.crdListResult.hidden = true;
    }
  }
}

function routesFromGroups(groups) {
  const routeGroup = (groups || []).find((group) => group.kind === "HTTPRoute");
  return (routeGroup && routeGroup.items) || [];
}

function backendsFromGroups(groups) {
  const backendGroup = (groups || []).find(
    (group) => group.kind === "EnterpriseAgentgatewayBackend"
  );
  return (backendGroup && backendGroup.items) || [];
}

function policiesFromGroups(groups) {
  const policyGroup = (groups || []).find(
    (group) => group.kind === "EnterpriseAgentgatewayPolicy"
  );
  return (policyGroup && policyGroup.items) || [];
}

function matchingHealthPolicy(policies, backendName) {
  return (policies || []).find((item) => {
    const refs = (item.spec && item.spec.targetRefs) || [];
    return refs.some(
      (ref) =>
        ref &&
        ref.kind === "EnterpriseAgentgatewayBackend" &&
        ref.name === backendName
    );
  });
}

function loadLlmInventoryItem(kind, item, groups) {
  const routes = routesFromGroups(groups);
  const policies = policiesFromGroups(groups);
  if (
    kind === "AgentgatewayModel" ||
    kind === "RateLimitConfig" ||
    kind === "EnterpriseAgentgatewayBudget"
  ) {
    if (kind === "AgentgatewayModel") {
      els.llmPreset.value =
        item.spec && item.spec.virtualModel ? "virtual-model" : "agw-model";
    }
    els.llmYaml.value = AgwBuilder.resourceToYaml(item);
    updateLlmBuilderVisibility();
    renderLlmCatalog(els.llmCatalogSearch ? els.llmCatalogSearch.value : "");
    persistLlmBuilder();
    return;
  }
  if (kind === "EnterpriseAgentgatewayPolicy") {
    if (!AgwBuilder.isHealthPolicy(item)) {
      els.llmYaml.value = AgwBuilder.resourceToYaml(item);
      persistLlmBuilder();
      return;
    }
    const health = AgwBuilder.fieldsFromHealthPolicy(item);
    const backend = backendsFromGroups(groups).find(
      (entry) =>
        entry.metadata &&
        entry.metadata.name === health.targetBackend &&
        AgwBuilder.isAiBackend(entry)
    );
    if (backend) {
      const route = AgwBuilder.matchingRoute(
        routes,
        backend.metadata && backend.metadata.name
      );
      const fields = AgwBuilder.fieldsFromLlmResource(backend, route, item);
      if (PROVIDERS[fields.provider]) {
        setProviderSelect(els.llmBuilderProvider, fields.provider);
      }
      fillLlmBuilder(fields);
    } else {
      fillLlmBuilder({
        ...currentLlmBuilderFields(),
        ...health,
        name: health.targetBackend || currentLlmBuilderFields().name,
        preset: "model-failover",
        failover: true,
      });
    }
    updateLlmBuilderVisibility();
    regenLlmYaml();
    syncFailoverTestFromBuilder();
    return;
  }
  if (kind === "Gateway") {
    els.llmGateway.value = (item.metadata && item.metadata.name) || AgwBuilder.DEFAULT_GATEWAY;
    els.llmNamespace.value =
      (item.metadata && item.metadata.namespace) || clusterNamespaceOrDefault();
    els.llmPreset.value = "gateway";
    updateLlmBuilderVisibility();
    regenLlmYaml();
    return;
  }
  if (kind === "HTTPRoute") {
    const routeFields = AgwBuilder.fieldsFromRoute(item);
    const backend = backendsFromGroups(groups).find(
      (entry) =>
        entry.metadata &&
        entry.metadata.name === routeFields.backendName &&
        AgwBuilder.isAiBackend(entry)
    );
    if (backend) {
      const policy = matchingHealthPolicy(
        policies,
        backend.metadata && backend.metadata.name
      );
      const fields = AgwBuilder.fieldsFromLlmResource(backend, item, policy);
      if (PROVIDERS[fields.provider]) {
        setProviderSelect(els.llmBuilderProvider, fields.provider);
      }
      fillLlmBuilder(fields);
    } else {
      fillLlmBuilder({
        ...currentLlmBuilderFields(),
        ...routeFields,
        preset: "httproute",
      });
      els.llmPreset.value = "httproute";
    }
    updateLlmBuilderVisibility();
    regenLlmYaml();
    return;
  }
  const route = AgwBuilder.matchingRoute(routes, item.metadata && item.metadata.name);
  const policy = matchingHealthPolicy(policies, item.metadata && item.metadata.name);
  const fields = AgwBuilder.fieldsFromLlmResource(item, route, policy);
  if (PROVIDERS[fields.provider]) {
    setProviderSelect(els.llmBuilderProvider, fields.provider);
  }
  fillLlmBuilder(fields);
  updateLlmBuilderVisibility();
  regenLlmYaml();
  if (AgwBuilder.isFailoverPreset(fields.preset)) {
    syncFailoverTestFromBuilder();
  }
}

function loadMcpInventoryItem(kind, item, groups) {
  const routes = routesFromGroups(groups);
  if (kind === "Gateway") {
    els.mcpGateway.value = (item.metadata && item.metadata.name) || AgwBuilder.DEFAULT_GATEWAY;
    els.mcpNamespace.value =
      (item.metadata && item.metadata.namespace) || clusterNamespaceOrDefault();
    persistMcpBuilder();
    regenMcpYaml();
    return;
  }
  if (kind === "HTTPRoute") {
    const routeFields = AgwBuilder.fieldsFromRoute(item);
    const backend = backendsFromGroups(groups).find(
      (entry) =>
        entry.metadata &&
        entry.metadata.name === routeFields.backendName &&
        AgwBuilder.isMcpBackend(entry)
    );
    if (backend) {
      fillMcpBuilder(AgwBuilder.fieldsFromMcpResource(backend, item));
    } else {
      fillMcpBuilder({
        ...currentMcpBuilderFields(),
        name: routeFields.name,
        namespace: routeFields.namespace,
        routePath: routeFields.routePath,
        gateway: routeFields.gateway,
      });
    }
    updateMcpBuilderVisibility();
    regenMcpYaml();
    return;
  }
  const route = AgwBuilder.matchingRoute(routes, item.metadata && item.metadata.name);
  fillMcpBuilder(AgwBuilder.fieldsFromMcpResource(item, route));
  updateMcpBuilderVisibility();
  regenMcpYaml();
}

function loadClusterInventoryItem(kind, item) {
  els.crdKind.value = K8S_KINDS[kind] ? kind : els.crdKind.value;
  els.crdYaml.value = AgwBuilder.resourceToYaml(item);
  saveClusterSettings();
}

async function confirmDelete(kind, item, which) {
  if (!clusterIsReady()) {
    return;
  }
  const name = (item.metadata && item.metadata.name) || "";
  const namespace =
    (item.metadata && item.metadata.namespace) || clusterNamespaceOrDefault();
  const label = KIND_LABELS[kind] || kind;
  if (!name || !window.confirm(`Delete ${label} ${name} from ${namespace}?`)) {
    return;
  }
  const settings = await saveClusterSettings();
  const result = await deleteResource(settings, kind, name, namespace);
  const ok = !result.error && result.response && result.response.ok;
  if (!ok) {
    window.alert(k8sStatusMessage(result));
    return;
  }
  await refreshInventory(which);
}

els.clusterSource.addEventListener("change", () => {
  updateClusterSourceUi();
  saveClusterSettings();
  if (currentClusterSource() === "omni" && els.clusterKubeconfig.value.trim()) {
    applyKubeconfigText(
      els.clusterKubeconfig.value,
      els.clusterContext.dataset.preferred || ""
    );
  }
  updateDeployHints();
});

els.clusterType.addEventListener("change", () => {
  updateClusterHelp();
  saveClusterSettings();
  updateDeployHints();
});

els.clusterApiServer.addEventListener("change", () => {
  saveClusterSettings();
  updateDeployHints();
});

els.clusterToken.addEventListener("change", () => {
  saveClusterSettings();
  updateDeployHints();
});

els.omniUrl.addEventListener("change", () => {
  saveClusterSettings();
});

els.omniSaKey.addEventListener("change", () => {
  saveClusterSettings();
});

els.clusterContext.addEventListener("change", () => {
  const text = els.clusterKubeconfig.value.trim();
  if (!text) {
    saveClusterSettings({ omniContext: els.clusterContext.value });
    return;
  }
  applyKubeconfigText(text, els.clusterContext.value);
  updateDeployHints();
});

els.clusterNamespace.addEventListener("change", () => {
  saveClusterSettings();
  const ns = clusterNamespaceOrDefault();
  if (els.llmNamespace && !els.llmNamespace.value.trim()) {
    els.llmNamespace.value = ns;
    regenLlmYaml();
  }
  if (els.mcpNamespace && !els.mcpNamespace.value.trim()) {
    els.mcpNamespace.value = ns;
    regenMcpYaml();
  }
  updateDeployHints();
});

els.clusterKubeconfig.addEventListener("change", () => {
  const text = els.clusterKubeconfig.value.trim();
  if (text) {
    applyKubeconfigText(text, els.clusterContext.dataset.preferred || "");
  } else {
    fillContextOptions({ contexts: [] }, "");
    saveClusterSettings();
  }
  updateDeployHints();
});

els.crdKind.addEventListener("change", () => {
  saveClusterSettings();
});

els.crdYaml.addEventListener("change", () => {
  saveClusterSettings();
});

els.parseKubeconfig.addEventListener("click", async () => {
  const text = els.clusterKubeconfig.value.trim();
  if (!text) {
    showBox(els.kubeconfigResult, {
      status: null,
      latencyMs: 0,
      body: "Paste a kubeconfig first.",
      isError: true,
    });
    return;
  }
  applyKubeconfigText(text, els.clusterContext.value);
  updateDeployHints();
});

async function probeClusterConnection({ interactive = false } = {}) {
  const token = ++clusterProbeToken;
  const settings = interactive
    ? await saveClusterSettings()
    : currentClusterSettings();
  const targetError = clusterTargetError(settings);
  if (targetError) {
    if (token !== clusterProbeToken) {
      return false;
    }
    clusterConnected = false;
    await persist({ clusterConnected: false });
    setClusterChip("disconnected");
    if (interactive) {
      showBox(els.clusterTestResult, {
        status: null,
        latencyMs: 0,
        body: targetError,
        isError: true,
      });
    }
    updateDeployHints();
    return false;
  }

  setClusterChip("checking");
  if (interactive && els.testCluster) {
    els.testCluster.disabled = true;
    showPending(els.clusterTestResult, "Testing…");
  }

  const headers = k8sHeaders(settings.clusterToken);
  let result = await timedFetch(k8sUrl(settings.clusterApiServer, "/version"), {
    method: "GET",
    headers,
  });
  let probe = "/version";

  if (result.error || !result.response || !result.response.ok) {
    const gateway = await timedFetch(
      k8sUrl(settings.clusterApiServer, "/apis/gateway.networking.k8s.io/v1"),
      { method: "GET", headers }
    );
    if (!gateway.error && gateway.response && gateway.response.ok) {
      result = gateway;
      probe = "/apis/gateway.networking.k8s.io/v1";
    }
  }

  if (token !== clusterProbeToken) {
    return false;
  }

  const ok = !result.error && result.response && result.response.ok;
  let body = k8sStatusMessage(result);
  if (ok && probe === "/version" && result.payload) {
    const version =
      result.payload.gitVersion ||
      [result.payload.major, result.payload.minor].filter(Boolean).join(".");
    body = version
      ? `Connected. Kubernetes ${version}`
      : "Connected via GET /version.";
  } else if (ok) {
    body = "Connected via GET /apis/gateway.networking.k8s.io/v1.";
  }

  clusterConnected = ok;
  await persist({ clusterConnected: ok });
  setClusterChip(ok ? "connected" : "disconnected");
  if (interactive || (els.clusterTestResult && !els.clusterTestResult.hidden)) {
    showBox(els.clusterTestResult, {
      status: result.status,
      latencyMs: result.latencyMs,
      body,
      isError: !ok,
    });
  }
  updateDeployHints();
  if (interactive && ok) {
    celebrate();
    refreshInventory("cluster");
  }
  if (interactive && els.testCluster) {
    els.testCluster.disabled = false;
  }
  return ok;
}

els.testCluster.addEventListener("click", () => {
  return probeClusterConnection({ interactive: true });
});

els.listCrds.addEventListener("click", () => {
  refreshInventory("cluster");
});

function bindExampleSelect(select, textarea, section, storageKey, yamlKey) {
  if (!select || !textarea) {
    return;
  }
  select.addEventListener("change", () => {
    const key = select.value;
    textarea.value = exampleYaml(section, key);
    persist({ [storageKey]: key, [yamlKey]: textarea.value });
  });
  textarea.addEventListener("change", () => {
    persist({ [yamlKey]: textarea.value });
  });
}

bindExampleSelect(els.a2aExample, els.a2aYaml, "a2a", "a2aExample", "a2aYaml");
bindExampleSelect(els.apiExample, els.apiYaml, "api", "apiExample", "apiYaml");

function bindBuilderFields(ids, onChange) {
  for (const id of ids) {
    const node = document.getElementById(id);
    if (!node) {
      continue;
    }
    node.addEventListener("input", onChange);
    node.addEventListener("change", onChange);
  }
}

if (els.llmPreset) {
  els.llmPreset.addEventListener("change", () => {
    applyLlmPreset(els.llmPreset.value);
  });
}
if (els.llmCatalogSearch) {
  els.llmCatalogSearch.addEventListener("input", () => {
    renderLlmCatalog(els.llmCatalogSearch.value);
  });
}
bindBuilderFields(
  [
    "llm-name",
    "llm-namespace",
    "llm-model",
    "llm-fallback",
    "llm-secret",
    "llm-path",
    "llm-gateway",
    "llm-host",
    "llm-port",
    "llm-provider-path",
    "llm-region",
    "llm-fallback-secret",
    "llm-unhealthy",
    "llm-eviction",
    "llm-failures",
    "llm-target-route",
    "llm-prompt",
    "llm-prompt-append",
    "llm-regex",
    "llm-header-name",
    "llm-header-value",
    "llm-transform-field",
    "llm-cel",
    "llm-alias-name",
    "llm-alias-target",
    "llm-rl-count",
    "llm-rl-unit",
    "llm-rl-type",
    "llm-budget-amount",
    "llm-budget-window",
  ],
  () => {
    updateLlmBuilderVisibility();
    regenLlmYaml();
    syncFailoverTestFromBuilder();
  }
);
els.llmYaml.addEventListener("change", () => {
  persist({ llmYaml: els.llmYaml.value });
});
if (els.llmRegen) {
  els.llmRegen.addEventListener("click", () => {
    regenLlmYaml();
  });
}
if (els.llmInvRefresh) {
  els.llmInvRefresh.addEventListener("click", () => {
    refreshInventory("llm");
  });
}

if (els.mcpPreset) {
  els.mcpPreset.addEventListener("change", () => {
    applyMcpPreset(els.mcpPreset.value);
  });
}
if (els.mcpProtocol) {
  els.mcpProtocol.addEventListener("change", () => {
    if (els.mcpProtocol.value === "OpenAPI") {
      els.mcpPreset.value = "openapi";
      if (!els.mcpSchema.value) {
        els.mcpSchema.value = "petstore-schema";
      }
    }
    updateMcpBuilderVisibility();
    regenMcpYaml();
  });
}
if (els.mcpHost) {
  els.mcpHost.addEventListener("change", () => {
    const parsed = AgwBuilder.parseTargetUrl(els.mcpHost.value);
    if (parsed.host) {
      els.mcpHost.value = parsed.host;
    }
    if (parsed.port && !els.mcpPort.value.trim()) {
      els.mcpPort.value = parsed.port;
    }
    regenMcpYaml();
  });
}
bindBuilderFields(
  [
    "mcp-name",
    "mcp-namespace",
    "mcp-host",
    "mcp-port",
    "mcp-path",
    "mcp-gateway",
    "mcp-tool-mode",
    "mcp-secret",
    "mcp-schema",
  ],
  () => {
    updateMcpBuilderVisibility();
    regenMcpYaml();
  }
);
els.mcpYaml.addEventListener("change", () => {
  persist({ mcpYaml: els.mcpYaml.value });
});
if (els.mcpRegen) {
  els.mcpRegen.addEventListener("click", () => {
    regenMcpYaml();
  });
}
if (els.mcpInvRefresh) {
  els.mcpInvRefresh.addEventListener("click", () => {
    refreshInventory("mcp");
  });
}

els.applyLlm.addEventListener("click", () => {
  applyYamlDocuments(els.llmYaml.value, els.llmApplyResult, els.applyLlm, () => {
    syncFailoverTestFromBuilder();
    refreshInventory("llm");
  });
});

els.applyMcp.addEventListener("click", () => {
  applyYamlDocuments(els.mcpYaml.value, els.mcpApplyResult, els.applyMcp, () => {
    refreshInventory("mcp");
  });
});

els.applyA2a.addEventListener("click", () => {
  applyYamlDocuments(els.a2aYaml.value, els.a2aApplyResult, els.applyA2a);
});

els.applyApi.addEventListener("click", () => {
  applyYamlDocuments(els.apiYaml.value, els.apiApplyResult, els.applyApi);
});

els.loadExample.addEventListener("click", () => {
  els.crdYaml.value = EXAMPLE_MANIFEST;
  saveClusterSettings();
});

els.applyCrds.addEventListener("click", async () => {
  const settings = await saveClusterSettings();
  const targetError = clusterTargetError(settings);
  if (targetError) {
    showBox(els.crdApplyResult, {
      status: null,
      latencyMs: 0,
      body: targetError,
      isError: true,
    });
    return;
  }

  let docs;
  try {
    docs = parseManifestText(settings.clusterManifest);
  } catch (error) {
    showBox(els.crdApplyResult, {
      status: null,
      latencyMs: 0,
      body: error.message || String(error),
      isError: true,
    });
    return;
  }

  els.applyCrds.disabled = true;
  showPending(els.crdApplyResult, `Applying ${docs.length} document(s)…`);

  const applied = [];
  for (const doc of docs) {
    try {
      applied.push(await applyManifest(settings, doc));
    } catch (error) {
      applied.push({
        name: (doc.metadata && doc.metadata.name) || "unknown",
        kind: doc.kind || "Unknown",
        method: "validate",
        result: {
          error: error.message || String(error),
          status: null,
          latencyMs: 0,
          raw: "",
          payload: null,
          response: null,
        },
      });
    }
  }

  const nodes = applied.map((item) => {
    const ok =
      !item.result.error && item.result.response && item.result.response.ok;
    const statusText =
      item.result.status == null ? "no response" : `HTTP ${item.result.status}`;
    return card(
      "check",
      ok ? "is-ok" : "is-error",
      `${item.method} ${item.kind}/${item.name} · ${statusText} · ${item.result.latencyMs} ms`,
      ok
        ? `${item.kind} ${item.name} ${item.method === "POST" ? "created" : "updated"}`
        : k8sStatusMessage(item.result)
    );
  });

  els.crdApplyResult.hidden = false;
  els.crdApplyResult.classList.toggle(
    "is-error",
    applied.some(
      (item) =>
        item.result.error || !item.result.response || !item.result.response.ok
    )
  );
  els.crdApplyResult.replaceChildren(...nodes);
  els.applyCrds.disabled = false;
  refreshInventory("cluster");
});

bindDeployViews();
loadSettings();
