# Agentgateway manifests

Apply these **after** the Autopilot cluster exists and Solo Enterprise for Agentgateway is installed (`scripts/install-agentgateway.sh` or a second `terraform apply` with `TF_VAR_agentgateway_license_key`).

1. `kubectl apply -f manifests/gateway.yaml`
2. Create `openai-secret` if you did not pass `OPENAI_API_KEY` / `TF_VAR_openai_api_key`:

   ```bash
   kubectl -n agentgateway-system create secret generic openai-secret \
     --from-literal=Authorization="${OPENAI_API_KEY}"
   ```

3. `kubectl apply -f manifests/openai-backend.yaml`

Never commit a real OpenAI key or license. The secret key name must be `Authorization` ([Solo OpenAI docs](https://docs.solo.io/agentgateway/latest/llm/providers/openai/)).
