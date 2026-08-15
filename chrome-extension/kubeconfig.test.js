/* node chrome-extension/kubeconfig.test.js */
const assert = require("assert");
const Kubeconfig = require("./kubeconfig.js");

const TOKEN_KUBECONFIG = `apiVersion: v1
kind: Config
clusters:
  - cluster:
      server: https://maniak.na-west-1.omni.siderolabs.io:8100
    name: demo
contexts:
  - context:
      cluster: demo
      user: demo-sa
      namespace: agentgateway-system
    name: demo
current-context: demo
users:
  - name: demo-sa
    user:
      token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.e30.sig
`;

const MULTI_CONTEXT = `apiVersion: v1
kind: Config
clusters:
  - cluster:
      server: https://proxy.example/a
    name: cluster-a
  - cluster:
      server: https://proxy.example/b
    name: cluster-b
contexts:
  - context:
      cluster: cluster-a
      user: user-a
    name: ctx-a
  - context:
      cluster: cluster-b
      user: user-b
      namespace: other
    name: ctx-b
current-context: ctx-a
users:
  - name: user-a
    user:
      token: token-a
  - name: user-b
    user:
      token: token-b
`;

const EXEC_KUBECONFIG = `apiVersion: v1
kind: Config
clusters:
  - cluster:
      server: https://maniak.na-west-1.omni.siderolabs.io:8100
    name: demo
contexts:
  - context:
      cluster: demo
      user: demo-user
    name: demo
current-context: demo
users:
  - name: demo-user
    user:
      exec:
        apiVersion: client.authentication.k8s.io/v1beta1
        command: kubectl
        args:
          - oidc-login
          - get-token
`;

const CERT_KUBECONFIG = `apiVersion: v1
kind: Config
clusters:
  - cluster:
      server: https://127.0.0.1:6443
    name: local
contexts:
  - context:
      cluster: local
      user: admin
    name: local
current-context: local
users:
  - name: admin
    user:
      client-certificate-data: Y2VydA==
      client-key-data: a2V5
`;

const AUTH_PROVIDER = `apiVersion: v1
kind: Config
clusters:
  - cluster:
      server: https://k8s.example
    name: cloud
contexts:
  - context:
      cluster: cloud
      user: oidc
    name: cloud
current-context: cloud
users:
  - name: oidc
    user:
      auth-provider:
        name: oidc
        config:
          id-token: id-token-value
          access-token: access-token-value
`;

const NO_CURRENT = `apiVersion: v1
kind: Config
clusters:
  - cluster:
      server: https://only.example
    name: only
contexts:
  - context:
      cluster: only
      user: only
    name: only
users:
  - name: only
    user:
      token: only-token
`;

const tokenParsed = Kubeconfig.parse(TOKEN_KUBECONFIG);
assert.strictEqual(tokenParsed.currentContext, "demo");
assert.strictEqual(tokenParsed.contexts.length, 1);
assert.strictEqual(tokenParsed.contexts[0].server, "https://maniak.na-west-1.omni.siderolabs.io:8100");
assert.strictEqual(tokenParsed.contexts[0].token, "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.e30.sig");
assert.strictEqual(tokenParsed.contexts[0].namespace, "agentgateway-system");
assert.strictEqual(tokenParsed.contexts[0].cluster, "demo");
assert.strictEqual(Kubeconfig.authError(tokenParsed.contexts[0], "omni"), "");

const multi = Kubeconfig.parse(MULTI_CONTEXT);
assert.strictEqual(multi.contexts.length, 2);
assert.strictEqual(Kubeconfig.pickContext(multi, ""), "ctx-a");
assert.strictEqual(Kubeconfig.pickContext(multi, "ctx-b"), "ctx-b");
const ctxB = Kubeconfig.contextEntry(multi, "ctx-b");
assert.strictEqual(ctxB.server, "https://proxy.example/b");
assert.strictEqual(ctxB.token, "token-b");
assert.strictEqual(ctxB.namespace, "other");

const execParsed = Kubeconfig.parse(EXEC_KUBECONFIG);
assert.strictEqual(execParsed.contexts[0].execOnly, true);
assert.strictEqual(execParsed.contexts[0].token, "");
assert.strictEqual(execParsed.contexts[0].execCommand, "kubectl");
assert.strictEqual(
  Kubeconfig.authError(execParsed.contexts[0], "omni"),
  Kubeconfig.OMNI_TOKEN_REQUIRED
);
assert.match(
  Kubeconfig.authError(execParsed.contexts[0], "manual"),
  /exec-only/
);

const certParsed = Kubeconfig.parse(CERT_KUBECONFIG);
assert.strictEqual(certParsed.contexts[0].hasClientCert, true);
assert.strictEqual(
  Kubeconfig.authError(certParsed.contexts[0], "omni"),
  Kubeconfig.OMNI_TOKEN_REQUIRED
);
assert.match(
  Kubeconfig.authError(certParsed.contexts[0], "manual"),
  /Client-certificate/
);

const oidcParsed = Kubeconfig.parse(AUTH_PROVIDER);
assert.strictEqual(oidcParsed.contexts[0].token, "id-token-value");
assert.strictEqual(oidcParsed.contexts[0].authProvider, "oidc");
assert.strictEqual(Kubeconfig.authError(oidcParsed.contexts[0], "omni"), "");

const only = Kubeconfig.parse(NO_CURRENT);
assert.strictEqual(only.currentContext, "");
assert.strictEqual(Kubeconfig.pickContext(only, ""), "only");
assert.strictEqual(only.contexts[0].token, "only-token");

const compact = Kubeconfig.parse(`apiVersion: v1
clusters:
- cluster:
    server: https://kube.omni.example
  name: prod
contexts:
- context:
    cluster: prod
    user: sa
  name: prod
current-context: prod
kind: Config
users:
- name: sa
  user:
    token: compact-token
`);
assert.strictEqual(compact.contexts[0].server, "https://kube.omni.example");
assert.strictEqual(compact.contexts[0].token, "compact-token");

assert.throws(() => Kubeconfig.parse(""), /No kubeconfig document found/);
assert.throws(
  () => Kubeconfig.parse("kind: Pod\nmetadata:\n  name: x\n"),
  /No kubeconfig document found/
);

console.log("kubeconfig.test.js: ok");
