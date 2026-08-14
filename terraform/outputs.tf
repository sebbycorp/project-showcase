output "project_id" {
  description = "GCP project ID that owns the cluster."
  value       = local.project_id
}

output "region" {
  description = "Cluster region."
  value       = google_container_cluster.autopilot.location
}

output "cluster_name" {
  description = "GKE Autopilot cluster name."
  value       = google_container_cluster.autopilot.name
}

output "kube_context" {
  description = "kubectl context name created by gcloud get-credentials."
  value       = local.kube_context
}

output "get_credentials_command" {
  description = "Command to write kubeconfig for this cluster."
  value       = local.get_credentials_command
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint."
  value       = google_container_cluster.autopilot.endpoint
  sensitive   = true
}

output "agentgateway_namespace" {
  description = "Namespace reserved for Solo Enterprise for Agentgateway and the Solo UI."
  value       = var.agentgateway_namespace
}

output "agentgateway_helm_enabled" {
  description = "True when helm_release resources ran because agentgateway_license_key was set."
  value       = nonsensitive(local.install_agentgateway)
}

output "next_steps" {
  description = "What to do after apply."
  value       = <<-EOT
    1. ${local.get_credentials_command}
    2. kubectl config current-context   # expect ${local.kube_context}
    3. If this apply had no license/OpenAI key, rebuild the live stack with:
         export TF_VAR_agentgateway_license_key
         export TF_VAR_openai_api_key
         terraform apply
    4. Solo UI: kubectl port-forward service/solo-enterprise-ui -n ${var.agentgateway_namespace} 4000:80
  EOT
}
