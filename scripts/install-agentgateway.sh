#!/usr/bin/env bash
# Second-step install of Solo Enterprise for Agentgateway + Solo UI.
# Requires a running cluster and kubeconfig (see terraform output get_credentials_command).
#
# Usage:
#   export AGENTGATEWAY_LICENSE_KEY
#   export OPENAI_API_KEY          # optional; creates openai-secret
#   ./scripts/install-agentgateway.sh
set -euo pipefail

NAMESPACE="${AGENTGATEWAY_NAMESPACE:-agentgateway-system}"
AGW_VERSION="${AGENTGATEWAY_CHART_VERSION:-v2026.8.0}"
UI_VERSION="${SOLO_UI_CHART_VERSION:-0.5.4}"
CLUSTER_NAME="${CLUSTER_NAME:-showcase}"
GATEWAY_API_CRDS_URL="${GATEWAY_API_CRDS_URL:-https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.1/standard-install.yaml}"

if [[ -z "${AGENTGATEWAY_LICENSE_KEY:-}" ]]; then
  echo "Set AGENTGATEWAY_LICENSE_KEY in the environment. Do not pass it on the command line." >&2
  exit 1
fi

if ! command -v helm >/dev/null || ! command -v kubectl >/dev/null; then
  echo "helm and kubectl are required on PATH." >&2
  exit 1
fi

echo "Installing Gateway API CRDs..."
kubectl apply -f "${GATEWAY_API_CRDS_URL}"

echo "Installing enterprise-agentgateway-crds ${AGW_VERSION} into ${NAMESPACE}..."
helm upgrade -i enterprise-agentgateway-crds \
  oci://us-docker.pkg.dev/solo-public/enterprise-agentgateway/charts/enterprise-agentgateway-crds \
  --create-namespace \
  --namespace "${NAMESPACE}" \
  --version "${AGW_VERSION}"

echo "Installing enterprise-agentgateway ${AGW_VERSION}..."
helm upgrade -i enterprise-agentgateway \
  oci://us-docker.pkg.dev/solo-public/enterprise-agentgateway/charts/enterprise-agentgateway \
  --namespace "${NAMESPACE}" \
  --version "${AGW_VERSION}" \
  --set-string "licensing.licenseKey=${AGENTGATEWAY_LICENSE_KEY}"

echo "Installing Solo UI (management) ${UI_VERSION}..."
helm upgrade -i management \
  oci://us-docker.pkg.dev/solo-public/solo-enterprise-helm/charts/management \
  --namespace "${NAMESPACE}" \
  --version "${UI_VERSION}" \
  --set cluster="${CLUSTER_NAME}" \
  --set products.agentgateway.enabled=true \
  --set-string "licensing.licenseKey=${AGENTGATEWAY_LICENSE_KEY}"

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  echo "Creating openai-secret in ${NAMESPACE}..."
  kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: openai-secret
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  Authorization: ${OPENAI_API_KEY}
EOF
else
  echo "OPENAI_API_KEY unset; skipped openai-secret. Create it later before applying manifests/openai-backend.yaml."
fi

echo "Waiting for control plane pods..."
kubectl get pods -n "${NAMESPACE}"

echo "Next: kubectl apply -f manifests/gateway.yaml"
echo "Then apply the OpenAI backend (see manifests/README.md)."
echo "Solo UI: kubectl port-forward service/solo-enterprise-ui -n ${NAMESPACE} 4000:80"
echo "A Chrome extension chat client comes next."
