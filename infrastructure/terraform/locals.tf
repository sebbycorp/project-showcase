locals {
  project_id = var.create_project ? google_project.showcase[0].project_id : var.project_id

  install_agentgateway = trimspace(var.agentgateway_license_key) != ""
  create_openai_secret = local.install_agentgateway && trimspace(var.openai_api_key) != ""

  # for_each cannot take a sensitive condition (license / API key).
  install_agentgateway_gate = nonsensitive(local.install_agentgateway)
  create_openai_secret_gate = nonsensitive(local.create_openai_secret)

  kube_host    = "https://${google_container_cluster.autopilot.endpoint}"
  kube_ca_cert = base64decode(google_container_cluster.autopilot.master_auth[0].cluster_ca_certificate)

  get_credentials_command = "gcloud container clusters get-credentials ${google_container_cluster.autopilot.name} --region ${google_container_cluster.autopilot.location} --project ${local.project_id}"
  kube_context            = "gke_${local.project_id}_${google_container_cluster.autopilot.location}_${google_container_cluster.autopilot.name}"

  labels = {
    purpose = "llm-gateway-showcase"
    managed = "terraform"
  }
}
