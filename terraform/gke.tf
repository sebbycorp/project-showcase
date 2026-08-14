# Small regional Autopilot cluster: no node pools to size, pay for running
# pods only. Public control plane keeps this cheaper than a private cluster
# (no Cloud NAT). Suitable for testing an LLM gateway, not production HA.

resource "google_container_cluster" "autopilot" {
  project  = local.project_id
  name     = var.cluster_name
  location = var.region

  enable_autopilot    = true
  deletion_protection = var.deletion_protection
  network             = google_compute_network.vpc.id
  subnetwork          = google_compute_subnetwork.gke.id

  release_channel {
    channel = var.release_channel
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Breaks out GKE spend in Cloud Billing reports.
  cost_management_config {
    enabled = true
  }

  resource_labels = local.labels

  depends_on = [time_sleep.apis]
}
