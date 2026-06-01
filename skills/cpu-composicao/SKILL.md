---
name: cpu-composicao
description: Criar e verificar Composições de Preço Unitário (CPU) para orçamentos de obras — metodologia de coeficientes, encargos sociais, produtividade, fontes de referência e boas práticas. Use quando montar composições analíticas para serviços não tabelados no SINAPI, verificar coeficientes de consumo, calcular encargos sobre mão de obra, ou auditar composições apresentadas por construtoras.
user-invocable: true
argument-hint: "<serviço a compor> ou <composição a verificar>"
---

# Composições de Preço Unitário (CPU)


## Quando Ativar

- Criar composição para serviço que não existe pronto no SINAPI
- Verificar se os coeficientes de uma CPU apresentada por construtora são razoáveis
- Calcular o custo real de um serviço com encargos sociais corretos
- Montar composição analítica para justificar preço acima da referência SINAPI
- Entender a diferença de custo entre regime desonerado e não desonerado

**Importante**: Este skill fornece metodologia e referências para composições de preço. Os coeficientes específicos devem ser verificados contra fontes técnicas reconhecidas (SINAPI analítico, TCPO, normas ABNT) e adaptados às condições reais da obra.

## O que é uma CPU

Uma **Composição de Preço Unitário** é a "receita" de quanto custa executar 1 unidade de um serviço. Detalha todos os insumos necessários (materiais, mão de obra, equipamentos) e seus coeficientes de consumo por unidade de serviço.

```
Preço Unitário = Σ (Coeficiente_i × Preço_Insumo_i) + Encargos sobre MO
```

## Estrutura de uma CPU

### Grupos de Insumos

| Tipo | Sigla | Descrição | Exemplos |
|---|---|---|---|
| **Material** | M | Insumos incorporados à obra | Cimento, areia, tijolos, tinta |
| **Mão de Obra** | MO | Profissionais que executam o serviço | Pedreiro, servente, eletricista |
| **Equipamentos** | E | Máquinas e ferramentas | Betoneira, andaime, compactador |
| **Transporte** | T | Movimentação de materiais | Frete, caminhão basculante |

### Campos Obrigatórios de cada Insumo

```
Código SINAPI: [código]
Descrição: [texto]
Unidade: [un]
Coeficiente: [quantidade por unidade do serviço]
Preço Unitário: R$ [preço SINAPI ou cotação]
Subtotal: Coeficiente × Preço Unitário
```

## Coeficientes de Consumo

### O que é o Coeficiente

Indica **quanto** de cada insumo é necessário para executar **1 unidade** do serviço.

```
Exemplo: Alvenaria de tijolo cerâmico 9x19x19cm, e=14cm (1 m²)
- Tijolos cerâmicos: 40 un/m² (coeficiente = 40)
- Cimento CP II: 5,12 kg/m² (coeficiente = 5,12)
- Areia média: 0,013 m³/m² (coeficiente = 0,013)
- Pedreiro: 0,55 Hh/m² (coeficiente = 0,55)
- Servente: 0,55 Hh/m² (coeficiente = 0,55)
```

### Fontes de Referência para Coeficientes

| Fonte | Tipo | Confiabilidade | Disponibilidade |
|---|---|---|---|
| **SINAPI Analítico (Caixa)** | Oficial | Muito alta | Gratuita |
| **TCPO (PINI)** | Privada | Muito alta | Paga (assinatura) |
| **ORSE analítico (Sergipe)** | Oficial estadual | Alta | Gratuita |
| **Normas ABNT** | Técnica | Alta | Paga |
| **Manual DNIT/SICRO** | Oficial (rodoviário) | Muito alta | Gratuita |
| **Literatura técnica** | Diversa | Variável | Diversa |
| **Experiência própria** | Empírica | Depende do histórico | Interna |

### Fatores que Alteram Coeficientes

**Condições da obra:**
- Altura (andares elevados → maior Hh por m²)
- Geometria (peças especiais → maior desperdício de material)
- Acesso (área restrita → menor produtividade)
- Clima (chuva, calor → reduz produtividade)

**Características do serviço:**
- Espessura (reboco 20mm vs 10mm: coef. dobra)
- Tipo de material (tijolo maciço vs cerâmico: coef. diferentes)
- Padrão de acabamento (padrão popular vs alto padrão)

**Equipe:**
- Composição da equipe (proporção pedreiro/servente)
- Mecanização (com/sem equipamento)

## Encargos Sociais — Cálculo sobre Mão de Obra

Os encargos sociais incidem sobre o **custo da hora de trabalho** e devem ser calculados separadamente do BDI.

### Regime Não Desonerado (~127,5%)

| Componente | % sobre Salário |
|---|---|
| INSS Patronal | 20,00% |
| FGTS | 8,00% |
| SAT/RAT | 3,00% |
| Salário Educação | 2,50% |
| SESC/SENAI | 1,50% |
| SEBRAE | 0,60% |
| INCRA | 0,20% |
| SECONCI | 1,00% |
| Férias + 1/3 | 13,33% |
| 13º Salário | 8,33% |
| Licença Maternidade | 0,00% |
| Aviso Prévio | 0,42% |
| Incidência sobre Férias e 13º | 18,00% |
| Multa do FGTS | 3,20% |
| Vale Transporte (estimado) | 5,00% |
| Outros (EPI, exames) | 3,00% |
| **TOTAL APROXIMADO** | **~127,5%** |

### Regime Desonerado (~96,8%)

INSS patronal (20%) substituído pela **CPRB** (Contribuição Previdenciária sobre Receita Bruta = 2%):
- Base menor de contribuição previdenciária
- Total aproximado: **~96,8%** sobre o salário

> **Quando usar cada regime:**
> - Se a empresa é optante pelo regime desonerado da Lei 12.546/2011 → usar tabela desonerada do SINAPI (ICD) e encargos desonerados
> - Se a empresa recolhe INSS normalmente → usar tabela não desonerada (ISD) e encargos ND
> - **Nunca misturar:** tabela desonerada com encargos ND (ou vice-versa) resulta em preço incorreto

### Aplicação na CPU

```
Custo MO = Σ (Coeficiente_MO × Salário_Hora)
Encargos = Custo MO × (% Encargos / 100)
Custo MO total = Custo MO + Encargos

Exemplo:
Pedreiro: 0,55 Hh × R$ 18,50/h = R$ 10,18
Servente: 0,55 Hh × R$ 14,20/h = R$ 7,81
Custo MO = R$ 17,99
Encargos (127,5%): R$ 17,99 × 1,275 = R$ 22,94
Custo MO total = R$ 17,99 + R$ 22,94 = R$ 40,93
```

## Tipos de Desperdício a Considerar nos Coeficientes

| Material | Fator de Desperdício Típico | Observação |
|---|---|---|
| Concreto usinado | 1,03 a 1,05 | Perdas na concretagem e cura |
| Argamassa | 1,30 | Alta perda em revestimentos |
| Tijolos cerâmicos | 1,05 a 1,10 | Quebra e cortes |
| Revestimento cerâmico | 1,10 a 1,15 | Cortes e rejeição |
| Tinta | 1,05 a 1,10 | Perdas na aplicação |
| Aço CA-50/60 | 1,10 a 1,15 | Perdas em cortes e emendas |
| Madeira de forma | 1,10 a 1,20 | Reaproveitamento parcial |
| Tubulação PVC | 1,05 | Conexões e perdas |

## Composições Complexas — Composição de 2º Nível

Algumas composições contêm outras composições como insumos (composições analíticas):

```
Exemplo: Laje maciça armada (1 m²)
├── Forma de madeira (1,05 m²) → subcmposição
│   ├── Madeira serrada
│   ├── Pregos
│   └── Carpinteiro (Hh)
├── Armação CA-50 (XX kg) → subcomposição
│   ├── Aço CA-50
│   └── Ferreiro (Hh)
└── Concreto FCK=25MPa (XX m³) → subcomposição
    ├── Cimento
    ├── Areia
    ├── Brita
    └── Pedreiro (Hh)
```

No SINAPI, composições analíticas já incorporam os insumos de 2º nível.

## Verificação de CPU Apresentada por Construtora

Checklist para auditoria de composição:

- [ ] Código SINAPI de cada insumo (quando existente)
- [ ] Coeficientes compatíveis com SINAPI analítico ou TCPO
- [ ] Encargos sociais calculados apenas sobre MO (não sobre materiais)
- [ ] Regime de encargos consistente com a tabela SINAPI usada
- [ ] Fator de desperdício justificado para o tipo de material
- [ ] Produtividade compatível com condições reais da obra
- [ ] Equipamentos com taxa de depreciação e manutenção (não apenas aluguel)
- [ ] Preços dos insumos compatíveis com SINAPI do mês/UF correspondentes

### Indícios de Manipulação de CPU

- Coeficientes muito acima do SINAPI analítico sem justificativa
- Insumos com descrição vaga que impede verificação de preço
- Mão de obra com salário muito acima do piso sindical sem justificativa
- Equipamentos com taxa de hora muito acima do SICRO
- Composição criada para item que existe pronto no SINAPI

## Formatos de Registro de CPU

### Formato Tabular (padrão planilha)

| Código | Descrição | Tipo | Un | Coef. | P.Unit (R$) | Subtotal (R$) |
|---|---|---|---|---|---|---|
| 4721 | Cimento CPII-F-32 | M | kg | 5,12 | 0,82 | 4,20 |
| 4267 | Areia média | M | m³ | 0,013 | 95,00 | 1,24 |
| 37273 | Tijolo cerâmico 9cm | M | un | 40 | 0,55 | 22,00 |
| 88239 | Pedreiro | MO | h | 0,55 | 18,50 | 10,18 |
| 88245 | Servente | MO | h | 0,55 | 14,20 | 7,81 |
| — | Custo MO | — | — | — | — | 17,99 |
| — | Encargos (127,5%) | — | — | — | — | 22,94 |
| **TOTAL** | **Alvenaria 9cm (1m²)** | — | m² | — | — | **68,37** |

## Anti-Padrões a Evitar

- Aplicar encargos sociais sobre materiais (encargos incidem APENAS sobre MO)
- Usar coeficientes de manual sem verificar se são compatíveis com a obra real
- Misturar coeficientes de diferentes fontes sem verificar compatibilidade
- Criar CPU para serviço que já existe no SINAPI analítico (duplicação desnecessária)
- Omitir o fator de desperdício para materiais com alta taxa de perda (argamassa, cerâmica)
