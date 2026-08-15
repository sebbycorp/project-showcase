// Build a kubectl port-forward command and localhost endpoints.
// Chrome cannot spawn kubectl — this only copies the command and points
// Chat / MCP / API tests at 127.0.0.1 after the user runs it locally.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PortForward = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  const DEFAULTS = {
    resource: "service",
    name: "agentgateway-proxy",
    namespace: "agentgateway-system",
    localPort: 8080,
    remotePort: 80,
  };

  function resourceArg(resource) {
    const raw = String(resource || "")
      .trim()
      .toLowerCase();
    if (raw === "deployment" || raw === "deploy") {
      return "deploy";
    }
    return "svc";
  }

  function normalizePort(raw, fallback) {
    const n = Number.parseInt(String(raw == null ? "" : raw).trim(), 10);
    if (!Number.isInteger(n) || n < 1 || n > 65535) {
      return fallback;
    }
    return n;
  }

  function shellQuote(value) {
    const s = String(value == null ? "" : value);
    if (!s) {
      return "";
    }
    if (/^[A-Za-z0-9_.:/=@-]+$/.test(s)) {
      return s;
    }
    return `'${s.replace(/'/g, `'\\''`)}'`;
  }

  function buildCommand(opts) {
    const settings = opts || {};
    const ns =
      String(settings.namespace || "").trim() || DEFAULTS.namespace;
    const name = String(settings.name || "").trim() || DEFAULTS.name;
    const localPort = normalizePort(settings.localPort, DEFAULTS.localPort);
    const remotePort = normalizePort(settings.remotePort, DEFAULTS.remotePort);
    const res = resourceArg(settings.resource);
    const parts = ["kubectl"];
    const context = String(settings.context || "").trim();
    if (context) {
      parts.push("--context", shellQuote(context));
    }
    parts.push(
      "-n",
      shellQuote(ns),
      "port-forward",
      `${res}/${shellQuote(name)}`,
      `${localPort}:${remotePort}`
    );
    return parts.join(" ");
  }

  function localhostOrigin(localPort) {
    return `http://127.0.0.1:${normalizePort(localPort, DEFAULTS.localPort)}`;
  }

  function chatEndpoint(localPort) {
    return localhostOrigin(localPort);
  }

  function apiEndpoint(localPort) {
    return localhostOrigin(localPort);
  }

  function mcpEndpoint(localPort, mcpPath) {
    const origin = localhostOrigin(localPort);
    return mcpPath ? `${origin}/mcp` : origin;
  }

  function checkUrl(localPort, mcpPath) {
    const origin = localhostOrigin(localPort);
    return mcpPath ? `${origin}/mcp` : `${origin}/`;
  }

  function isLocalhostUrl(raw) {
    const text = String(raw || "").trim();
    if (!text) {
      return false;
    }
    try {
      const url = new URL(text.includes("://") ? text : `http://${text}`);
      return url.hostname === "127.0.0.1" || url.hostname === "localhost";
    } catch {
      return false;
    }
  }

  return {
    DEFAULTS,
    resourceArg,
    normalizePort,
    shellQuote,
    buildCommand,
    localhostOrigin,
    chatEndpoint,
    apiEndpoint,
    mcpEndpoint,
    checkUrl,
    isLocalhostUrl,
  };
});
