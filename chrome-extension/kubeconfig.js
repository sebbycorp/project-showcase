// Parse kubeconfig YAML (via yaml.js) into contexts with server + token.
// Chrome cannot run exec plugins or client-certificate auth.
(function (root, factory) {
  const parseYamlDocuments =
    typeof root.parseYamlDocuments === "function"
      ? root.parseYamlDocuments
      : typeof module === "object" && module.exports
        ? require("./yaml.js").parseYamlDocuments
        : undefined;
  const api = factory(parseYamlDocuments);
  // Always set the browser global. Chrome popups can have `module`.
  root.Kubeconfig = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof self !== "undefined" ? self : this, function (parseYamlDocuments) {
  const OMNI_TOKEN_REQUIRED =
    "Need a token kubeconfig (omnictl kubeconfig --service-account). Chrome cannot run omnictl.";

  function asList(value) {
    return Array.isArray(value) ? value : [];
  }

  function tokenFromUser(user) {
    if (!user || typeof user !== "object") {
      return "";
    }
    if (typeof user.token === "string" && user.token.trim()) {
      return user.token.trim();
    }
    const provider = user["auth-provider"];
    const config = provider && provider.config;
    if (!config || typeof config !== "object") {
      return "";
    }
    const candidates = [config["id-token"], config["access-token"], config.token];
    for (const value of candidates) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return "";
  }

  function findNamed(list, name) {
    return list.find((item) => item && item.name === name) || null;
  }

  function resolveContext(config, contextName) {
    const contexts = asList(config.contexts);
    const clusters = asList(config.clusters);
    const users = asList(config.users);
    const ctxEntry = findNamed(contexts, contextName);
    if (!ctxEntry || !ctxEntry.context) {
      throw new Error(`Context ${contextName} was not found.`);
    }

    const clusterName = ctxEntry.context.cluster;
    const userName = ctxEntry.context.user;
    const namespace = ctxEntry.context.namespace;
    const clusterEntry = findNamed(clusters, clusterName);
    const userEntry = findNamed(users, userName);
    const server =
      clusterEntry && clusterEntry.cluster && clusterEntry.cluster.server;
    const user = (userEntry && userEntry.user) || {};
    const token = tokenFromUser(user);
    const execCommand =
      user.exec && typeof user.exec.command === "string" ? user.exec.command : "";
    const authProvider =
      user["auth-provider"] && typeof user["auth-provider"].name === "string"
        ? user["auth-provider"].name
        : "";

    return {
      context: contextName,
      cluster: clusterName ? String(clusterName) : "",
      user: userName ? String(userName) : "",
      server: server ? String(server).trim() : "",
      token,
      namespace: namespace ? String(namespace).trim() : "",
      execCommand,
      execOnly: Boolean(user.exec && !token),
      hasClientCert: Boolean(
        user["client-certificate"] || user["client-certificate-data"]
      ),
      authProvider,
    };
  }

  function parse(text) {
    const docs = parseYamlDocuments(text);
    const config = docs.find(
      (doc) => doc && (doc["current-context"] || doc.clusters || doc.contexts)
    );
    if (!config) {
      throw new Error("No kubeconfig document found.");
    }

    const currentContext =
      typeof config["current-context"] === "string"
        ? config["current-context"]
        : "";
    const named = asList(config.contexts)
      .map((item) => (item && item.name ? String(item.name) : ""))
      .filter(Boolean);
    const names = named.length
      ? named
      : currentContext
        ? [currentContext]
        : [];
    if (names.length === 0) {
      throw new Error("Kubeconfig has no contexts.");
    }

    return {
      currentContext,
      contexts: names.map((name) => resolveContext(config, name)),
    };
  }

  function pickContext(parsed, preferred) {
    const names = (parsed.contexts || []).map((item) => item.context);
    if (preferred && names.includes(preferred)) {
      return preferred;
    }
    if (parsed.currentContext && names.includes(parsed.currentContext)) {
      return parsed.currentContext;
    }
    if (names.length === 1) {
      return names[0];
    }
    return "";
  }

  function contextEntry(parsed, name) {
    return (parsed.contexts || []).find((item) => item.context === name) || null;
  }

  function authError(entry, source) {
    if (!entry) {
      return "Select a kubeconfig context.";
    }
    if (entry.token) {
      return "";
    }
    if (source === "omni") {
      return OMNI_TOKEN_REQUIRED;
    }
    if (entry.execOnly) {
      return `This user is exec-only (${entry.execCommand || "exec plugin"}). Chrome cannot run gke-gcloud-auth-plugin, kubelogin, or aws eks get-token. Paste a bearer token from the matching command.`;
    }
    if (entry.hasClientCert) {
      return "No bearer token in this kubeconfig. Client-certificate auth is not supported here; paste a token.";
    }
    return "No user.token found. Paste a bearer token.";
  }

  return {
    OMNI_TOKEN_REQUIRED,
    parse,
    resolveContext,
    pickContext,
    contextEntry,
    tokenFromUser,
    authError,
  };
});
