# Agentgateway manifests

These YAML files are the source of truth for the Gateway and OpenAI LLM path.
`terraform apply` (with `TF_VAR_agentgateway_license_key` and `TF_VAR_openai_api_key`)
creates the same objects via the kubectl provider. `scripts/install-agentgateway.sh`
applies them as a fallback.

Manual apply (only if you are not using Terraform or the script):

1. `kubectl apply -f manifests/gateway.yaml`
2. Create `openai-secret` if you did not pass `OPENAI_API_KEY` / `TF_VAR_openai_api_key`:

   ```bash
   kubectl -n agentgateway-system create secret generic openai-secret \
     --from-literal=Authorization="${OPENAI_API_KEY}"
   ```

3. `kubectl apply -f manifests/openai-backend.yaml`

Never commit a real OpenAI key or license. The secret key name must be `Authorization` ([Solo OpenAI docs](https://docs.solo.io/agentgateway/latest/llm/providers/openai/)).
