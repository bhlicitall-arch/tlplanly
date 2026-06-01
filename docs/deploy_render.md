# Deploy TLPlanly no Render

## Tipo de servico

Use **New Web Service** no Render, conectado ao repositorio:

`bhlicitall-arch/tlplanly`

O TLPlanly roda como uma aplicacao Node/Express unica:

- frontend estatico servido pelo Express;
- API `/api/copilot`;
- base SINAPI local em `data/referencia.json`;
- health check em `/health`.

## Configuracao recomendada no Dashboard

- **Name:** `tlplanly`
- **Language:** `Node`
- **Branch:** `main` ou `codex/ecc-hardening-cost-aware`, conforme branch publicada
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Plan:** `Free` para homologacao; subir para plano pago antes de uso com cliente real

## Variaveis de ambiente

Recomendada:

- `ANTHROPIC_API_KEY`: chave da Anthropic para o Copilot IA

Opcionais:

- `DEEPSEEK_API_KEY`: chave da DeepSeek para fallback automatico se a Anthropic ficar sem credito, limite ou disponibilidade
- `DEEPSEEK_MODEL`: modelo DeepSeek usado no fallback; padrao recomendado: `deepseek-v4-flash`

O Render define `PORT` automaticamente. Nao configure `PORT` manualmente no painel.

## Pos-deploy

Depois do deploy concluir, validar:

- `https://SEU-SERVICO.onrender.com/health`
- `https://SEU-SERVICO.onrender.com/`

O `/health` deve retornar `status: "ok"` e `costAware: true`. Se o fallback estiver configurado, tambem deve retornar `deepseek: true`.
