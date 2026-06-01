---
name: risco-edital
description: Identificar, classificar e mitigar riscos em editais de licitação de obras públicas — riscos contratuais, técnicos, financeiros e de conformidade. Use quando analisar um edital antes de licitar, avaliar cláusulas de risco, identificar pontos de atenção em contratos de obras, ou preparar impugnação a edital irregular.
user-invocable: true
argument-hint: "<edital ou cláusula a analisar>"
---

# Análise de Risco em Editais de Obras Públicas


## Quando Ativar

- Antes de decidir participar ou não de uma licitação
- Ao revisar o edital antes de elaborar a proposta
- Quando identificar cláusulas que transferem riscos indevidos ao contratado
- Para calcular o valor de contingência a incluir no orçamento
- Para decidir se vale a pena impugnar o edital

**Importante**: Este skill fornece framework de análise de riscos mas não substitui assessoria jurídica especializada. Impugnações e recursos devem ser preparados com apoio de advogado de direito administrativo.

## Matriz de Risco — Adaptada para Obras Públicas Brasileiras

### Classificação de Severidade

| Nível | Label | Impacto Financeiro | Impacto Operacional |
|---|---|---|---|
| 1 | **Negligível** | < 1% do valor do contrato | Atraso < 5 dias |
| 2 | **Baixo** | 1% a 5% do contrato | Atraso 5 a 30 dias |
| 3 | **Moderado** | 5% a 15% do contrato | Atraso 1 a 3 meses |
| 4 | **Alto** | 15% a 30% do contrato | Atraso 3 a 12 meses |
| 5 | **Crítico** | > 30% do contrato | Inviabilização da obra |

### Classificação de Probabilidade

| Nível | Label | Descrição |
|---|---|---|
| 1 | **Remota** | < 10% de chance, sem precedente |
| 2 | **Improvável** | 10% a 25%, precedente raro |
| 3 | **Possível** | 25% a 50%, precedente existe |
| 4 | **Provável** | 50% a 75%, ocorre regularmente |
| 5 | **Quase Certa** | > 75%, padrão histórico |

### Score = Severidade × Probabilidade

| Score | Nível | Ação |
|---|---|---|
| 1-4 | 🟢 Baixo | Aceitar, monitorar |
| 5-9 | 🟡 Médio | Mitigar, precificar no BDI/contingência |
| 10-15 | 🟠 Alto | Negociar cláusula ou impugnar |
| 16-25 | 🔴 Crítico | Impugnar ou não participar |

## Riscos Técnicos

### Projeto Inadequado ou Incompleto
- **Manifestações:** plantas sem detalhes construtivos, especificações vagas, quantitativos sem memória de cálculo
- **Consequência:** variação de quantidade (aditivos), conflito com gestor, responsabilização indevida
- **Mitigação:** exigir complementação antes da licitação (impugnação); precificar contingência de 5-15%

### Condições do Solo Não Investigadas
- **Manifestações:** ausência de sondagem (SPT/CPT) ou laudo geotécnico desatualizado
- **Consequência:** fundação subdimensionada, custo imprevisível de escavação, rocha ou aterro
- **Mitigação:** solicitar sondagem no edital; incluir item de "alteração de fundação" com preço unitário

### Interferências com Redes Existentes
- **Manifestações:** ausência de levantamento de redes de água, esgoto, elétrica, telefonia, gás
- **Consequência:** obras paradas para relocação, custo e prazo não previstos
- **Mitigação:** exigir projeto de interferências; cláusula de responsabilidade da contratante por relocação

### Topografia Incompatível
- **Manifestações:** levantamento topográfico desatualizado ou inexistente
- **Consequência:** quantitativos errados de terraplenagem (+ ou - volumes)
- **Mitigação:** realizar levantamento próprio antes da proposta; incluir no orçamento topografia prévia

## Riscos Contratuais

### Matriz de Risco Contratual Desequilibrada
A Lei 14.133/2021 exige que o edital contenha **matriz de riscos** alocando responsabilidades:

| Risco | Responsável Legal | Alerta se no Edital |
|---|---|---|
| Caso fortuito e força maior | Administração | Transferido ao contratado → Impugnar |
| Erros de projeto | Administração | Transferido ao contratado → Impugnar |
| Variação de preços de insumos | Contratado (até limite) | Sem reajuste → Verificar IPCA/INCC |
| Variação de quantitativos | Administração (empreitada unitária) | Risco integral no contratado → Negociar |
| Eventos climáticos previsíveis | Contratado | Razoável para região |
| Riscos geológicos não investigados | Administração | Transferido ao contratado → Impugnar |

### Cláusulas de Reajuste Inadequadas
- **Risco:** contrato longo sem reajuste, ou índice inadequado
- **Índices aceitos:** INCC (FGV), IPCA, índices setoriais IBGE
- **Alerta:** obras > 12 meses sem cláusula de reajuste em desconformidade com Lei 14.133/2021
- **Mitigação:** impugnar; se não atendido, precificar inflação esperada no BDI (componente R)

### Prazo de Execução Incompatível
- **Risco:** prazo subestimado em relação ao porte da obra
- **Verificação:** comparar com parâmetros de produtividade por tipo de serviço
- **Consequência:** aplicação de multa por atraso mesmo com execução regular
- **Mitigação:** impugnar prazo irrealista; demonstrar com cronograma que é fisicamente impossível

### Exigências de Habilitação Restritivas
Verificar se as exigências não são discriminatórias:
- **Capacidade técnica:** acervo de obras similares (tipo, porte, natureza)
- **Capacidade financeira:** patrimônio líquido ≥ 10% do valor estimado (Lei 14.133, Art. 69)
- **Qualificação técnica:** responsável técnico com atestado de 50% da maior parcela de maior relevância
- **Alerta:** exigência de atestado para valor acima de 50% da maior parcela relevante pode ser restritiva

## Riscos Financeiros

### Subpreço e Proposta Inexequível
- **Definição:** proposta abaixo de 75% do orçamento de referência para obras (Lei 14.133, Art. 59)
- **Consequência:** qualificação como inexequível, desclassificação
- **Para licitantes:** não ofertar preço < 75% do orçamento estimado sem justificativa sólida

### Atraso nos Pagamentos
- **Risco:** órgão público com histórico de pagamentos atrasados
- **Verificação:** consultar CADIN, SICONV, notícias de pendências do órgão
- **Mitigação:** solicitar garantia de pagamento; incluir DF elevado no BDI; capital de giro adequado

### Garantia Contratual Excessiva
- Lei 14.133/2021 permite exigir até 5% do valor (podendo chegar a 10% em obras complexas)
- **Alerta:** garantia acima de 5% sem justificativa → impugnar
- **Modalidades aceitas:** caução em dinheiro ou títulos, seguro-garantia, fiança bancária

### Retenção de Pagamentos
- Retenção de 5% para garantia — verificar se está prevista no edital
- Prazo para devolução da retenção após aceite definitivo

## Riscos de Conformidade

### Orçamento de Referência Sigiloso (Art. 24, Lei 14.133)
- Pode ser sigiloso até a abertura das propostas
- Após abertura: **deve ser divulgado obrigatoriamente**
- **Alerta:** negativa de fornecer orçamento após abertura → impugnar

### Exigência de Marca ou Modelo
- Proibido por Lei 14.133 (salvo justificativa técnica)
- **Manifestação:** "usar apenas produto X da marca Y"
- **Ação:** impugnar, exigir substituição por especificação técnica equivalente

### Prazo para Impugnação Exíguo
- Mínimo legal: 3 dias úteis antes da abertura das propostas
- Prazo menor → irregularidade processual

## Modelo de Análise de Edital

```
ANÁLISE DE RISCO DO EDITAL
Órgão: _________________ Objeto: _________________
Valor Estimado: R$ _________ Data de Abertura: __/__/____

┌──────────────────────┬───────────┬────────┬────────┬──────────────────────────┐
│ Risco Identificado   │ Severidade│ Prob.  │ Score  │ Recomendação             │
├──────────────────────┼───────────┼────────┼────────┼──────────────────────────┤
│ [Risco 1]            │ [1-5]     │ [1-5]  │ [1-25] │ [Aceitar/Mitigar/Impugnar]│
│ [Risco 2]            │ [1-5]     │ [1-5]  │ [1-25] │ [Ação]                   │
│ ...                  │ ...       │ ...    │ ...    │ ...                      │
└──────────────────────┴───────────┴────────┴────────┴──────────────────────────┘

Recomendação Final:
[ ] Participar sem ressalvas
[ ] Participar com impugnação parcial de cláusulas
[ ] Participar com precificação de contingência adicional de ____%
[ ] Não participar (riscos inaceitáveis)

Prazo para Impugnação: __/__/____ (3 dias úteis antes da abertura)
Responsável pela análise: ___________________ ART/RRT: ___________
```

## Impugnação ao Edital

### Quando Impugnar

- Exigências de habilitação restritivas ou discriminatórias
- Especificações que direcionam para produto ou fornecedor específico
- Prazo de execução fisicamente impossível
- Matriz de risco transferindo ao contratado riscos que são da Administração
- Ausência de estudos técnicos obrigatórios (geotécnico, interferências, topografia)
- Orçamento de referência com metodologia irregular (BDI, encargos)
- Exigência de garantia acima dos limites legais

### Prazo Legal
- Até 3 dias úteis antes da data de abertura (Lei 14.133/2021, Art. 164)
- Resposta da Administração: em até 3 dias úteis

### Estrutura da Impugnação

1. **Identificação** do licitante impugnante
2. **Dispositivo legal** violado (com transcrição)
3. **Cláusula impugnada** (transcrição exata)
4. **Argumentação técnica e jurídica** detalhada
5. **Pedido** específico (exclusão, substituição, prazo adicional)
6. **Documentação** de suporte (normas, jurisprudência TCU, doutrina)

## Anti-Padrões a Evitar

- Avaliar apenas riscos financeiros sem considerar riscos técnicos e de prazo
- Aceitar matriz de risco que transfere ao contratado riscos de projeto inadequado
- Ignorar o histórico de pagamentos do órgão (risco de inadimplência)
- Não verificar se o prazo de execução é fisicamente compatível com o porte da obra
- Impugnar sem fundamentação técnica e jurídica sólida (pode prejudicar a empresa)

## Referências para Impugnações

- **Lei 14.133/2021** — Arts. 40, 63, 69, 164, 165
- **Acórdão TCU 2081/2016** — Exigências restritivas de habilitação
- **Acórdão TCU 2173/2019** — Matriz de riscos em contratos de obras
- **Acórdão TCU 1977/2013** — Projeto básico como condição de licitação
- **Súmula TCU 269** — Prorrogação e aditivos contratuais
- **IN SEGES 65/2021** — Orçamento de referência para obras federais
