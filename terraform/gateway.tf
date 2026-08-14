# Gateway API CRDs (standard-install v1.6.1) must exist before Agentgateway.
# Fetched from the same pinned URL as scripts/install-agentgateway.sh.

data "http" "gateway_api_crds" {
  url = var.gateway_api_crds_url

  retry {
    attempts     = 3
    min_delay_ms = 1000
  }

  lifecycle {
    postcondition {
      condition     = contains([200], self.status_code)
      error_message = "Failed to download Gateway API CRDs from ${var.gateway_api_crds_url} (HTTP ${self.status_code})."
    }
  }
}

data "kubectl_file_documents" "gateway_api_crds" {
  content = data.http.gateway_api_crds.response_body
}

resource "kubectl_manifest" "gateway_api_crds" {
  for_each = local.install_agentgateway_gate ? data.kubectl_file_documents.gateway_api_crds.manifests : {}

  yaml_body         = each.value
  server_side_apply = true
  wait              = true

  depends_on = [google_container_cluster.autopilot]
}

# CRDs are registered before the API server serves them; Helm needs a short gap.
resource "time_sleep" "gateway_api_crds" {
  count = local.install_agentgateway_gate ? 1 : 0

  create_duration = "20s"

  depends_on = [kubectl_manifest.gateway_api_crds]

  triggers = {
    crds_url = var.gateway_api_crds_url
    crds_sha = sha256(data.http.gateway_api_crds.response_body)
  }
}

data "kubectl_file_documents" "gateway" {
  content = file("${path.module}/../manifests/gateway.yaml")
}

resource "kubectl_manifest" "gateway" {
  for_each = local.install_agentgateway_gate ? data.kubectl_file_documents.gateway.manifests : {}

  yaml_body         = each.value
  server_side_apply = true
  wait              = true

  depends_on = [helm_release.enterprise_agentgateway]
}

data "kubectl_file_documents" "openai_backend" {
  content = file("${path.module}/../manifests/openai-backend.yaml")
}

resource "kubectl_manifest" "openai_backend" {
  for_each = local.create_openai_secret_gate ? data.kubectl_file_documents.openai_backend.manifests : {}

  yaml_body         = each.value
  server_side_apply = true
  wait              = true

  depends_on = [
    kubernetes_secret_v1.openai,
    kubectl_manifest.gateway,
    helm_release.enterprise_agentgateway,
  ]
}
