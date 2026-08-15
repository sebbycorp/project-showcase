resource "google_project_service" "required" {
  for_each = toset(var.enable_apis)

  project = local.project_id
  service = each.value

  disable_on_destroy = false
}

# API enablement is eventually consistent. GKE create often fails if we
# proceed immediately after container.googleapis.com reports enabled.
resource "time_sleep" "apis" {
  create_duration = "45s"

  depends_on = [google_project_service.required]

  triggers = {
    apis = join(",", sort(var.enable_apis))
  }
}
