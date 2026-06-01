---
name: sinapi-conformidade
description: Verificar conformidade de preços de orçamentos com a tabela SINAPI, identificar desvios, classificar itens e gerar análise de conformidade para TCU/CGU/TCEs. Use quando auditar preços de planilhas orçamentárias, verificar sobrepreço, comparar preços propostos com referência SINAPI, ou preparar parecer técnico de conformidade.
user-invocable: true
argument-hint: "<item ou planilha a verificar> <UF> <mês de referência>"
---

# Conformidade de Preços com o SINAPI


## Quando Ativar

- Auditar preços de uma planilha orçamentária apresentada em licitação
- Verificar se há sobrepreço antes de assinar um contrato
- Preparar parecer técnico de conformidade para TCU/CGU/TCE
- Comparar preços propostos por construtoras com a referência SINAPI
- Identificar itens que precisam de cotação de mercado (sem código SINAPI)

**Importante**: Este skill auxilia na verificação de conformidade mas não substitui parecer técnico formal. Análises destinadas a processos administrativos ou judiciais devem ser assinadas por profissional habilitado com ART/RRT.

## O que é o SINAPI

**SINAPI — Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil**

Mantido pela **Caixa Econômica Federal** em parceria com o **IBGE**, publicado mensalmente com preços de referência para:
- **Insumos:** materiais, equipamentos e mão de obra
- **Composições:** serviços completos com coeficientes de consumo

Organizado por **27 UFs** (estados + DF), disponível nas versões:
- **ISD** — Insumos Sem Desoneração (não desonerado)
- **ICD** — Insumos Com Desoneração
- **ISE** — Insumos Sem Encargos (custo apenas de materiais e equipamentos)

### Obrigatoriedade Legal

| Norma | Obrigatoriedade |
|---|---|
| Lei 14.133/2021, Art. 23 | SINAPI é referência obrigatória para obras e serviços de engenharia financiados com recursos federais |
| Lei 13.303/2016, Art. 43 | Estatais devem usar SINAPI como referência |
| IN SEGES 65/2021 | Define metodologia de uso do SINAPI em orçamentos federais |
| Acórdão TCU 2622/2013 | Reforça SINAPI como balizador de preços |

> Estados e municípios com recursos próprios podem usar tabelas estaduais (ORSE-SE, SEINFRA-MG, EMOP-RJ, etc.), mas o SINAPI é sempre aceito como referência alternativa.

## Metodologia de Verificação de Conformidade

### Passo 1 — Identificação da Base de Referência

Antes de comparar, identificar:
1. **UF da obra** — preços variam por estado
2. **Mês de referência** — SINAPI publicado com 1-2 meses de defasagem
3. **Regime** — desonerado ou não desonerado (deve ser consistente em todo o orçamento)
4. **Tipo de item** — insumo ou composição

### Passo 2 — Localização do Item no SINAPI

Localizar pelo **código SINAPI** (5 a 7 dígitos). Se o código não existir:
- Buscar por descrição similar
- Verificar se é item não tabelado (justificar com 3 cotações ou composição própria)
- Verificar se o código está desatualizado (SINAPI tem manutenções mensais)

### Passo 3 — Comparação de Preços

```
Desvio (%) = (Preço Praticado - Preço SINAPI) / Preço SINAPI × 100
```

### Passo 4 — Classificação do Desvio

| Desvio | Classificação | Ação Recomendada |
|---|---|---|
| ≤ 0% | **Abaixo da referência** | Verificar exequibilidade (preço anormalmente baixo) |
| 0% a 5% | **Conforme** | Dentro da margem de mercado |
| 5% a 15% | **Atenção** | Verificar justificativa; pode ser aceitável com comprovação |
| 15% a 25% | **Sobrepreço provável** | Exige justificativa técnica robusta ou reajuste |
| > 25% | **Sobrepreço grave** | Glosa ou adequação obrigatória em obras públicas |

> 💡 A tolerância de 5% é prática de mercado amplamente aceita pelo TCU. Acima de 10% já há risco de questionamento em auditoria.

### Passo 5 — Tratamento de Itens Não Tabelados

Para itens sem código SINAPI correspondente:
1. **Composição própria** baseada em insumos SINAPI
2. **3 cotações de mercado** (notas fiscais, propostas de fornecedores)
3. **Tabelas estaduais complementares** (ORSE, SEINFRA, EMOP, etc.)
4. **SICRO** para itens de infraestrutura viária
5. **TCPO/PINI** para composições analíticas não cobertas pelo SINAPI

## Análise de Sobrepreço vs Superfaturamento

### Sobrepreço
Preço unitário acima da referência de mercado **no momento da contratação**.
- Verificado na fase de licitação (orçamento básico) ou na execução
- Pode ser corrigido por impugnação ao edital ou negociação

### Superfaturamento
Cobrança por serviços **não executados** ou executados em quantidade/qualidade inferior ao contratado.
- Verificado na fase de medição e pagamento
- Implica responsabilidade solidária do gestor público e do contratado

## Itens de Atenção Especial em Auditorias

### Itens Frequentemente Sobrepreçados

1. **Escavações e terraplanagem** — quantidade difícil de medir, fácil de superfaturar
2. **Composições de transporte** — DMT (Distância Média de Transporte) é parâmetro crítico
3. **Concreto usinado** — diferença entre fck e classe de agressividade
4. **Serviços de concretagem** — lançamento e adensamento separados da compra do concreto
5. **Revestimentos e pintura** — espessuras e número de demãos
6. **Fundações** — tipo de solo pode justificar diferenças significativas

### Itens Frequentemente Sem Referência SINAPI

1. Equipamentos especiais (elevadores, geradores, UPS)
2. Sistemas de automação predial (BMS, CFTV)
3. Itens importados
4. Tecnologias novas (painéis fotovoltaicos de nova geração)
5. Serviços especializados de engenharia

Para esses, exigir cotações de mercado ou composição analítica detalhada.

## Modelos de Parecer de Conformidade

### Parecer Simplificado (por item)

```
Item: [código SINAPI] [descrição]
Unidade: [UN]
Preço Praticado: R$ [valor]
Preço SINAPI ([UF]/[mês/ano]): R$ [valor]
Desvio: [+/-XX%]
Classificação: [CONFORME / ATENÇÃO / SOBREPREÇO]
Observação: [justificativa se aplicável]
```

### Parecer Consolidado (por planilha)

```
ANÁLISE DE CONFORMIDADE SINAPI
Obra: _______________
Responsável: _______________ CREA/CAU: _______
Período de referência: __/__/____
UF: ___ Regime: [ND/D]

Resumo:
- Total de itens analisados: ___
- Itens conformes (≤5% desvio): ___ (___%)
- Itens em atenção (5-15%): ___ (___%)
- Itens com sobrepreço (>15%): ___ (___%)
- Itens sem referência SINAPI: ___ (___%)

Impacto financeiro do sobrepreço:
- Valor total do orçamento: R$ ___
- Valor referenciado SINAPI: R$ ___
- Sobrepreço identificado: R$ ___ (___%)

Recomendação: [APROVADO / APROVADO COM RESSALVAS / REPROVADO]
```

## Variação de Preços Entre UFs

O SINAPI apresenta variações significativas entre estados. Fatores que influenciam:

- **Logística e frete** — estados remotos têm insumos mais caros
- **Mão de obra regional** — salário normativo varia por sindicato
- **Impostos estaduais** — ICMS diferenciado por UF
- **Mercado local** — concorrência entre fornecedores

Variação típica entre UF mais cara e mais barata: 20% a 40%.

> ⚠️ Nunca use preços de outra UF para comparar. Se a obra é em MG, use SINAPI/MG. Se em SP, use SINAPI/SP.

## Atualização Monetária de Preços SINAPI

Quando o orçamento foi elaborado em data anterior ao SINAPI atual, é possível atualizar usando:

- **INCC** (Índice Nacional de Custo da Construção — FGV): índice mensal de variação de custos
- **CUB** (Custo Unitário Básico — SINDUSCON): por tipo de obra e padrão
- Fórmula paramétrica contratual (quando prevista no contrato)

```
Preço Atualizado = Preço Base × (INCC Atual / INCC Base)
```

## Anti-Padrões a Evitar

- Comparar preços de UF diferente da obra (cada estado tem preços próprios)
- Usar tabela SINAPI de mês diferente do orçamento sem correção monetária
- Misturar tabela desonerada com não desonerada no mesmo orçamento
- Aceitar "sem referência SINAPI" como justificativa sem exigir cotações
- Focar no desvio % sem calcular o impacto financeiro absoluto

## Referências

- **SINAPI:** https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi
- **SICRO (DNIT):** http://www.dnit.gov.br/custos-e-pagamentos/sicro
- **TCU Acórdão 2622/2013** — Limites de BDI e metodologia de verificação
- **IN SEGES 65/2021** — Elaboração de orçamentos de obras públicas federais
- **Lei 14.133/2021, Art. 23** — Obrigatoriedade de uso do SINAPI
- **TCU Acórdão 1094/2013** — Sobrepreço e superfaturamento: conceitos e responsabilidade
