# TLPlanly — Memória de Sessão

Este arquivo é lido no início de cada sessão para restaurar contexto crítico.
Atualizar ao final de cada sessão produtiva.

## Estado Atual do Projeto (atualizar a cada sessão)

**Última atualização:** 01/06/2026  
**Versão TLPlanly:** v3 + Fase 2A + 2B + 2C + Fase 3 + Copilot IA + 6 Skills

### Arquivos críticos
- `tlplanly.html` — Frontend completo (~249KB, single-file SPA)
- `src/server.ts` — Backend Express, endpoint `/api/copilot` SSE streaming
- `data/referencia.json` — 4.304 insumos SINAPI MG/Abril-2026
- `skills/` — 7 skills: 6 TLPlanly + cost-aware-llm-pipeline
- `.env` — ANTHROPIC_API_KEY (não commitar)
- `RELATORIO_PROJETO.md` — Documentação completa do projeto

### Comandos para retomar
```bash
cd "C:\Users\CARLOS ALBERTO\PROJETOS CARLÃO\orcamentos_sinapi"
npm run server        # Inicia servidor + Copilot IA
# Acessa: http://localhost:3000
```

### Últimas decisões técnicas
- TLPlanly é produto independente da BHLICITALL (branding separado)
- Pode usar infraestrutura Cloudflare da BHLICITALL nos bastidores
- Copilot usa Claude Haiku 4.5 com fallback para KB local
- skills carregados automaticamente no system prompt do server.ts
- AgentShield: Grau A (99/100) — deny list reforçada; PreToolUse ainda pendente via runtime de hooks ECC

### Próximos passos (backlog)
1. Concluir prompt caching e métricas persistentes do cost-aware-llm-pipeline no server.ts
2. Deploy TLPlanly como Cloudflare Worker
3. Criar D1 database para persistência multi-usuário
4. Conectar ao pncp-core-api (leitura apenas, sem expor origem)
5. Fase 4 — Cronograma Físico-Financeiro (Gantt + Curva S)

### Regras de desenvolvimento
- Edições no HTML via Python (nunca Edit tool direto — trunca Unicode)
- `fs.createWriteStream` para arquivos grandes (nunca writeFileSync no Windows)
- TypeScript strict mode + commonjs + ts-node
- Frontend modularizado em `frontend/`; `tlplanly.html` permanece como legado/compatibilidade
