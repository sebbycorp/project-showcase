# project-showcase

Terraform rebuilds the live [maniak-showcase](https://console.cloud.google.com/) stack: GKE Autopilot `showcase` in `us-central1`, Solo Enterprise for Agentgateway, Solo UI, ClickHouse on a PVC, and the OpenAI LLM path.

A fresh `terraform apply` with the license and OpenAI key produces that stack. Do not commit those keys.

## Layout

| Path | Purpose |
| --- | --- |
| `terraform/` | Project (optional), APIs, VPC, Autopilot cluster, Gateway API CRDs, Helm, secret, Gateway, OpenAI route |
| `helm/management-values.yaml` | Shared ClickHouse persistence values (Terraform + fallback script) |
| `manifests/` | Gateway + OpenAI backend/HTTPRoute (no secrets); applied by Terraform |
| `scripts/install-agentgateway.sh` | Optional non-Terraform fallback for the in-cluster stack |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.6
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- Auth as a user that can create a project in org `629527910221` (or use an existing project — see below)
- Billing user on account `011C38-867461-BE95B1`

```bash
gcloud auth login
gcloud auth application-default login
```

## Rebuild the live environment

License and OpenAI keys are **apply-time environment variables only**. Never put them in `terraform.tfvars`, examples, or git.

```bash
export TF_VAR_agentgateway_license_key   # Solo Enterprise license
export TF_VAR_openai_api_key             # stored as Secret openai-secret, key Authorization

cd terraform
cp terraform.tfvars.example terraform.tfvars   # optional; defaults already match maniak-showcase
terraform init
terraform apply
```

That apply creates:

- GCP project `maniak-showcase` (unless `create_project=false`) and Autopilot cluster `showcase`
- Gateway API CRDs (`standard-install` v1.6.1)
- Helm: `enterprise-agentgateway-crds` + `enterprise-agentgateway` **v2026.8.0**
- Helm: management / Solo UI **0.5.5** with ClickHouse PVC (`20Gi`, `standard-rwo`) and `ephemeral-storage` 2Gi
- Secret `openai-secret`, Gateway `agentgateway-proxy`, `EnterpriseAgentgatewayBackend`/`HTTPRoute` `openai`

Namespace is `agentgateway-system`.

If the Kubernetes/Helm providers error because the cluster endpoint is not known yet (first create), apply the cluster first, then the rest with the same `TF_VAR_*` values:

```bash
terraform apply -target=google_container_cluster.autopilot
terraform apply
```

### Apply-time env vars

| Variable | Required for | Notes |
| --- | --- | --- |
| `TF_VAR_agentgateway_license_key` | Helm + Gateway + LLM path | Empty skips all in-cluster Solo resources |
| `TF_VAR_openai_api_key` | `openai-secret` + OpenAI backend/HTTPRoute | Empty skips the LLM path only |

### If you cannot create the project

Org-level `resourcemanager.projectCreator` and billing `billing.user` are required for `create_project=true`. Create the project in the console (name **showcase**, id **maniak-showcase**), attach the billing account, then:

```bash
terraform apply -var=create_project=false
```

## Kubeconfig

```bash
terraform output get_credentials_command
# gcloud container clusters get-credentials showcase --region us-central1 --project maniak-showcase
```

```bash
kubectl config current-context
# gke_maniak-showcase_us-central1_showcase
```

Solo UI:

```bash
kubectl port-forward service/solo-enterprise-ui -n agentgateway-system 4000:80
```

Docs: [install](https://docs.solo.io/agentgateway/latest/quickstart/install/), [Helm](https://docs.solo.io/agentgateway/latest/install/helm/), [UI](https://docs.solo.io/agentgateway/latest/install/ui/setup/), [OpenAI](https://docs.solo.io/agentgateway/latest/llm/providers/openai/).

## Fallback (no Terraform Helm)

`scripts/install-agentgateway.sh` installs the same in-cluster pieces (UI 0.5.5, ClickHouse persistence, Gateway, OpenAI route) against an existing kubeconfig. Use it only when you are not applying the Helm/kubectl resources through Terraform.

```bash
export AGENTGATEWAY_LICENSE_KEY
export OPENAI_API_KEY
./scripts/install-agentgateway.sh
```

## Cost notes

Autopilot has no idle node pool; you pay the Autopilot management fee plus running pods. The cluster is public (no Cloud NAT). Destroy the cluster when idle:

```bash
cd terraform
terraform destroy -target=google_container_cluster.autopilot
```

The project uses `deletion_policy = PREVENT` by default so `terraform destroy` will not delete `maniak-showcase`. Set `-var=project_deletion_policy=DELETE` if you intend to remove the project.

## CI

`.github/workflows/terraform.yml` runs `terraform fmt -check` and `terraform validate` (no `plan`/`apply`; those need GCP credentials).
