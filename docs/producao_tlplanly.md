# TLPlanly - Plano de Producao

Este documento registra os blocos que faltam para transformar o prototipo atual em SaaS vendavel.

## 1. Auditoria real

Estado atual:

- Codigo exato funciona.
- Codigo normalizado funciona.
- Codigo proprio pode casar por descricao com score e rastreabilidade.
- Itens sem confianca continuam como `NAO_ENCONTRADO`.

Gargalo:

- A base atual e SINAPI insumos MG 04/2026.
- A planilha real contem muitos codigos de composicoes/servicos/proprios.

Proximo corte:

- Importar composicoes SINAPI analiticas/sinteticas.
- Criar tabela `referencia_precos` com tipo `insumo` ou `composicao`.
- Auditar primeiro por codigo, depois por fonte, depois por descricao/unidade.

## 2. Frontend modular

Estado atual:

- `tlplanly.html` permanece como legado.
- `frontend/index.html`, `frontend/src/styles.css` e `frontend/src/main.js` foram extraidos.
- O servidor Express prioriza `frontend/index.html` em `/`.

Proximo corte:

- Dividir `frontend/src/main.js` por dominio: SINAPI, orcamento, BDI, ABC, auditoria, importacao, Copilot e exportacao.
- Remover dependencias globais aos poucos.

## 3. Testes de importacao

Estado atual:

- Teste XLSX nacional SINAPI criado em `tests/test_importadores.ts`.
- CSV real continua coberto por `tests/est_arquivo_real.ts`.

Pendente:

- Teste de PDF digital com pdfjs.
- Teste OCR com Tesseract.js no navegador.
- Esses dois dependem de suite de UI/browser.

## 4. Persistencia

Estado atual:

- Esquema inicial criado em `src/persistence/schema.sql`.

Entidades cobertas:

- tenants
- usuarios
- obras
- orcamentos
- itens
- bases de referencia
- precos de referencia
- auditorias
- resultados
- CPUs

Proximo corte:

- Escolher Supabase/Postgres ou Cloudflare D1.
- Criar migrations reais.
- Ligar frontend/backend a API persistente.

## 5. Multi-base real

Prioridade de importadores:

1. SINAPI composicoes.
2. SICRO 3 DNIT.
3. ORSE.
4. Bases estaduais mais demandadas: SEINFRA-CE, EMOP-RJ, SUDECAP-BH, GOINFRA, DAER-RS.

Regra:

- Toda base externa deve converter para o mesmo schema universal: codigo, descricao, unidade, preco, fonte, uf, data_referencia, tipo.

## 6. Deploy controlado

Requisitos:

- Dominio TLPlanly separado.
- Nenhuma marca de infraestrutura interna na UI, relatorios ou exports.
- Autenticacao por tenant.
- Isolamento logico de dados por `tenant_id`.
- Logs e relatorios com marca TLPlanly/TechLicense.
