# Agentgateway Chrome extension

A Chrome extension for chatting, testing, and teaching [Solo Agentgateway](https://docs.solo.io/agentgateway/latest/) (LLM, MCP, A2A, and API/HTTP) against **your** Kubernetes cluster. Point it at a reachable API server, apply Gateway / Agentgateway CRDs from the popup, and run the same hops you would show in a live demo.

The extension is in [`chrome-extension/`](chrome-extension/). Current version: **0.9.8** (`manifest.json`).

## Use cases

These match the tabs and header controls in the popup.

- **Chat with an LLM through Agentgateway.** On **Chat**, set **Endpoint URL**, pick a **Provider** (OpenAI, Claude, Grok, Bedrock, Gemini), choose a **Model**, then **Test** or send a message. The gateway injects backend auth — Chat does not store or send an API key.
- **LLM provider testing.** The **LLM** tab runs **Chat ping**, **Model failover**, and **List / call model** against the Chat endpoint. Each card has a visual hop flow (AI Agent → Agentgateway → provider), a result drawer with latency, an estimated token/cost line when usage is present, and **Open in Solo UI**.
- **Deploy and test LLM configs from a catalog.** On **LLM**, open **Build & apply config**. Search the **LLM config catalog** (Connect / Route / Protect / Control), fill the form, preview YAML, and **Apply** `Gateway`, `HTTPRoute`, `EnterpriseAgentgatewayBackend`, and `EnterpriseAgentgatewayPolicy` (plus Model / RateLimit / Budget where the recipe uses them).
- **MCP: one-click virtual MCP, live status, and tests.** The **MCP** tab has **One-click deploys** (for example **Deploy everything server**, **Deploy website fetcher**, **Deploy virtual MCP**). Virtual examples show a live **Running** / **Pending** / **Error** (or **Missing**) chip. **Run test** and **Run all** probe initialize, list tools, echo, and fetch. Separate cards cover **MCP initialize**, **List tools**, **Call echo**, **Call fetch**, **JWT / unauth**, and **Tool calling**.
- **A2A and API/HTTP.** **A2A** probes **A2A agent-card / health**. **API/HTTP** runs **HTTP request**, **Unauthenticated request**, and **Junk / policy-probe**. Each tab can **Apply** a prebuilt example when a cluster is connected.
- **Connect to any cluster and apply CRDs.** In **Settings → Cluster**, choose **Source** **Manual** (GKE, AKS, EKS, or Local) or **Omni** (Sidero Omni). **Test connection**, then apply from the builders or **Resources**.
- **Clusters without a public proxy.** **Settings → Port forward** copies a `kubectl port-forward` command. Run it locally, click **Use localhost**, and point Chat / MCP / API tests at `127.0.0.1`. **Check localhost** reports Reachable or Not reachable.
- **Persistence.** The last top-level tab and the header **Demo** toggle are remembered. A **Connected** / **Not connected** chip (or **Checking** on open) sits in the header; click it to jump to Cluster.

## Install

Load the unpacked extension in Chrome (desktop). This is not on the Chrome Web Store.

1. Clone this repo, or download the ZIP from GitHub and unzip it.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the **`chrome-extension`** folder — the folder that contains `manifest.json`, not the repo root.
6. Pin **Agentgateway** from the extensions menu so the toolbar icon stays visible.

Click the toolbar icon to open the popup. Version **0.9.8** is the `version` field in `chrome-extension/manifest.json`.

## Configure it to your cluster

Open the **gear** in the header. That is **Settings**. Cluster connection lives here, not on a top-level tab.

### Connect with API server URL + bearer token

1. Under **Cluster**, set **Source** to **Manual**.
2. Choose **Cluster type** (GKE, AKS, EKS, or Local). The hint under the dropdown tells you where to get the server and token for that type.
3. Paste **API server URL** (for example from `kubectl cluster-info`).
4. Paste **Bearer token** (password field). Chrome cannot run exec plugins, so this must be a real token — not a kubeconfig that only has `exec`.
5. Set **Namespace** (default `agentgateway-system`).
6. Click **Test connection**.

Typical token sources (same text the UI uses):

| Cluster type | API server | Token |
| --- | --- | --- |
| GKE | `kubectl cluster-info` or `gcloud container clusters describe` | `gcloud auth print-access-token` |
| AKS | `az aks show` | A service-account token, or `az` / `kubelogin` output — not the exec kubeconfig alone |
| EKS | `aws eks describe-cluster` | `aws eks get-token --cluster-name …` |
| Local | Your API server URL | For example `kubectl create token` |

### Paste a kubeconfig (token-based)

Under **Kubeconfig YAML (optional)**, paste a kubeconfig that includes `user.token` (or an `auth-provider` token). Click **Parse kubeconfig**. If there are multiple contexts, pick one from **Context / cluster**. That fills **API server URL** and **Bearer token**.

Chrome cannot run exec plugins (`gke-gcloud-auth-plugin`, `kubelogin`, `aws eks get-token` as an exec plugin, Omni `oidc-login`). An exec-only kubeconfig will not work. Client-certificate kubeconfigs are also unsupported.

### Omni (Sidero Omni)

Omni’s management API is gRPC, so the extension cannot list clusters from the browser. Connect with a **token** kubeconfig.

1. In a terminal (not Chrome), generate a service-account kubeconfig:

   ```bash
   omnictl kubeconfig --service-account --cluster <name> --user <username> ./omni.kubeconfig
   ```

2. In **Settings → Cluster**, set **Source** to **Omni**.
3. Confirm **Omni URL** (default `https://maniak.na-west-1.omni.siderolabs.io`).
4. Optionally paste **OMNI_SERVICE_ACCOUNT_KEY**. That key is stored locally; it is not used to list clusters.
5. Paste the kubeconfig into **Omni kubeconfig**. If there are multiple contexts, pick **Context / cluster**.
6. **Parse kubeconfig**, then **Test connection**.

The kubeconfig from the Omni UI (**Download kubeconfig**) or `omnictl kubeconfig` without `--service-account` is exec-based. Chrome cannot run `omnictl` or that plugin. The popup will say you need a token kubeconfig.

### How to tell it worked

The header chip next to **Demo** / the gear shows **Connected** (plus a short host or context hint) or **Not connected**. On open it may briefly show **Checking**. Click the chip to return to **Settings → Cluster**.

### Port forward (no public proxy)

If the cluster does not expose Agentgateway on a public load balancer:

1. Stay in **Settings → Port forward**.
2. Confirm **Resource** (Service or Deployment), **Name** (default `agentgateway-proxy`), **Namespace** (default `agentgateway-system`), **Local port** (`8080`), and **Remote port** (`80`).
3. Click **Copy command**. Example:

   ```bash
   kubectl -n agentgateway-system port-forward svc/agentgateway-proxy 8080:80
   ```

4. Run that command on the same machine where Chrome is open. The extension cannot start the tunnel.
5. Click **Use localhost** so Chat and API/HTTP tests use `http://127.0.0.1:<localPort>` (Chat still appends `/v1/chat/completions`). Turn on **MCP path** if MCP should use `http://127.0.0.1:<port>/mcp`.
6. Click **Check localhost**. You want **Reachable**. A `127.0.0.1:<port>` chip appears in the header while tests use localhost.

For Omni, port-forward still needs a working kubeconfig on that laptop (`omnictl kubeconfig` / OIDC). It is local kubectl, not the extension token.

### Chat endpoint

On **Chat**, set **Endpoint URL** to your Agentgateway chat completions URL — a public load balancer, or `http://127.0.0.1:<port>/v1/chat/completions` after port-forward. If you enter a base URL without `/v1/chat/completions`, the extension appends that path.

MCP defaults to the Chat gateway host + `/mcp` unless you override **MCP endpoint**.

### Solo UI (optional)

In **Settings**, set **Solo UI URL** to the Solo UI app base (path `/age/`). After a **Test** or **Run**, **Open in Solo UI** opens the traces page (`/age/tracing`, or `/age/tracing/<id>` when a trace id is in the response headers).

**Demo stage** (header **Demo**, or the Settings toggle) grows the popup for a projector. **Hooray** plays a short confetti burst after a successful test.

## Quick start after connect

- Confirm the header chip says **Connected**.
- Open **Chat**, set **Endpoint URL** (or **Use localhost**), pick a provider and model, click **Test**.
- Open **LLM**, run **Chat ping**, then open **Build & apply config** and **Apply** a catalog item (Connect / Route / Protect / Control).
- Open **MCP**, click a one-click deploy (for example **Deploy virtual MCP**), wait for **Running**, then **Run test** or **Run all**.
- Optionally set **Solo UI URL** and use **Open in Solo UI** on a result drawer.
- Turn on **Demo** if you are projecting the hop flow.

## Requirements / limits

- **Chrome on desktop only.** This is a Manifest V3 unpacked extension. It does not run on Android or in other browsers.
- You need a **reachable Kubernetes API** (or you paste API server + bearer token that the browser can `fetch`). Chrome rejects untrusted / self-signed API server CAs (common with kind / minikube / k3d) unless the CA is trusted by the OS.
- Use a **token kubeconfig** or a pasted bearer token. `gcloud` / `az` / AWS / Omni **exec** plugins do not run inside Chrome.
- The extension **cannot spawn kubectl**. That is why **Port forward** is copy/paste, then **Use localhost** / **Check localhost**.
- Chat and the test tabs do **not** store provider API keys or a Solo license. Cluster tokens stay in `chrome.storage.local` (not sync) and are not logged.

Terraform under `terraform/` is still in the repo if you want to stand up a demo cluster later. The live GCP project that used to back the default endpoints is gone — set **Endpoint URL**, **Solo UI URL**, and Cluster to **your** environment.
