const DEFAULT_ENDPOINT = "http://35.226.209.32/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_FALLBACK_MODEL = "gpt-4o";
const DEFAULT_MCP_ENDPOINT = "http://35.226.209.32/mcp";
const DEFAULT_A2A_ENDPOINT = "http://35.226.209.32/.well-known/agent-card.json";
const CHAT_PATH = "/v1/chat/completions";
const TEST_MESSAGE = { role: "user", content: "Reply with the word pong." };
const JUNK_PROMPT = `policy-probe ${"x".repeat(1024)}`;
const BODY_SNIPPET = 400;
const STORAGE_KEYS = [
  "endpoint",
  "model",
  "primaryModel",
  "fallbackModel",
  "mcpEndpoint",
  "a2aEndpoint",
  "area",
  "scenario",
];

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
  scenarioType: document.getElementById("scenario-type"),
  scenarioFailover: document.getElementById("scenario-failover"),
  scenarioMcp: document.getElementById("scenario-mcp"),
  scenarioA2a: document.getElementById("scenario-a2a"),
  scenarioSecurity: document.getElementById("scenario-security"),
  primaryModel: document.getElementById("primary-model"),
  fallbackModel: document.getElementById("fallback-model"),
  runFailover: document.getElementById("run-failover"),
  failoverHint: document.getElementById("failover-endpoint-hint"),
  mcpEndpoint: document.getElementById("mcp-endpoint"),
  probeMcp: document.getElementById("probe-mcp"),
  a2aEndpoint: document.getElementById("a2a-endpoint"),
  probeA2a: document.getElementById("probe-a2a"),
  runSecurity: document.getElementById("run-security"),
  securityHint: document.getElementById("security-endpoint-hint"),
  scenarioResult: document.getElementById("scenario-result"),
  seqChat: document.getElementById("seq-chat"),
  seqFailover: document.getElementById("seq-failover"),
  seqMcp: document.getElementById("seq-mcp"),
};

const scenarioPanels = {
  failover: els.scenarioFailover,
  mcp: els.scenarioMcp,
  a2a: els.scenarioA2a,
  security: els.scenarioSecurity,
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
  els.failoverHint.textContent = text;
  els.securityHint.textContent = text;
  refreshSeqDiagrams();
}

const SEQ_STEP_MS = 240;
const seqTokens = { "seq-chat": 0, "seq-failover": 0, "seq-mcp": 0 };

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
  configureSeq(els.seqFailover, llmSeqConfig());
  configureSeq(els.seqMcp, mcpSeqConfig());
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
  const isChat = area === "chat";
  els.tabChat.classList.toggle("is-active", isChat);
  els.tabScenarios.classList.toggle("is-active", !isChat);
  els.areaChat.classList.toggle("is-active", isChat);
  els.areaScenarios.classList.toggle("is-active", !isChat);
  els.areaChat.hidden = !isChat;
  els.areaScenarios.hidden = isChat;
}

function setScenario(name) {
  const selected = scenarioPanels[name] ? name : "failover";
  els.scenarioType.value = selected;
  for (const [key, panel] of Object.entries(scenarioPanels)) {
    const active = key === selected;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  }
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS);
  els.endpoint.value = stored.endpoint || DEFAULT_ENDPOINT;
  els.model.value = stored.model || DEFAULT_MODEL;
  els.primaryModel.value = stored.primaryModel || DEFAULT_MODEL;
  els.fallbackModel.value = stored.fallbackModel || DEFAULT_FALLBACK_MODEL;
  els.mcpEndpoint.value = stored.mcpEndpoint || DEFAULT_MCP_ENDPOINT;
  els.a2aEndpoint.value = stored.a2aEndpoint || DEFAULT_A2A_ENDPOINT;
  setArea(stored.area === "scenarios" ? "scenarios" : "chat");
  setScenario(stored.scenario || "failover");
  updateEndpointHints();
}

els.tabChat.addEventListener("click", () => {
  setArea("chat");
  persist({ area: "chat" });
});

els.tabScenarios.addEventListener("click", () => {
  setArea("scenarios");
  updateEndpointHints();
  persist({ area: "scenarios" });
});

els.scenarioType.addEventListener("change", () => {
  setScenario(els.scenarioType.value);
  refreshSeqDiagrams();
  persist({ scenario: els.scenarioType.value });
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
      els.seqFailover,
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
        els.seqFailover,
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
  els.runFailover.disabled = false;
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
      clientInfo: { name: "agentgateway-extension", version: "0.4.0" },
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
  els.probeMcp.disabled = false;
});

els.probeA2a.addEventListener("click", async () => {
  const url = els.a2aEndpoint.value.trim() || DEFAULT_A2A_ENDPOINT;
  els.a2aEndpoint.value = url;
  await persist({ a2aEndpoint: url });
  els.probeA2a.disabled = true;
  setScenarioResult([card("check", "", "A2A", "Probing…")]);

  const result = await probeWithFallback(
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
  els.probeA2a.disabled = false;
});

els.runSecurity.addEventListener("click", async () => {
  const { endpoint, model } = await saveChatSettings();
  els.runSecurity.disabled = true;
  setScenarioResult([card("check", "", "Security", "Running probes…")]);

  const unauth = summarizeCompletion(
    await postCompletions(endpoint, model, [TEST_MESSAGE]),
    model
  );
  const junk = summarizeCompletion(
    await postCompletions(endpoint, model, [
      { role: "user", content: JUNK_PROMPT },
    ]),
    model
  );

  const unauthStatus =
    unauth.status == null ? "no response" : `HTTP ${unauth.status}`;
  const junkStatus = junk.status == null ? "no response" : `HTTP ${junk.status}`;
  const junkVerdict = junk.ok
    ? "Gateway accepted the junk prompt"
    : "Gateway rejected the junk prompt";

  setScenarioResult([
    card(
      "check",
      unauth.ok ? "is-ok" : "is-error",
      `Unauthenticated · ${unauthStatus} · ${unauth.latencyMs} ms`,
      unauth.body
    ),
    card(
      "check",
      junk.ok ? "is-ok" : "is-error",
      `Junk prompt · ${junkStatus} · ${junk.latencyMs} ms · ${junkVerdict}`,
      junk.body
    ),
  ]);
  els.runSecurity.disabled = false;
});

loadSettings();
