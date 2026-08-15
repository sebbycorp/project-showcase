/* Prebuilt Scenario deploys. No secret values — secretRef name only. */
const DEPLOY_EXAMPLES = {
  llm: {
    gateway: {
      label: "Gateway (HTTP :80)",
      yaml: `# From manifests/gateway.yaml
# Apply after Solo Enterprise for Agentgateway is installed.
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: agentgateway-proxy
  namespace: agentgateway-system
spec:
  gatewayClassName: enterprise-agentgateway
  listeners:
    - protocol: HTTP
      port: 80
      name: http
      allowedRoutes:
        namespaces:
          from: All
`,
    },
    openai: {
      label: "OpenAI backend + HTTPRoute",
      yaml: `# From manifests/openai-backend.yaml
# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/openai/
# Create openai-secret in the cluster first — do not put a key here.
#   kubectl -n agentgateway-system create secret generic openai-secret \\
#     --from-literal=Authorization="\${OPENAI_API_KEY}"
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: openai
  namespace: agentgateway-system
spec:
  ai:
    provider:
      openai: {}
  policies:
    auth:
      secretRef:
        name: openai-secret
    ai:
      routes:
        "/v1/responses": "Responses"
        "/v1/chat/completions": "Completions"
        "/v1/models": "Models"
        "*": "Passthrough"
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: openai
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - backendRefs:
        - name: openai
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    failover: {
      label: "Failover backend (primary + fallback)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/failover/
# Primary model: gpt-4o-mini (first priority group)
# Fallback model: gpt-4o (second priority group)
# Health policy evicts 5xx/429 so traffic moves to the next group.
# secretRef name only — create openai-secret separately.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: model-failover
  namespace: agentgateway-system
spec:
  ai:
    groups:
      - providers:
          - name: openai-primary
            openai:
              model: gpt-4o-mini
            policies:
              auth:
                secretRef:
                  name: openai-secret
      - providers:
          - name: openai-fallback
            openai:
              model: gpt-4o
            policies:
              auth:
                secretRef:
                  name: openai-secret
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-failover
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /model
      backendRefs:
        - name: model-failover
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
---
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: model-failover-health
  namespace: agentgateway-system
spec:
  targetRefs:
    - group: enterpriseagentgateway.solo.io
      kind: EnterpriseAgentgatewayBackend
      name: model-failover
  backend:
    health:
      unhealthyCondition: "response.code >= 500 || response.code == 429"
      eviction:
        duration: 10s
        consecutiveFailures: 1
`,
    },
    httproute: {
      label: "HTTPRoute add-on (/openai)",
      yaml: `# Destination / HTTPRoute add-on from the OpenAI provider page.
# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/openai/
# Rewrites /openai → /v1/chat/completions. Tweak the path or backend name.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: openai-path
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /openai
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v1/chat/completions
      backendRefs:
        - name: openai
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
  },
  mcp: {
    mcp: {
      label: "MCP backend + HTTPRoute",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/quickstart/mcp/
# PLACEHOLDER: replace static.host with your MCP Service DNS.
# This stub does not include a Secret or API key.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: mcp-backend
  namespace: agentgateway-system
spec:
  mcp:
    targets:
      - name: mcp-target
        static:
          host: mcp-website-fetcher.default.svc.cluster.local
          port: 80
          protocol: SSE
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: mcp
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp
      backendRefs:
        - name: mcp-backend
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    a2a: {
      label: "A2A backend + HTTPRoute",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/agent/a2a/
# PLACEHOLDER: replace a2a.host with your agent Service DNS.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: a2a-backend
  namespace: agentgateway-system
spec:
  a2a:
    host: a2a-agent.default.svc.cluster.local
    port: 9090
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: a2a
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /myagent
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /
      backendRefs:
        - name: a2a-backend
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
  },
  security: {
    policy: {
      label: "Prompt-guard policy (PII stub)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/guardrails/regex/
# Safe PII reject example (credit card string). Not a jailbreak payload.
# Target the openai HTTPRoute from the LLM OpenAI example.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: openai-prompt-guard
  namespace: agentgateway-system
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai
  backend:
    ai:
      promptGuard:
        request:
          - response:
              message: "Rejected due to inappropriate content"
            regex:
              action: Reject
              matches:
                - "credit card"
`,
    },
  },
};
