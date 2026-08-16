// Step state for Settings → Connect. Pure: no DOM, no storage. popup.js feeds
// it the current field values and renders whatever comes back.
(function (root, factory) {
  const api = factory();
  // Always set the browser global. Chrome popups can have `module`.
  root.ConnectSteps = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  const METHODS = [
    {
      id: "proxy",
      label: "kubectl proxy",
      blurb: "any cluster",
      detail:
        "kubectl runs your kubeconfig auth locally, so exec plugins, client certs, and OIDC all work.",
    },
    {
      id: "manual",
      label: "API + token",
      blurb: "public API",
      detail:
        "Point straight at the API server with a bearer token. Chrome cannot run exec plugins.",
    },
    {
      id: "omni",
      label: "Omni",
      blurb: "token config",
      detail:
        "Paste a service-account kubeconfig from omnictl. OIDC kubeconfigs use exec and will not work.",
    },
  ];

  const DEFAULT_PROXY_PORT = 8001;

  function methods() {
    return METHODS.map((m) => Object.assign({}, m));
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeSource(source) {
    return METHODS.some((m) => m.id === source) ? source : "manual";
  }

  function proxyCommand(input) {
    const port = Number.parseInt(input.proxyPort, 10);
    const safe =
      Number.isInteger(port) && port > 0 && port < 65536
        ? port
        : DEFAULT_PROXY_PORT;
    const context = text(input.proxyContext);
    const flags = [`--port=${safe}`];
    if (context) {
      flags.push(`--context=${context}`);
    }
    return `kubectl proxy ${flags.join(" ")}`;
  }

  // Each entry is {key, label, hint, satisfied} plus anything extra the UI
  // needs. `satisfied` describes setup only - the test step is driven by the
  // live connection, not by field contents.
  function stepsFor(source, input) {
    if (source === "proxy") {
      return [
        {
          key: "context",
          label: "Pick a context",
          hint: "Blank uses your current-context.",
          satisfied: true,
        },
        {
          key: "run",
          label: "Run it in a terminal",
          hint: "Leave the terminal open while you demo.",
          command: proxyCommand(input),
          satisfied: Boolean(input.connected),
        },
      ];
    }
    if (source === "omni") {
      return [
        {
          key: "url",
          label: "Confirm the Omni URL",
          hint: "The base URL of your Omni instance.",
          satisfied: Boolean(text(input.omniUrl)),
        },
        {
          key: "kubeconfig",
          label: "Paste a token kubeconfig",
          hint: "omnictl kubeconfig --service-account",
          satisfied: Boolean(input.hasKubeconfigToken),
        },
      ];
    }
    return [
      {
        key: "type",
        label: "Cluster type",
        hint: "Sets the hint for where to find the server and token.",
        satisfied: true,
      },
      {
        key: "creds",
        label: "API server and token",
        hint: "A real bearer token, not an exec kubeconfig.",
        satisfied: Boolean(text(input.apiServer) && text(input.token)),
      },
    ];
  }

  function build(input) {
    const source = normalizeSource(input && input.source);
    const safe = input || {};
    const connected = Boolean(safe.connected);
    const error = text(safe.error);

    const setup = stepsFor(source, safe);
    setup.push({
      key: "test",
      label: "Test connection",
      hint: "Checks GET /version on the API server.",
      satisfied: connected,
    });

    // The first unsatisfied step is where the user is; everything after it is
    // still pending. Once connected, every step reads as done.
    let seenPending = false;
    const steps = setup.map((step, index) => {
      let state;
      if (connected || step.satisfied) {
        state = "done";
      } else if (seenPending) {
        state = "pending";
      } else {
        seenPending = true;
        state = "current";
      }
      // A failed probe belongs to the test step - the setup above it is fine.
      if (!connected && error && step.key === "test") {
        state = "error";
      }
      return Object.assign({}, step, {
        n: index + 1,
        state,
        detail: step.key === "test" && !connected && error ? error : "",
      });
    });

    return {
      source,
      method: METHODS.find((m) => m.id === source),
      steps,
      connected,
    };
  }

  return { methods, build, proxyCommand, DEFAULT_PROXY_PORT };
});
