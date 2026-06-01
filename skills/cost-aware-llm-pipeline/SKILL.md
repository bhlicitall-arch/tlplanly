---
name: cost-aware-llm-pipeline
description: Padrões de otimização de custo para o Copilot TLPlanly — roteamento de modelo por complexidade, prompt caching, rastreamento de budget e retry inteligente. Use quando otimizar chamadas à API Anthropic no server.ts, reduzir custo por usuário/mês, ou implementar roteamento Haiku→Sonnet por complexidade de pergunta.
origin: ECC (adaptado para TLPlanly/TypeScript)
---

# Cost-Aware LLM Pipeline — TLPlanly Copilot

Padrões para controlar custos da API Anthropic mantendo qualidade. Aplicado ao `src/server.ts` do TLPlanly.

## Contexto TLPlanly

Custo atual estimado: **R$ 2,20/user/mês** (Claude Haiku 4.5, 160 interações/mês).
Meta com otimização: **R$ 1,20–1,50/user/mês** (-30% a -45%).

## 1. Roteamento por Complexidade de Pergunta

Perguntas simples (navegação, status, definições) → **Haiku** (mais barato)
Perguntas complexas (análise de orçamento, auditoria, legislação) → **Sonnet** (melhor qualidade)

```typescript
const HAIKU  = 'claude-haiku-4-5';
const SONNET = 'claude-sonnet-4-6';

// Palavras-chave que indicam pergunta complexa → usar Sonnet
const COMPLEX_KEYWORDS = [
  'analise', 'analisa', 'audita', 'auditar', 'verifica', 'comparar',
  'justifica', 'conformidade', 'sobrepreço', 'irregularidade',
  'reequilíbrio', 'impugnar', 'memorial', 'composição analítica'
];

function selectModel(userMessage: string, tokenCount: number): string {
  const lower = userMessage.toLowerCase();
  const isComplex = tokenCount > 500
    || COMPLEX_KEYWORDS.some(k => lower.includes(k));
  return isComplex ? SONNET : HAIKU;
}
```

## 2. Prompt Caching — Reduz custo do system prompt

O system prompt do TLPlanly tem ~8KB (com skills). Sem caching, é reenviado em CADA mensagem.
Com caching, o custo do system prompt cai **90%** após a primeira chamada da sessão.

```typescript
// Em server.ts — adicionar cache_control ao system prompt
const systemMessage = {
  role: 'user' as const,
  content: [
    {
      type: 'text' as const,
      text: systemFinal,
      cache_control: { type: 'ephemeral' as const }  // ← ADICIONAR ISSO
    },
    {
      type: 'text' as const,
      text: messages[messages.length - 1].content
    }
  ]
};

// Estimativa de economia:
// System prompt: ~2.000 tokens × $1/1M = $0,002 por chamada
// Com cache:     ~200 tokens  × $0,10/1M = $0,00002 por chamada
// Economia por sessão de 8 perguntas: $0,014 → $0,00016 = -98%
```

## 3. Rastreamento de Uso por Usuário (TypeScript)

```typescript
// Tipos imutáveis para rastreamento
interface CostRecord {
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  readonly timestamp: string;
}

// Preços em USD por milhão de tokens (Jun/2026)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5':   { input: 1.00, output: 5.00 },
  'claude-sonnet-4-6':  { input: 3.00, output: 15.00 },
};

function calcCost(model: string, inputTok: number, outputTok: number): number {
  const p = PRICING[model] ?? PRICING['claude-haiku-4-5'];
  return (inputTok * p.input + outputTok * p.output) / 1_000_000;
}
```

## 4. Retry Inteligente — Só em erros transitórios

```typescript
import Anthropic from '@anthropic-ai/sdk';

const RETRYABLE = ['overloaded_error', 'api_error'];
const MAX_RETRIES = 3;

async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTransient = err?.status >= 500
        || err?.error?.type && RETRYABLE.includes(err.error.type);
      if (!isTransient || attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2 ** attempt * 500)); // backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

## 5. Limitar Histórico de Mensagens

Cada mensagem histórica aumenta o custo. Limitar a janela de contexto:

```typescript
// Em server.ts — já implementado parcialmente:
messages: messages.slice(-10)  // últimas 10 mensagens

// Otimização: também truncar mensagens muito longas
const MAX_MSG_CHARS = 2000;
const optimizedHistory = messages.slice(-8).map(m => ({
  ...m,
  content: m.content.length > MAX_MSG_CHARS
    ? m.content.slice(0, MAX_MSG_CHARS) + '...[truncado]'
    : m.content
}));
```

## Impacto Estimado das Otimizações

| Otimização | Economia Estimada | Complexidade |
|---|---|---|
| Prompt caching | -40% a -50% no custo do system prompt | Baixa |
| Roteamento Haiku/Sonnet | -20% a -30% geral | Média |
| Limitar histórico (8 msgs) | -10% a -15% | Baixa |
| Retry inteligente | Evita cobranças duplas | Baixa |
| **Total combinado** | **-45% a -60%** | |

De R$ 2,20 → **R$ 0,90 a R$ 1,20/user/mês** com todas aplicadas.

## Aplicação no server.ts

Adicionar no endpoint `/api/copilot`:

```typescript
// 1. Selecionar modelo por complexidade
const userMsg = messages[messages.length-1]?.content || '';
const totalTokensEstimate = (systemFinal.length + userMsg.length) / 4;
const model = selectModel(userMsg, totalTokensEstimate);

// 2. Usar histórico otimizado
const optimizedMessages = messages.slice(-8);

// 3. Chamar com retry
const stream = await callWithRetry(() =>
  anthropic.messages.stream({
    model,                    // ← dinâmico
    max_tokens: 1024,
    system: systemFinal,
    messages: optimizedMessages,  // ← limitado
  })
);
```
