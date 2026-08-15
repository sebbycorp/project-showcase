# Agentgateway (Chrome extension)

Manifest V3 popup with **Chat**, **Scenarios**, **Cluster**, and a header
gear for **Settings**.
Chat and Scenarios talk to a user-configured Agentgateway. The gateway injects
backend auth, so those areas do **not** store or send an API key or license
key. Cluster talks to a Kubernetes API server so you can list and apply
Agentgateway CRDs from the popup.

The popup matches the [agentgateway.dev](https://agentgateway.dev/) product
site: deep navy/black surfaces (`#0B0E18`, `#111422`, `#181C2E`), purple
accent (`#8A3FFC` / `#A06EFF`), and a tight header with the official mark
beside the title. The dark wordmark and color mark are vendored in
`icons/` from the live homepage (`/agw-dark.svg`, `/agw-mark-color.svg`) —
they are not hotlinked at runtime. Toolbar PNGs (`icon16.png`,
`icon32.png`, `icon48.png`) are rasterized from that mark and set as
`action.default_icon`.

Chat and each Scenarios section show a live sequence diagram
(Client → [Agentgateway logo] → provider or MCP/A2A). **Test** and each
named **Run** highlight hops in order, then mark the path in the site
accent on success or the failing hop red.

The header gear opens **Settings**. **Hooray** (default on, stored in
`chrome.storage.local`) plays a short canvas confetti burst after a
successful Chat **Test**, LLM Chat ping, Failover (when a model
succeeds), List/call (both steps ok), an MCP or A2A probe that returns
HTTP 2xx, a Security probe that finishes as designed, or a Cluster
**Test connection** success. Turn it off to skip the burst.

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
history. While the request is in flight, the sequence diagram highlights
Client → Agentgateway → provider, then the return path.

The chat box uses the same saved endpoint and model for follow-up messages.
Each send is `POST` with JSON `{ "model": "<chosen model>", "messages": [...] }`.
No API key is included.

## Scenarios

Three sections — **LLM**, **MCP / A2A**, and **Security**. Each has a live
flow diagram (middle hop is the vendored Agentgateway mark), a list of
named tests, and a **Deploy config** area.

**Deploy config** loads a prebuilt YAML example you can edit, then
**Apply**s it with the Cluster tab API server, token, and namespace.
If the cluster is not connected, the hint and Apply state say
“Connect a cluster in the Cluster tab first.” No API keys are stored
or sent. `secretRef` uses a name only.

### LLM

Tests run against the Chat endpoint. Each result shows HTTP status,
latency, model, and reply or error.

- **Chat ping** — tiny `Reply with the word pong.` prompt
- **Model failover** — primary model, then fallback if it fails
  (persisted; defaults `gpt-4o-mini` / `gpt-4o`)
- **List / call model** — `GET /v1/models`, then chat with the chosen
  model

Prebuilt deploys (from `manifests/` and
[Solo LLM docs](https://docs.solo.io/agentgateway/latest/llm/)):

- Gateway (`enterprise-agentgateway`, HTTP :80) — `manifests/gateway.yaml`
- OpenAI `EnterpriseAgentgatewayBackend` + HTTPRoute (Completions /
  Models / Responses / Passthrough) — `manifests/openai-backend.yaml`
- Failover backend — priority groups for `gpt-4o-mini` then `gpt-4o`,
  plus HTTPRoute and a health policy
- HTTPRoute add-on — `/openai` rewrite you can tweak

### MCP / A2A

- **MCP initialize** — JSON-RPC `initialize` (GET fallback). Default
  `http://35.226.209.32/mcp`
- **A2A agent-card / health** — GET, or POST `{ "probe": "health" }`.
  Default `http://35.226.209.32/.well-known/agent-card.json`

Prebuilt deploys are documented stubs: MCP backend + `/mcp` HTTPRoute,
and A2A backend + `/myagent` HTTPRoute. Hostnames are placeholders
from the Solo MCP / A2A guides.

### Security

Safe connectivity/policy probes only — no exploit or jailbreak
payloads.

- **Unauthenticated request** — tiny chat ping, no extra headers
- **Junk / policy-probe** — short padded `policy-probe` string

Prebuilt deploy: `EnterpriseAgentgatewayPolicy` prompt-guard stub that
rejects the string `credit card` (Solo regex guardrails example).

## Settings

The gear in the header opens **Settings**.

- **Hooray** — “Confetti on a successful test.” Persisted in
  `chrome.storage.local`; default **on**. One ~1s canvas burst, not a
  loop. Honors `prefers-reduced-motion`.

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
