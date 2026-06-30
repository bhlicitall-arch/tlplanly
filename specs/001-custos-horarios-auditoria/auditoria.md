# Checklist de Auditoria: Custos Horarios Auditaveis

**Data de criacao**: 2026-06-30

**Objetivo**: garantir que os apontamentos do orcamentista sejam conferidos durante analise, implementacao, teste e aprovacao.

## Rastreamento dos apontamentos recebidos

| ID | Apontamento | Decisao de SPEC | Status |
|---|---|---|---|
| A01 | Comecar pelo custo horario | Modulo tratado como frente propria | Especificado |
| A02 | K de manutencao separado do K de depreciacao | Campo e formula propria obrigatorios | Especificado |
| A03 | K de manutencao normalmente igual ao de depreciacao | Sistema sugere mesmo valor quando vazio | Especificado |
| A04 | Manutencao aumenta conforme idade/historico do equipamento | K ajustavel pelo usuario; historico real fica para evolucao | Especificado |
| A05 | Duas opcoes: parcelas calculadas e parcelas informadas | Tipo de calculo obrigatorio | Especificado |
| A06 | Parcelas informadas manualmente | Depreciacao, juros, impostos/seguros, manutencao, material e mao de obra | Especificado |
| A07 | Material inclui combustivel, energia ou desgaste | Classificacao de insumo auxiliar | Especificado |
| A08 | Mao de obra manual ja inclui salario, horas extras e encargos | Parcela manual de mao de obra aceita valor fechado | Especificado |
| A09 | Botao/aba de insumos no equipamento | Painel de insumos auxiliares por codigo | Especificado |
| A10 | Insumos ja cadastrados devem trazer preco unitario | Busca por codigo com descricao, unidade, tipo e preco | Especificado |
| A11 | Usuario informa apenas consumo de cada insumo | Campo consumo/indice obrigatorio | Especificado |
| A12 | Codigo do equipamento deve existir na aba/base de insumos | Equipamento principal vinculado a insumo cadastrado | Especificado |
| A13 | Digitar codigo traz nome do equipamento | Auto preenchimento por codigo | Especificado |
| A14 | Calcular mostra parcelas e resumo | Demonstrativo antes de salvar | Especificado |
| A15 | Produtivo inclui tudo | Formula produtivo soma todas as parcelas | Especificado |
| A16 | Improdutivo nao inclui material nem manutencao | Formula improdutivo = depreciacao + mao de obra | Especificado |
| A17 | Beneficios de mao de obra devem ter composicao propria | Botao "Compor beneficios" | Especificado |
| A18 | Beneficios incluem almoco, jantar, alojamento, cesta, viagens, transporte | Lista inicial de tipos de beneficio | Especificado |
| A19 | Valor calculado dos beneficios volta para tela de mao de obra | Retorno automatico para beneficios mensais | Especificado |

## Checklist de analise antes de implementar

- [ ] Validar formulas com orcamentista.
- [ ] Coletar 3 exemplos reais de equipamento.
- [ ] Coletar 3 exemplos reais de mao de obra.
- [ ] Confirmar se encargos incidem sobre beneficios.
- [ ] Confirmar uso de valor residual.
- [ ] Confirmar tratamento de aluguel de equipamento.
- [ ] Confirmar se preco do insumo atualizado sera produtivo ou improdutivo.
- [ ] Confirmar nomenclatura final dos codigos locais.

## Checklist de implementacao

- [ ] Criar ou isolar motor de calculo testavel.
- [ ] Criar testes para depreciacao.
- [ ] Criar testes para manutencao por K.
- [ ] Criar testes para custo produtivo.
- [ ] Criar testes para custo improdutivo.
- [ ] Criar testes para parcelas informadas.
- [ ] Criar testes para custo horario de mao de obra.
- [ ] Criar testes para beneficios compostos.
- [ ] Migrar registros antigos sem quebra.
- [ ] Atualizar tela de Custos Horarios.
- [ ] Adicionar busca de insumo por codigo.
- [ ] Adicionar painel de insumos do equipamento.
- [ ] Adicionar painel/modal de resumo.
- [ ] Adicionar composicao de beneficios.
- [ ] Atualizar exportacoes.
- [ ] Atualizar documentacao de usuario.

## Checklist de conferencia manual

### Equipamento

- [ ] Codigo `IE0001` carrega descricao do equipamento.
- [ ] Codigo inexistente gera alerta.
- [ ] K de manutencao aparece separado.
- [ ] K de manutencao pode ser igual ao K de depreciacao.
- [ ] Modo parcelas calculadas calcula as parcelas.
- [ ] Modo parcelas informadas aceita valores manuais.
- [ ] Insumo de operador entra como mao de obra.
- [ ] Insumo de diesel/energia entra como material.
- [ ] Total produtivo inclui todas as parcelas.
- [ ] Total improdutivo inclui apenas depreciacao e mao de obra.
- [ ] Memoria mostra formula e origem.
- [ ] Enviar CPU preserva codigo, unidade `h`, preco e memoria.

### Mao de obra

- [ ] Codigo de mao de obra carrega cargo/descricao quando existir.
- [ ] Salario mensal, beneficios, encargos e horas produtivas calculam custo horario.
- [ ] Botao de beneficios abre composicao.
- [ ] Almoco, jantar, alojamento, cesta, viagens e transporte podem ser informados.
- [ ] Total mensal dos beneficios volta para o campo principal.
- [ ] Memoria de mao de obra mostra beneficios compostos.

### Exportacao e auditoria

- [ ] Excel mostra parcelas de cada custo horario.
- [ ] PDF mostra memoria de calculo.
- [ ] Registro salvo mostra data de criacao/atualizacao.
- [ ] Origem das parcelas fica clara.
- [ ] Preco zerado ou sem fonte aparece como alerta.

## Cenarios numericos minimos

### Cenario E01 - Equipamento calculado

Entrada:

- Valor de aquisicao: 1.110.000,00
- Vida util: 10.000 h
- K depreciacao: 1,0
- K manutencao: 0,8
- Mao de obra: 91,8058/h
- Material: 102,7580/h
- Juros: 0
- Impostos/seguros: 0

Resultado esperado:

- Depreciacao: 111,0000/h
- Manutencao: 88,8000/h
- Produtivo: 394,3638/h
- Improdutivo: 202,8058/h

### Cenario E02 - Parcelas informadas

Entrada:

- Depreciacao: valor manual
- Juros: valor manual
- Impostos/seguros: valor manual
- Manutencao: valor manual
- Material: valor manual
- Mao de obra: valor manual

Resultado esperado:

- Produtivo: soma de todas as parcelas.
- Improdutivo: depreciacao + mao de obra.
- Memoria: origem manual.

### Cenario MO01 - Mao de obra com beneficios

Entrada:

- Salario mensal: 1.800,00
- Beneficios mensais: calculados pela composicao
- Encargos: 127,5%
- Horas produtivas: 189

Resultado esperado:

- Custo horario calculado conforme formula aprovada.
- Memoria lista salario, beneficios, encargos e horas.

## Evidencias esperadas por release

- Link ou caminho dos arquivos alterados.
- Resultado dos testes.
- Prints ou descricao dos 3 fluxos validados.
- Exportacao Excel/PDF de exemplo.
- Pendencias e decisoes ainda abertas.

