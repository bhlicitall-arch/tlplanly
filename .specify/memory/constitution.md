# TLPlanly Specification Constitution

## Core Principles

### I. Rastreabilidade primeiro

Toda funcionalidade que afete preco, BDI, encargos, CPU, cotacao, custo horario, medicao ou auditoria deve preservar origem dos dados, data de referencia, parametros usados e memoria de calculo. Um valor final sem explicacao nao deve ser considerado pronto.

### II. Regra de calculo testavel

Formulas de negocio devem ficar em funcoes isoladas ou servicos testaveis, evitando regras criticas presas apenas a manipuladores de tela. Toda formula nova ou alterada deve ter exemplo numerico e teste automatizado.

### III. Memoria de calculo obrigatoria

Toda acao que gere custo, atualize preco ou envie item para CPU/orcamento deve produzir memoria de calculo em linguagem compreensivel para orcamentista, com campos estruturados para exportacao e conferencia.

### IV. Conferencia antes de automacao

Automacoes devem mostrar demonstrativo e permitir revisao antes de sobrescrever precos, CPUs, insumos ou resultados de auditoria. Atualizacoes automaticas precisam manter snapshot do antes/depois.

### V. Produto profissional para obra real

As interfaces devem priorizar trabalho tecnico: informacao densa, organizada, clara e sem excesso decorativo. O TLPlanly deve ajudar o usuario a montar, provar, revisar e defender o orcamento.

## Engineering Standards

- Specs devem existir antes de mudancas relevantes de produto.
- Toda spec deve conter criterios de aceite, casos extremos e checklist de auditoria quando impactar calculo ou relatorio.
- Testes devem acompanhar regras de calculo, importacao, exportacao e atualizacao de dados.
- Alteracoes devem respeitar compatibilidade com projetos salvos sempre que possivel.
- Dados de referencia, insumos locais e cotacoes devem carregar fonte e data.
- Exportacoes devem preservar informacao suficiente para auditoria externa.

## Review Workflow

1. Registrar requisito em spec.
2. Identificar formulas, entidades e fluxos afetados.
3. Validar exemplos numericos com usuario/orcamentista quando houver calculo.
4. Implementar em etapas pequenas e verificaveis.
5. Rodar testes e conferencia manual dos cenarios principais.
6. Atualizar documentacao ou checklist de auditoria.

## Governance

Esta constituicao orienta specs, planos, revisoes e implementacoes do TLPlanly. Em caso de conflito entre rapidez e rastreabilidade, a rastreabilidade prevalece para funcionalidades que afetem valores financeiros, memoria de calculo, licitacoes, auditoria ou exportacoes oficiais.

Alteracoes nesta constituicao devem registrar motivo, data e impacto esperado.

**Version**: 1.0.0 | **Ratified**: 2026-06-30 | **Last Amended**: 2026-06-30
