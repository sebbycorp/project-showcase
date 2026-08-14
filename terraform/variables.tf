variable "project_id" {
  description = "Globally unique GCP project ID. Plain 'showcase' is likely taken."
  type        = string
  default     = "maniak-showcase"
}

variable "project_name" {
  description = "Human-readable GCP project name."
  type        = string
  default     = "showcase"
}

variable "org_id" {
  description = "Numeric organization ID (maniak.io)."
  type        = string
  default     = "629527910221"
}

variable "billing_account" {
  description = "Billing account ID to attach to the project."
  type        = string
  default     = "011C38-867461-BE95B1"
}

variable "create_project" {
  description = "Create the GCP project and attach org + billing. Set false if you lack org/billing permissions and the project already exists."
  type        = bool
  default     = true
}

variable "region" {
  description = "Region for the GKE Autopilot cluster and subnet."
  type        = string
  default     = "us-central1"
}

variable "cluster_name" {
  description = "GKE Autopilot cluster name."
  type        = string
  default     = "showcase"
}

variable "release_channel" {
  description = "GKE release channel. REGULAR stays current enough for Solo Enterprise without running RAPID."
  type        = string
  default     = "REGULAR"

  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE"], var.release_channel)
    error_message = "release_channel must be RAPID, REGULAR, or STABLE."
  }
}

variable "deletion_protection" {
  description = "Prevent Terraform from destroying the GKE cluster. Leave false for a disposable test cluster."
  type        = bool
  default     = false
}

variable "project_deletion_policy" {
  description = "What Terraform does if the google_project resource is destroyed. PREVENT avoids accidental project deletion."
  type        = string
  default     = "PREVENT"

  validation {
    condition     = contains(["PREVENT", "DELETE", "ABANDON"], var.project_deletion_policy)
    error_message = "project_deletion_policy must be PREVENT, DELETE, or ABANDON."
  }
}

variable "network_name" {
  description = "VPC name for the Autopilot cluster."
  type        = string
  default     = "showcase-vpc"
}

variable "subnet_name" {
  description = "Subnet name in var.region."
  type        = string
  default     = "showcase-gke"
}

variable "subnet_cidr" {
  description = "Primary IPv4 range for GKE nodes."
  type        = string
  default     = "10.20.0.0/20"
}

variable "pods_cidr" {
  description = "Secondary range for Autopilot pods."
  type        = string
  default     = "10.24.0.0/14"
}

variable "services_cidr" {
  description = "Secondary range for Kubernetes services."
  type        = string
  default     = "10.28.0.0/20"
}

variable "enable_apis" {
  description = "APIs required to create and operate the Autopilot cluster."
  type        = list(string)
  default = [
    "container.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "serviceusage.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ]
}

variable "agentgateway_namespace" {
  description = "Namespace for Solo Enterprise for Agentgateway and the Solo UI."
  type        = string
  default     = "agentgateway-system"
}

variable "agentgateway_chart_version" {
  description = "Solo Enterprise for Agentgateway Helm chart version (CRDs + control plane)."
  type        = string
  default     = "v2026.8.0"
}

variable "solo_ui_chart_version" {
  description = "Solo management / UI Helm chart version."
  type        = string
  default     = "0.5.5"
}

variable "gateway_api_crds_url" {
  description = "Kubernetes Gateway API CRDs install manifest. Required before Agentgateway."
  type        = string
  default     = "https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.1/standard-install.yaml"
}

variable "agentgateway_license_key" {
  description = "Solo Enterprise for Agentgateway license. Leave empty to skip Helm. Pass at apply time via TF_VAR_agentgateway_license_key — never commit a real key."
  type        = string
  default     = ""
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key stored as Secret openai-secret (key Authorization). Leave empty to skip. Pass via TF_VAR_openai_api_key — never commit a real key."
  type        = string
  default     = ""
  sensitive   = true
}

variable "install_solo_ui" {
  description = "When Helm is enabled (license set), also install the Solo management UI chart."
  type        = bool
  default     = true
}
