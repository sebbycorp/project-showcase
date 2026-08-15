# Agentgateway Chat (Chrome extension)

Manifest V3 popup for basic LLM provider testing and follow-up chat through an
Agentgateway proxy. The gateway injects backend auth, so this extension does
**not** store or send an API key or license key.

## Load unpacked

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder

The toolbar action opens a 360×480 popup.

## Provider testing

Configure **Endpoint URL** and **Model**, then click **Test**.

The **Endpoint URL** field is pre-filled with:

`http://35.226.209.32/v1/chat/completions`

The **Model** field defaults to `gpt-4o-mini`. Both values are saved in
`chrome.storage.local`.

If you enter a base URL without `/v1/chat/completions` (for example
`http://35.226.209.32`), the extension appends that path.

**Test** sends a tiny `POST` to the configured endpoint:

```json
{
  "model": "<chosen model>",
  "messages": [{ "role": "user", "content": "Reply with the word pong." }]
}
```

The result shows HTTP status, round-trip latency in ms, the model from the
response when present, and the reply or error. Test does not clear chat
history. No API key is included.

## Chat

The chat box uses the same saved endpoint and model for follow-up messages.
Each send is `POST` with JSON `{ "model": "<chosen model>", "messages": [...] }`.
