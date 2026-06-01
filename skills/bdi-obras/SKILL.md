---
name: bdi-obras
description: Calcular e validar o BDI (Benefícios e Despesas Indiretas) para obras públicas e privadas conforme Decreto nº 7.983/2013 e TCU Acórdão 2622/2013. Use quando calcular BDI, verificar limites TCU, justificar componentes, configurar percentuais por tipo de obra ou interpretar autuações de órgãos de controle.
user-invocable: true
argument-hint: "<tipo de obra> <componentes ou BDI calculado>"
---

# BDI para Obras — Decreto 7983/2013 & TCU Acórdão 2622/2013


## Quando Ativar

- Calcular o BDI de um orçamento pela primeira vez
- Verificar se o BDI está dentro dos limites do TCU
- Justificar tecnicamente um BDI acima dos limites de referência
- Entender a diferença entre regime desonerado e não desonerado
- Preparar memória de cálculo para processo licitatório

**Importante**: Este skill auxilia em cálculos e verificações de BDI mas não substitui análise técnica especializada. Todos os percentuais devem ser revisados por engenheiro ou arquiteto responsável com ART/RRT emitida.

## O que é o BDI

BDI — Benefícios e Despesas Indiretas — é o percentual acrescido ao custo direto de uma obra para obter o preço de venda (preço contratado). Inclui despesas administrativas, riscos, tributos e lucro da construtora.

**Preço de Venda = Custo Direto × (1 + BDI/100)**

## Fórmula Oficial — Decreto nº 7.983/2013, Art. 9º

```
BDI = [(1 + AC + S + R)(1 + DF)(1 + L) / (1 - I) - 1] × 100
```

### Componentes

| Sigla | Componente | Descrição | Faixa Típica |
|---|---|---|---|
| **AC** | Administração Central | Rateio das despesas da sede (salários administrativos, aluguel, TI, etc.) | 3% a 6% |
| **S** | Seguros e Garantias | Seguro de obras, garantias contratuais, caução | 0,3% a 1% |
| **R** | Risco | Imprevistos, variações de mercado, risco operacional | 0,5% a 2% |
| **DF** | Despesas Financeiras | Custo do capital de giro durante a execução | 0,5% a 1,5% |
| **L** | Lucro | Remuneração do capital investido | 5% a 10% |
| **I** | Tributos (ISS + PIS + COFINS) | Incidência tributária sobre o faturamento | 6% a 12% |

### Exemplo de Cálculo

Dados: AC=4%, S=0,5%, R=1,27%, DF=1,23%, L=7,4%, I=8,65%

```
Numerador:   (1 + 0,04 + 0,005 + 0,0127) × (1 + 0,0123) × (1 + 0,074)
           = 1,0577 × 1,0123 × 1,074
           = 1,1502

Denominador: (1 - 0,0865) = 0,9135

BDI = (1,1502 / 0,9135 - 1) × 100 = (1,2592 - 1) × 100 = 25,92%
```

## Limites do TCU — Acórdão 2622/2013

O TCU estabelece **limites de referência** por tipo de obra. Ultrapassá-los exige justificativa técnica fundamentada no processo licitatório.

| Tipo de Obra | Limite BDI (referência) | Observação |
|---|---|---|
| **Obras Civis em Geral** | **25%** | Edificações, saneamento, urbanização |
| **Instalações Elétricas e Mecânicas** | **24%** | Sistemas elétricos, AVAC, automação |
| **Fornecimento de Materiais e Equipamentos** | **15%** | Itens de fornecimento sem montagem |
| **Fornecimento c/ Instalação (Equipamentos)** | **22%** | Equipamentos especiais c/ montagem |

> ⚠️ Estes são **limites de razoabilidade**, não proibições absolutas. O TCU aceita BDI acima dos limites desde que devidamente justificado com memória de cálculo detalhada.

## O que NÃO entra no BDI

Conforme Decreto 7983/2013 e jurisprudência do TCU, os seguintes itens **não devem** compor o BDI:

- Encargos sociais (devem estar no custo direto da mão de obra)
- IRPJ e CSLL (tributos sobre o lucro, não sobre o faturamento)
- Depreciação de equipamentos (custo direto)
- Materiais incorporados à obra (custo direto)
- Custos de canteiro e instalações (custo direto)

## Regimes de Tributação e ISS

O componente **I** (tributos) varia conforme o regime tributário da empresa e o município da obra:

| Regime | ISS | PIS | COFINS | Total típico |
|---|---|---|---|---|
| Lucro Presumido | 2% a 5% | 0,65% | 3% | 5,65% a 8,65% |
| Simples Nacional | Depende da faixa | — | — | Verificar tabela PGDAS |
| Lucro Real | 2% a 5% | 1,65% | 7,6% | 11,25% a 14,25% |

> 💡 **Atenção:** O ISS é municipal. Verificar a alíquota no município onde a obra será executada (varia de 2% a 5%).

## Diferença de BDI entre Desonerado e Não Desonerado

No regime **desonerado** (Lei 12.546/2011), a empresa recolhe CPRB (2% sobre receita) em vez de INSS patronal (20% sobre folha). Isso **não altera diretamente o BDI** — o que muda é o custo da mão de obra no custo direto. Porém, algumas empresas ajustam o componente AC e L do BDI conforme o regime.

- **Tabela SINAPI Desonerada (ICD):** preços com encargos reduzidos → BDI pode ser ligeiramente maior para compensar
- **Tabela SINAPI Não Desonerada (ISD):** preços com encargos completos → BDI padrão

**Não misture:** se usar tabela desonerada, o BDI deve ser calculado no regime desonerado.

## Como Justificar BDI Acima dos Limites TCU

Se o BDI calculado ultrapassar os limites de referência, a justificativa técnica deve conter:

1. **Memória de cálculo detalhada** de cada componente com base documental
2. **AC elevado:** comprovação de estrutura administrativa maior (obras complexas, remotas, múltiplas frentes)
3. **R elevado:** identificação dos riscos específicos do contrato (geológico, climático, social)
4. **DF elevado:** demonstração de maior capital de giro necessário (cronograma longo, pagamentos atrasados)
5. **L elevado:** justificativa de mercado (obra especializada, poucos concorrentes, alta demanda)
6. **Referência a acordãos TCU favoráveis** em obras similares

## Verificação de Conformidade — Checklist

Para cada orçamento apresentado em licitação pública:

- [ ] BDI calculado com a fórmula oficial do Decreto 7983/2013
- [ ] Cada componente documentado com memória de cálculo
- [ ] Encargos sociais fora do BDI (no custo direto)
- [ ] IRPJ e CSLL fora do BDI
- [ ] BDI dentro dos limites TCU OU justificativa técnica documentada
- [ ] Regime tributário (ISS municipal verificado)
- [ ] Consistência entre regime de encargos (ND ou D) e tabela SINAPI utilizada
- [ ] ART/RRT do responsável técnico emitida

## Anti-Padrões a Evitar

- Incluir IRPJ e CSLL no BDI (são tributos sobre lucro, não faturamento)
- Incluir encargos sociais no BDI (devem estar no custo direto da MO)
- Usar o mesmo BDI para materiais e serviços (TCU exige BDI menor para materiais)
- Aplicar BDI sobre insumos de desoneração diferente da tabela SINAPI usada
- Calcular BDI sem registrar a memória de cálculo por componente

## Referências Normativas

- **Decreto nº 7.983/2013** — Regras e critérios para elaboração de orçamento de referência de obras públicas
- **TCU Acórdão 2622/2013** — Limites de BDI por tipo de obra (Plenário)
- **TCU Acórdão 325/2007** — Composição e metodologia de cálculo do BDI
- **TCU Acórdão 2369/2011** — Encargos sociais e BDI desonerado
- **Lei 14.133/2021** — Art. 23: obrigatoriedade de uso de SINAPI/SICRO como referência
- **IN SEGES 65/2021** — Critérios para elaboração de orçamentos de obras públicas federais
