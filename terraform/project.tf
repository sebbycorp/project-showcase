# Creating a project requires roles/resourcemanager.projectCreator on the org
# and roles/billing.user on the billing account. If you do not have those,
# create the project in the console (name "showcase", id maniak-showcase),
# attach billing, then re-run with -var=create_project=false.

resource "google_project" "showcase" {
  count = var.create_project ? 1 : 0

  name            = var.project_name
  project_id      = var.project_id
  org_id          = var.org_id
  billing_account = var.billing_account

  # Dedicated VPC is created in network.tf. Skipping the default network
  # avoids an extra unused network in orgs that still allow it.
  auto_create_network = false
  deletion_policy     = var.project_deletion_policy

  labels = local.labels
}
