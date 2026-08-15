# Gateway API CRDs (standard-install v1.6.1) must exist before Agentgateway.
# GKE Autopilot already installs them (kube-addon-manager). Only apply when
# var.manage_gateway_api_crds is true (clusters that do not already have Gateway API).
# Fetched from the same pinned URL as ../scripts/install-agentgateway.sh.

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
  for_each = local.install_agentgateway_gate && var.manage_gateway_api_crds ? data.kubectl_file_documents.gateway_api_crds.manifests : {}

  yaml_body         = each.value
  server_side_apply = true
  wait              = true

  depends_on = [google_container_cluster.autopilot]
}

# CRDs are registered before the API server serves them; Helm needs a short gap.
resource "time_sleep" "gateway_api_crds" {
  count = local.install_agentgateway_gate && var.manage_gateway_api_crds ? 1 : 0

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

# Helm does not create this policy. Same shape as the live GKE showcase /
# official Solo UI tracing setup (OTLP gRPC to solo-enterprise-telemetry-collector:4317).
data "kubectl_file_documents" "tracing" {
  content = file("${path.module}/../manifests/tracing.yaml")
}

resource "kubectl_manifest" "tracing" {
  for_each = local.install_agentgateway_gate && var.install_solo_ui ? data.kubectl_file_documents.tracing.manifests : {}

  yaml_body         = each.value
  server_side_apply = true
  wait              = true

  depends_on = [
    helm_release.solo_ui,
    kubectl_manifest.gateway,
    helm_release.enterprise_agentgateway,
  ]
}
