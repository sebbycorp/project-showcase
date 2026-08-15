const DEFAULT_ENDPOINT = "http://35.226.209.32/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_FALLBACK_MODEL = "gpt-4o";
const DEFAULT_MCP_ENDPOINT = "http://35.226.209.32/mcp";
const DEFAULT_A2A_ENDPOINT = "http://35.226.209.32/.well-known/agent-card.json";
const DEFAULT_CLUSTER_NAMESPACE = "agentgateway-system";
const CHAT_PATH = "/v1/chat/completions";
const TEST_MESSAGE = { role: "user", content: "Reply with the word pong." };
const JUNK_PROMPT = `policy-probe ${"x".repeat(1024)}`;
const BODY_SNIPPET = 400;
const AREAS = ["chat", "scenarios", "cluster", "settings"];
const STORAGE_KEYS = [
  "endpoint",
  "model",
  "primaryModel",
  "fallbackModel",
  "mcpEndpoint",
  "a2aEndpoint",
  "area",
  "scenario",
  "chosenModel",
  "llmExample",
  "mcpExample",
  "securityExample",
  "llmYaml",
  "mcpYaml",
  "securityYaml",
  "clusterType",
  "clusterApiServer",
  "clusterToken",
  "clusterNamespace",
  "clusterKubeconfig",
  "clusterConnected",
  "clusterKind",
  "clusterManifest",
  "hooray",
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
  tabScenarios: document.getElementById("tab-scenarios"),
  areaChat: document.getElementById("area-chat"),
  areaScenarios: document.getElementById("area-scenarios"),
  endpoint: document.getElementById("endpoint"),
  model: document.getElementById("model"),
  test: document.getElementById("test"),
  testResult: document.getElementById("test-result"),
  log: document.getElementById("log"),
  form: document.getElementById("chat-form"),
  message: document.getElementById("message"),
  send: document.getElementById("send"),
  sectionLlm: document.getElementById("section-llm"),
  sectionMcp: document.getElementById("section-mcp"),
  sectionSecurity: document.getElementById("section-security"),
  scenarioLlm: document.getElementById("scenario-llm"),
  scenarioMcp: document.getElementById("scenario-mcp"),
  scenarioSecurity: document.getElementById("scenario-security"),
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
  runUnauth: document.getElementById("run-unauth"),
  runJunk: document.getElementById("run-junk"),
  securityHint: document.getElementById("security-endpoint-hint"),
  securityExample: document.getElementById("security-example"),
  securityYaml: document.getElementById("security-yaml"),
  applySecurity: document.getElementById("apply-security"),
  securityApplyResult: document.getElementById("security-apply-result"),
  scenarioResult: document.getElementById("scenario-result"),
  seqChat: document.getElementById("seq-chat"),
  seqLlm: document.getElementById("seq-llm"),
  seqMcp: document.getElementById("seq-mcp"),
  seqSecurity: document.getElementById("seq-security"),
  tabCluster: document.getElementById("tab-cluster"),
  areaCluster: document.getElementById("area-cluster"),
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
  hooray: document.getElementById("hooray"),
  confetti: document.getElementById("confetti"),
};

let hoorayOn = true;
let clusterConnected = false;

function celebrate() {
  if (!hoorayOn) {
    return;
  }
  burstConfetti(els.confetti);
}

const scenarioPanels = {
  llm: els.scenarioLlm,
  mcp: els.scenarioMcp,
  security: els.scenarioSecurity,
};

const sectionTabs = {
  llm: els.sectionLlm,
  mcp: els.sectionMcp,
  security: els.sectionSecurity,
};

function normalizeScenario(name) {
  if (name === "mcp" || name === "a2a") {
    return "mcp";
  }
  if (name === "security") {
    return "security";
  }
  return "llm";
}

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
  els.securityHint.textContent = text;
  refreshSeqDiagrams();
}

const SEQ_STEP_MS = 240;
const seqTokens = {
  "seq-chat": 0,
  "seq-llm": 0,
  "seq-mcp": 0,
  "seq-security": 0,
};

function isIpHost(host) {
  return (
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
    host.includes(":") ||
    host === "localhost"
  );
}

function providerLabel(rawUrl) {
  const raw = (rawUrl || "").trim();
  if (/openai/i.test(raw)) {
    return "OpenAI";
  }
  try {
    const host = new URL(raw).hostname;
    if (!host || isIpHost(host)) {
      return "OpenAI";
    }
    return host;
  } catch {
    return "OpenAI";
  }
}

function pathCaption(viaGateway, target) {
  return viaGateway
    ? `Client → Agentgateway → ${target}`
    : `Client → ${target}`;
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
  const caption = seq.querySelector(".seq-caption");
  if (caption) {
    caption.textContent = text;
  }
}

function configureSeq(seq, { viaGateway, target }) {
  seq.dataset.mode = viaGateway ? "via-gw" : "direct";
  const targetBox = seq.querySelector('[data-role="target"]');
  if (targetBox) {
    targetBox.textContent = target;
  }
  if (!seq.classList.contains("is-run")) {
    setSeqCaption(seq, pathCaption(viaGateway, target));
  }
}

function llmSeqConfig() {
  return {
    viaGateway: true,
    target: providerLabel(normalizeEndpoint(els.endpoint.value)),
  };
}

function mcpSeqConfig() {
  const mcpUrl = els.mcpEndpoint.value.trim() || DEFAULT_MCP_ENDPOINT;
  const viaGateway = mcpUsesGateway(mcpUrl, els.endpoint.value);
  return { viaGateway, target: "MCP" };
}

function refreshSeqDiagrams() {
  configureSeq(els.seqChat, llmSeqConfig());
  configureSeq(els.seqLlm, llmSeqConfig());
  configureSeq(els.seqMcp, mcpSeqConfig());
  configureSeq(els.seqSecurity, llmSeqConfig());
}

function clearSeqMarks(seq) {
  seq.querySelectorAll(".seq-box, .seq-arrow").forEach((node) => {
    node.classList.remove("is-on", "is-fail");
  });
}

function resetSeq(seq) {
  seq.classList.remove("is-run", "is-ok", "is-fail");
  clearSeqMarks(seq);
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

function failSeq(seq, hop, viaGateway, target) {
  seq.classList.remove("is-run");
  seq.classList.add("is-fail");
  clearSeqMarks(seq);

  if (hop <= 1) {
    markSeq(seq, ["client"], [1], "is-fail");
    setSeqCaption(seq, "Failed at Client");
    return;
  }

  if (!viaGateway) {
    markSeq(seq, ["client"], [1], "is-on");
    markSeq(seq, ["target"], [1], "is-fail");
    setSeqCaption(seq, `Failed at ${target}`);
    return;
  }

  if (hop === 2) {
    markSeq(seq, ["client"], [1], "is-on");
    markSeq(seq, ["gateway"], [], "is-fail");
    setSeqCaption(seq, "Failed at Agentgateway");
    return;
  }

  markSeq(seq, ["client", "gateway"], [1, 2], "is-on");
  markSeq(seq, ["target"], [2], "is-fail");
  setSeqCaption(seq, `Failed at ${target}`);
}

async function animateSeqForward(seq, viaGateway, target, token) {
  const id = seq.id;
  markSeq(seq, ["client"], [1], "is-on");
  setSeqCaption(seq, "Client sends");
  if (!(await waitSeq(SEQ_STEP_MS, id, token))) {
    return false;
  }

  if (viaGateway) {
    markSeq(seq, ["gateway"], [], "is-on");
    setSeqCaption(seq, "Agentgateway");
    if (!(await waitSeq(SEQ_STEP_MS, id, token))) {
      return false;
    }
    markSeq(seq, ["target"], [2], "is-on");
    setSeqCaption(seq, target);
    if (!(await waitSeq(SEQ_STEP_MS, id, token))) {
      return false;
    }
    return true;
  }

  markSeq(seq, ["target"], [1], "is-on");
  setSeqCaption(seq, target);
  if (!(await waitSeq(SEQ_STEP_MS, id, token))) {
    return false;
  }
  return true;
}

async function animateSeqReturn(seq, viaGateway, target, token) {
  if (viaGateway) {
    markSeq(seq, [], [3, 4], "is-on");
  } else {
    markSeq(seq, [], [4], "is-on");
  }
  setSeqCaption(seq, "Response");
  return waitSeq(180, seq.id, token);
}

async function runWithSeq(seq, requestFn, { viaGateway, target, ok }) {
  const token = ++seqTokens[seq.id];
  configureSeq(seq, { viaGateway, target });
  resetSeq(seq);
  seq.classList.add("is-run");

  const request = Promise.resolve().then(requestFn);
  const forward = animateSeqForward(seq, viaGateway, target, token);
  const result = await request;
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
    markSeq(
      seq,
      viaGateway ? ["client", "gateway", "target"] : ["client", "target"],
      viaGateway ? [1, 2, 3, 4] : [1, 4],
      "is-on"
    );
    setSeqCaption(seq, pathCaption(viaGateway, target));
    return result;
  }

  failSeq(seq, failHopFromResult(result, viaGateway), viaGateway, target);
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
  try {
    const response = await fetch(url, options);
    const raw = await response.text();
    return {
      response,
      status: response.status,
      latencyMs: Math.round(performance.now() - started),
      raw,
      payload: parseJson(raw),
      error: null,
    };
  } catch (error) {
    return {
      response: null,
      status: null,
      latencyMs: Math.round(performance.now() - started),
      raw: "",
      payload: null,
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
  };
}

function showBox(target, { status, latencyMs, model, body, isError }) {
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
}

function card(className, extraClass, metaText, bodyText) {
  const wrap = document.createElement("div");
  wrap.className = `${className} ${extraClass}`.trim();

  const meta = document.createElement("div");
  meta.className = `${className}-meta`;
  meta.textContent = metaText;

  const body = document.createElement("div");
  body.className = `${className}-body`;
  body.textContent = bodyText;
  wrap.append(meta, body);
  return wrap;
}

function setScenarioResult(nodes) {
  els.scenarioResult.replaceChildren(...nodes);
}

function setArea(area) {
  const selected = AREAS.includes(area) ? area : "chat";
  els.tabChat.classList.toggle("is-active", selected === "chat");
  els.tabScenarios.classList.toggle("is-active", selected === "scenarios");
  els.tabCluster.classList.toggle("is-active", selected === "cluster");
  els.tabSettings.classList.toggle("is-active", selected === "settings");
  els.areaChat.classList.toggle("is-active", selected === "chat");
  els.areaScenarios.classList.toggle("is-active", selected === "scenarios");
  els.areaCluster.classList.toggle("is-active", selected === "cluster");
  els.areaSettings.classList.toggle("is-active", selected === "settings");
  els.areaChat.hidden = selected !== "chat";
  els.areaScenarios.hidden = selected !== "scenarios";
  els.areaCluster.hidden = selected !== "cluster";
  els.areaSettings.hidden = selected !== "settings";
}

function setScenario(name) {
  const selected = normalizeScenario(name);
  for (const [key, panel] of Object.entries(scenarioPanels)) {
    const active = key === selected;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
    if (sectionTabs[key]) {
      sectionTabs[key].classList.toggle("is-active", active);
    }
  }
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS);
  els.endpoint.value = stored.endpoint || DEFAULT_ENDPOINT;
  els.model.value = stored.model || DEFAULT_MODEL;
  els.primaryModel.value = stored.primaryModel || DEFAULT_MODEL;
  els.fallbackModel.value = stored.fallbackModel || DEFAULT_FALLBACK_MODEL;
  els.chosenModel.value = stored.chosenModel || stored.model || DEFAULT_MODEL;
  els.mcpEndpoint.value = stored.mcpEndpoint || DEFAULT_MCP_ENDPOINT;
  els.a2aEndpoint.value = stored.a2aEndpoint || DEFAULT_A2A_ENDPOINT;
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
  setArea(AREAS.includes(stored.area) ? stored.area : "chat");
  setScenario(stored.scenario || "llm");
  updateEndpointHints();
  updateDeployHints();
}

els.tabChat.addEventListener("click", () => {
  setArea("chat");
  persist({ area: "chat" });
});

els.tabScenarios.addEventListener("click", () => {
  setArea("scenarios");
  updateEndpointHints();
  updateDeployHints();
  persist({ area: "scenarios" });
});

els.tabCluster.addEventListener("click", () => {
  setArea("cluster");
  persist({ area: "cluster" });
});

els.tabSettings.addEventListener("click", () => {
  setArea("settings");
  persist({ area: "settings" });
});

els.hooray.addEventListener("change", () => {
  hoorayOn = els.hooray.checked;
  persist({ hooray: hoorayOn });
});

els.sectionLlm.addEventListener("click", () => {
  setScenario("llm");
  refreshSeqDiagrams();
  persist({ scenario: "llm" });
});

els.sectionMcp.addEventListener("click", () => {
  setScenario("mcp");
  refreshSeqDiagrams();
  persist({ scenario: "mcp" });
});

els.sectionSecurity.addEventListener("click", () => {
  setScenario("security");
  refreshSeqDiagrams();
  persist({ scenario: "security" });
});

els.endpoint.addEventListener("change", () => {
  saveChatSettings();
});

els.endpoint.addEventListener("input", () => {
  refreshSeqDiagrams();
});

els.model.addEventListener("change", () => {
  saveChatSettings();
});

els.primaryModel.addEventListener("change", () => {
  const primaryModel = normalizeModel(els.primaryModel.value);
  els.primaryModel.value = primaryModel;
  persist({ primaryModel });
});

els.fallbackModel.addEventListener("change", () => {
  const fallbackModel = normalizeModel(
    els.fallbackModel.value,
    DEFAULT_FALLBACK_MODEL
  );
  els.fallbackModel.value = fallbackModel;
  persist({ fallbackModel });
});

els.chosenModel.addEventListener("change", () => {
  const chosenModel = normalizeModel(els.chosenModel.value);
  els.chosenModel.value = chosenModel;
  persist({ chosenModel });
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
    { ...llmSeqConfig(), ok: llmRequestOk }
  );
  const summary = summarizeCompletion(result, model);
  showBox(els.testResult, {
    status: summary.status,
    latencyMs: summary.latencyMs,
    model: summary.model,
    body: summary.body,
    isError: !summary.ok,
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
      { ...llmSeqConfig(), ok: llmRequestOk }
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
  setScenarioResult([card("check", "", "Chat ping", "Running…")]);
  const result = await runWithSeq(
    els.seqLlm,
    () => postCompletions(endpoint, model, [TEST_MESSAGE]),
    { ...llmSeqConfig(), ok: llmRequestOk }
  );
  const summary = summarizeCompletion(result, model);
  const statusText =
    summary.status == null ? "no response" : `HTTP ${summary.status}`;
  setScenarioResult([
    card(
      "check",
      summary.ok ? "is-ok" : "is-error",
      `Chat ping · ${summary.model} · ${statusText} · ${summary.latencyMs} ms`,
      summary.body
    ),
  ]);
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
    DEFAULT_FALLBACK_MODEL
  );
  els.primaryModel.value = primaryModel;
  els.fallbackModel.value = fallbackModel;
  await persist({ primaryModel, fallbackModel });

  els.runFailover.disabled = true;
  setScenarioResult([
    card("check", "", "Failover", "Running primary model…"),
  ]);

  const attempts = [];
  const seqOpts = { ...llmSeqConfig(), ok: llmRequestOk };
  const primary = summarizeCompletion(
    await runWithSeq(
      els.seqLlm,
      () => postCompletions(endpoint, primaryModel, [TEST_MESSAGE]),
      seqOpts
    ),
    primaryModel
  );
  attempts.push({ label: "primary", ...primary });

  if (!primary.ok) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const fallback = summarizeCompletion(
      await runWithSeq(
        els.seqLlm,
        () => postCompletions(endpoint, fallbackModel, [TEST_MESSAGE]),
        seqOpts
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
      attempt.body
    );
  });

  setScenarioResult([summary, ...cards]);
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
  setScenarioResult([card("check", "", "List / call", "Listing models…")]);

  const listed = await runWithSeq(
    els.seqLlm,
    () => timedFetch(listUrl, { method: "GET", headers: { Accept: "application/json" } }),
    { ...llmSeqConfig(), ok: mcpRequestOk }
  );
  const listOk = !listed.error && listed.status != null && listed.status < 400;
  const listStatus =
    listed.status == null ? "no response" : `HTTP ${listed.status}`;
  const listBody = listed.error
    ? listed.error
    : listOk
      ? listModelNames(listed.payload)
      : snippet(listed.raw || `HTTP ${listed.status}`);

  await new Promise((resolve) => setTimeout(resolve, 350));
  const called = summarizeCompletion(
    await runWithSeq(
      els.seqLlm,
      () => postCompletions(endpoint, chosenModel, [TEST_MESSAGE]),
      { ...llmSeqConfig(), ok: llmRequestOk }
    ),
    chosenModel
  );
  const callStatus =
    called.status == null ? "no response" : `HTTP ${called.status}`;

  setScenarioResult([
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
      called.body
    ),
  ]);
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
  setScenarioResult([card("check", "", "MCP", "Probing…")]);

  const initialize = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "agentgateway-extension", version: "0.7.0" },
    },
  };

  const result = await runWithSeq(
    els.seqMcp,
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
    { ...mcpSeqConfig(), ok: mcpRequestOk }
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

  setScenarioResult([
    card(
      "check",
      ok ? "is-ok" : "is-error",
      meta.join(" · "),
      snippet(result.error || result.raw || "(empty body)")
    ),
  ]);
  if (!result.error && result.status >= 200 && result.status < 300) {
    celebrate();
  }
  els.probeMcp.disabled = false;
});

function a2aSeqConfig() {
  const a2aUrl = els.a2aEndpoint.value.trim() || DEFAULT_A2A_ENDPOINT;
  const viaGateway = mcpUsesGateway(a2aUrl, els.endpoint.value);
  return { viaGateway, target: "A2A" };
}

els.probeA2a.addEventListener("click", async () => {
  const url = els.a2aEndpoint.value.trim() || DEFAULT_A2A_ENDPOINT;
  els.a2aEndpoint.value = url;
  await persist({ a2aEndpoint: url });
  els.probeA2a.disabled = true;
  setScenarioResult([card("check", "", "A2A", "Probing…")]);

  const result = await runWithSeq(
    els.seqMcp,
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
    { ...a2aSeqConfig(), ok: mcpRequestOk }
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

  setScenarioResult([
    card(
      "check",
      ok ? "is-ok" : "is-error",
      meta.join(" · "),
      snippet(result.error || result.raw || "(empty body)")
    ),
  ]);
  if (!result.error && result.status >= 200 && result.status < 300) {
    celebrate();
  }
  els.probeA2a.disabled = false;
});

async function runSecurityProbe(button, label, messages) {
  const { endpoint, model } = await saveChatSettings();
  button.disabled = true;
  setScenarioResult([card("check", "", label, "Running…")]);
  const summary = summarizeCompletion(
    await runWithSeq(
      els.seqSecurity,
      () => postCompletions(endpoint, model, messages),
      { ...llmSeqConfig(), ok: llmRequestOk }
    ),
    model
  );
  const statusText =
    summary.status == null ? "no response" : `HTTP ${summary.status}`;
  setScenarioResult([
    card(
      "check",
      summary.ok ? "is-ok" : "is-error",
      `${label} · ${statusText} · ${summary.latencyMs} ms`,
      summary.body
    ),
  ]);
  celebrate();
  button.disabled = false;
}

els.runUnauth.addEventListener("click", () => {
  runSecurityProbe(els.runUnauth, "Unauthenticated", [TEST_MESSAGE]);
});

els.runJunk.addEventListener("click", () => {
  runSecurityProbe(els.runJunk, "Junk / policy-probe", [
    { role: "user", content: JUNK_PROMPT },
  ]);
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

const CONNECT_CLUSTER_MSG = "Connect a cluster in the Cluster tab first.";

function exampleYaml(section, key) {
  const group = DEPLOY_EXAMPLES[section] || {};
  const item = group[key] || Object.values(group)[0];
  return item ? item.yaml : "";
}

function loadDeployExamples(stored) {
  const llmKey = DEPLOY_EXAMPLES.llm[stored.llmExample]
    ? stored.llmExample
    : "gateway";
  const mcpKey = DEPLOY_EXAMPLES.mcp[stored.mcpExample]
    ? stored.mcpExample
    : "mcp";
  const secKey = DEPLOY_EXAMPLES.security[stored.securityExample]
    ? stored.securityExample
    : "policy";
  els.llmExample.value = llmKey;
  els.mcpExample.value = mcpKey;
  els.securityExample.value = secKey;
  els.llmYaml.value = stored.llmYaml || exampleYaml("llm", llmKey);
  els.mcpYaml.value = stored.mcpYaml || exampleYaml("mcp", mcpKey);
  els.securityYaml.value = stored.securityYaml || exampleYaml("security", secKey);
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
    ? "Apply uses the Cluster tab API server, token, and namespace."
    : CONNECT_CLUSTER_MSG;
  document.querySelectorAll("[data-deploy-hint]").forEach((node) => {
    node.textContent = text;
  });
  els.applyLlm.disabled = !connected;
  els.applyMcp.disabled = !connected;
  els.applySecurity.disabled = !connected;
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
bindExampleSelect(
  els.securityExample,
  els.securityYaml,
  "security",
  "securityExample",
  "securityYaml"
);

els.applyLlm.addEventListener("click", () => {
  applyYamlDocuments(els.llmYaml.value, els.llmApplyResult, els.applyLlm);
});

els.applyMcp.addEventListener("click", () => {
  applyYamlDocuments(els.mcpYaml.value, els.mcpApplyResult, els.applyMcp);
});

els.applySecurity.addEventListener("click", () => {
  applyYamlDocuments(
    els.securityYaml.value,
    els.securityApplyResult,
    els.applySecurity
  );
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
