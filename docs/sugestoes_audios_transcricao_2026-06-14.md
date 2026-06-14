# Sugestões em áudio - transcrição revisada

Data: 2026-06-14  
Origem: áudios OGG enviados pelo usuário  
Observação: transcrição automática com revisão técnica por contexto. Alguns termos foram normalizados, como "Compor", "custo horário", "depreciação", "cotação", "CPU", "mão de obra" e "frente de serviço".

## Áudio 1 - Custo horário de equipamento

O Compor tem uma composição própria para equipamento. Ele calcula o custo horário do equipamento e permite criar uma tabela separada.

Nessa tabela entram:

- custo de aquisição do equipamento;
- vida útil ou quantidade de horas para depreciação;
- taxa de depreciação, por exemplo 1,0 ou 0,8;
- quantidade de horas em que o equipamento será depreciado;
- mão de obra vinculada ao equipamento, como operador;
- consumo de combustível;
- taxa de manutenção sobre o custo horário.

Exemplo citado: equipamento de R$ 1.000.000,00, com 10.000 horas de depreciação e taxa 0,8. Dependendo da idade do equipamento, a taxa pode mudar.

Depois de calculado, esse custo horário entra diretamente na composição de preço unitário.

Ponto principal: o TLPlanly precisa ter um módulo de custo horário de equipamento, com memória de cálculo e integração direta com CPUs.

## Áudio 2 - Custo horário de mão de obra e banco de cotações

A sugestão é criar para mão de obra algo semelhante ao custo horário de equipamento.

Ideia central:

- importar convenções coletivas;
- buscar salários por função operacional, como servente, oficial, pedreiro e carpinteiro;
- atualizar salários conforme índices de reajuste;
- montar o custo horário da mão de obra com memória de cálculo;
- definir salário mensal;
- definir horas produtivas mensais, por exemplo 189 horas;
- permitir cargo/função;
- calcular custo horário da função.

O ponto destacado é que isso não existe de forma comum no mercado. O sistema deveria guardar a memória da composição do custo horário da mão de obra.

Também foi sugerido um banco de cotações:

- importar PDFs ou documentos de cotação;
- guardar preços por material;
- consultar depois de onde saiu determinado preço;
- comparar cotações, por exemplo cimento a R$ 1.500/t e outro a R$ 600 ou R$ 700/t;
- calcular média ou menor preço;
- permitir aceitar ou aplicar índice de segurança;
- importar também custos de materiais e subempreiteiros.

Ponto principal: criar banco de cotações auditável, vinculado aos insumos e composições.

## Áudio 3 - Desconto linear x ajuste pontual por item

O desconto automático/linear é útil para obras menores, quando a empresa precisa ganhar agilidade.

Para obras grandes, a sugestão é não depender apenas de desconto linear. O ajuste deve ser pontual, item a item, porque cada serviço tem margem e incidência diferentes.

Exemplo citado: fechaduras.

- Fechadura comum de 40 mm pode ter maior consumo/incidência.
- Fechadura de 70 mm aparece poucas vezes.
- Fechadura de porta corta-fogo pode nem aparecer em certos contratos.
- Reparo de fechadura pode ter comportamento diferente de troca de fechadura.

Conclusão: o sistema deve permitir distribuir desconto por item, grupo, serviço ou incidência esperada, e não apenas aplicar desconto uniforme.

Ponto principal: complementar a readequação de proposta com um modo avançado de desconto pontual, por item/grupo/curva ABC/incidência.

## Áudio 4 - Importação de cotações e atualização automática de insumos

Sugestão para importação de planilhas/PDFs de cotação:

- o sistema deve importar PDFs/planilhas de cotação;
- separar os itens em uma planilha interna;
- identificar itens como diesel, diesel S10, diesel comum, etanol, gasolina, cimento CP-II, CP-III, CP-IV etc.;
- permitir codificar esses itens de acordo com os códigos dos insumos existentes nas composições.

Modelo de codificação citado:

- `IM` para insumo de material;
- `S` para insumo de subempreiteiro;
- `H` para homem-hora/mão de obra.

Exemplo: diesel codificado como `IM001`.

Depois da codificação:

- o usuário escolhe critério, como menor preço;
- exemplo: menor preço do diesel é R$ 6,00;
- pode aplicar percentual de segurança, por exemplo 20% sobre o menor preço;
- o sistema atualiza automaticamente os insumos das composições;
- como os insumos já estarão codificados, a atualização entra nas CPUs corretas;
- o usuário pode abrir o banco de dados e conferir de onde veio cada preço.

Ponto principal: criar fluxo "cotação -> codificação de insumos -> critério de preço -> atualização de CPUs", com rastreabilidade.

## Áudio 5 - Acompanhamento por frente de serviço

Sugestão para acompanhamento e controle da obra por frente de serviço.

A ideia é conectar composições às frentes de serviço por uma tabela de atividades.

Exemplos de estrutura:

- Terraplanagem
  - escavação;
  - aterro;
- Pavimentação
  - sub-base;
  - base;
  - pavimento flexível;
  - pavimento rígido;
- Drenagem
  - drenagem profunda;
  - drenagem superficial.

Cada composição seria vinculada a uma atividade/frente de serviço.

Depois, o sistema permitiria:

- prever custo por frente de serviço;
- lançar custo realizado;
- comparar previsto x realizado;
- identificar desvios por frente;
- exportar conforme cronograma;
- demonstrar ao cliente onde está o desvio.

Ponto principal: criar módulo de controle por frente de serviço, vinculando composições, cronograma, previsto, realizado e desvios.

## Áudio 6 - Dashboard HTML interativo

Sugestão para o sistema gerar dashboards interativos em HTML.

Ideia:

- botão para gerar um arquivo HTML interativo;
- o HTML já abriria com cards, KPIs e gráficos;
- dashboard com principais indicadores do orçamento;
- maior custo;
- menor custo;
- materiais mais relevantes;
- itens que mais pesam na Curva ABC;
- indicadores de custo por categoria;
- visualização interativa para apresentação ao cliente.

Ponto principal: criar exportação de dashboard HTML interativo, além de Excel/PDF.

## Backlog técnico consolidado

### Alta prioridade

1. Módulo de custo horário de equipamentos.
2. Módulo de custo horário de mão de obra.
3. Banco de cotações com importação de PDF/Excel e rastreabilidade.
4. Atualização automática de insumos das CPUs a partir de cotações codificadas.
5. Readequação avançada de proposta com desconto pontual por item/grupo/incidência.

### Média prioridade

6. Tabela de atividades/frentes de serviço.
7. Vinculação de composições às frentes de serviço.
8. Comparativo previsto x realizado por frente.
9. Exportação de dashboard HTML interativo.

### Diferenciais fortes de produto

10. Memória auditável para custo horário de mão de obra.
11. Memória auditável de origem de preço por cotação.
12. Critérios configuráveis de atualização de preço: menor preço, média, mediana, menor preço + segurança.
13. Dashboard executivo gerado automaticamente a partir do orçamento.

## Interpretação para o TLPlanly

Essas sugestões apontam para um próximo bloco claro de evolução:

**Módulo de Engenharia de Custos Analítica**

Componentes:

- Equipamentos: aquisição, vida útil, depreciação, manutenção, combustível, operador e custo horário.
- Mão de obra: convenção coletiva, cargos, salário, horas produtivas, encargos e custo horário.
- Materiais e subempreiteiros: cotações, critérios de preço, índice de segurança e origem auditável.
- CPUs: atualização automática dos insumos conforme banco de custos.
- Controle: frente de serviço, previsto x realizado e dashboard interativo.

Frase de produto sugerida:

> "O TLPlanly não apenas monta a planilha: ele explica de onde veio cada custo, atualiza composições por cotação e acompanha a obra por frente de serviço."
