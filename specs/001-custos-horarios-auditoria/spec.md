# Feature Specification: Custos Horarios Auditaveis

**Feature Branch**: `codex/001-custos-horarios-auditoria`

**Created**: 2026-06-30

**Status**: Draft para validacao tecnica com orcamentista

**Input**: Apontamentos de 30/06/2026 sobre custos horarios de equipamentos, mao de obra, beneficios, insumos codificados e comparativo com fluxo do 90 Compor.

## Objetivo

Evoluir o modulo de Custos Horarios do TLPlanly para um motor profissional de custo horario auditavel, com memoria de calculo, duas modalidades de preenchimento, vinculacao ao cadastro de insumos, composicao por insumos e resumo produtivo/improdutivo.

O objetivo de produto nao e copiar o concorrente. E superar o fluxo classico com rastreabilidade, conferencia automatica, integracao com CPUs e clareza suficiente para uso em licitacoes, auditorias internas e apresentacoes tecnicas.

## Escopo

Inclui:

- Custo horario de equipamento por parcelas calculadas.
- Custo horario de equipamento por parcelas informadas manualmente.
- K de depreciacao e K de manutencao separados.
- Vinculo do equipamento a um insumo previamente cadastrado.
- Composicao do custo por insumos codificados: operador, combustivel, energia, material de desgaste, aluguel e outros.
- Janela ou painel de resumo com parcelas e totais produtivo/improdutivo.
- Custo horario de mao de obra com salario, beneficios, encargos e horas produtivas.
- Composicao dos beneficios por itens cadastrados ou informados.
- Envio do custo horario calculado para a biblioteca de CPUs.
- Memoria de calculo exportavel e auditavel.

Fora do escopo desta primeira especificacao:

- Importacao automatica de convencoes coletivas.
- Integracao direta com ERPs externos.
- Parametrizacao completa de normas SICRO/SINAPI por UF.
- Controle de historico real de manutencao por equipamento fisico.

## User Scenarios & Testing

### User Story 1 - Cadastrar equipamento por codigo de insumo (Priority: P1)

Como orcamentista, quero digitar o codigo de um equipamento ja cadastrado na base de insumos e ter a descricao, unidade, tipo e preco de referencia carregados automaticamente, para manter o custo horario ligado ao banco de dados e evitar nomes soltos.

**Why this priority**: Sem codigo e vinculo de insumo, a memoria de calculo perde rastreabilidade e a CPU final nao consegue ser atualizada de forma segura.

**Independent Test**: Criar um insumo `IE0001` na base local, digitar esse codigo na tela de Custos Horarios e verificar que o sistema preenche a descricao do equipamento e bloqueia/alerta codigo inexistente.

**Acceptance Scenarios**:

1. **Given** um insumo `IE0001` cadastrado como equipamento, **When** o usuario digita `IE0001`, **Then** o sistema preenche a descricao e identifica o registro como equipamento.
2. **Given** um codigo inexistente, **When** o usuario sai do campo codigo, **Then** o sistema informa que o equipamento precisa ser cadastrado na aba/base de insumos.
3. **Given** um codigo existente de material ou mao de obra, **When** o usuario tenta usa-lo como equipamento principal, **Then** o sistema alerta incompatibilidade de tipo e permite correcao.

---

### User Story 2 - Calcular equipamento por parcelas calculadas (Priority: P1)

Como orcamentista, quero calcular automaticamente o custo horario de um equipamento usando valor de aquisicao, vida util, K de depreciacao, K de manutencao e insumos de operacao, para obter custo produtivo e improdutivo com memoria de calculo.

**Why this priority**: Esta e a base tecnica do modulo e substitui o preenchimento manual simplificado atual.

**Independent Test**: Informar aquisicao de R$ 1.110.000,00, vida util de 10.000 h, K depreciacao 1, K manutencao 0,8, operador e diesel por insumos. O sistema deve demonstrar as parcelas e o total produtivo/improdutivo.

**Acceptance Scenarios**:

1. **Given** valor de aquisicao, vida util e K de depreciacao, **When** calcular, **Then** o sistema calcula depreciacao por hora.
2. **Given** valor de aquisicao, vida util e K de manutencao, **When** calcular, **Then** o sistema calcula manutencao por hora como parcela propria.
3. **Given** insumos vinculados com consumo e preco unitario, **When** calcular, **Then** o sistema soma material/combustivel, mao de obra e aluguel nas parcelas correspondentes.
4. **Given** um equipamento calculado, **When** abrir o resumo, **Then** o sistema exibe depreciacao, juros, impostos/seguros, manutencao, material, mao de obra, custo produtivo e custo improdutivo.

---

### User Story 3 - Informar parcelas manualmente (Priority: P1)

Como orcamentista, quero escolher a modalidade "parcelas informadas" e preencher diretamente depreciacao, juros, impostos/seguros, manutencao, material e mao de obra por hora, para usar custos vindos de memoria externa ou historico da empresa.

**Why this priority**: Empresas podem ja possuir custos horarios homologados e precisam apenas registrar os valores com rastreabilidade.

**Independent Test**: Selecionar "Parcelas informadas", preencher seis parcelas e verificar que o sistema calcula os mesmos totais produtivo/improdutivo sem exigir valor de aquisicao ou vida util.

**Acceptance Scenarios**:

1. **Given** modo "parcelas informadas", **When** preencher as parcelas, **Then** o sistema usa os valores manuais sem recalcular K.
2. **Given** uma parcela manual zerada, **When** calcular, **Then** o sistema aceita zero e deixa isso registrado na memoria.
3. **Given** o modo manual, **When** salvar, **Then** a memoria indica que a origem das parcelas e informada pelo usuario.

---

### User Story 4 - Compor equipamento por insumos codificados (Priority: P1)

Como orcamentista, quero abrir a composicao de insumos do equipamento, digitar apenas o codigo do insumo e informar o consumo, para que o sistema traga descricao, unidade e preco unitario automaticamente e calcule o subtotal.

**Why this priority**: Esta regra conecta custos horarios ao banco de insumos e permite atualizar CPUs por codigo depois.

**Independent Test**: Adicionar operador `IH1001` e diesel `IM0001`, informar consumos 1 h/h e 19,1 l/h, verificar preco unitario puxado da base e subtotal por insumo.

**Acceptance Scenarios**:

1. **Given** insumo cadastrado, **When** digitar codigo na composicao, **Then** descricao, unidade, tipo e preco unitario sao preenchidos.
2. **Given** consumo informado, **When** calcular, **Then** subtotal e atualizado como consumo vezes preco unitario.
3. **Given** insumo de mao de obra, **When** calcular, **Then** valor entra na parcela mao de obra.
4. **Given** diesel, energia ou material de desgaste, **When** calcular, **Then** valor entra na parcela material.
5. **Given** aluguel de equipamento, **When** calcular, **Then** valor entra em parcela configuravel e participa do custo produtivo.

---

### User Story 5 - Ver resumo produtivo e improdutivo (Priority: P1)

Como orcamentista, quero ver uma janela/painel de demonstrativo ao calcular, para conferir as parcelas do custo horario antes de salvar ou atualizar o insumo.

**Why this priority**: O resumo e a tela de conferencia que reduz erro e gera confianca na memoria de calculo.

**Independent Test**: Calcular um equipamento com parcelas conhecidas e validar que o produtivo soma tudo, enquanto o improdutivo soma apenas depreciacao e mao de obra.

**Acceptance Scenarios**:

1. **Given** parcelas calculadas, **When** clicar em calcular, **Then** o sistema exibe demonstrativo com cada parcela.
2. **Given** depreciacao de 111,00 e mao de obra de 91,8058, **When** calcular improdutivo, **Then** o improdutivo e 202,8058 antes de arredondamento visual.
3. **Given** material e manutencao informados, **When** calcular improdutivo, **Then** essas parcelas nao entram no improdutivo.
4. **Given** usuario marca atualizar preco do insumo, **When** confirmar, **Then** o preco horario calculado atualiza o insumo de equipamento vinculado, mantendo log de origem.

---

### User Story 6 - Calcular mao de obra com beneficios compostos (Priority: P2)

Como orcamentista, quero calcular beneficios mensais em uma janela propria com itens como almoco, jantar, alojamento, cesta basica, viagem e transporte, para levar automaticamente o total ao calculo de mao de obra por hora.

**Why this priority**: A tela atual ja calcula mao de obra, mas o campo beneficios ainda depende de valor manual e nao possui memoria.

**Independent Test**: Cadastrar beneficios com frequencia mensal/diaria, calcular total mensal e verificar que o valor retorna ao campo beneficios mensais.

**Acceptance Scenarios**:

1. **Given** itens de beneficio, **When** calcular beneficios, **Then** o total mensal e preenchido em beneficios mensais.
2. **Given** salario, beneficios, encargos e horas produtivas, **When** calcular, **Then** custo horario e calculado e memoria mostra cada parcela.
3. **Given** beneficio vindo de insumo codificado, **When** revisar memoria, **Then** o sistema mostra codigo, descricao, quantidade, preco e fonte.

---

### User Story 7 - Enviar custo horario para CPU e auditoria (Priority: P2)

Como orcamentista, quero transformar o custo horario aprovado em CPU ou insumo reutilizavel, para usar esse custo em composicoes sem recadastrar os dados.

**Why this priority**: O custo horario so gera valor operacional se alimentar CPUs e orcamentos.

**Independent Test**: Salvar custo horario, enviar para CPU, abrir biblioteca de CPUs e verificar codigo, descricao, unidade h, preco e memoria.

**Acceptance Scenarios**:

1. **Given** custo horario aprovado, **When** enviar para CPU, **Then** a CPU e criada/atualizada com preco horario.
2. **Given** uma CPU ja existente com mesmo codigo, **When** reenviar custo horario, **Then** o sistema atualiza sem duplicar.
3. **Given** exportacao Excel/PDF, **When** gerar relatorio, **Then** a memoria de custo horario acompanha o item.

## Edge Cases

- Valor de aquisicao zero no modo calculado: sistema deve bloquear calculo de depreciacao/manutencao e orientar uso de parcelas informadas.
- Vida util zero ou negativa: sistema deve bloquear com mensagem clara.
- K de manutencao vazio: sistema deve sugerir valor igual ao K de depreciacao, mas permitir alteracao.
- Insumo sem preco unitario: sistema deve permitir cadastrar, mas nao deve salvar calculo aprovado sem alerta de preco zerado.
- Codigo duplicado entre insumos locais e base SINAPI: sistema deve usar regra de precedencia configurada e mostrar a fonte.
- Mudanca de preco de insumo apos salvar custo horario: sistema deve manter memoria original e oferecer recalculo.
- Arredondamento: sistema deve calcular com precisao interna de pelo menos 4 casas e exibir moeda com 2 casas.
- Modo manual alterado para calculado: sistema deve pedir confirmacao, pois as parcelas manuais serao substituidas.
- Beneficio com periodicidade diaria: sistema deve exigir dias por mes ou usar padrao configurado.
- Encargos sobre beneficios: regra deve ser configuravel ou confirmada com o orcamentista antes do fechamento da versao.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST permitir selecionar o tipo de calculo do equipamento: `parcelas_calculadas`, `parcelas_informadas` ou `nao_calcular`.
- **FR-002**: O sistema MUST separar K de depreciacao e K de manutencao.
- **FR-003**: O sistema MUST sugerir K de manutencao igual ao K de depreciacao quando o campo estiver vazio.
- **FR-004**: O sistema MUST calcular depreciacao horaria no modo calculado.
- **FR-005**: O sistema MUST calcular manutencao horaria no modo calculado usando K de manutencao, valor de aquisicao e vida util.
- **FR-006**: O sistema MUST permitir informar manualmente depreciacao, juros, impostos/seguros, manutencao, material e mao de obra por hora.
- **FR-007**: O sistema MUST manter a origem de cada parcela: calculada, informada, insumo, cotacao ou ajuste manual.
- **FR-008**: O sistema MUST permitir vincular o equipamento principal a um codigo de insumo existente.
- **FR-009**: O sistema MUST preencher descricao, unidade, tipo e preco ao digitar codigo de insumo existente.
- **FR-010**: O sistema MUST permitir incluir insumos auxiliares no equipamento por codigo e consumo.
- **FR-011**: O sistema MUST classificar insumos auxiliares em parcelas de mao de obra, material/combustivel/energia/desgaste, aluguel ou outros.
- **FR-012**: O sistema MUST calcular o custo produtivo como soma de depreciacao, juros, impostos/seguros, manutencao, material e mao de obra.
- **FR-013**: O sistema MUST calcular o custo improdutivo como soma de depreciacao e mao de obra.
- **FR-014**: O sistema MUST exibir demonstrativo das parcelas antes de salvar o custo horario.
- **FR-015**: O sistema MUST permitir atualizar o preco do insumo vinculado com o custo horario aprovado.
- **FR-016**: O sistema MUST registrar memoria de calculo completa, incluindo parametros, parcelas, insumos, data e usuario quando houver login.
- **FR-017**: O sistema MUST permitir compor beneficios de mao de obra por itens.
- **FR-018**: O sistema MUST calcular o custo horario da mao de obra a partir de salario mensal, beneficios mensais, encargos e horas produtivas.
- **FR-019**: O sistema MUST enviar custo horario aprovado para biblioteca de CPUs com unidade `h`.
- **FR-020**: O sistema MUST exportar custos horarios e memoria em Excel/PDF, preservando origem das parcelas.
- **FR-021**: O sistema MUST manter compatibilidade com registros antigos ja salvos em `STATE.equipamentosHorarios` e `STATE.maoObraHoraria`.
- **FR-022**: O sistema MUST ter testes automatizados para formulas de equipamento, mao de obra, beneficios e resumo produtivo/improdutivo.

### Non-Functional Requirements

- **NFR-001**: O calculo deve ser deterministico e testavel fora da interface.
- **NFR-002**: Toda formula deve ter funcao isolada e cobertura de teste.
- **NFR-003**: O usuario deve conseguir auditar de onde veio cada valor sem abrir codigo-fonte.
- **NFR-004**: A interface deve ser densa, clara e orientada a trabalho, sem parecer pagina promocional.
- **NFR-005**: A memoria deve ser exportavel em formato humano e estruturado.
- **NFR-006**: O modulo deve funcionar offline com dados locais ja carregados.

## Formulas de referencia

Estas formulas sao a referencia inicial e devem ser validadas com o orcamentista antes da implementacao final.

### Equipamento - modo calculado

```text
base_depreciavel = valor_aquisicao - valor_residual
depreciacao_hora = (base_depreciavel * k_depreciacao) / vida_util_horas
manutencao_hora = (valor_aquisicao * k_manutencao) / vida_util_horas
material_hora = soma(consumo_insumo * preco_unitario) dos insumos classificados como material/combustivel/energia/desgaste
mao_obra_hora = soma(consumo_insumo * preco_unitario) dos insumos classificados como mao de obra
produtivo_hora = depreciacao_hora + juros_hora + impostos_seguros_hora + manutencao_hora + material_hora + mao_obra_hora
improdutivo_hora = depreciacao_hora + mao_obra_hora
```

### Equipamento - modo informado

```text
produtivo_hora = depreciacao_hora + juros_hora + impostos_seguros_hora + manutencao_hora + material_hora + mao_obra_hora
improdutivo_hora = depreciacao_hora + mao_obra_hora
```

### Mao de obra

```text
base_mensal = salario_mensal + beneficios_mensais
encargos_valor = base_mensal * encargos_percentual / 100
custo_hora = (base_mensal + encargos_valor) / horas_produtivas_mes
```

Ponto de validacao: confirmar se encargos incidem sobre beneficios ou apenas sobre salario. O comportamento atual do TLPlanly aplica encargos sobre a base salario + beneficios.

## Key Entities

- **Insumo de Referencia**: codigo, descricao, unidade, tipo, preco unitario, origem, data de referencia.
- **Custo Horario de Equipamento**: equipamento vinculado, modo de calculo, dados de aquisicao, vida util, fatores K, parcelas, insumos auxiliares, resultados e memoria.
- **Parcela de Custo Horario**: tipo da parcela, valor por hora, origem, formula, observacao e evidencias.
- **Insumo Auxiliar de Equipamento**: codigo do insumo, descricao, unidade, consumo, preco unitario, subtotal e classificacao da parcela.
- **Custo Horario de Mao de Obra**: codigo, cargo, salario, beneficios, encargos, horas produtivas, custo horario e memoria.
- **Beneficio de Mao de Obra**: tipo, codigo opcional de insumo, quantidade, frequencia, preco unitario, total mensal e fonte.
- **Memoria de Calculo**: snapshot de entrada, formulas, resultados, usuario, data, fonte dos precos e status de aprovacao.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos custos horarios salvos possuem memoria de calculo com origem das parcelas.
- **SC-002**: O usuario consegue calcular e conferir um equipamento completo em ate 3 minutos apos os insumos estarem cadastrados.
- **SC-003**: O custo produtivo e improdutivo batem com os cenarios de teste definidos pelo orcamentista em 100% dos casos.
- **SC-004**: O sistema reduz campos manuais duplicados: codigo do insumo traz descricao/unidade/preco automaticamente.
- **SC-005**: Exportacao Excel/PDF inclui as parcelas e a memoria de pelo menos um custo horario aprovado.
- **SC-006**: Testes automatizados cobrem formulas de depreciacao, manutencao, produtivo, improdutivo, mao de obra e beneficios.

## Assumptions

- O cadastro de insumos local sera a fonte primaria para equipamentos e insumos auxiliares criados pelo usuario.
- SINAPI e bases importadas continuam disponiveis como referencia complementar.
- Codigos locais poderao seguir padroes como `IE` para equipamento, `IH` para mao de obra e `IM` para material, sem impedir outros padroes existentes.
- Para a primeira versao, historico real de manutencao sera representado pelo K de manutencao informado, nao por lancamentos de oficina.
- O resumo improdutivo seguira a regra indicada pelo orcamentista: depreciacao + mao de obra.
- O frontend modular em `frontend/index.html` e `frontend/src/main.js` sera a base principal; `tlplanly.html` permanece como compatibilidade ate decisao de retirada.

## Auditoria e conferencia permanente

Cada entrega deste modulo deve ser conferida contra:

- Esta especificacao.
- Checklist em `specs/001-custos-horarios-auditoria/auditoria.md`.
- Plano de implementacao em `specs/001-custos-horarios-auditoria/plan.md`.
- Testes automatizados de formulas.
- Validacao manual com pelo menos 3 cenarios reais do orcamentista.
