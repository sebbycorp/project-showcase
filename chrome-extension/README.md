# Agentgateway (Chrome extension)

Manifest V3 popup with three areas: **Chat**, **Scenarios**, and **Cluster**.
Chat and Scenarios talk to a user-configured Agentgateway. The gateway injects
backend auth, so those areas do **not** store or send an API key or license
key. Cluster talks to a Kubernetes API server so you can list and apply
Agentgateway CRDs from the popup.

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

## Cluster

Switch to the **Cluster** tab to connect to a Kubernetes API and apply
Agentgateway CRDs. Manifest V3 `host_permissions` let the extension `fetch`
the API server directly (browser CORS does not apply). Settings are stored
only in `chrome.storage.local` — never `sync`. Tokens are not logged.

### Tokens and exec plugins

Chrome **cannot** run kubeconfig exec plugins. That includes
`gke-gcloud-auth-plugin`, `kubelogin` / Azure exec, and
`aws eks get-token`. Pasting an exec-only kubeconfig is not enough. You must
paste a bearer token from the matching command (or a service-account token).

Client-certificate kubeconfigs are also unsupported. Chrome will reject
untrusted or self-signed API server CAs (common with kind / minikube /
k3d) unless the CA is trusted by the OS/browser.

### Cluster type

The help text under **Cluster type** changes with the selection:

- **GKE** — API server from `kubectl cluster-info` or
  `gcloud container clusters describe`. Token from
  `gcloud auth print-access-token`.
- **AKS** — API server from `az aks show`. Token from a service account or
  `az` / `kubelogin` output, not the exec kubeconfig alone.
- **EKS** — API server from `aws eks describe-cluster`. Token from
  `aws eks get-token --cluster-name ...`.
- **Local** — API server + token (for example `kubectl create token`).
  Chrome rejects self-signed CAs.

### Connection fields

- **API server URL**
- **Bearer token** (password field)
- **Namespace** (default `agentgateway-system`)
- **Kubeconfig YAML** (optional) — **Parse kubeconfig** reads
  `current-context`, then fills `cluster.server` and `user.token` when
  present. If the user block is exec-only, the popup tells you to paste a
  token.

**Test connection** GETs `/version`, and falls back to
`GET /apis/gateway.networking.k8s.io/v1`. Status, latency, and the
Kubernetes version (or error) are shown.

### CRDs

Always visible. **List** and **Apply** need an API server URL and token.

- **Kind** — `Gateway`, `HTTPRoute`, `EnterpriseAgentgatewayBackend`, or
  `EnterpriseAgentgatewayPolicy` (`gateway.networking.k8s.io` /
  `enterpriseagentgateway.solo.io` as appropriate)
- **List** — `GET` the collection in the configured namespace and show names
- **YAML** — paste one or more documents (YAML preferred; JSON is accepted).
  **Load example** fills a small Gateway + OpenAI
  `EnterpriseAgentgatewayBackend` + `HTTPRoute`. The example uses
  `secretRef.name: openai-secret` only — no secret values.
- **Apply** — converts YAML to JSON and `POST`s (create) or `PUT`s (update)
  each document. Namespace on the manifest wins; otherwise the Namespace
  field is used.

Requests send `Authorization: Bearer <token>` and
`Content-Type: application/json`.
