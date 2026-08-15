const DEFAULT_ENDPOINT = "http://35.226.209.32/v1/chat/completions";
const STORAGE_KEY = "endpoint";
const CHAT_PATH = "/v1/chat/completions";

const endpointInput = document.getElementById("endpoint");
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
    if (!url.pathname || url.pathname === "/") {
      url.pathname = CHAT_PATH;
    }
    return url.toString();
  } catch {
    return trimmed;
  }
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

async function loadEndpoint() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  endpointInput.value = stored[STORAGE_KEY] || DEFAULT_ENDPOINT;
}

async function saveEndpoint(value) {
  await chrome.storage.local.set({ [STORAGE_KEY]: value });
}

endpointInput.addEventListener("change", () => {
  const value = endpointInput.value.trim() || DEFAULT_ENDPOINT;
  endpointInput.value = value;
  saveEndpoint(value);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = messageInput.value.trim();
  if (!content) {
    return;
  }

  const endpoint = normalizeEndpoint(endpointInput.value);
  endpointInput.value = endpoint;
  await saveEndpoint(endpoint);

  messages.push({ role: "user", content });
  appendBubble("user", content);
  messageInput.value = "";
  sendButton.disabled = true;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
      }),
    });

    const raw = await response.text();
    let payload;
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(raw || `HTTP ${response.status}`);
    }

    if (!response.ok) {
      const detail =
        (payload.error && payload.error.message) || raw || `HTTP ${response.status}`;
      throw new Error(detail);
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

loadEndpoint();
