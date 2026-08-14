# project-showcase

GCP project **showcase** (`maniak-showcase`) plus a small GKE Autopilot cluster in `us-central1`, ready for a later install of [Solo Enterprise for Agentgateway](https://docs.solo.io/agentgateway/latest/) and the [Solo UI](https://docs.solo.io/agentgateway/latest/install/ui/setup/). First LLM backend is OpenAI. A Chrome extension chat client comes next and is not in this repo yet.

## Layout

| Path | Purpose |
| --- | --- |
| `terraform/` | Project (optional), APIs, VPC, Autopilot cluster, gated Helm releases |
| `scripts/install-agentgateway.sh` | Recommended second-step Helm install (matches Solo docs) |
| `manifests/` | Gateway + OpenAI backend/HTTPRoute (no secrets) |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.6
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- Auth as a user that can create a project in org `629527910221` (or use an existing project — see below)
- Billing user on account `011C38-867461-BE95B1`
- For the Helm step: `kubectl`, `helm`, plus `AGENTGATEWAY_LICENSE_KEY` (and later `OPENAI_API_KEY`) in the environment — never commit these

```bash
gcloud auth login
gcloud auth application-default login
```

## 1. Create the project and cluster

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # optional; defaults already match maniak-showcase
terraform init
terraform plan
terraform apply
```

Defaults:

- Project name `showcase`, project id `maniak-showcase` (plain `showcase` is likely taken globally)
- Org `629527910221` (maniak.io), billing `011C38-867461-BE95B1`
- Regional Autopilot cluster `showcase` in `us-central1` (no node pools)
- APIs: `container`, `compute`, `iam`, `serviceusage`, `cloudresourcemanager`

Leave `agentgateway_license_key` and `openai_api_key` empty on this first apply. Helm resources stay disabled.

If the Helm/Kubernetes providers error because the cluster endpoint is not known yet, apply the cluster first, then the rest:

```bash
terraform apply -target=google_container_cluster.autopilot
terraform apply
```

### If you cannot create the project

Org-level `resourcemanager.projectCreator` and billing `billing.user` are required for `create_project=true`. Create the project in the console (name **showcase**, id **maniak-showcase**), attach the billing account, then:

```bash
terraform apply -var=create_project=false
```

Terraform still enables APIs and creates the VPC + Autopilot cluster in `maniak-showcase`.

## 2. Kubeconfig

```bash
terraform output get_credentials_command
# gcloud container clusters get-credentials showcase --region us-central1 --project maniak-showcase
```

Run that command, then:

```bash
kubectl config current-context
# gke_maniak-showcase_us-central1_showcase
```

Outputs also include `project_id`, `region`, `cluster_name`, and `kube_context`.

## 3. Agentgateway + Solo UI (second step)

License and OpenAI keys are **variables/secrets only**. Do not put them in `terraform.tfvars`, examples, or git.

### Option A — Helm CLI (recommended)

```bash
export AGENTGATEWAY_LICENSE_KEY
export OPENAI_API_KEY            # optional; creates Secret openai-secret
./scripts/install-agentgateway.sh
```

The script installs Gateway API CRDs, then:

- `oci://us-docker.pkg.dev/solo-public/enterprise-agentgateway/charts/enterprise-agentgateway-crds`
- `oci://us-docker.pkg.dev/solo-public/enterprise-agentgateway/charts/enterprise-agentgateway`
- `oci://us-docker.pkg.dev/solo-public/solo-enterprise-helm/charts/management` (Solo UI)

Namespace is `agentgateway-system`. Chart versions default to Solo docs current latest (`v2026.8.0` / UI `0.5.5`).

### Option B — Terraform Helm releases

Same stack, second apply. Releases are created only when the license is non-empty:

```bash
cd terraform
export TF_VAR_agentgateway_license_key
export TF_VAR_openai_api_key     # optional
terraform apply
```

You still need Gateway API CRDs before the control plane is useful:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.1/standard-install.yaml
```

### Gateway and OpenAI route

```bash
kubectl apply -f manifests/gateway.yaml
kubectl apply -f manifests/openai-backend.yaml
```

`openai-backend.yaml` references Secret `openai-secret` (key `Authorization`). It does not contain a key.

Solo UI (after the management chart is installed):

```bash
kubectl port-forward service/solo-enterprise-ui -n agentgateway-system 4000:80
```

Docs: [install](https://docs.solo.io/agentgateway/latest/quickstart/install/), [Helm](https://docs.solo.io/agentgateway/latest/install/helm/), [UI](https://docs.solo.io/agentgateway/latest/install/ui/setup/), [OpenAI](https://docs.solo.io/agentgateway/latest/llm/providers/openai/).

## Cost notes

Autopilot has no idle node pool; you pay the Autopilot management fee plus running pods. The cluster is public (no Cloud NAT). Destroy the cluster when idle:

```bash
cd terraform
terraform destroy -target=google_container_cluster.autopilot
```

The project uses `deletion_policy = PREVENT` by default so `terraform destroy` will not delete `maniak-showcase`. Set `-var=project_deletion_policy=DELETE` if you intend to remove the project.

## CI

`.github/workflows/terraform.yml` runs `terraform fmt -check` and `terraform validate` (no `plan`/`apply`; those need GCP credentials).

## Next

Chrome extension chat client against the OpenAI route through Agentgateway.
