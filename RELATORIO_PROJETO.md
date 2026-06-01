# TLPlanly by TechLicense — Relatório Geral do Projeto
**Data de geração:** 31/05/2026  
**Responsável:** CARLÃO  
**Empresa:** TechLicense  

---

## 1. VISÃO GERAL DO PRODUTO

**TLPlanly** é uma plataforma SaaS de orçamentação de obras públicas e privadas, com foco no mercado brasileiro de engenharia e licitações. Combina motor de auditoria SINAPI em TypeScript/Node.js com um frontend HTML completo e um Copilot de IA integrado.

**Posicionamento:** Superação do 90 COMPOR — único sistema do mercado com modo duplo (Construtor + Auditor), importação de editais em PDF/Excel, multi-base de referência (SINAPI + SICRO + 7 bases estaduais) e tutor de IA embutido.

---

## 2. ESTRUTURA DO PROJETO

```
orcamentos_sinapi/
├── src/
│   ├── server.ts              ← Servidor Express + endpoint Copilot Anthropic API
│   ├── index.ts               ← Pipeline de auditoria CLI
│   ├── ai_agents/
│   │   └── orchestrator.ts    ← Orquestrador de IA (stub, expandir na Fase 4)
│   ├── config/
│   │   ├── config.ts
│   │   └── ai_keys.ts         ← Configuração de provedores de IA
│   ├── connectors/
│   │   ├── sinapiConnector.ts     ← Carrega referencia.json
│   │   ├── sinapiDownloader.ts    ← Download automático CAIXA
│   │   ├── sinapiProcessor.ts     ← Parser CSV dual-layout (Layout A e B)
│   │   └── sinapiXlsxReader.ts    ← Leitor XLSX SINAPI nacional (ISD/ICD/ISE)
│   ├── models/
│   │   ├── Auditoria.ts       ← Tipos: PrecoReferencia, RelatorioAuditoria
│   │   └── Insumo.ts          ← Tipos: Insumo, OrcamentoItem
│   └── services/
│       ├── AgenteAuditor.ts   ← Motor de comparação de preços
│       └── RelatorioExportador.ts ← Export JSON/CSV/TXT
├── data/
│   ├── referencia.json        ← 4.304 insumos SINAPI MG (Abril/2026)
│   ├── insumos.csv            ← Planilha de orçamento de exemplo
│   └── downloads/             ← ZIPs baixados da CAIXA
├── scripts/
│   ├── sinapi_import_xlsx.ts  ← Importa XLSX SINAPI para referencia.json
│   ├── sinapi_update.ts       ← Atualização automática via download
│   └── sinapi_info.ts         ← Info da base carregada
├── tests/
│   ├── test_auditoria.ts      ← Testes unitários
│   └── est_arquivo_real.ts    ← Teste com arquivo real (todos passando)
├── tlplanly.html              ← Frontend completo (~249KB, single-file SPA)
├── package.json               ← Dependências e scripts npm
├── tsconfig.json
├── .env.example               ← Template de configuração
└── .env                       ← Chave ANTHROPIC_API_KEY (NÃO commitar)
```

---

## 3. FRONTEND — tlplanly.html

**Tamanho:** ~249KB — single-file SPA completo  
**Tecnologias:** HTML5 + CSS3 + JS vanilla + Chart.js + pdfjs + SheetJS + Tesseract.js  

### 3.1 Temas
- **Tema Escuro:** fundo #050505 + dourado #f5a623 (TechLicense brand DNA)
- **Tema Claro:** fundo #f4f5f7 + mesma paleta dourada
- Toggle no topbar, persistido em localStorage

### 3.2 Módulos Implementados

| Rota/View | Módulo | Status | Observações |
|---|---|---|---|
| `dashboard` | Dashboard | ✅ Completo | Métricas, Curva ABC donut, categorias bar chart |
| `elaborar` | Elaborar Orçamento | ✅ Completo | Busca SINAPI multi-base, desvio%, BDI aplicado |
| `bdi` | BDI & Encargos | ✅ Completo | Decreto 7983, TCU 2622/2013, ND/Desonerado |
| `curvaABC` | Curva ABC | ✅ Completo | Gráficos pizza + linha acumulada, faixas configuráveis |
| `memoria` | Memória de Cálculo | ✅ Completo | Breakdown por item com encargos e BDI |
| `auditoria` | Análise SINAPI | ✅ Completo | Conformidade por item, filtros, tolerância configurável |
| `conformidade` | Conformidade BDI | ✅ Completo | Verificação limites TCU com badge por tipo selecionado |
| `relatorio` | Exportar/Relatório | ✅ Completo | Excel 4 abas + PDF impressão A4 paisagem, padrão TCU/CGU |
| `bases` | Bases de Referência | ✅ Completo | SINAPI + SICRO 3 + 7 estaduais + OCR Tesseract.js |
| `importar` | Importar Edital | ✅ Completo | PDF digital (pdfjs), Excel (SheetJS), OCR, fila de revisão |
| `cpu` | Composições (CPU) | ✅ Completo | 4 passos, insumos SINAPI, encargos, biblioteca |
| `config` | Configurações | ✅ Completo | UF, tolerância, encargos padrão, tipo obra |

### 3.3 Modo Duplo
- **Construtor:** criar e editar planilhas orçamentárias
- **Auditor:** verificar conformidade de preços para órgãos públicos/TCU/CGU
- Toggle no topbar, visualmente destacado

### 3.4 Bases de Referência Suportadas

| Base | Tipo | Órgão | URL Oficial |
|---|---|---|---|
| SINAPI | Federal | Caixa/IBGE | caixa.gov.br/sinapi |
| SICRO 3 | Federal | DNIT | dnit.gov.br/custos-e-pagamentos/sicro |
| SEINFRA-MG | Estadual | Sec. Infraestrutura-MG | infraestrutura.mg.gov.br |
| ORSE-SE | Estadual | CEHOP-SE | orse.cehop.se.gov.br |
| EMOP-RJ | Estadual | Emp. Obras Públicas-RJ | rj.gov.br/emop |
| SEINFRA-CE | Estadual | Sec. Infraestrutura-CE | seinfra.ce.gov.br/tabela-de-custos |
| SUDECAP-BH | Municipal | Prefeitura BH | prefeitura.pbh.gov.br/sudecap/tabela-de-precos |
| GOINFRA | Estadual | Agência Goiana Infraestrutura | goinfra.go.gov.br/tabela-de-composicao/114 |
| DAER-RS | Estadual | Depto. Estradas RS | daer.rs.gov.br/referencial-de-obra |

---

## 4. BACKEND — server.ts

**Framework:** Express 5 + TypeScript  
**Porta:** 3000 (configurável via .env)

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Serve tlplanly.html |
| GET | `/health` | Status do servidor + flag `anthropic: true/false` |
| GET | `/api/referencia` | Retorna data/referencia.json (base SINAPI) |
| POST | `/api/copilot` | Streaming SSE → Anthropic Claude Haiku 4.5 |

### Copilot API — POST /api/copilot

**Body:**
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "context": {
    "view": "bdi",
    "totalItens": 15,
    "totalOrcamento": 45000.00,
    "bdi": 24.46,
    "sinapiCount": 4304
  }
}
```

**Response:** SSE stream — `data: {"text": "chunk"}\n\n` ... `data: [DONE]\n\n`

**Modelo:** `claude-haiku-4-5` (custo ~R$ 2,20/usuário/mês)  
**System prompt:** Especializado em obras, SINAPI, BDI, TCU, legislação brasileira

---

## 5. COPILOT AGENT — Arquitetura

### 5.1 Modo Duplo
- **Modo Local (offline):** Base de conhecimento embutida em JS (~20 tópicos)
- **Modo API (online):** Claude Haiku 4.5 via streaming SSE
- Detecção automática via `/health` — fallback transparente

### 5.2 Base de Conhecimento Local
Tópicos cobertos (com ~25-30 palavras-chave cada):
`onboarding` · `bdi_oque` · `bdi_limites` · `bdi_como` · `sinapi_oque` · `sinapi_atualizar` · `sinapi_sicro` · `abc_oque` · `abc_como` · `encargos` · `cpu_oque` · `cpu_como` · `coeficientes` · `importar` · `ocr` · `exportar` · `art` · `legislacao` · `auditoria`

### 5.3 Comportamentos Inteligentes
- **Onboarding automático:** badge `1` na primeira abertura
- **Contexto por tela:** ao trocar de módulo, explica o que a tela faz
- **Alerta proativo de BDI:** badge `!` quando BDI ultrapassa limite TCU
- **Navegação por chat:** "Ir para BDI" navega direto para o módulo
- **Estado em tempo real:** "Meu orçamento atual" retorna totais/BDI/itens
- **Fallback em 3 níveis:** match exato → match por palavras → fallback útil

### 5.4 Indicador Visual de Modo
- `🟢 Claude Haiku 4.5 — IA ativa` (quando ANTHROPIC_API_KEY configurada)
- `🟡 Modo local — base de conhecimento` (sem chave ou offline)

---

## 6. DADOS E BASE SINAPI

**Arquivo:** `data/referencia.json`  
**Conteúdo:** 4.304 insumos SINAPI — UF: MG — Mês: Abril/2026  
**Formato:**
```json
{
  "codigoSinapi": "87482",
  "descricao": "CONCRETO FCK=25MPA, TRAÇO...",
  "unidade": "M3",
  "precoMedio": 425.50,
  "dataReferencia": "04/2026",
  "desonerado": false,
  "fonte": "SINAPI/CAIXA/ISD/MG"
}
```

**Atualização manual:**
```bash
npm run sinapi:import
# Seleciona automaticamente o arquivo SINAPI_Referência_XXXX_XX.xlsx do ZIP
```

---

## 7. SCRIPTS NPM

```bash
npm run server        # Inicia servidor Express (produção)
npm run server:dev    # Servidor com hot-reload (desenvolvimento)
npm run start         # Pipeline CLI de auditoria
npm run sinapi:import # Importa novo XLSX SINAPI → referencia.json
npm run sinapi:update # Download automático CAIXA + importação
npm run sinapi:info   # Info da base carregada
npm run test          # Testes unitários
npm run test:real     # Teste com arquivo real
npm run compile       # Verifica TypeScript sem compilar
npm run build         # Compila TypeScript
```

---

## 8. CONFIGURAÇÃO (.env)

```env
# Anthropic API Key (obrigatório para Copilot com IA real)
# Obter em: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXX

# Porta do servidor (opcional, padrão: 3000)
PORT=3000
```

---

## 9. FASES CONCLUÍDAS

| Fase | Descrição | Status |
|---|---|---|
| Backend Core | Motor de auditoria SINAPI TypeScript | ✅ |
| Parser XLSX | Leitor SINAPI nacional (27 UFs, abas ISD/ICD/ISE) | ✅ |
| Fase 1 | BDI, Curva ABC, Memória, Auditoria, dark/light theme | ✅ |
| Fase 2A | Importador PDF digital + Excel + fila de revisão SINAPI | ✅ |
| Fase 2B | SICRO 3, multi-base estadual (7 bases), OCR Tesseract.js | ✅ |
| Fase 2C | Exportação Excel 4 abas + PDF padrão edital TCU/CGU | ✅ |
| Fase 3 | Composições Analíticas (CPU) com biblioteca persistida | ✅ |
| Copilot | Agente tutor com KB local + Anthropic API streaming | ✅ |

---

## 10. PRÓXIMAS FASES (BACKLOG)

### Fase 4 — Cronograma Físico-Financeiro
- Gantt por etapas de obra
- Desembolso mensal (curva S)
- Integração com orçamento (cada item → etapa/mês)
- Exportação em Excel com gráfico de barras

### Fase 5 — Módulo de Medição
- Boletim de Medição (BM) por período
- Avanço físico % por item
- Glosas e retenções contratuais
- Histórico de medições e saldo a executar

### Fase 6 — Análise de Risco e Reequilíbrio
- Simulador de reequilíbrio econômico-financeiro
- Impacto de variação INCC/IPCA
- Simulador de aditivos contratuais

### Fase 7 — Multi-Projetos
- Gerenciar múltiplos orçamentos
- Comparativo entre obras
- Consolidado de portfólio

### Fase 8 — Integrações API
- Webhook para ERP (TOTVS, SAP)
- Integração PNCP (Portal Nacional de Contratações Públicas)
- Atualização automática mensal SINAPI/SICRO

### Fase 9 — IA Avançada
- Sugestão de composições por linguagem natural
- Detecção de itens faltantes no orçamento
- Análise de consistência automática

---

## 11. ANÁLISE COMPETITIVA

| Feature | TLPlanly | 90 COMPOR | i9 Orçamentos | OrçaFascio |
|---|---|---|---|---|
| BDI Decreto 7983 | ✅ | ✅ | Parcial | Parcial |
| Curva ABC | ✅ | ✅ | ✅ | ✅ |
| Modo Auditor | ✅ | ❌ | ❌ | ❌ |
| Importar PDF edital | ✅ | ❌ | ❌ | ❌ |
| OCR PDF escaneado | ✅ | ❌ | ❌ | ❌ |
| Multi-base (SICRO+estaduais) | ✅ | Parcial | ✅ | ✅ |
| Composições CPU | ✅ | ✅ | ✅ | ✅ |
| Copilot IA tutor | ✅ | ❌ | ❌ | ❌ |
| Dark/Light theme | ✅ | ❌ | ❌ | ❌ |
| Open source / self-hosted | ✅ | ❌ | ❌ | ❌ |
| Exportação padrão TCU | ✅ | ✅ | Parcial | Parcial |

---

## 12. MODELO DE NEGÓCIO SUGERIDO

| Plano | Preço/mês | Inclui |
|---|---|---|
| Básico | R$ 89 | Orçamento + BDI + Curva ABC + SINAPI |
| Pro | R$ 189 | + SICRO + bases estaduais + Importar PDF + Copilot IA |
| Enterprise | R$ 389 | + Multi-projetos + API + self-hosted + treinamento |
| Gov (on-premise) | Sob consulta | Servidor local, dados 100% internos, sem dependência cloud |

**Custo de IA por usuário/mês:**
- Claude Haiku 4.5: ~R$ 2,20 (margem bruta > 97%)
- Groq Llama 70B (alternativa): ~R$ 0,58 (margem > 99%)

---

## 13. COMO RETOMAR O DESENVOLVIMENTO

### Setup inicial
```bash
cd orcamentos_sinapi
npm install
cp .env.example .env
# Editar .env com ANTHROPIC_API_KEY
```

### Iniciar o servidor TLPlanly
```bash
npm run server
# Acessar: http://localhost:3000
```

### Para atualizar a base SINAPI
1. Baixar ZIP mensal em: https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi
2. Extrair o arquivo XLSX (aba ISD para não desonerado)
3. Executar: `npm run sinapi:import`

### Arquivos críticos
- `tlplanly.html` — frontend completo (não dividir em múltiplos arquivos)
- `src/server.ts` — backend Express + endpoint Copilot
- `data/referencia.json` — base SINAPI ativa (não deletar)
- `.env` — chaves de API (nunca commitar no git)

### Observações técnicas importantes
1. **Nunca usar `fs.writeFileSync` para arquivos grandes no Windows/WSL** — usar `createWriteStream` (já implementado)
2. **Edições no HTML via Python** — o Edit tool do Claude pode truncar arquivos com acentos Unicode; usar Python com heredoc
3. **TypeScript**: `strict: true`, `commonjs`, `ts-node` para execução direta
4. **Frontend**: single-file por design — toda lógica em um HTML para facilitar deploy

---

## 14. DEPENDÊNCIAS PRINCIPAIS

```json
{
  "@anthropic-ai/sdk": "^0.100.1",
  "express": "^5.2.1",
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "exceljs": "^4.4.0",
  "adm-zip": "^0.5.17",
  "csv-parse": "^6.2.1"
}
```

**CDNs no frontend (tlplanly.html):**
- Chart.js 4.4.1
- pdf.js 3.11.174
- xlsx (SheetJS) 0.18.5
- Tesseract.js 5.0.4

---

*Relatório gerado em 31/05/2026 — TLPlanly by TechLicense*  
*Para retomar: fornecer este arquivo ao assistente de IA na nova sessão*
