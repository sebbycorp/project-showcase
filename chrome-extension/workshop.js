/* Workshop + original demo YAML and card metadata. Loaded after examples.js. */
(function (root) {
  const NS = "agentgateway-system";
  const GW = "agentgateway-proxy";
  const AGW = "enterpriseagentgateway.solo.io/v1alpha1";
  const AGW_GROUP = "enterpriseagentgateway.solo.io";
  const GW_API = "gateway.networking.k8s.io/v1";

  // Documented workshop demo JWT + public JWKS (labs/security/jwt-auth-with-rbac.md).
  const WORKSHOP_JWT =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNvbG8tcHVibGljLWtleS0wMDEifQ.eyJpc3MiOiJzb2xvLmlvIiwib3JnIjoic29sby5pbyIsInN1YiI6InVzZXItaWQiLCJ0ZWFtIjoidGVhbS1pZCIsImV4cCI6MjA3OTU1NjEwNCwibGxtcyI6eyJvcGVuYWkiOlsiZ3B0LTRvIl19fQ.e49g9XE6yrttR9gQAPpT_qcWVKe-bO6A7yJarMDCMCh8PhYs67br00wT6v0Wt8QXMMN09dd8UUEjTunhXqdkF5oeRMXiyVjpTPY4CJeoF1LfKhgebVkJeX8kLhqBYbMXp3cxr2GAmc3gkNfS2XnL2j-bowtVzwNqVI5D8L0heCpYO96xsci37pFP8jz6r5pRNZ597AT5bnYaeu7dHO0a5VGJqiClSyX9lwgVCXaK03zD1EthwPoq34a7MwtGy2mFS_pD1MTnPK86QfW10LCHxtahzGHSQ4jfiL-zp13s8MyDgTkbtanCk_dxURIyynwX54QJC_o5X7ooDc3dxbd8Cw";

  const WORKSHOP_JWKS = `{
  "keys": [
    {
      "kty": "RSA",
      "kid": "solo-public-key-001",
      "n": "vlmc5pb-jYaOq75Y4r91AC2iuS9B0sm6sxzRm3oOG7nIt2F1hHd4AKll2jd6BZg437qvsLdREnbnVrr8kU0drmJNPHL-xbsTz_cQa95GuKb6AI6osAaUAEL3dPjuoqkGNRe1sAJyOi48qtcbV0kPWcwFmCV0-OiqliCms12jrd1PSI_LYiNc3GcutpxY6BiHkbxxNeIuWDxE-i_Obq8EhhGkwha1KVUvLHV-EwD4M_AY8BegGsX-sjoChXOxyueu_ReqWV227I-FTKwMnjwWW0BQkeI6g1w1WqADmtKZ2sLamwGUJgWt4ZgIyhQ-iQfeN1WN2iupTWa5JAsw--CQJw",
      "e": "AQAB",
      "use": "sig",
      "alg": "RS256"
    }
  ]
}`;

  const OPEN_METEO_SCHEMA = JSON.stringify(
    {
      openapi: "3.0.0",
      info: {
        title: "Open-Meteo Forecast API",
        version: "1.0.0",
        description: "Free weather forecast API. No API key required.",
      },
      servers: [{ url: "/" }],
      paths: {
        "/v1/forecast": {
          get: {
            operationId: "getWeatherForecast",
            summary: "Get the weather forecast for a geographic location",
            description:
              "Returns current, hourly, and/or daily weather variables for a latitude/longitude.",
            parameters: [
              {
                name: "latitude",
                in: "query",
                required: true,
                description: "Latitude in decimal degrees (e.g. 51.5072 for London).",
                schema: { type: "number" },
              },
              {
                name: "longitude",
                in: "query",
                required: true,
                description: "Longitude in decimal degrees (e.g. -0.1276 for London).",
                schema: { type: "number" },
              },
              {
                name: "current",
                in: "query",
                required: false,
                description: "Comma-separated current weather variables.",
                schema: { type: "string" },
              },
              {
                name: "timezone",
                in: "query",
                required: false,
                description: "Timezone. Use auto to resolve from coordinates.",
                schema: { type: "string" },
              },
            ],
            responses: { "200": { description: "Weather forecast data" } },
          },
        },
      },
    },
    null,
    2
  );

  const YAML = {
    guardrails: `# Workshop labs/guardrails/builtin-guardrails.md
# Full builtin promptGuard suite (request Reject + response Mask).
# Targets HTTPRoute openai. Create openai-secret in-cluster first — no keys here.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: comprehensive-prompt-guard
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai
  backend:
    ai:
      promptGuard:
        request:
          - regex:
              action: Reject
              matches:
                - "(?i)(ignore|disregard|forget|override|bypass|skip|dismiss|drop|abandon)\\\\s+(all\\\\s+|any\\\\s+|your\\\\s+)?(previous|prior|earlier|above|existing|current|original|initial|given|preset)\\\\s+(instructions|rules|guidelines|directives|constraints|restrictions|prompts|programming|configuration)"
                - "(?i)(from now on|effective immediately|starting now|henceforth)\\\\s*(,\\\\s+)?(you\\\\s+)?(will|shall|must|should|are to|need to)\\\\s+(be|act|respond|answer|behave|operate|function)"
            response:
              message: "Request blocked: prompt injection detected. Attempts to override system instructions are not permitted."
              statusCode: 403
          - regex:
              action: Reject
              matches:
                - "(?i)(you are now|you're now|from now on you are|henceforth you are|you have become|you are no longer)\\\\s+(a |an |the )?(unrestricted|unfiltered|uncensored|unlimited|jailbroken|evil|malicious|dangerous|DAN|unethical|amoral|rogue|hacker)"
                - "(?i)(do anything now|DAN mode|DAN jailbreak|enable DAN|activate DAN|DAN [0-9]+\\\\.[0-9]+|STAN mode|DUDE mode|AIM mode)"
                - "(?i)(enter|enable|activate|switch to|turn on|engage|unlock)\\\\s+(developer|dev|debug|admin|sudo|root|god|maintenance|unrestricted|unfiltered|jailbreak)\\\\s*(mode|access|privileges|console)"
            response:
              message: "Request blocked: jailbreak attempt detected. Role hijacking and persona manipulation are not permitted."
              statusCode: 403
          - regex:
              action: Reject
              matches:
                - "(?i)(show|print|display|reveal|output|tell|give|share|repeat|recite|echo|dump|expose|leak|disclose)\\\\s+(me\\\\s+)?(your|the)?\\\\s*(system|initial|original|first|hidden|secret|internal|underlying|prepended)\\\\s*(prompt|instructions?|message|context|configuration|rules?|directives?|preamble)"
            response:
              message: "Request blocked: system prompt extraction attempt detected. Internal instructions are confidential."
              statusCode: 403
          - regex:
              action: Reject
              builtins:
                - CreditCard
                - Ssn
                - Email
                - PhoneNumber
                - CaSin
            response:
              message: "Request blocked: personally identifiable information (PII) detected. Do not include credit cards, SSNs, emails, phone numbers, or SINs in prompts."
              statusCode: 422
          - regex:
              action: Reject
              matches:
                - "\\\\bAKIA[0-9A-Z]{16}\\\\b"
                - "\\\\bsk-[a-zA-Z0-9_-]{20,}\\\\b"
                - "(?i)(password|passwd|pwd|secret|token|api[_-]?key)\\\\s*[=:]\\\\s*[\\"']?[^\\\\s\\"']{8,}"
            response:
              message: "Request blocked: credential or secret detected. Do not include API keys, tokens, or passwords in prompts."
              statusCode: 422
        response:
          - regex:
              action: Mask
              builtins:
                - CreditCard
                - Ssn
                - Email
                - PhoneNumber
                - CaSin
            response:
              message: "Response filtered: PII redacted from model output."
          - regex:
              action: Mask
              matches:
                - "\\\\bAKIA[0-9A-Z]{16}\\\\b"
                - "\\\\bsk-[a-zA-Z0-9_-]{20,}\\\\b"
            response:
              message: "Response filtered: credentials redacted from model output."
`,

    enrichment: `# Workshop labs/transformations/prompt-enrichment.md
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: openai-opt
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai
  backend:
    ai:
      prompt:
        prepend:
          - role: system
            content: "Return the response in JSON format"
`,

    tokenBudget: `# Workshop labs/rate-limiting/local-token-rate-limiting.md
# Tiny local token budget (5 tokens / minute) on HTTPRoute openai.
# Dedicated enough for a demo; Chat on a different path is unaffected if openai is /openai.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: local-token-based-rate-limit
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai
  traffic:
    rateLimit:
      local:
        - unit: Minutes
          tokens: 5
          burst: 0
`,

    embeddings: `# Workshop labs/routing/configure-openai-embeddings.md
# Reuses the openai backend; adds Completions + embeddings Passthrough routes.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: openai
  namespace: ${NS}
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
        "/v1/chat/completions": "Completions"
        "/v1/embeddings": "Passthrough"
        "/v1/models": "Passthrough"
        "*": "Passthrough"
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: openai
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - backendRefs:
        - name: openai
          namespace: ${NS}
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "120s"
`,

    bodyRouting: `# Workshop labs/routing/configure-body-based-routing.md
# Enterprise PreRouting extract + header-matched HTTPRoute (not OSS AgentgatewayPolicy).
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: extract-model-from-body
  namespace: ${NS}
spec:
  targetRefs:
    - name: ${GW}
      group: gateway.networking.k8s.io
      kind: Gateway
  traffic:
    phase: PreRouting
    transformation:
      request:
        set:
          - name: x-gateway-model-name
            value: "default(json(request.body).model, '')"
          - name: x-gateway-model-status
            value: "default(json(request.body).model, '') == '' ? 'unspecified' : 'specified'"
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: mock-gpt-4o
  namespace: ${NS}
spec:
  ai:
    provider:
      openai:
        model: "mock-gpt-4o"
      host: mock-gpt-4o-svc.${NS}.svc.cluster.local
      port: 8000
      path: "/v1/chat/completions"
  policies:
    auth:
      passthrough: {}
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: body-based-routing
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /openai
          headers:
            - type: Exact
              name: x-gateway-model-name
              value: gpt-4o-mini
      backendRefs:
        - name: openai
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "120s"
    - matches:
        - path:
            type: PathPrefix
            value: /openai
          headers:
            - type: Exact
              name: x-gateway-model-name
              value: mock-gpt-4o
      backendRefs:
        - name: mock-gpt-4o
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "120s"
    - matches:
        - path:
            type: PathPrefix
            value: /openai
          headers:
            - type: Exact
              name: x-gateway-model-status
              value: unspecified
      backendRefs:
        - name: mock-gpt-4o
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "120s"
`,

    mockOpenai: `# Workshop labs/routing/configure-mock-openai-server.md
# Public image: ghcr.io/llm-d/llm-d-inference-sim:latest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mock-gpt-4o
  namespace: ${NS}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mock-gpt-4o
  template:
    metadata:
      labels:
        app: mock-gpt-4o
    spec:
      containers:
        - name: vllm-sim
          image: ghcr.io/llm-d/llm-d-inference-sim:latest
          imagePullPolicy: IfNotPresent
          args:
            - --model
            - mock-gpt-4o
            - --port
            - "8000"
          ports:
            - containerPort: 8000
              name: http
---
apiVersion: v1
kind: Service
metadata:
  name: mock-gpt-4o-svc
  namespace: ${NS}
  labels:
    app: mock-gpt-4o
spec:
  selector:
    app: mock-gpt-4o
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
      name: http
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: mock-openai
  namespace: ${NS}
spec:
  ai:
    provider:
      openai:
        model: "mock-gpt-4o"
      host: mock-gpt-4o-svc.${NS}.svc.cluster.local
      port: 8000
      path: "/v1/chat/completions"
  policies:
    auth:
      passthrough: {}
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: mock-openai
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /openai
      backendRefs:
        - name: mock-openai
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "120s"
`,

    timeouts: `# Workshop labs/routing/timeouts-and-retries.md
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: timeout-retry-policy
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: mock-openai
  traffic:
    timeouts:
      request: 2s
    retry:
      attempts: 10
      backoff: 200ms
      codes:
        - 503
`,

    openapiMeteo: `# Workshop labs/mcp/openapi-to-mcp-external-api.md
# Path /mcp-weather so it does not steal /mcp.
apiVersion: v1
kind: ConfigMap
metadata:
  name: open-meteo-schema
  namespace: ${NS}
data:
  schema: |
${OPEN_METEO_SCHEMA.split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: open-meteo-openapi
  namespace: ${NS}
spec:
  entMcp:
    targets:
      - name: open-meteo
        static:
          host: api.open-meteo.com
          port: 443
          protocol: OpenAPI
          openAPI:
            schemaRef:
              name: open-meteo-schema
          policies:
            tls:
              sni: api.open-meteo.com
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: openapi-mcp-weather
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp-weather
      backendRefs:
        - name: open-meteo-openapi
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
`,

    remoteMcp: `# Workshop labs/mcp/remote-mcp.md
# Path /mcp-remote so it does not steal /mcp. FailOpen-friendly at Run time.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: soloio-docs-mcp-backend
  namespace: ${NS}
spec:
  mcp:
    targets:
      - name: soloio-docs-mcp-target
        static:
          host: search.solo.io
          port: 443
          protocol: StreamableHTTP
          policies:
            tls: {}
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: soloio-docs-mcp
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp-remote
      backendRefs:
        - name: soloio-docs-mcp-backend
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
`,

    mcpToolRl: `# Workshop labs/mcp/mcp-tool-rate-limiting.md
# CEL on json(request.body).params.name — hammer get-env, echo stays 200.
apiVersion: ratelimit.solo.io/v1alpha1
kind: RateLimitConfig
metadata:
  name: mcp-tool-rate-limit
  namespace: ${NS}
spec:
  raw:
    domain: "mcp-tools"
    descriptors:
      - key: tool_name
        value: "get-env"
        rateLimit:
          requestsPerUnit: 3
          unit: MINUTE
    rateLimits:
      - actions:
          - cel:
              expression: 'json(request.body).with(body, body.method == "tools/call" ? string(body.params.name) : "none")'
              key: "tool_name"
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: mcp-tool-rate-limit
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: mcp
  traffic:
    entRateLimit:
      global:
        rateLimitConfigRefs:
          - name: mcp-tool-rate-limit
`,

    federation: `# Slim tool federation (workshop mcp-tool-federation.md without 4 images).
# Reuses everything-server + website-fetcher. failureMode: FailOpen.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: mcp-federation
  namespace: ${NS}
spec:
  entMcp:
    failureMode: FailOpen
    targets:
      - name: mcp-server-everything
        static:
          host: mcp-server-everything.${NS}.svc.cluster.local
          port: 3001
          protocol: StreamableHTTP
      - name: mcp-website-fetcher
        static:
          host: mcp-website-fetcher.${NS}.svc.cluster.local
          port: 80
          protocol: SSE
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: mcp-federation
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp-fed
      backendRefs:
        - name: mcp-federation
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
`,

    composable: `# Slim composable MCP (docs.solo.io/agentgateway/latest/mcp/composable/).
# One custom target: HTTP GET to a tiny in-cluster echo Service (http-echo).
# Deploy everything-server first if you want the MCP step; this Apply is HTTP-only.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: http-echo
  namespace: ${NS}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: http-echo
  template:
    metadata:
      labels:
        app: http-echo
    spec:
      containers:
        - name: echo
          image: hashicorp/http-echo:1.0.0
          args: ["-text=pong", "-listen=:5678"]
          ports:
            - containerPort: 5678
---
apiVersion: v1
kind: Service
metadata:
  name: http-echo
  namespace: ${NS}
spec:
  selector:
    app: http-echo
  ports:
    - port: 5678
      targetPort: 5678
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: http-echo
  namespace: ${NS}
spec:
  static:
    host: http-echo.${NS}.svc.cluster.local
    port: 5678
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: composable-mcp
  namespace: ${NS}
spec:
  entMcp:
    targets:
      - name: echo-compose
        custom:
          description: "GET the in-cluster echo service and return the body."
          inputSchema:
            type: object
            additionalProperties: false
            properties: {}
          steps:
            - name: ping
              http:
                backendRef:
                  group: ${AGW_GROUP}
                  kind: EnterpriseAgentgatewayBackend
                  name: http-echo
                method: GET
                path: '"/"'
          output: |
            output.ping
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: composable-mcp
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp-compose
      backendRefs:
        - name: composable-mcp
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
`,

    searchMode: `# Workshop labs/mcp/mcp-tool-mode-search.md — reuses everything-server.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: mcp-search-backend
  namespace: ${NS}
spec:
  entMcp:
    toolMode: Search
    sessionRouting: Stateless
    targets:
      - name: mcp-target
        static:
          host: mcp-server-everything.${NS}.svc.cluster.local
          port: 3001
          protocol: StreamableHTTP
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: mcp-search
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp/search
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /
      backendRefs:
        - name: mcp-search-backend
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "0s"
`,

    codeMode: `# Workshop labs/mcp/mcp-tool-mode-code.md — reuses everything-server.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: mcp-code-backend
  namespace: ${NS}
spec:
  entMcp:
    toolMode: Code
    codeMode:
      timeout: 7s
    targets:
      - name: mcp-target
        static:
          host: mcp-server-everything.${NS}.svc.cluster.local
          port: 3001
          protocol: StreamableHTTP
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: mcp-code
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp/code
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /
      backendRefs:
        - name: mcp-code-backend
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
      timeouts:
        request: "0s"
`,

    mcpJwtRbac: `# Richer MCP JWT + tool RBAC (workshop in-cluster-mcp / remote-mcp).
# Dedicated backend + /mcp-jwt so default /mcp and Chat stay open.
# Demo JWT is the public workshop token (WORKSHOP_JWT). JWKS is public.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: mcp-jwt-backend
  namespace: ${NS}
spec:
  mcp:
    targets:
      - name: mcp-server-everything
        static:
          host: mcp-server-everything.${NS}.svc.cluster.local
          port: 3001
          protocol: StreamableHTTP
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: mcp-jwt-echo
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: mcp-jwt
  traffic:
    jwtAuthentication:
      mode: Strict
      providers:
        - issuer: solo.io
          jwks:
            inline: |
              ${WORKSHOP_JWKS.split("\n").join("\n              ")}
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: mcp-echo-rbac
  namespace: ${NS}
spec:
  targetRefs:
    - group: ${AGW_GROUP}
      kind: EnterpriseAgentgatewayBackend
      name: mcp-jwt-backend
  backend:
    mcp:
      authorization:
        action: Allow
        policy:
          matchExpressions:
            - 'mcp.tool.name == "echo" || mcp.tool.name == "mcp-server-everything-3001_echo"'
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: mcp-jwt
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mcp-jwt
      backendRefs:
        - name: mcp-jwt-backend
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
`,

    a2aTask: `# Docs: https://docs.solo.io/agentgateway/latest/agent/a2a/
# Public sample image gcr.io/solo-public/docs/test-a2a-agent:latest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: a2a-agent
  namespace: ${NS}
  labels:
    app: a2a-agent
spec:
  selector:
    matchLabels:
      app: a2a-agent
  template:
    metadata:
      labels:
        app: a2a-agent
    spec:
      containers:
        - name: a2a-agent
          image: gcr.io/solo-public/docs/test-a2a-agent:latest
          ports:
            - containerPort: 9090
---
apiVersion: v1
kind: Service
metadata:
  name: a2a-agent
  namespace: ${NS}
spec:
  selector:
    app: a2a-agent
  type: ClusterIP
  ports:
    - protocol: TCP
      port: 9090
      targetPort: 9090
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayBackend
metadata:
  name: a2a-backend
  namespace: ${NS}
spec:
  a2a:
    host: a2a-agent.${NS}.svc.cluster.local
    port: 9090
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: a2a
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
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
          group: ${AGW_GROUP}
          kind: EnterpriseAgentgatewayBackend
`,

    waf: `# Workshop labs/security/WAF.md — model allow-list + literal injection.
# Dedicated /openai-waf so default Chat without WAF still works.
apiVersion: waf.solo.io/v1alpha1
kind: WAFPolicy
metadata:
  name: ai-shape-model-waf
  namespace: ${NS}
spec:
  processingConfig:
    request:
      mode: HeadersAndBody
    response:
      mode: None
  ruleEngineSettings:
    inline: |
      SecRuleEngine On
      SecRule REQUEST_HEADERS:Content-Type "^application/json" "id:200001,phase:1,t:none,t:lowercase,pass,nolog,ctl:requestBodyProcessor=JSON"
  customDirectives:
    - inline: |
        SecRule REQUEST_HEADERS:Content-Type "!@rx ^application/json" "id:300010,phase:1,deny,status:415,msg:'AI API requires application/json'"
        SecRule ARGS:json.model "!@rx ^(gpt-4o-mini|gpt-4o|gpt-5\\.4-nano|gpt-5\\.6-terra|gpt-4\\.1)$" "id:300011,phase:2,deny,status:403,msg:'model not allowed by WAF policy'"
        SecRule ARGS "@rx (?i)(rm\\s+-rf|curl\\s+https?://|wget\\s+https?://|/etc/passwd)" "id:300101,phase:2,deny,status:403,msg:'suspicious tool/command payload in AI request'"
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: openai-waf-attach
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai-waf
  traffic:
    entWAF:
      wafPolicyRef:
        name: ai-shape-model-waf
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: openai-waf
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /openai-waf
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
`,

    directResponse: `# Workshop labs/routing/direct-response.md
# Enterprise equivalent of OSS AgentgatewayPolicy directResponse.
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: health-check
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /health
---
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: health-response
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: health-check
  traffic:
    directResponse:
      status: 200
      body: "Status: Healthy"
`,

    jwtLlm: `# Workshop labs/security/jwt-auth-with-rbac.md
# Dedicated /openai-jwt so Chat without a token still works.
apiVersion: ${AGW}
kind: EnterpriseAgentgatewayPolicy
metadata:
  name: openai-jwt-auth
  namespace: ${NS}
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: openai-jwt
  traffic:
    jwtAuthentication:
      mode: Strict
      providers:
        - issuer: solo.io
          jwks:
            inline: |
              ${WORKSHOP_JWKS.split("\n").join("\n              ")}
    authorization:
      policy:
        matchExpressions:
          - '(jwt.org == "solo.io") && (jwt.team == "team-id")'
---
apiVersion: ${GW_API}
kind: HTTPRoute
metadata:
  name: openai-jwt
  namespace: ${NS}
spec:
  parentRefs:
    - name: ${GW}
      namespace: ${NS}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /openai-jwt
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
        request: "120s"
`,
  };

  const WORKSHOP_DEMOS = [
    {
      id: "guardrails",
      tab: "llm",
      name: "Prompt Guard pass vs jailbreak",
      hint: "Workshop builtin-guardrails: pass, DAN jailbreak → 403, fake SSN/email → 422, invent an email → masked <EMAIL_ADDRESS>.",
      hops: { gateway: "promptGuard", target: "block | provider" },
      yaml: YAML.guardrails,
      run: "guardrails",
      targetKind: "security",
    },
    {
      id: "enrichment",
      tab: "llm",
      name: "Prompt enrichment",
      hint: "Prepend system “Return the response in JSON format”. Same user prompt; response should look like JSON.",
      hops: { gateway: "prompt.prepend", target: "provider" },
      yaml: YAML.enrichment,
      run: "enrichment",
      targetKind: "openai",
    },
    {
      id: "token-budget",
      tab: "llm",
      name: "Local token budget → 429",
      hint: "5 input tokens / minute on HTTPRoute openai. Burst tiny chat pings: 200 then 429.",
      hops: { gateway: "rateLimit", target: "429 | provider" },
      yaml: YAML.tokenBudget,
      run: "tokenBudget",
      targetKind: "security",
    },
    {
      id: "streaming",
      tab: "llm",
      name: "Stream ping",
      hint: "No extra CRD. Sends stream: true and renders SSE delta.content. Shows TTFT when the first token arrives.",
      hops: { gateway: "SSE", target: "provider" },
      yaml: "",
      run: "streaming",
      targetKind: "openai",
    },
    {
      id: "embeddings",
      tab: "llm",
      name: "Embeddings ping",
      hint: "POST /v1/embeddings with a short input. Shows embedding length and first dims. Reuses the chat host.",
      hops: { gateway: "embeddings", target: "provider" },
      yaml: YAML.embeddings,
      run: "embeddings",
      targetKind: "openai",
    },
    {
      id: "body-routing",
      tab: "llm",
      name: "Body-based routing",
      hint: "PreRouting sets x-gateway-model-name from json(request.body).model. Two requests, two backends.",
      hops: { gateway: "x-gateway-model-name", target: "rule match" },
      yaml: YAML.bodyRouting,
      run: "bodyRouting",
      targetKind: "openai",
    },
    {
      id: "mock-openai",
      tab: "llm",
      name: "Mock OpenAI",
      hint: "Deploy llm-d-inference-sim (public ghcr image) + /openai. Unblocks demos with no provider key.",
      hops: { gateway: "mock-openai", target: "mock-gpt-4o" },
      yaml: YAML.mockOpenai,
      run: "mockOpenai",
      targetKind: "openai",
    },
    {
      id: "timeouts",
      tab: "llm",
      name: "Timeouts / retries",
      hint: "Apply timeout + retry on mock-openai. Run probes /openai (expect 200, or 504 if the mock is down).",
      hops: { gateway: "timeout+retry", target: "200 | 504" },
      yaml: YAML.timeouts,
      run: "timeouts",
      targetKind: "openai",
    },
    {
      id: "openapi-meteo",
      tab: "mcp",
      name: "OpenAPI → MCP (Open-Meteo)",
      hint: "ConfigMap schema + entMcp OpenAPI to api.open-meteo.com. initialize → list → getWeatherForecast (London). No API key.",
      hops: { gateway: "OpenAPI→REST", target: "api.open-meteo.com" },
      yaml: YAML.openapiMeteo,
      run: "openapiMeteo",
      targetKind: "mcp",
      path: "/mcp-weather",
    },
    {
      id: "remote-mcp",
      tab: "mcp",
      name: "Remote MCP (search.solo.io)",
      hint: "Backend to search.solo.io:443 with TLS. initialize + list tools (and search if listed). FailOpen-friendly if remote is down.",
      hops: { gateway: "remote MCP", target: "search.solo.io" },
      yaml: YAML.remoteMcp,
      run: "remoteMcp",
      targetKind: "mcp",
      path: "/mcp-remote",
    },
    {
      id: "mcp-tool-rl",
      tab: "mcp",
      name: "MCP tool rate limit",
      hint: "RateLimitConfig + CEL on json(request.body).params.name. Hammer get-env until 429; echo still 200.",
      hops: { gateway: "rateLimit", target: "429 | echo" },
      yaml: YAML.mcpToolRl,
      run: "mcpToolRl",
      targetKind: "mcp",
    },
    {
      id: "federation",
      tab: "mcp",
      name: "Tool federation FailOpen",
      hint: "Slim virtual MCP: everything-server + website-fetcher, failureMode: FailOpen. List tools (prefixed names).",
      hops: { gateway: "FailOpen", target: "2 targets" },
      yaml: YAML.federation,
      run: "federation",
      targetKind: "mcp",
      path: "/mcp-fed",
    },
    {
      id: "composable",
      tab: "mcp",
      name: "Composable MCP",
      hint: "Minimal entMcp.targets[].custom HTTP echo. Apply YAML, then Run if deployed (lists tools / calls echo-compose).",
      hops: { gateway: "compose", target: "http-echo" },
      yaml: YAML.composable,
      run: "composable",
      targetKind: "mcp",
      path: "/mcp-compose",
    },
    {
      id: "search-mode",
      tab: "mcp",
      name: "Tool mode Search",
      hint: "entMcp.toolMode: Search on everything-server. tools/list is get_tool + invoke_tool; then get_tool + invoke_tool for echo.",
      hops: { gateway: "Search", target: "get_tool" },
      yaml: YAML.searchMode,
      run: "searchMode",
      targetKind: "mcp",
      path: "/mcp/search",
    },
    {
      id: "code-mode",
      tab: "mcp",
      name: "Tool mode Code",
      hint: "entMcp.toolMode: Code. tools/list is run_code; call run_code with a tiny JS snippet that awaits echo.",
      hops: { gateway: "Code", target: "run_code" },
      yaml: YAML.codeMode,
      run: "codeMode",
      targetKind: "mcp",
      path: "/mcp/code",
    },
    {
      id: "mcp-jwt-rbac",
      tab: "mcp",
      name: "MCP JWT + tool RBAC",
      hint: "Keep the existing JWT/unauth card. This Apply sets Strict JWT on /mcp-jwt and CEL mcp.tool.name==echo. Paste the workshop demo JWT or leave empty (expect 401).",
      hops: { gateway: "JWT + RBAC", target: "echo only" },
      yaml: YAML.mcpJwtRbac,
      run: "mcpJwtRbac",
      targetKind: "mcp",
      path: "/mcp-jwt",
      fields: [
        {
          id: "jwt",
          label: "Bearer token",
          type: "password",
          placeholder: "optional — workshop demo JWT (solo.io / team-id)",
        },
      ],
    },
    {
      id: "a2a-task",
      tab: "a2a",
      name: "Real A2A task",
      hint: "GET agent-card, POST tasks/send, poll tasks/get until completed or timeout. Apply uses gcr.io/solo-public/docs/test-a2a-agent.",
      hops: { gateway: "A2A task", target: "agent" },
      yaml: YAML.a2aTask,
      run: "a2aTask",
      targetKind: "a2a",
    },
    {
      id: "waf",
      tab: "api",
      name: "WAF first-pass",
      hint: "WAFPolicy model allow-list + rm -rf signature, attached via traffic.entWAF on /openai-waf. Allowed 200; disallowed model or rm -rf → 403.",
      hops: { gateway: "WAF", target: "block | upstream" },
      yaml: YAML.waf,
      run: "waf",
      targetKind: "security",
    },
    {
      id: "direct-response",
      tab: "api",
      name: "Direct response / health",
      hint: "HTTPRoute /health returns a fixed body. No backend. GET and show “Status: Healthy”.",
      hops: { gateway: "directResponse", target: "no backend" },
      yaml: YAML.directResponse,
      run: "directResponse",
      targetKind: "api",
    },
    {
      id: "jwt-llm",
      tab: "api",
      name: "JWT + RBAC on LLM",
      hint: "Strict JWT + CEL on /openai-jwt so Chat without a token still works. No JWT → 403; paste workshop demo JWT → 200.",
      hops: { gateway: "JWT", target: "403 | provider" },
      yaml: YAML.jwtLlm,
      run: "jwtLlm",
      targetKind: "security",
      fields: [
        {
          id: "jwt",
          label: "Bearer token",
          type: "password",
          placeholder: "optional — workshop demo JWT",
        },
      ],
    },
  ];

  root.WORKSHOP_DEMOS = WORKSHOP_DEMOS;
  root.WORKSHOP_YAML = YAML;
  root.WORKSHOP_JWT = WORKSHOP_JWT;
  root.WORKSHOP_JWKS = WORKSHOP_JWKS;

  if (root.DEPLOY_EXAMPLES) {
    root.DEPLOY_EXAMPLES.llm.guardrails = {
      label: "Prompt Guard (builtin suite)",
      yaml: YAML.guardrails,
    };
    root.DEPLOY_EXAMPLES.llm.enrichment = {
      label: "Prompt enrichment",
      yaml: YAML.enrichment,
    };
    root.DEPLOY_EXAMPLES.llm.tokenBudget = {
      label: "Local token budget",
      yaml: YAML.tokenBudget,
    };
    root.DEPLOY_EXAMPLES.llm.mockOpenai = {
      label: "Mock OpenAI",
      yaml: YAML.mockOpenai,
    };
    root.DEPLOY_EXAMPLES.mcp.openapiMeteo = {
      label: "OpenAPI → MCP (Open-Meteo)",
      yaml: YAML.openapiMeteo,
    };
    root.DEPLOY_EXAMPLES.mcp.remoteMcp = {
      label: "Remote MCP (search.solo.io)",
      yaml: YAML.remoteMcp,
    };
    root.DEPLOY_EXAMPLES.a2a.a2aTask = {
      label: "A2A agent + task route",
      yaml: YAML.a2aTask,
    };
    root.DEPLOY_EXAMPLES.api.policy = {
      label: "Prompt Guard (builtin suite)",
      yaml: YAML.guardrails,
    };
    root.DEPLOY_EXAMPLES.api.waf = {
      label: "WAF first-pass",
      yaml: YAML.waf,
    };
    root.DEPLOY_EXAMPLES.api.directResponse = {
      label: "Direct response / health",
      yaml: YAML.directResponse,
    };
    root.DEPLOY_EXAMPLES.api.jwtLlm = {
      label: "JWT + RBAC on LLM",
      yaml: YAML.jwtLlm,
    };
  }
})(typeof self !== "undefined" ? self : this);
