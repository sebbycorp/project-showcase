# Agentgateway (Chrome extension)

Manifest V3 popup with **Chat**, **Services**, **Cluster**, and a header
gear for **Settings**.
Chat and Services talk to a user-configured Agentgateway. The gateway injects
backend auth, so those areas do **not** store or send an API key or license
key. Cluster talks to a Kubernetes API server so you can list and apply
Agentgateway CRDs from the popup.

The popup is a light console: off-white surfaces (`#F3F5F6`, `#FFFFFF`),
soft gray borders, a refined teal accent (`#0C7469`), tighter system type,
and cards with a light shadow. The header keeps the official color mark
beside the title. The dark wordmark and color mark are vendored in
`icons/` from the live homepage (`/agw-dark.svg`, `/agw-mark-color.svg`) —
they are not hotlinked at runtime. Flow hops use compact vendored SVGs
in the same folder (AI Agent robot, OpenAI blossom, Claude asterisk,
xAI/Grok mark, AWS cube, an original twin-ring Gemini mark, MCP, A2A,
Policy). Toolbar PNGs (`icon16.png`, `icon32.png`, `icon48.png`) are
rasterized from that mark and set as `action.default_icon`.

The story is **Agent → Agentgateway → any LLM**. Provider pills
(OpenAI, Claude, Grok, Bedrock, Gemini) sit above the model field — not
a dropdown that defaults the whole UI to OpenAI. Switching updates the
right-hand flow icon immediately and fills a default model
(`gpt-4o-mini`, `claude-sonnet-4-5`, `grok-3`, `amazon.nova-micro-v1:0`,
`gemini-2.0-flash`). The same control appears on Services → LLM.
Provider, endpoint, and model are saved in `chrome.storage.local`.

Chat and each Services test show a compact one-row flow
(AI Agent tile → Agentgateway mark → provider or MCP/A2A tile). Idle
tiles are icon-only — no permanent path caption. **Test** and each named
**Run** light tiles in order and add short hop labels as they light:
**Agent sends** → **Gateway routes** → **{Provider} replies**. When the
request is in flight, tiles follow real fetch hops when they are
available: AI Agent (request sent) → Agentgateway (HTTP headers /
status) → provider (model in the body). Sliding chevrons still march as
a fallback so demos move if timing or traces are empty. A traces GET
against the Solo UI origin is attempted without extra auth and never
blocks Run; a 401 or CORS failure stays on the client-side fallback.
The path settles teal on success, or motion stops on the failing hop.

When real timings exist (`headersMs` / body delta, or total latency),
each hop arrow can show a compact duration (`12ms`, `80ms`, `1.9s`).
Unknown hops stay blank — numbers are never invented. During Run, the
active chevron also carries the request path and model
(`/v1/chat/completions · gpt-4o-mini`). After OK, the result drawer
adds a compact waterfall (agent / gateway / model) for hops that have
timings, plus the existing **Open in Solo UI** link and token/cost
estimate.

The header **Demo** control (also a Settings toggle, persisted in
`chrome.storage.local`, default **off**) grows the popup to 480×640,
enlarges Services tiles, slows the arrows, and makes hop labels easier
to read on a projector. Normal mode stays 448×600.

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

The toolbar action opens a 448×600 popup (480×640 in Demo stage).

## Chat

Configure **Endpoint URL**, **Provider**, and **Model**, then use **Test**
or the chat box.

The **Endpoint URL** field is pre-filled with:

`http://35.226.209.32/v1/chat/completions`

**Provider** is a pill / segment control with each provider’s icon.
Switching updates the right-hand flow tile and default model. Captions
and hop labels use the selected provider name, not a hardcoded
“OpenAI.”

If you enter a base URL without `/v1/chat/completions` (for example
`http://35.226.209.32`), the extension appends that path.

**Test** sends a tiny `POST` and shows HTTP status, round-trip latency, the
response model when present, and the reply or error. It does not clear chat
history. After success or failure, **Open in Solo UI** opens the configured
UI traces page in a new tab (`/age/tracing`, or `/age/tracing/<id>` when a
trace id is in `traceparent` / `x-b3-traceid` / similar headers). If the
JSON includes `usage.prompt_tokens` / `usage.completion_tokens`, the result
also shows token counts and an estimated USD cost from an in-extension rate
table (clearly labeled as an estimate, not a bill). Missing usage hides
cost — token counts are never invented.

The chat box uses the same saved endpoint and model for follow-up messages.
Each send is `POST` with JSON `{ "model": "<chosen model>", "messages": [...] }`.
No API key is included.

## Services

Open **Services**, then choose a subnav: **LLM**, **MCP / A2A**, or
**Security**. Each page lists tests as their own cards. A card has:

- Test name and a one-line description
- A compact one-row flow for that test
  (AI Agent tile → Agentgateway mark → provider or target tile)
- A **Run** button on the same row as the title
- An expandable results drawer under that test

Click **Run** on a card. The drawer opens in place with live status
(`Running` → `OK` / `Fail`), latency, model when present, and the
response or error. After success or failure, **Open in Solo UI** is on
that drawer. Token/cost lines appear when usage is present; failover
shows cost per attempt when both responses include usage. **Collapse**
hides the drawer; run again to reopen it. There is no shared Run control
at the bottom of the page.

**Deploy config** is a secondary accordion on each service page so
tests stay primary. It loads a prebuilt YAML example you can edit, then
**Apply**s it with the Cluster tab API server, token, and namespace.
If the cluster is not connected, the hint and Apply state say
“Connect a cluster in the Cluster tab first.” No API keys are stored
or sent. `secretRef` uses a name only.

### LLM

The provider switcher matches Chat. Changing it updates LLM flow icons,
default models (including failover primary/fallback), and the Deploy
accordion’s prebuilt backend / HTTPRoute YAML for that provider
(`secretRef` name only).

Tests run against the Chat endpoint. Each result shows HTTP status,
latency, model, and reply or error.

- **Chat ping** — tiny `Reply with the word pong.` prompt
- **Model failover** — two provider tiles (primary + fallback). On Run,
  primary lights, then dims if it fails and fallback lights. Hop labels
  say **Primary failed** / **Failover → {provider}**. Default models
  stay `gpt-4o-mini` / `gpt-4o` for the OpenAI pill; tiles follow the
  model names so Claude → Grok (or any pair) is visible
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
- Claude `EnterpriseAgentgatewayBackend` + HTTPRoute (`anthropic-secret`)
- Grok OpenAI-compatible backend (`api.x.ai`) + HTTPRoute (`grok-secret`)
- Bedrock backend + HTTPRoute (`bedrock-secret`, documented
  `amazon.nova-micro-v1:0`)
- Gemini backend + HTTPRoute (`gemini-secret`, `gemini-2.0-flash`)
- Matching failover and HTTPRoute add-on examples per provider

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

- **Solo UI URL** — default `http://35.225.111.45/age/` (`/age/` is the
  app). Persisted in `chrome.storage.local` like the chat endpoint.
  **Open in Solo UI** uses this base and the SPA traces path
  (`/age/tracing`). A trace id from gateway response headers is appended
  as a path segment when present. No invented query params.
- **Demo stage** — taller popup, bigger tiles, slower arrows. Also
  toggled from the header **Demo** control. Persisted; default **off**.
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
