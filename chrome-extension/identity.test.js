/* node chrome-extension/identity.test.js */
const assert = require("assert");
const Identity = require("./identity.js");

const TENANT = "11111111-2222-3333-4444-555555555555";
const CLIENT = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

assert.strictEqual(
  Identity.entraIssuer(TENANT, "v1"),
  `https://sts.windows.net/${TENANT}/`
);
assert.strictEqual(
  Identity.entraIssuer(TENANT),
  `https://sts.windows.net/${TENANT}/`
);
assert.strictEqual(
  Identity.entraIssuer(TENANT, "v2"),
  `https://login.microsoftonline.com/${TENANT}/v2.0`
);
assert.strictEqual(
  Identity.entraJwksPath(TENANT),
  `/${TENANT}/discovery/v2.0/keys`
);

const httpKc = Identity.parseKeycloakIssuer(
  "http://10.0.0.5:8080/realms/foo"
);
assert.ok(httpKc);
assert.strictEqual(httpKc.host, "10.0.0.5");
assert.strictEqual(httpKc.port, 8080);
assert.strictEqual(httpKc.tls, false);
assert.strictEqual(httpKc.realm, "foo");
assert.strictEqual(httpKc.issuer, "http://10.0.0.5:8080/realms/foo");
assert.ok(!httpKc.issuer.endsWith("/"));

const httpsKc = Identity.parseKeycloakIssuer("https://kc.example/realms/bar/");
assert.ok(httpsKc);
assert.strictEqual(httpsKc.host, "kc.example");
assert.strictEqual(httpsKc.port, 443);
assert.strictEqual(httpsKc.tls, true);
assert.strictEqual(httpsKc.realm, "bar");
assert.strictEqual(httpsKc.issuer, "https://kc.example/realms/bar");

assert.strictEqual(
  Identity.keycloakJwksPath("foo"),
  "realms/foo/protocol/openid-connect/certs"
);

const entra = Identity.entraYaml({
  ns: "demo-ns",
  gateway: "demo-gw",
  tenantId: TENANT,
  clientId: CLIENT,
  issuerVersion: "v1",
});
assert.match(entra, /\/openai-entra/);
assert.match(entra, /name: entra-jwks/);
assert.match(entra, /host: login.microsoftonline.com/);
assert.match(entra, new RegExp(`jwksPath: /${TENANT}/discovery/v2.0/keys`));
assert.match(entra, /issuer: https:\/\/sts\.windows\.net\//);
assert.match(entra, /audiences:/);
assert.match(entra, new RegExp(`api://${CLIENT}`));
assert.match(entra, /name: demo-gw/);
assert.match(entra, /namespace: demo-ns/);
assert.doesNotMatch(entra, /policies:\s*\n\s*tunnel/);

const entraV2 = Identity.entraYaml({
  tenantId: TENANT,
  issuerVersion: "v2",
});
assert.match(
  entraV2,
  new RegExp(
    `issuer: https://login.microsoftonline.com/${TENANT}/v2.0`
  )
);
assert.doesNotMatch(entraV2, /audiences:/);

assert.throws(() => Identity.entraYaml({}), /Tenant ID is required/);

const kc = Identity.keycloakYaml({
  ns: "demo-ns",
  gateway: "demo-gw",
  issuer: "http://10.0.0.5:8080/realms/foo",
  audience: "mcp-client",
});
assert.match(kc, /\/openai-keycloak/);
assert.match(kc, /name: keycloak-jwks/);
assert.match(kc, /host: 10.0.0.5/);
assert.match(kc, /port: 8080/);
assert.match(kc, /jwksPath: realms\/foo\/protocol\/openid-connect\/certs/);
assert.doesNotMatch(kc, /jwksPath: \/realms\//);
assert.match(kc, /issuer: http:\/\/10.0.0.5:8080\/realms\/foo/);
assert.doesNotMatch(kc, /policies:\s*\n\s*tls:/);
assert.match(kc, /audiences:/);
assert.match(kc, /- mcp-client/);

const kcHttps = Identity.keycloakYaml({
  issuer: "https://kc.example/realms/bar/",
  realm: "",
});
assert.match(kcHttps, /port: 443/);
assert.match(kcHttps, /policies:\s*\n\s*tls: \{\}/);
assert.match(kcHttps, /issuer: https:\/\/kc.example\/realms\/bar\n/);
assert.doesNotMatch(kcHttps, /audiences:/);

assert.throws(() => Identity.keycloakYaml({}), /Issuer URL is required/);
assert.throws(
  () => Identity.keycloakYaml({ issuer: "http://10.0.0.5:8080/" }),
  /Realm is required/
);

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
const token = `eyJhbGciOiJub25lIn0.${b64url({
  iss: "https://sts.windows.net/tid/",
  aud: "api://client",
  tid: "tid-1",
  azp: "azp-1",
})}.sig`;
const claims = Identity.decodeJwtClaims(token);
assert.ok(claims);
assert.strictEqual(claims.iss, "https://sts.windows.net/tid/");
assert.strictEqual(claims.aud, "api://client");
assert.strictEqual(claims.tid, "tid-1");
assert.strictEqual(claims.azp, "azp-1");
assert.strictEqual(Identity.decodeJwtClaims(""), null);
assert.strictEqual(Identity.decodeJwtClaims("not-a-jwt"), null);

console.log("identity.test.js ok");
