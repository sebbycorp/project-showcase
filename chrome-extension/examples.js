/* Prebuilt tab deploys (LLM / MCP / A2A / API). No secret values — secretRef name only. */
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
    providerFailover: {
      label: "Provider failover (OpenAI → Claude)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/failover/
# Official provider-failover shape: priority groups on one backend.
# Primary: OpenAI gpt-4o-mini. Fallback: Anthropic claude-sonnet-4-5.
# Health policy evicts 5xx/429 so traffic moves to the next group.
# secretRef names only — create the Secrets in the cluster first.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: provider-failover
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
          - name: claude-fallback
            anthropic:
              model: claude-sonnet-4-5
            policies:
              auth:
                secretRef:
                  name: anthropic-secret
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: provider-failover
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
        - name: provider-failover
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
---
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: provider-failover-health
  namespace: agentgateway-system
spec:
  targetRefs:
    - group: enterpriseagentgateway.solo.io
      kind: EnterpriseAgentgatewayBackend
      name: provider-failover
  backend:
    health:
      unhealthyCondition: "response.code >= 500 || response.code == 429"
      eviction:
        duration: 10s
        consecutiveFailures: 1
`,
    },
    failover: {
      label: "Model failover (same provider)",
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
    claude: {
      label: "Claude backend + HTTPRoute",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/anthropic/
# Create anthropic-secret in the cluster first — do not put a key here.
#   kubectl -n agentgateway-system create secret generic anthropic-secret \\
#     --from-literal=Authorization="\${ANTHROPIC_API_KEY}"
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: anthropic
  namespace: agentgateway-system
spec:
  ai:
    provider:
      anthropic:
        model: claude-sonnet-4-5
  policies:
    auth:
      secretRef:
        name: anthropic-secret
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: anthropic
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /anthropic
      backendRefs:
        - name: anthropic
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    failoverClaude: {
      label: "Failover backend (Claude)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/failover/
# Primary model: claude-sonnet-4-5 (first priority group)
# Fallback model: claude-3-5-sonnet (second priority group)
# secretRef name only — create anthropic-secret separately.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: model-failover
  namespace: agentgateway-system
spec:
  ai:
    groups:
      - providers:
          - name: claude-primary
            anthropic:
              model: claude-sonnet-4-5
            policies:
              auth:
                secretRef:
                  name: anthropic-secret
      - providers:
          - name: claude-fallback
            anthropic:
              model: claude-3-5-sonnet
            policies:
              auth:
                secretRef:
                  name: anthropic-secret
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
    httprouteClaude: {
      label: "HTTPRoute add-on (/anthropic)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/anthropic/
# Rewrites /anthropic → /v1/chat/completions. Tweak the path or backend name.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: anthropic-path
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /anthropic
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v1/chat/completions
      backendRefs:
        - name: anthropic
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    grok: {
      label: "Grok backend + HTTPRoute",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/openai-compatible/
# xAI Grok uses the OpenAI-compatible provider shape (host api.x.ai).
# Create grok-secret in the cluster first — do not put a key here.
#   kubectl -n agentgateway-system create secret generic grok-secret \\
#     --from-literal=Authorization="\${XAI_API_KEY}"
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: grok
  namespace: agentgateway-system
spec:
  ai:
    provider:
      openai:
        model: grok-3
      host: api.x.ai
      port: 443
      path: /v1/chat/completions
  policies:
    auth:
      secretRef:
        name: grok-secret
    tls:
      sni: api.x.ai
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: grok
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /grok
      backendRefs:
        - name: grok
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    failoverGrok: {
      label: "Failover backend (Grok)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/failover/
# Primary model: grok-3 (first priority group)
# Fallback model: grok-2-latest (second priority group)
# secretRef name only — create grok-secret separately.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: model-failover
  namespace: agentgateway-system
spec:
  ai:
    groups:
      - providers:
          - name: grok-primary
            openai:
              model: grok-3
            host: api.x.ai
            port: 443
            path: /v1/chat/completions
            policies:
              auth:
                secretRef:
                  name: grok-secret
              tls:
                sni: api.x.ai
      - providers:
          - name: grok-fallback
            openai:
              model: grok-2-latest
            host: api.x.ai
            port: 443
            path: /v1/chat/completions
            policies:
              auth:
                secretRef:
                  name: grok-secret
              tls:
                sni: api.x.ai
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
    httprouteGrok: {
      label: "HTTPRoute add-on (/grok)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/openai-compatible/
# Rewrites /grok → /v1/chat/completions. Tweak the path or backend name.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: grok-path
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /grok
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v1/chat/completions
      backendRefs:
        - name: grok
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    bedrock: {
      label: "Bedrock backend + HTTPRoute",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/bedrock/
# Documented example model: amazon.nova-micro-v1:0
# Create bedrock-secret in the cluster first — do not put a key here.
#   kubectl -n agentgateway-system create secret generic bedrock-secret \\
#     --from-literal=accessKey="\${AWS_ACCESS_KEY_ID}" \\
#     --from-literal=secretKey="\${AWS_SECRET_ACCESS_KEY}"
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: bedrock
  namespace: agentgateway-system
spec:
  ai:
    provider:
      bedrock:
        model: amazon.nova-micro-v1:0
        region: us-east-1
  policies:
    auth:
      aws:
        secretRef:
          name: bedrock-secret
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: bedrock
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /bedrock
      backendRefs:
        - name: bedrock
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    failoverBedrock: {
      label: "Failover backend (Bedrock)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/failover/
# Primary model: amazon.nova-micro-v1:0 (first priority group)
# Fallback model: amazon.titan-text-lite-v1 (second priority group)
# secretRef name only — create bedrock-secret separately.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: model-failover
  namespace: agentgateway-system
spec:
  ai:
    groups:
      - providers:
          - name: bedrock-primary
            bedrock:
              model: amazon.nova-micro-v1:0
              region: us-east-1
            policies:
              auth:
                aws:
                  secretRef:
                    name: bedrock-secret
      - providers:
          - name: bedrock-fallback
            bedrock:
              model: amazon.titan-text-lite-v1
              region: us-east-1
            policies:
              auth:
                aws:
                  secretRef:
                    name: bedrock-secret
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
    gemini: {
      label: "Gemini backend + HTTPRoute",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/google/
# Create gemini-secret in the cluster first — do not put a key here.
#   kubectl -n agentgateway-system create secret generic gemini-secret \\
#     --from-literal=Authorization="\${GEMINI_API_KEY}"
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: gemini
  namespace: agentgateway-system
spec:
  ai:
    provider:
      gemini:
        model: gemini-2.0-flash
  policies:
    auth:
      secretRef:
        name: gemini-secret
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: gemini
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /gemini
      backendRefs:
        - name: gemini
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    failoverGemini: {
      label: "Failover backend (Gemini)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/failover/
# Primary model: gemini-2.0-flash (first priority group)
# Fallback model: gemini-1.5-flash (second priority group)
# secretRef name only — create gemini-secret separately.
apiVersion: enterpriseagentgateway.solo.io/v1alpha1
kind: EnterpriseAgentgatewayBackend
metadata:
  name: model-failover
  namespace: agentgateway-system
spec:
  ai:
    groups:
      - providers:
          - name: gemini-primary
            gemini:
              model: gemini-2.0-flash
            policies:
              auth:
                secretRef:
                  name: gemini-secret
      - providers:
          - name: gemini-fallback
            gemini:
              model: gemini-1.5-flash
            policies:
              auth:
                secretRef:
                  name: gemini-secret
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
    dgx: {
      label: "DGX Spark backend + HTTPRoute",
      yaml: `# Self-hosted OpenAI-compatible server (vLLM / SGLang / TGI) on your own box.
# No secret: the model is on your network, so there is no provider key to inject.
# Set host/port to wherever the inference server listens.
apiVersion: agentgateway.dev/v1alpha1
kind: AgentgatewayBackend
metadata:
  name: dgx-spark-llm
  namespace: agentgateway-system
spec:
  ai:
    provider:
      host: 172.16.10.173
      port: 8000
      pathPrefix: /v1
      openai:
        model: Qwen/Qwen3.6-35B-A3B-FP8
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: dgx-spark-llm
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: dgx-spark-gateway
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /spark
      backendRefs:
        - name: dgx-spark-llm
          namespace: agentgateway-system
          group: agentgateway.dev
          kind: AgentgatewayBackend
`,
    },

    httprouteDgx: {
      label: "HTTPRoute add-on (/spark)",
      yaml: `# Rewrites /spark → /v1/chat/completions against the local model.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: dgx-spark-path
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: dgx-spark-gateway
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /spark
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v1/chat/completions
      backendRefs:
        - name: dgx-spark-llm
          namespace: agentgateway-system
          group: agentgateway.dev
          kind: AgentgatewayBackend
`,
    },

    httprouteGemini: {
      label: "HTTPRoute add-on (/gemini)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/google/
# Rewrites /gemini → /v1/chat/completions. Tweak the path or backend name.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: gemini-path
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /gemini
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v1/chat/completions
      backendRefs:
        - name: gemini
          namespace: agentgateway-system
          group: enterpriseagentgateway.solo.io
          kind: EnterpriseAgentgatewayBackend
`,
    },
    httprouteBedrock: {
      label: "HTTPRoute add-on (/bedrock)",
      yaml: `# Docs: https://docs.solo.io/agentgateway/latest/llm/providers/bedrock/
# Rewrites /bedrock → /v1/chat/completions. Tweak the path or backend name.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: bedrock-path
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-proxy
      namespace: agentgateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /bedrock
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v1/chat/completions
      backendRefs:
        - name: bedrock
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
  },
  a2a: {
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
  api: {
    policy: {
      label: "Prompt Guard (builtin suite)",
      yaml: `# Replaced by workshop.js WORKSHOP_YAML.guardrails (builtin-guardrails.md).
# Loaded at runtime — see workshop.js if this stub is still visible.
`,
    },
  },
};
