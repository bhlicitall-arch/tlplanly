---
name: curva-abc-obras
description: Gerar e interpretar a Curva ABC de orçamentos de obras — análise de Pareto por representatividade financeira, identificação de itens críticos, estratégias de negociação e auditoria focada. Use quando classificar itens do orçamento por importância, identificar onde focar negociação ou auditoria, ou apresentar análise de representatividade para gestores e órgãos de controle.
user-invocable: true
argument-hint: "<planilha ou lista de itens do orçamento>"
---

# Curva ABC para Orçamentos de Obras


## Quando Ativar

- Antes de negociar com fornecedores (priorizar os itens Classe A)
- Para apresentar análise de representatividade em relatório para TCU/CGU
- Para definir onde concentrar esforços de fiscalização de obra
- Após montar o orçamento completo para identificar itens críticos
- Para detectar anomalias (fracionamento, subdimensionamento de itens importantes)

**Importante**: A Curva ABC é uma ferramenta analítica de apoio à decisão. As faixas de classificação (80/95/100) são convenção amplamente adotada, mas podem ser ajustadas conforme o contexto da obra e a finalidade da análise.

## O que é a Curva ABC

A Curva ABC aplica o **Princípio de Pareto (80/20)** a orçamentos de obras: a maioria do custo se concentra em poucos itens. Ordenando os itens por valor decrescente e calculando o percentual acumulado, é possível identificar quais itens merecem atenção prioritária.

### Por que é importante

- **Construtores:** negociar melhor os itens que mais impactam o custo total
- **Fiscais e auditores:** focar a auditoria nos itens com maior risco financeiro
- **Gestores públicos:** TCU e CGU usam Curva ABC para priorizar verificações
- **Engenheiros de custos:** identificar onde pequenos erros têm grande impacto

## Classificação das Classes

### Classe A — Itens Críticos
- **Faixa:** 0% a 80% do custo acumulado
- **Característica:** Poucos itens, alto impacto individual
- **Ação:** Negociação intensiva, especificação rigorosa, auditoria detalhada, acompanhamento semanal na execução

### Classe B — Itens Intermediários
- **Faixa:** 80% a 95% do custo acumulado
- **Característica:** Número médio de itens, impacto individual moderado
- **Ação:** Negociação padrão, acompanhamento quinzenal, cotação com pelo menos 2 fornecedores

### Classe C — Itens de Baixo Impacto
- **Faixa:** 95% a 100% do custo acumulado
- **Característica:** Muitos itens, baixo impacto individual
- **Ação:** Simplificar processo de compra, agrupar compras, contratação global

## Metodologia de Cálculo

### Passo a Passo

1. **Calcular o valor total de cada item:**
   ```
   Valor Item = Quantidade × Preço Unitário c/ BDI
   ```

2. **Ordenar em ordem decrescente** por valor total

3. **Calcular % de participação individual:**
   ```
   % Item = Valor Item / Valor Total da Obra × 100
   ```

4. **Calcular % acumulado** (soma progressiva)

5. **Classificar:**
   - Até 80% acumulado → Classe A
   - 80% a 95% acumulado → Classe B
   - 95% a 100% acumulado → Classe C

### Exemplo Ilustrativo

| # | Item | Valor (R$) | % Individual | % Acumulado | Classe |
|---|---|---|---|---|---|
| 1 | Concreto estrutural | 450.000 | 22,5% | 22,5% | A |
| 2 | Armação de aço | 380.000 | 19,0% | 41,5% | A |
| 3 | Escavação e aterro | 210.000 | 10,5% | 52,0% | A |
| 4 | Alvenaria | 185.000 | 9,25% | 61,25% | A |
| 5 | Cobertura | 165.000 | 8,25% | 69,5% | A |
| 6 | Instalações elétricas | 120.000 | 6,0% | 75,5% | A |
| 7 | Revestimentos | 90.000 | 4,5% | 80,0% | A/B |
| 8 | Pintura | 75.000 | 3,75% | 83,75% | B |
| ... | ... | ... | ... | ... | ... |

**Resultado:** 7 itens (Classe A) = 80% do custo. Demais 30+ itens = 20% restante.

## Interpretação e Uso Estratégico

### Para Construtoras (Modo Construtor)

**Negociação de Materiais Classe A:**
- Negociar direto com fabricantes (não distribuidores)
- Contratos de fornecimento de longo prazo com preço fixo
- Compra antecipada para itens com alta volatilidade de preço (aço, cimento)
- Lote único vs. entregas parceladas — comparar custo de estoque

**Composição de Equipes:**
- Classe A: equipe própria da construtora (controle de qualidade e custo)
- Classe B: subempreitada com contrato formal e medições
- Classe C: subempreitada simplificada ou compra por pacote

**Controle de Execução:**
- Classe A: medição semanal, acompanhamento diário do engenheiro de campo
- Classe B: medição quinzenal
- Classe C: medição mensal, verificação por amostragem

### Para Auditores e Fiscais (Modo Auditor)

**Priorização de Auditoria:**
Os itens Classe A concentram 80% do custo e do risco financeiro. Uma auditoria eficiente deve:
1. Verificar TODOS os itens Classe A quanto ao preço e quantitativo
2. Verificar AMOSTRA ESTATÍSTICA dos itens Classe B (30-50%)
3. Verificar AMOSTRA dos itens Classe C (10-20%) por sondagem

**Foco nos Itens Mais Auditados:**
- **Terraplanagem:** DMT (Distância Média de Transporte) — verificar topografia
- **Fundações:** tipo de solo justifica fundação escolhida?
- **Estrutura de concreto:** conferir fck especificado vs. executado
- **Instalações elétricas:** conferir cabeamento, disjuntores, quadros
- **Serviços de acabamento:** metragem real vs. medida

## Variações da Curva ABC

### Curva ABC por Categoria
Além da curva geral, fazer análise por categoria:
- **Materiais** — onde estão concentrados os materiais mais caros?
- **Mão de obra** — quais atividades consomem mais horas?
- **Equipamentos** — quais equipamentos têm maior impacto?

### Curva ABC Temporal (por fase)
Distribua os itens por fase da obra (fundação, estrutura, acabamentos) e faça a curva ABC dentro de cada fase. Útil para cronograma financeiro e gestão de caixa.

### Curva ABC por Fornecedor
Após a contratação: quais fornecedores concentram 80% das compras? Gestão de fornecedores prioritários.

## Curva ABC em Relatórios para Órgãos de Controle

### Formato Padrão para TCU/CGU/TCEs

```
ANÁLISE CURVA ABC
Obra: _________________ Processo: _____________
Valor Total: R$ _________ Data Base: ___/____

Distribuição por Classe:
┌─────────┬──────────────────┬──────────────────┬──────────────────┐
│ Classe  │ Nº Itens         │ Valor (R$)       │ % do Total       │
├─────────┼──────────────────┼──────────────────┼──────────────────┤
│ A       │ __ (___% itens)  │ R$ _______       │ ≈ 80%            │
│ B       │ __ (___% itens)  │ R$ _______       │ ≈ 15%            │
│ C       │ __ (___% itens)  │ R$ _______       │ ≈ 5%             │
├─────────┼──────────────────┼──────────────────┼──────────────────┤
│ TOTAL   │ ____             │ R$ _______       │ 100%             │
└─────────┴──────────────────┴──────────────────┴──────────────────┘

Conclusão: Os ___ itens da Classe A correspondem a ___% dos itens e
concentram ___% do valor total da obra, sendo prioritários para
verificação e acompanhamento.
```

## Alertas e Anomalias na Curva ABC

### Curva muito plana (muitos itens com valores similares)
- Pode indicar fracionamento artificial de itens
- Verificar se itens deveriam estar agrupados
- Risco de burla a limites de dispensa de licitação

### Item único com participação >30%
- Risco de dependência de fornecedor único
- Verificar se não há subdivisão necessária
- Analisar se o item pode ser licitado separadamente

### Classe A com apenas 1-2 itens
- Orçamento pode estar superfaturado nesses itens
- Verificar conformidade SINAPI com prioridade máxima

### Ausência de itens esperados para o tipo de obra
- Ex.: obra de escola sem itens de instalações elétricas na Classe A
- Pode indicar itens omitidos (obra incompleta) ou subdimensionamento

## Integração com Auditoria SINAPI

A Curva ABC potencializa a auditoria SINAPI:

1. Gerar a Curva ABC
2. Verificar conformidade SINAPI **em ordem da Curva ABC** (Classe A primeiro)
3. Um desvio de 10% num item Classe A de R$ 500.000 = R$ 50.000 de sobrepreço
4. Um desvio de 50% num item Classe C de R$ 500 = R$ 250 (irrelevante)

**Impacto financeiro por classe:**
```
Impacto Sobrepreço = Valor Item × Desvio%
```

Focar onde o impacto financeiro é maior — não onde o desvio percentual é maior.

## Anti-Padrões a Evitar

- Fazer Curva ABC com preços sem BDI misturados com preços com BDI
- Usar % de participação baseado em quantidade em vez de valor financeiro
- Tratar itens com mesmo código mas especificações diferentes como um único item
- Ignorar a Curva ABC em obras pequenas (ela é útil independente do porte)
- Apresentar apenas a classificação sem o % acumulado (perde o raciocínio de Pareto)
