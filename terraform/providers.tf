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
