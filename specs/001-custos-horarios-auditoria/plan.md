# Implementation Plan: Custos Horarios Auditaveis

**Branch**: `codex/001-custos-horarios-auditoria` | **Date**: 2026-06-30 | **Spec**: `specs/001-custos-horarios-auditoria/spec.md`

**Input**: Especificacao de custos horarios auditaveis criada a partir dos apontamentos do orcamentista e dos prints de referencia do concorrente.

## Summary

Transformar o modulo atual de Custos Horarios em um subsistema de engenharia de custos: calculo de equipamento e mao de obra com memoria, insumos codificados, modo calculado/manual, demonstrativo produtivo/improdutivo, beneficios compostos e integracao com CPUs.

O trabalho deve priorizar confianca tecnica, auditabilidade e fluxo profissional para orcamentistas. A inovacao desejada esta na combinacao de: calculo transparente, vinculo ao banco de insumos, rastreio de origem de cada parcela e reaproveitamento automatico nas composicoes.

## Technical Context

**Language/Version**: TypeScript/JavaScript, Node.js >=20.

**Primary Dependencies**: Express, TypeScript, ExcelJS, frontend HTML/CSS/JS modular.

**Storage**: Estado local no frontend e schema SaaS PostgreSQL quando `DATABASE_URL` existir.

**Testing**: `npm run compile`, `npm run test`, testes unitarios novos para formulas.

**Target Platform**: Web app TLPlanly, com operacao local/offline e modo SaaS.

**Project Type**: Aplicacao web de orcamentacao, auditoria e gestao de custos.

**Performance Goals**: Calculo instantaneo na interface; exportacao sem travar a tela; formulas testaveis fora do DOM.

**Constraints**:

- Manter compatibilidade com registros atuais de `STATE.equipamentosHorarios` e `STATE.maoObraHoraria`.
- Evitar criar regra critica apenas dentro de manipuladores de tela.
- Preservar o fluxo atual "Enviar CPU".
- Nao depender de internet para calcular custos com dados ja cadastrados.

**Scale/Scope**:

- Primeira entrega focada em custos horarios e beneficios.
- Preparada para centenas de equipamentos, funcoes e insumos auxiliares por projeto.
- Exportacao e auditoria devem funcionar por obra/projeto.

## Constitution Check

A constituicao do projeto em `.specify/memory/constitution.md` ainda esta no modelo original. Para esta frente, adotamos os seguintes portoes internos:

- Toda regra de calculo deve estar documentada antes da implementacao.
- Toda regra de calculo deve ter teste automatizado.
- Toda tela que salva custo deve preservar memoria de calculo.
- Toda parcela deve ter origem identificavel.
- Nenhuma integracao com CPU deve perder codigo, unidade, preco ou fonte.

## Current State

O projeto ja possui:

- Tela `Custos Horarios` em `frontend/index.html`.
- Funcoes de calculo em `frontend/src/main.js`.
- Estado para `equipamentosHorarios` e `maoObraHoraria`.
- Exportacao de custos horarios.
- Envio de custo horario para biblioteca de CPUs.
- Cadastro/importacao de insumos e composicoes.

Lacunas identificadas:

- Manutencao e valor manual por hora, nao K calculado.
- Nao ha modo "parcelas calculadas" versus "parcelas informadas".
- Nao ha busca obrigatoria do equipamento pelo cadastro de insumos.
- Nao ha composicao do equipamento por insumos auxiliares codificados.
- Nao ha resumo formal de produtivo/improdutivo.
- Beneficios de mao de obra sao campo unico, sem composicao auditavel.
- Formulas estao acopladas ao DOM, dificultando testes robustos.

## Project Structure

### Documentation

```text
specs/001-custos-horarios-auditoria/
|-- spec.md
|-- plan.md
`-- auditoria.md
```

### Source Code Planned

```text
frontend/
|-- index.html
`-- src/
    |-- main.js
    `-- styles.css

src/
|-- models/
|   `-- Insumo.ts
|-- services/
|   `-- [novo] CustosHorarios.ts
`-- persistence/
    `-- schema.sql

tests/
`-- [novo] test_custos_horarios.ts
```

**Structure Decision**: A primeira versao pode reaproveitar a interface modular atual, mas as formulas devem migrar para servico testavel em TypeScript ou, no minimo, para funcoes puras isoladas antes de serem chamadas pela tela.

## Work Plan

### Fase 0 - Validacao tecnica e benchmark controlado

Objetivo: confirmar as regras com o orcamentista antes de codificar.

Entregas:

- Revisar formulas de depreciacao, manutencao, produtivo e improdutivo.
- Confirmar se encargos de mao de obra incidem sobre salario + beneficios ou apenas salario.
- Confirmar tratamento de juros, impostos e seguros no improdutivo. Regra inicial: nao entram, pois o apontamento destacou depreciacao + mao de obra.
- Definir padrao de codigos locais: `IE`, `IH`, `IM`, `IA` ou equivalente.
- Definir se aluguel entra em material, manutencao, parcela propria ou "outros".

Saida esperada:

- SPEC aprovada ou ajustada.
- 3 exemplos numericos reais para testes.

### Fase 1 - Motor de calculo e modelo auditavel

Objetivo: criar o nucleo tecnico antes da tela.

Entregas:

- Modelo de dados para equipamento, parcelas, insumos auxiliares e beneficios.
- Funcoes puras para:
  - depreciacao horaria;
  - manutencao horaria por K;
  - produtivo;
  - improdutivo;
  - custo horario de mao de obra;
  - beneficios mensalizados;
  - resumo de memoria.
- Testes automatizados com os exemplos do orcamentista.
- Migracao segura de registros antigos.

Criterio de pronto:

- Testes passam sem depender de navegador.
- Cada resultado possui memoria e origem.

### Fase 2 - UX profissional de Custos Horarios

Objetivo: transformar a tela atual em fluxo de trabalho do orcamentista.

Entregas:

- Controle de tipo de calculo: parcelas calculadas, parcelas informadas, nao calcular.
- Campo K de manutencao ao lado do K de depreciacao.
- Busca por codigo do equipamento no cadastro de insumos.
- Painel "Insumos do equipamento" com codigo, descricao, unidade, tipo, consumo, preco unitario e total.
- Painel ou modal "Parcelas do custo horario" com produtivo/improdutivo.
- Botao para atualizar preco do insumo vinculado.
- Estados de alerta para codigo inexistente, preco zerado e memoria incompleta.

Criterio de pronto:

- O usuario consegue repetir o fluxo dos prints de referencia com menos campos manuais e mais rastreabilidade.

### Fase 3 - Beneficios de mao de obra

Objetivo: tirar beneficios do campo solto e criar composicao rastreavel.

Entregas:

- Botao "Compor beneficios".
- Itens de beneficio: almoco, jantar, alojamento, cesta basica, viagem, transporte e outros.
- Periodicidade: diario, semanal, mensal, por viagem ou valor direto.
- Busca opcional de beneficio por insumo codificado.
- Retorno automatico para o campo beneficios mensais.
- Memoria de beneficios dentro da memoria da mao de obra.

Criterio de pronto:

- O campo beneficios mensais pode ser explicado por itens e fontes.

### Fase 4 - Integracao com CPUs, insumos e exportacao

Objetivo: garantir que o custo horario aprovado vira dado operacional reutilizavel.

Entregas:

- Envio para biblioteca de CPUs preservando memoria.
- Atualizacao do preco do insumo vinculado quando autorizado.
- Exportacao Excel/PDF com demonstrativo de parcelas.
- Registro de origem: calculado, informado, insumo, cotacao.
- Preparacao para persistencia SaaS em PostgreSQL.

Criterio de pronto:

- Um custo horario pode ser criado, auditado, enviado para CPU e exportado sem perda de rastreabilidade.

### Fase 5 - Auditoria, testes e aprovacao com orcamentista

Objetivo: validar o modulo com uso real antes de tratar como pronto.

Entregas:

- Checklist `auditoria.md` preenchido.
- Testes automatizados rodando.
- Conferencia manual com 3 equipamentos e 3 funcoes de mao de obra.
- Comparacao com memoria externa ou sistema concorrente.
- Ajustes finos de arredondamento e nomenclatura.

Criterio de pronto:

- Orcamentista aprova os cenarios.
- Testes e exportacoes demonstram os mesmos valores.

## Professional Product Decisions

- A tela deve priorizar trabalho tecnico: informacao densa, blocos claros e demonstrativo direto.
- O usuario nunca deve precisar digitar descricao quando o codigo existe.
- Valores calculados e informados devem conviver, mas nunca se misturar sem origem.
- O sistema deve mostrar "por que chegou nesse valor", nao apenas o total.
- Custo improdutivo deve aparecer como conceito de equipamento parado.
- O modulo deve reforcar o posicionamento do TLPlanly: montar, provar e auditar o orcamento.

## Innovation Opportunities

- Memoria viva: clique em qualquer parcela e veja formula, origem e insumos que compoem.
- Recalculo assistido: quando preco de diesel ou operador mudar, o sistema sugere recalcular equipamentos afetados.
- Trilhas de confianca: badge de custo `Calculado`, `Informado`, `Cotacao`, `SINAPI` ou `Sem fonte`.
- Comparador de cenarios: equipamento novo, medio uso e velho, variando K de manutencao.
- Copilot de conferencia: explicar divergencias entre produtivo e improdutivo e apontar parcelas zeradas.
- Auditoria de completude: indicar custo horario salvo sem insumo vinculado, sem memoria ou com preco zerado.

## Risks and Mitigations

| Risco | Impacto | Mitigacao |
|---|---:|---|
| Formula errada por interpretacao | Alto | Validar exemplos numericos antes de implementar |
| Acoplamento das regras ao DOM | Alto | Criar funcoes puras e testes |
| Duplicidade de codigos de insumo | Medio | Definir precedencia e exibir fonte |
| Arredondamento divergente | Medio | Calculo interno com 4+ casas e exibicao com 2 |
| Usuario confundir modo calculado/manual | Medio | Mostrar origem das parcelas e pedir confirmacao ao trocar |
| Atualizar preco do insumo sem historico | Alto | Registrar snapshot e origem antes/depois |

## Quality Gates

Antes de iniciar implementacao:

- SPEC revisada.
- Exemplos reais coletados.
- Regra de encargos confirmada.

Antes de concluir Fase 1:

- Testes de formula escritos.
- Motor de calculo sem dependencia de tela.

Antes de concluir Fase 2:

- Fluxo do equipamento validado manualmente.
- Codigo de insumo carrega dados automaticamente.

Antes de concluir Fase 3:

- Beneficios compostos retornam ao calculo de mao de obra.
- Memoria de beneficios exportavel.

Antes de release:

- `npm run compile`.
- `npm run test`.
- Exportacao Excel/PDF conferida.
- Checklist de auditoria preenchido.

## Open Questions

1. A depreciacao deve considerar valor residual opcional em todos os equipamentos?
2. K de manutencao deve usar valor de aquisicao cheio ou base depreciavel?
3. Juros, impostos e seguros entram em algum cenario de improdutivo ou sempre ficam fora?
4. Encargos sociais incidem sobre beneficios ou apenas sobre salario?
5. Aluguel de equipamento sera parcela propria ou classificado como material/outros?
6. O preco atualizado do insumo deve ser o produtivo ou o improdutivo por padrao?
7. Qual padrao final de codificacao local o TLPlanly deve recomendar?
