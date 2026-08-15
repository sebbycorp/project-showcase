# Agentgateway Chat (Chrome extension)

Manifest V3 popup that chats with an LLM through an Agentgateway proxy. The
gateway injects backend auth, so this extension does **not** store or send an
API key or license key.

## Load unpacked

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder

The toolbar action opens a 360×480 chat popup.

## Endpoint

The **Endpoint URL** field is pre-filled with:

`http://35.226.209.32/v1/chat/completions`

Edit it to point at any Agentgateway (or OpenAI-compatible) chat completions
URL. The value is saved in `chrome.storage.local`.

If you enter a base URL with no path (for example `http://35.226.209.32`), the
extension appends `/v1/chat/completions`.

Each send is `POST` with JSON `{ "model": "gpt-4o-mini", "messages": [...] }`.
No API key is included.
