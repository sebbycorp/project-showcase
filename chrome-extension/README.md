# Agentgateway (Chrome extension)

Manifest V3 popup with two areas: **Chat** and **Scenarios**. Both talk to a
user-configured Agentgateway. The gateway injects backend auth, so this
extension does **not** store or send an API key or license key.

## Load unpacked

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder

The toolbar action opens a 380×560 popup.

## Chat

Configure **Endpoint URL** and **Model**, then use **Test** or the chat box.

The **Endpoint URL** field is pre-filled with:

`http://35.226.209.32/v1/chat/completions`

The **Model** field defaults to `gpt-4o-mini`. Endpoint and model are saved in
`chrome.storage.local`.

If you enter a base URL without `/v1/chat/completions` (for example
`http://35.226.209.32`), the extension appends that path.

**Test** sends a tiny `POST` and shows HTTP status, round-trip latency, the
response model when present, and the reply or error. It does not clear chat
history.

The chat box uses the same saved endpoint and model for follow-up messages.
Each send is `POST` with JSON `{ "model": "<chosen model>", "messages": [...] }`.
No API key is included.

## Scenarios

Switch to the **Scenarios** tab and pick a type from the dropdown.

### Failover

Runnable now against the Chat gateway endpoint.

- **Primary model** and **Fallback model** (persisted; defaults `gpt-4o-mini`
  and `gpt-4o`)
- **Run test** POSTs a tiny `Reply with the word pong.` prompt using the
  primary model
- If HTTP is not 2xx or the request throws, it retries once with the fallback
  model
- Results show which model succeeded, plus HTTP status, latency, and
  reply/error for each attempt

### MCP

Connectivity probe only — not a full MCP client.

- **MCP endpoint** (persisted; default `http://35.226.209.32/mcp`)
- **Probe** POSTs a JSON-RPC `initialize`. If POST is unavailable (network
  error or HTTP 405), it tries GET
- Shows HTTP status, latency, and a short body snippet or error

### A2A

Agent-card / health probe.

- **A2A endpoint** (persisted; default
  `http://35.226.209.32/.well-known/agent-card.json`)
- **Probe** GETs the endpoint. If GET is unavailable, it POSTs a small
  `{ "probe": "health" }` body
- Shows HTTP status, latency, and a short body snippet or error

### Security

Two built-in checks against the configured Chat endpoint. These are safe
connectivity/policy probes — no exploit payloads, jailbreak strings, or
attack recipes.

1. **Unauthenticated** — the same tiny chat request with no extra headers
   (useful if the gateway is later locked down)
2. **Junk prompt** — a short `policy-probe` string plus padding, to see
   whether the gateway accepted or rejected it

Each check shows HTTP status, latency, and the reply or error.
