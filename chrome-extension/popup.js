const DEFAULT_ENDPOINT = "http://35.226.209.32/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const STORAGE_KEYS = ["endpoint", "model"];
const CHAT_PATH = "/v1/chat/completions";
const TEST_MESSAGE = { role: "user", content: "Reply with the word pong." };

const endpointInput = document.getElementById("endpoint");
const modelInput = document.getElementById("model");
const testButton = document.getElementById("test");
const testResultEl = document.getElementById("test-result");
const logEl = document.getElementById("log");
const form = document.getElementById("chat-form");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");

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

function normalizeModel(raw) {
  return (raw || "").trim() || DEFAULT_MODEL;
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
  logEl.appendChild(bubble);
  logEl.scrollTop = logEl.scrollHeight;
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

async function persistSettings(endpoint, model) {
  endpointInput.value = endpoint;
  modelInput.value = model;
  await chrome.storage.local.set({ endpoint, model });
}

async function currentSettings() {
  const endpoint = normalizeEndpoint(endpointInput.value);
  const model = normalizeModel(modelInput.value);
  await persistSettings(endpoint, model);
  return { endpoint, model };
}

async function postCompletions(endpoint, model, requestMessages) {
  const started = performance.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: requestMessages,
    }),
  });
  const raw = await response.text();
  const latencyMs = Math.round(performance.now() - started);

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return { response, latencyMs, raw, payload: null };
  }

  return { response, latencyMs, raw, payload };
}

function showTestResult({ status, latencyMs, model, body, isError }) {
  testResultEl.hidden = false;
  testResultEl.classList.toggle("is-error", Boolean(isError));
  testResultEl.replaceChildren();

  const meta = document.createElement("div");
  meta.className = "test-meta";
  const statusText = status == null ? "no response" : `HTTP ${status}`;
  const parts = [`${statusText} · ${latencyMs} ms`];
  if (model) {
    parts.push(`model ${model}`);
  }
  meta.textContent = parts.join(" · ");

  const detail = document.createElement("div");
  detail.className = "test-body";
  detail.textContent = body;

  testResultEl.append(meta, detail);
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS);
  endpointInput.value = stored.endpoint || DEFAULT_ENDPOINT;
  modelInput.value = stored.model || DEFAULT_MODEL;
}

endpointInput.addEventListener("change", () => {
  persistSettings(
    normalizeEndpoint(endpointInput.value),
    normalizeModel(modelInput.value)
  );
});

modelInput.addEventListener("change", () => {
  persistSettings(
    normalizeEndpoint(endpointInput.value),
    normalizeModel(modelInput.value)
  );
});

testButton.addEventListener("click", async () => {
  const { endpoint, model } = await currentSettings();
  testButton.disabled = true;
  testResultEl.hidden = false;
  testResultEl.classList.remove("is-error");
  testResultEl.replaceChildren();
  const pending = document.createElement("div");
  pending.className = "test-body";
  pending.textContent = "Testing…";
  testResultEl.append(pending);

  const started = performance.now();
  try {
    const { response, latencyMs, raw, payload } = await postCompletions(
      endpoint,
      model,
      [TEST_MESSAGE]
    );

    if (!payload) {
      showTestResult({
        status: response.status,
        latencyMs,
        model,
        body: raw || `HTTP ${response.status}`,
        isError: true,
      });
      return;
    }

    if (!response.ok) {
      showTestResult({
        status: response.status,
        latencyMs,
        model: payload.model || model,
        body: errorDetail(payload, raw, response.status),
        isError: true,
      });
      return;
    }

    let reply;
    try {
      reply = extractAssistantText(payload);
    } catch (error) {
      showTestResult({
        status: response.status,
        latencyMs,
        model: payload.model || model,
        body: error.message || String(error),
        isError: true,
      });
      return;
    }

    showTestResult({
      status: response.status,
      latencyMs,
      model: payload.model || model,
      body: reply,
      isError: false,
    });
  } catch (error) {
    showTestResult({
      status: null,
      latencyMs: Math.round(performance.now() - started),
      model,
      body: error.message || String(error),
      isError: true,
    });
  } finally {
    testButton.disabled = false;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = messageInput.value.trim();
  if (!content) {
    return;
  }

  const { endpoint, model } = await currentSettings();

  messages.push({ role: "user", content });
  appendBubble("user", content);
  messageInput.value = "";
  sendButton.disabled = true;

  try {
    const { response, raw, payload } = await postCompletions(
      endpoint,
      model,
      messages
    );

    if (!payload) {
      throw new Error(raw || `HTTP ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(errorDetail(payload, raw, response.status));
    }

    const assistant = extractAssistantText(payload);
    messages.push({ role: "assistant", content: assistant });
    appendBubble("assistant", assistant);
  } catch (error) {
    messages.pop();
    appendBubble("error", error.message || String(error));
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

loadSettings();
