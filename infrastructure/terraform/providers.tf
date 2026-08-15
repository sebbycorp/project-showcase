provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = local.kube_host
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = local.kube_ca_cert
}

provider "helm" {
  kubernetes {
    host                   = local.kube_host
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = local.kube_ca_cert
  }
}

# Applies Gateway API CRDs and Agentgateway CRs in the same apply as Helm.
# kubernetes_manifest cannot plan those CRs until the APIs already exist.
provider "kubectl" {
  host                   = local.kube_host
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = local.kube_ca_cert
  load_config_file       = false
}
