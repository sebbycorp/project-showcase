# Helm + LLM path stay disabled until agentgateway_license_key is set.
# After the cluster exists, one apply with the license (and OpenAI key) creates
# charts, openai-secret, Gateway, backend, HTTPRoute, and the tracing policy.
# Autopilot already has Gateway API CRDs; set manage_gateway_api_crds only if
# the cluster does not.
#
#   export TF_VAR_agentgateway_license_key
#   export TF_VAR_openai_api_key
#   terraform apply
#
# ../scripts/install-agentgateway.sh is an optional non-Terraform fallback.

resource "helm_release" "enterprise_agentgateway_crds" {
  count = local.install_agentgateway ? 1 : 0

  name             = "enterprise-agentgateway-crds"
  namespace        = var.agentgateway_namespace
  create_namespace = true
  chart            = "oci://us-docker.pkg.dev/solo-public/enterprise-agentgateway/charts/enterprise-agentgateway-crds"
  version          = var.agentgateway_chart_version
  wait             = true
  timeout          = 600

  depends_on = [
    google_container_cluster.autopilot,
    time_sleep.gateway_api_crds,
  ]
}

resource "helm_release" "enterprise_agentgateway" {
  count = local.install_agentgateway ? 1 : 0

  name      = "enterprise-agentgateway"
  namespace = var.agentgateway_namespace
  chart     = "oci://us-docker.pkg.dev/solo-public/enterprise-agentgateway/charts/enterprise-agentgateway"
  version   = var.agentgateway_chart_version
  wait      = true
  timeout   = 600

  set_sensitive {
    name  = "licensing.licenseKey"
    value = var.agentgateway_license_key
  }

  depends_on = [helm_release.enterprise_agentgateway_crds]
}

resource "helm_release" "solo_ui" {
  count = local.install_agentgateway && var.install_solo_ui ? 1 : 0

  name      = "management"
  namespace = var.agentgateway_namespace
  chart     = "oci://us-docker.pkg.dev/solo-public/solo-enterprise-helm/charts/management"
  version   = var.solo_ui_chart_version
  wait      = true
  timeout   = 600

  set {
    name  = "cluster"
    value = var.cluster_name
  }

  set {
    name  = "products.agentgateway.enabled"
    value = "true"
  }

  set_sensitive {
    name  = "licensing.licenseKey"
    value = var.agentgateway_license_key
  }

  # ClickHouse PVC + Autopilot ephemeral-storage. cpu/memory stay at chart
  # defaults; this file only overrides persistence and ephemeral-storage.
  values = [file("${path.module}/../helm/management-values.yaml")]

  depends_on = [helm_release.enterprise_agentgateway]
}

resource "kubernetes_secret_v1" "openai" {
  count = local.create_openai_secret ? 1 : 0

  metadata {
    name      = "openai-secret"
    namespace = var.agentgateway_namespace
  }

  data = {
    Authorization = var.openai_api_key
  }

  depends_on = [helm_release.enterprise_agentgateway_crds]
}
