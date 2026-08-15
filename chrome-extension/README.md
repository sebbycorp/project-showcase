# Agentgateway (Chrome extension)

![Chat tab](../docs/images/chat.png)

Install, cluster setup, and how to use the popup are in the [root README](../README.md).

## Load unpacked

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select **this folder** (`chrome-extension/`) — the one that contains `manifest.json`, not the repo root.

Current version: **0.10.0** (`manifest.json`). Pin the toolbar icon, then open the gear for **Settings → Cluster**.

## Workshop demos

LLM / MCP / A2A / API tabs include **Apply** + **Run** cards (hop labels on the existing tiles):

- **LLM / Chat** — Prompt Guard pass vs jailbreak, prompt enrichment, local token budget → 429, streaming SSE, embeddings, body-based routing, mock OpenAI, timeouts/retries
- **MCP** — OpenAPI→MCP (Open-Meteo), remote MCP (search.solo.io), tool rate limit, FailOpen federation, composable MCP, Search/Code tool modes, JWT + tool RBAC
- **A2A** — Real task (agent-card, `tasks/send`, poll `tasks/get`)
- **API/HTTP** — WAF first-pass, direct response / health, JWT + RBAC on `/openai-jwt`
