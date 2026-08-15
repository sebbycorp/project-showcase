const DEFAULT_ENDPOINT = "http://35.226.209.32/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_FALLBACK_MODEL = "gpt-4o";
const DEFAULT_MCP_ENDPOINT = "http://35.226.209.32/mcp";
const DEFAULT_A2A_ENDPOINT = "http://35.226.209.32/.well-known/agent-card.json";
const DEFAULT_CLUSTER_NAMESPACE = "agentgateway-system";
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
  "llmYaml",
  "mcpYaml",
  "a2aYaml",
  "securityYaml",
  "apiYaml",
  "clusterType",
  "clusterApiServer",
  "clusterToken",
  "clusterNamespace",
  "clusterKubeconfig",
  "clusterConnected",
  "clusterKind",
  "clusterManifest",
  "hooray",
  "soloUi",
  "demoStage",
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
  llmYaml: document.getElementById("llm-yaml"),
  applyLlm: document.getElementById("apply-llm"),
  llmApplyResult: document.getElementById("llm-apply-result"),
  mcpEndpoint: document.getElementById("mcp-endpoint"),
  probeMcp: document.getElementById("probe-mcp"),
  a2aEndpoint: document.getElementById("a2a-endpoint"),
  probeA2a: document.getElementById("probe-a2a"),
  mcpExample: document.getElementById("mcp-example"),
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
  resultA2a: document.getElementById("result-a2a"),
  resultHttp: document.getElementById("result-http"),
  resultUnauth: document.getElementById("result-unauth"),
  resultJunk: document.getElementById("result-junk"),
  seqChat: document.getElementById("seq-chat"),
  seqChatPing: document.getElementById("seq-chat-ping"),
  seqFailover: document.getElementById("seq-failover"),
  seqListCall: document.getElementById("seq-list-call"),
  seqMcpInit: document.getElementById("seq-mcp-init"),
  seqA2a: document.getElementById("seq-a2a"),
  seqHttp: document.getElementById("seq-http"),
  seqUnauth: document.getElementById("seq-unauth"),
  seqJunk: document.getElementById("seq-junk"),
  clusterType: document.getElementById("cluster-type"),
  clusterHelp: document.getElementById("cluster-help"),
  clusterApiServer: document.getElementById("cluster-api-server"),
  clusterToken: document.getElementById("cluster-token"),
  clusterNamespace: document.getElementById("cluster-namespace"),
  clusterKubeconfig: document.getElementById("cluster-kubeconfig"),
  parseKubeconfig: document.getElementById("parse-kubeconfig"),
  kubeconfigResult: document.getElementById("kubeconfig-result"),
  testCluster: document.getElementById("test-cluster"),
  clusterTestResult: document.getElementById("cluster-test-result"),
  crdKind: document.getElementById("crd-kind"),
  listCrds: document.getElementById("list-crds"),
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
  confetti: document.getElementById("confetti"),
};

let hoorayOn = true;
let demoStageOn = false;
let clusterConnected = false;

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

function setProviderSelects(id) {
  const spec = providerSpec(id);
  document.querySelectorAll(".provider-switch").forEach((root) => {
    root.querySelectorAll(".provider-pill").forEach((btn) => {
      const on = btn.dataset.provider === spec.id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
  });
}

function buildProviderSwitches(selected) {
  const spec = providerSpec(selected);
  document.querySelectorAll(".provider-switch").forEach((root) => {
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
        onProviderChange(item.id);
      });
      root.append(btn);
    }
  });
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
    loadYaml ? spec.example : els.llmExample.value
  );
  if (loadYaml) {
    els.llmExample.value = spec.example;
    els.llmYaml.value = exampleYaml("llm", spec.example);
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
  const mcpUrl = els.mcpEndpoint.value.trim() || DEFAULT_MCP_ENDPOINT;
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

function failoverSeqConfig() {
  const primaryKind = providerFromModel(els.primaryModel.value);
  const fallbackKind = providerFromModel(els.fallbackModel.value);
  return {
    viaGateway: true,
    target: providerLabel(primaryKind),
    targetKind: primaryKind,
    primaryKind,
    fallbackKind,
    fallbackTarget: providerLabel(fallbackKind),
  };
}

function refreshSeqDiagrams() {
  configureSeq(els.seqChat, llmSeqConfig(els.model.value));
  configureSeq(els.seqChatPing, llmSeqConfig(els.model.value));
  configureSeq(els.seqFailover, failoverSeqConfig());
  configureSeq(els.seqListCall, llmSeqConfig(els.chosenModel.value));
  configureSeq(els.seqMcpInit, mcpSeqConfig());
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
  els.mcpEndpoint.value = stored.mcpEndpoint || DEFAULT_MCP_ENDPOINT;
  els.a2aEndpoint.value = stored.a2aEndpoint || DEFAULT_A2A_ENDPOINT;
  els.httpMethod.value =
    stored.httpMethod === "POST" || stored.httpMethod === "GET"
      ? stored.httpMethod
      : "GET";
  els.httpUrl.value = stored.httpUrl || stored.endpoint || DEFAULT_ENDPOINT;
  els.clusterType.value = CLUSTER_HELP[stored.clusterType]
    ? stored.clusterType
    : "gke";
  els.clusterApiServer.value = stored.clusterApiServer || "";
  els.clusterToken.value = stored.clusterToken || "";
  els.clusterNamespace.value =
    stored.clusterNamespace || DEFAULT_CLUSTER_NAMESPACE;
  els.clusterKubeconfig.value = stored.clusterKubeconfig || "";
  els.crdKind.value = K8S_KINDS[stored.clusterKind]
    ? stored.clusterKind
    : "Gateway";
  els.crdYaml.value = stored.clusterManifest || EXAMPLE_MANIFEST;
  loadDeployExamples(stored);
  updateClusterHelp();
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
  const area = normalizeArea(stored.area, stored.scenario);
  setArea(area);
  if (area !== stored.area) {
    persist({ area });
  }
  updateEndpointHints();
  updateDeployHints();
}

function switchArea(area) {
  setArea(area);
  if (area !== "chat" && area !== "settings") {
    updateEndpointHints();
    updateDeployHints();
    refreshSeqDiagrams();
  }
  persist({ area });
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
  switchArea("settings");
});

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

els.endpoint.addEventListener("change", () => {
  saveChatSettings();
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
  const mcpEndpoint = els.mcpEndpoint.value.trim() || DEFAULT_MCP_ENDPOINT;
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

els.probeMcp.addEventListener("click", async () => {
  const url = els.mcpEndpoint.value.trim() || DEFAULT_MCP_ENDPOINT;
  els.mcpEndpoint.value = url;
  await persist({ mcpEndpoint: url });
  els.probeMcp.disabled = true;
  runningDrawer(els.resultMcp, "Probing…");

  const initialize = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "agentgateway-extension", version: "0.9.2" },
    },
  };

  const result = await runWithSeq(
    els.seqMcpInit,
    () =>
      probeWithFallback(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
          },
          body: JSON.stringify(initialize),
        },
        {
          method: "GET",
          headers: { Accept: "application/json, text/event-stream" },
        },
        "POST initialize unavailable; used GET"
      ),
    { ...mcpSeqConfig(), ok: mcpRequestOk, path: requestPath(url) }
  );

  const ok = !result.error && result.status != null && result.status < 400;
  const statusText = result.status == null ? "no response" : `HTTP ${result.status}`;
  const meta = [
    `MCP ${result.method}`,
    statusText,
    `${result.latencyMs} ms`,
  ];
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

function updateClusterHelp() {
  const type = CLUSTER_HELP[els.clusterType.value] ? els.clusterType.value : "gke";
  els.clusterType.value = type;
  els.clusterHelp.textContent = CLUSTER_HELP[type];
}

function normalizeApiServer(raw) {
  return (raw || "").trim().replace(/\/+$/, "");
}

function currentClusterSettings() {
  return {
    clusterType: CLUSTER_HELP[els.clusterType.value]
      ? els.clusterType.value
      : "gke",
    clusterApiServer: normalizeApiServer(els.clusterApiServer.value),
    clusterToken: (els.clusterToken.value || "").trim(),
    clusterNamespace:
      (els.clusterNamespace.value || "").trim() || DEFAULT_CLUSTER_NAMESPACE,
    clusterKubeconfig: els.clusterKubeconfig.value,
    clusterKind: K8S_KINDS[els.crdKind.value] ? els.crdKind.value : "Gateway",
    clusterManifest: els.crdYaml.value,
  };
}

const CONNECT_CLUSTER_MSG = "Connect a cluster in Settings first.";

function exampleYaml(section, key) {
  const group = DEPLOY_EXAMPLES[section] || {};
  const item = group[key] || Object.values(group)[0];
  return item ? item.yaml : "";
}

function loadDeployExamples(stored) {
  const provider = currentProvider();
  const preferred = DEPLOY_EXAMPLES.llm[stored.llmExample]
    ? stored.llmExample
    : providerSpec(provider).example;
  const llmKey = refreshLlmExampleOptions(provider, preferred);
  const mcpKey = DEPLOY_EXAMPLES.mcp[stored.mcpExample]
    ? stored.mcpExample
    : "mcp";
  const a2aStored =
    stored.a2aExample ||
    (stored.mcpExample === "a2a" ? "a2a" : "a2a");
  const a2aKey = DEPLOY_EXAMPLES.a2a[a2aStored] ? a2aStored : "a2a";
  const apiStored = stored.apiExample || stored.securityExample;
  const apiKey = DEPLOY_EXAMPLES.api[apiStored] ? apiStored : "policy";
  els.llmExample.value = llmKey;
  els.mcpExample.value = mcpKey;
  els.a2aExample.value = a2aKey;
  els.apiExample.value = apiKey;
  els.llmYaml.value = stored.llmYaml || exampleYaml("llm", llmKey);
  els.mcpYaml.value =
    stored.mcpExample === "a2a"
      ? exampleYaml("mcp", "mcp")
      : stored.mcpYaml || exampleYaml("mcp", mcpKey);
  els.a2aYaml.value =
    stored.a2aYaml ||
    (stored.mcpExample === "a2a" ? stored.mcpYaml : "") ||
    exampleYaml("a2a", a2aKey);
  els.apiYaml.value =
    stored.apiYaml || stored.securityYaml || exampleYaml("api", apiKey);
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
  els.applyLlm.disabled = !connected;
  els.applyMcp.disabled = !connected;
  els.applyA2a.disabled = !connected;
  els.applyApi.disabled = !connected;
}

async function applyYamlDocuments(yaml, resultEl, applyBtn) {
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
}

async function saveClusterSettings(extra = {}) {
  const settings = currentClusterSettings();
  els.clusterApiServer.value = settings.clusterApiServer;
  els.clusterNamespace.value = settings.clusterNamespace;
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
    spec: doc.spec,
  };
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
  return `/apis/${spec.group}/${spec.version}/namespaces/${encodeURIComponent(
    namespace
  )}/${spec.plural}`;
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

function parseKubeconfigText(text) {
  const docs = parseYamlDocuments(text);
  const config = docs.find((doc) => doc && (doc["current-context"] || doc.clusters));
  if (!config) {
    throw new Error("No kubeconfig document found.");
  }

  const current = config["current-context"];
  if (!current) {
    throw new Error("Kubeconfig has no current-context.");
  }

  const contexts = Array.isArray(config.contexts) ? config.contexts : [];
  const clusters = Array.isArray(config.clusters) ? config.clusters : [];
  const users = Array.isArray(config.users) ? config.users : [];
  const ctxEntry = contexts.find((item) => item && item.name === current);
  if (!ctxEntry || !ctxEntry.context) {
    throw new Error(`Context ${current} was not found.`);
  }

  const clusterName = ctxEntry.context.cluster;
  const userName = ctxEntry.context.user;
  const namespace = ctxEntry.context.namespace;
  const clusterEntry = clusters.find((item) => item && item.name === clusterName);
  const userEntry = users.find((item) => item && item.name === userName);
  const server =
    clusterEntry && clusterEntry.cluster && clusterEntry.cluster.server;
  const user = (userEntry && userEntry.user) || {};
  const token = typeof user.token === "string" ? user.token.trim() : "";
  const execCommand =
    user.exec && typeof user.exec.command === "string" ? user.exec.command : "";

  return {
    context: current,
    server: server ? String(server).trim() : "",
    token,
    namespace: namespace ? String(namespace).trim() : "",
    execCommand,
    execOnly: Boolean(user.exec && !token),
    hasClientCert: Boolean(
      user["client-certificate"] || user["client-certificate-data"]
    ),
  };
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

els.clusterNamespace.addEventListener("change", () => {
  saveClusterSettings();
});

els.clusterKubeconfig.addEventListener("change", () => {
  saveClusterSettings();
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

  try {
    const parsed = parseKubeconfigText(text);
    if (parsed.server) {
      els.clusterApiServer.value = normalizeApiServer(parsed.server);
    }
    if (parsed.token) {
      els.clusterToken.value = parsed.token;
    }
    if (parsed.namespace) {
      els.clusterNamespace.value = parsed.namespace;
    }
    await saveClusterSettings();

    const lines = [`Parsed context ${parsed.context}.`];
    if (parsed.server) {
      lines.push("API server filled from the current cluster.");
    } else {
      lines.push("No cluster.server found for this context.");
    }
    if (parsed.execOnly) {
      lines.push(
        `This user is exec-only (${parsed.execCommand || "exec plugin"}). Chrome cannot run gke-gcloud-auth-plugin, kubelogin, or aws eks get-token. Paste a bearer token from the matching command.`
      );
    } else if (parsed.token) {
      lines.push("Bearer token filled from the user block.");
    } else if (parsed.hasClientCert) {
      lines.push(
        "No bearer token in this kubeconfig. Client-certificate auth is not supported here; paste a token."
      );
    } else {
      lines.push("No user.token found. Paste a bearer token.");
    }

    showBox(els.kubeconfigResult, {
      status: parsed.token ? 200 : null,
      latencyMs: 0,
      body: lines.join(" "),
      isError: !parsed.token,
    });
  } catch (error) {
    showBox(els.kubeconfigResult, {
      status: null,
      latencyMs: 0,
      body: error.message || String(error),
      isError: true,
    });
  }
});

els.testCluster.addEventListener("click", async () => {
  const settings = await saveClusterSettings();
  const targetError = clusterTargetError(settings);
  if (targetError) {
    showBox(els.clusterTestResult, {
      status: null,
      latencyMs: 0,
      body: targetError,
      isError: true,
    });
    clusterConnected = false;
    await persist({ clusterConnected: false });
    updateDeployHints();
    return;
  }

  els.testCluster.disabled = true;
  showPending(els.clusterTestResult, "Testing…");

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

  showBox(els.clusterTestResult, {
    status: result.status,
    latencyMs: result.latencyMs,
    body,
    isError: !ok,
  });
  clusterConnected = ok;
  await persist({ clusterConnected: ok });
  updateDeployHints();
  if (ok) {
    celebrate();
  }
  els.testCluster.disabled = false;
});

els.listCrds.addEventListener("click", async () => {
  const settings = await saveClusterSettings();
  const targetError = clusterTargetError(settings);
  if (targetError) {
    showBox(els.crdListResult, {
      status: null,
      latencyMs: 0,
      body: targetError,
      isError: true,
    });
    return;
  }

  const spec = K8S_KINDS[settings.clusterKind];
  els.listCrds.disabled = true;
  showPending(els.crdListResult, `Listing ${settings.clusterKind}…`);

  const result = await timedFetch(
    k8sUrl(
      settings.clusterApiServer,
      collectionPath(spec, settings.clusterNamespace)
    ),
    { method: "GET", headers: k8sHeaders(settings.clusterToken) }
  );
  const ok = !result.error && result.response && result.response.ok;
  els.crdListResult.hidden = false;
  els.crdListResult.classList.toggle("is-error", !ok);
  els.crdListResult.replaceChildren();

  const meta = document.createElement("div");
  meta.className = "result-meta";
  const statusText =
    result.status == null ? "no response" : `HTTP ${result.status}`;
  meta.textContent = `${settings.clusterKind} · ${settings.clusterNamespace} · ${statusText} · ${result.latencyMs} ms`;
  els.crdListResult.append(meta);

  if (!ok) {
    const detail = document.createElement("div");
    detail.className = "result-body";
    detail.textContent = k8sStatusMessage(result);
    els.crdListResult.append(detail);
  } else {
    const items =
      result.payload && Array.isArray(result.payload.items)
        ? result.payload.items
        : [];
    if (items.length === 0) {
      const detail = document.createElement("div");
      detail.className = "result-body";
      detail.textContent = "No resources found.";
      els.crdListResult.append(detail);
    } else {
      const list = document.createElement("ul");
      list.className = "crd-names";
      for (const item of items) {
        const li = document.createElement("li");
        li.textContent = (item.metadata && item.metadata.name) || "(unnamed)";
        list.append(li);
      }
      els.crdListResult.append(list);
    }
  }

  els.listCrds.disabled = false;
});

function bindExampleSelect(select, textarea, section, storageKey, yamlKey) {
  select.addEventListener("change", () => {
    const key = select.value;
    textarea.value = exampleYaml(section, key);
    persist({ [storageKey]: key, [yamlKey]: textarea.value });
  });
  textarea.addEventListener("change", () => {
    persist({ [yamlKey]: textarea.value });
  });
}

bindExampleSelect(els.llmExample, els.llmYaml, "llm", "llmExample", "llmYaml");
bindExampleSelect(els.mcpExample, els.mcpYaml, "mcp", "mcpExample", "mcpYaml");
bindExampleSelect(els.a2aExample, els.a2aYaml, "a2a", "a2aExample", "a2aYaml");
bindExampleSelect(els.apiExample, els.apiYaml, "api", "apiExample", "apiYaml");

els.applyLlm.addEventListener("click", () => {
  applyYamlDocuments(els.llmYaml.value, els.llmApplyResult, els.applyLlm);
});

els.applyMcp.addEventListener("click", () => {
  applyYamlDocuments(els.mcpYaml.value, els.mcpApplyResult, els.applyMcp);
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
});

loadSettings();
