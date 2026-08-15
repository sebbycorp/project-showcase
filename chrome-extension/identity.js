// Entra ID + Keycloak JWT helpers for Settings → Identity.
// Always set the browser global. Chrome popups can have `module`.
(function (root, factory) {
  const api = factory();
  root.Identity = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  const DEFAULT_NS = "agentgateway-system";
  const DEFAULT_GW = "agentgateway-proxy";
  const AGW = "enterpriseagentgateway.solo.io/v1alpha1";
  const AGW_GROUP = "enterpriseagentgateway.solo.io";
  const GW_API = "gateway.networking.k8s.io/v1";

  function trim(value) {
    return String(value == null ? "" : value).trim();
  }

  function entraIssuer(tenantId, version) {
    const tenant = trim(tenantId);
    if (version === "v2") {
      return `https://login.microsoftonline.com/${tenant}/v2.0`;
    }
    return `https://sts.windows.net/${tenant}/`;
  }

  function entraJwksPath(tenantId) {
    return `/${trim(tenantId)}/discovery/v2.0/keys`;
  }

  function parseKeycloakIssuer(url) {
    const raw = trim(url);
    if (!raw) {
      return null;
    }
    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    const tls = parsed.protocol === "https:";
    const port = parsed.port ? Number(parsed.port) : tls ? 443 : 80;
    const match = parsed.pathname.match(/\/realms\/([^/]+)/);
    return {
      issuer: raw.replace(/\/+$/, ""),
      host: parsed.hostname,
      port,
      tls,
      realm: match ? match[1] : "",
    };
  }

  function keycloakJwksPath(realm) {
    return `realms/${trim(realm)}/protocol/openid-connect/certs`;
  }

  function nsOrDefault(value) {
    return trim(value) || DEFAULT_NS;
  }

  function gwOrDefault(value) {
    return trim(value) || DEFAULT_GW;
  }

  function entraAudiences(clientId) {
    const id = trim(clientId);
    if (!id) {
      return [];
    }
    const raw = id.replace(/^api:\/\//, "");
    const api = id.startsWith("api://") ? id : `api://${id}`;
    if (api === raw) {
      return [api];
    }
    return [api, raw];
  }

  function audiencesYaml(audiences, indent) {
    if (!audiences.length) {
      return "";
    }
    const pad = indent || "          ";
    return (
      `\n${pad}audiences:\n` +
      audiences.map((item) => `${pad}  - ${item}`).join("\n")
    );
  }

  function llmHttpRoute({ name, path, ns, gateway }) {
    return `apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: ${name}
  namespace: ${ns}
spec:
  parentRefs:
    - name: ${gateway}
      namespace: ${ns}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: ${path}
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v1/chat/completions
      backendRefs:
        - name: openai
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "120s"`;
  }

  function entraYaml(opts) {
    const options = opts || {};
    const tenantId = trim(options.tenantId);
    if (!tenantId) {
      throw new Error("Tenant ID is required.");
    }
    const ns = nsOrDefault(options.ns);
    const gateway = gwOrDefault(options.gateway);
    const issuer = entraIssuer(tenantId, options.issuerVersion);
    const audiences = entraAudiences(options.clientId);
    return `# Backend for Entra JWKS — DIRECT (no Squid tunnel)
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: entra-jwks
  namespace: ${ns}
spec:
  static:
    host: login.microsoftonline.com
    port: 443
  policies:
    tls: {}
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: openai-entra-jwt
  namespace: ${ns}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai-entra
  traffic:
    jwtAuthentication:
      mode: Strict
      providers:
        - issuer: ${issuer}
          jwks:
            remote:
              backendRef:
                name: entra-jwks
                namespace: ${ns}
                kind: EnterpriseAgentgatewayBackend
                group: ${AGW_GROUP}
              jwksPath: ${entraJwksPath(tenantId)}${audiencesYaml(audiences)}
---
${llmHttpRoute({
  name: "openai-entra",
  path: "/openai-entra",
  ns,
  gateway,
})}
`;
  }

  function keycloakYaml(opts) {
    const options = opts || {};
    const parsed = parseKeycloakIssuer(options.issuer);
    if (!parsed) {
      throw new Error("Issuer URL is required (no trailing slash).");
    }
    const realm = trim(options.realm) || parsed.realm;
    if (!realm) {
      throw new Error(
        "Realm is required, or use an issuer path like /realms/<name>."
      );
    }
    const ns = nsOrDefault(options.ns);
    const gateway = gwOrDefault(options.gateway);
    const audience = trim(options.audience);
    const tlsBlock = parsed.tls
      ? `
  policies:
    tls: {}`
      : "";
    const audiences = audience ? [audience] : [];
    return `apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: keycloak-jwks
  namespace: ${ns}
spec:
  static:
    host: ${parsed.host}
    port: ${parsed.port}${tlsBlock}
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: openai-keycloak-jwt
  namespace: ${ns}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai-keycloak
  traffic:
    jwtAuthentication:
      mode: Strict
      providers:
        - issuer: ${parsed.issuer}
          jwks:
            remote:
              backendRef:
                name: keycloak-jwks
                namespace: ${ns}
                kind: EnterpriseAgentgatewayBackend
                group: ${AGW_GROUP}
              jwksPath: ${keycloakJwksPath(realm)}${audiencesYaml(audiences)}
---
${llmHttpRoute({
  name: "openai-keycloak",
  path: "/openai-keycloak",
  ns,
  gateway,
})}
`;
  }

  function base64UrlToJson(segment) {
    const b64 = String(segment || "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    if (!b64) {
      return null;
    }
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    let json;
    try {
      if (typeof Buffer !== "undefined") {
        json = Buffer.from(b64 + pad, "base64").toString("utf8");
      } else if (typeof atob === "function") {
        json = decodeURIComponent(
          Array.prototype.map
            .call(atob(b64 + pad), (c) => {
              const hex = c.charCodeAt(0).toString(16);
              return "%" + (hex.length < 2 ? "0" + hex : hex);
            })
            .join("")
        );
      } else {
        return null;
      }
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function decodeJwtClaims(token) {
    const raw = trim(token);
    if (!raw) {
      return null;
    }
    const parts = raw.split(".");
    if (parts.length < 2) {
      return null;
    }
    const payload = base64UrlToJson(parts[1]);
    if (!payload || typeof payload !== "object") {
      return null;
    }
    return {
      iss: payload.iss,
      aud: payload.aud,
      tid: payload.tid,
      azp: payload.azp,
    };
  }

  return {
    DEFAULT_NS,
    DEFAULT_GW,
    entraIssuer,
    entraJwksPath,
    parseKeycloakIssuer,
    keycloakJwksPath,
    entraYaml,
    keycloakYaml,
    decodeJwtClaims,
  };
});
