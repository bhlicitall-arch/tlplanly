# Manual de Operação do TLPlanly

Versão: 1.0
Produto: TLPlanly-Orçamentos
Público: usuários sem conhecimento técnico em sistemas, construtoras, fiscais, analistas de licitação e órgãos públicos.

---

## 1. O que é o TLPlanly

O TLPlanly é uma plataforma para criar, importar, revisar, auditar e exportar orçamentos de obras. Ele pode ser usado por dois perfis:

- **Construtor / orçamentista:** monta planilhas, ajusta quantidades, cria composições, calcula BDI e exporta relatórios.
- **Auditor / órgão público:** confere se preços, BDI, descontos e referências estão conformes com SINAPI, SICRO, legislação e boas práticas.

Frase-guia:

> Anexe documentos ou planilhas. O TLPlanly monta uma primeira versão para revisão, calcula, audita e gera relatórios profissionais.

---

## 2. Fluxo recomendado para iniciantes

Use esta sequência quando estiver começando:

1. Acesse **Configurações** e confira UF, tolerância, tipo de obra e regime de encargos.
2. Acesse **Bases de Referência** e confira se a base SINAPI/SICRO/ORSE está carregada.
3. Acesse **BDI / Encargos** e configure o BDI da obra.
4. Acesse **Central de Documentos** para anexar edital, TR, ETP, projeto básico, memorial, planilhas e pranchas.
5. Use **Analisar Documentos** ou **Importar Planilha/PDF** para extrair dados.
6. Revise a extração. Nada entra automaticamente no orçamento.
7. Clique em **Enviar para Elaborar Orçamento**.
8. Ajuste a planilha em **Elaborar Orçamento**.
9. Gere **Curva ABC**, **Memória de Cálculo**, **Auditoria SINAPI** e **Conformidade BDI**.
10. Exporte em **Exportar / Relatório**.

---

## 3. Conta, obras salvas e segurança de dados

No topo do sistema existe o controle de conta/salvamento:

- **Local:** os dados estão salvos somente no navegador.
- **Conta:** usuário conectado, mas sem obra ativa.
- **Pendente:** há alterações aguardando salvamento.
- **Salvando:** o sistema está gravando a obra.
- **Salvo:** a obra foi persistida.
- **Erro:** houve falha no salvamento.

Como usar:

1. Clique no ícone de conta/salvamento no topo.
2. Crie uma conta ou entre com e-mail e senha.
3. Crie uma **obra/orçamento salvo**.
4. Trabalhe normalmente. O TLPlanly salva automaticamente.
5. Antes de sair, confira se o status está **Salvo**.

Boa prática: crie uma obra para cada contratação, edital, empreendimento ou processo.

---

## 4. Modos de operação

No topo existe a alternância entre:

- **Construtor:** foco em montar e ajustar orçamento.
- **Auditor:** foco em conferir preços, BDI e conformidade.

Use **Construtor** quando estiver preparando a planilha.
Use **Auditor** quando estiver analisando proposta de terceiros ou validando desconto/conformidade.

---

## 5. Dashboard

O **Dashboard** mostra um resumo do orçamento ativo:

- quantidade de itens;
- subtotal;
- BDI;
- total com BDI;
- itens críticos;
- gráficos e visão geral.

Use o Dashboard para responder rapidamente:

- Quanto custa a obra?
- O BDI está configurado?
- Existem itens críticos?
- O orçamento já está pronto para relatório?

---

## 6. Configurações

A tela **Configurações** define parâmetros gerais da obra:

- **UF:** estado usado para buscar preços de referência.
- **Tolerância:** percentual aceito acima da referência antes de virar alerta.
- **Regime de encargos:** desonerado ou não desonerado.
- **Tipo de obra:** civil, elétrica, fornecimento de material etc.
- **Moeda de exibição:** BRL, USD, EUR ou GBP.
- **Modelo de relatório:** órgão público, construtora, medição ou auditoria.

Passo a passo:

1. Abra **Configurações**.
2. Escolha a UF da obra.
3. Defina tolerância, tipo de obra e regime de encargos.
4. Salve as configurações.

Importante: a UF e o regime de encargos afetam a interpretação da base de preços.

---

## 7. Bases de Referência

A tela **Bases de Referência** concentra bases como:

- SINAPI;
- SICRO 3;
- ORSE;
- bases estaduais/municipais, quando disponíveis.

Para que serve:

- buscar preços oficiais;
- comparar planilhas importadas;
- auditar propostas;
- apoiar composições próprias.

Como usar:

1. Abra **Bases de Referência**.
2. Confira a base ativa e a UF.
3. Se necessário, carregue arquivo SINAPI em XLSX/ZIP.
4. Use a busca unificada para localizar insumos.

Regra prática:

- edificações, escolas, postos de saúde, reformas: geralmente SINAPI;
- rodovias, pontes e infraestrutura DNIT: geralmente SICRO;
- bases estaduais podem complementar referências locais.

---

## 8. BDI / Encargos

O BDI é o percentual aplicado sobre o custo direto para formar o preço de venda da obra.

Componentes do BDI:

- **AC:** Administração Central.
- **S:** Seguros e Garantias.
- **R:** Riscos.
- **DF:** Despesas Financeiras.
- **L:** Lucro.
- **I:** Tributos.

Como configurar:

1. Abra **BDI / Encargos**.
2. Preencha os seis componentes.
3. Escolha o tipo de obra.
4. Confira o limite TCU indicado na tela.
5. Clique em **Aplicar ao Orçamento**.

O sistema não deve usar BDI “de teste” sem confirmação. Se aparecer “Não configurado”, preencha e aplique.

Encargos:

- **Não desonerado:** regime mais comum.
- **Desonerado:** regime com CPRB, quando aplicável.

Não misture regimes sem justificativa técnica.

---

## 9. Elaborar Orçamento

É a tela principal para montar e ajustar a planilha.

Você pode criar orçamento de três formas:

1. **Do zero:** pesquisar item SINAPI ou criar item próprio.
2. **Por importação:** enviar Excel, CSV, PDF digital, PDF escaneado ou imagem.
3. **Por documentos:** enviar uma pré-planilha gerada pelo Analisador de Documentos.

Campos da planilha:

- código;
- descrição;
- unidade;
- quantidade;
- preço unitário;
- referência SINAPI;
- desvio;
- total;
- categoria;
- capítulo.

Operações úteis:

- adicionar item próprio;
- duplicar item;
- mover item para cima/baixo;
- zerar quantidades;
- limpar orçamento;
- exportar JSON da planilha.

Boa prática: após importar, revise descrição, unidade, quantidade e preço item por item.

---

## 10. Central de Documentos da Obra

A **Central de Documentos** é o arquivo técnico da obra.

Use para anexar:

- edital;
- Termo de Referência;
- ETP;
- projeto básico;
- memorial descritivo;
- planilha orçamentária;
- pranchas;
- fotos;
- ART/RRT;
- documentos fiscais.

O que a Central mostra:

- total de documentos;
- lotes de extração;
- documentos processados por OCR;
- revisões pendentes;
- documentos classificados;
- histórico de extrações.

Como usar:

1. Abra **Central de Documentos**.
2. Clique em **Selecionar lote**.
3. Escolha todos os arquivos relacionados à obra.
4. Clique em **Analisar agora**.
5. Revise a extração no Analisador.
6. Envie os itens aprovados para **Elaborar Orçamento**.

Regra principal: documento anexado não altera o orçamento automaticamente. A revisão humana é obrigatória.

---

## 11. Importar Planilha / PDF

Use quando você já tem uma planilha, edital ou PDF com itens orçamentários.

Formatos aceitos:

- Excel XLSX/XLS/ODS;
- CSV;
- PDF digital;
- PDF escaneado;
- PNG, JPG, TIFF.

Como importar:

1. Abra **Importar Planilha/PDF** ou use **Importar planilha** em Elaborar Orçamento.
2. Selecione um ou vários arquivos.
3. Clique em **Extrair Dados**.
4. Aguarde a leitura, OCR, normalização e match com SINAPI.
5. Revise os itens extraídos.
6. Escolha se usará preço do edital, SINAPI ou menor valor.
7. Escolha se irá adicionar ao orçamento atual ou substituir.
8. Clique em **Confirmar e enviar para Elaboração**.

O que observar na revisão:

- **Match SINAPI:** encontrou referência direta.
- **Parcial:** encontrou possível correspondência.
- **Sem match:** exige conferência manual.

Nunca confirme importação sem revisar itens “Parcial” e “Sem match”.

---

## 12. OCR para PDF escaneado

OCR é o reconhecimento de texto em imagem.

O TLPlanly usa OCR automaticamente quando:

- o PDF não tem texto selecionável;
- o arquivo é imagem;
- a extração digital não encontra itens.

Cuidados:

- use arquivos legíveis;
- prefira resolução de 200 DPI ou superior;
- revise números, vírgulas e unidades;
- confira se a tabela não foi lida fora de ordem.

Depois do OCR, o sistema abre a revisão. Nada entra direto no orçamento.

---

## 13. Analisador de Documentos da Obra

Use quando você ainda não tem uma planilha pronta e deseja gerar uma primeira versão do orçamento a partir de documentos técnicos.

Documentos recomendados:

- edital;
- TR;
- ETP;
- projeto básico;
- memorial;
- projetos/pranchas;
- especificações.

O Analisador faz:

- classificação automática dos arquivos;
- extração de escopo;
- identificação de especificações;
- sugestão de serviços;
- mapeamento para SINAPI quando possível;
- criação de composições preliminares;
- indicação de confiança e pendências.

Como operar:

1. Abra **Analisar Documentos** ou envie lote pela **Central de Documentos**.
2. Selecione os arquivos.
3. Clique em **Analisar documentos**.
4. Leia os documentos classificados.
5. Revise os serviços sugeridos.
6. Ajuste descrição, unidade, quantidade e preço.
7. Desmarque o que não quiser usar.
8. Clique em **Enviar para Elaborar Orçamento**.

A saída é uma estimativa técnica preliminar. O responsável técnico deve validar.

---

## 14. Composições (CPU)

CPU significa Composição de Preço Unitário.

Use para criar um serviço próprio com:

- materiais;
- mão de obra;
- equipamentos;
- coeficientes;
- encargos.

Como criar:

1. Abra **Composições (CPU)**.
2. Defina código, descrição, unidade e tipo.
3. Busque insumos SINAPI.
4. Adicione cada insumo à composição.
5. Ajuste coeficiente e preço.
6. Escolha o regime de encargos.
7. Confira o custo unitário.
8. Salve na biblioteca ou envie ao orçamento.

Exemplo: para criar “Alvenaria”, adicione tijolo, argamassa, pedreiro e servente com seus coeficientes.

---

## 15. Curva ABC

A Curva ABC mostra quais itens têm maior peso financeiro.

Classes:

- **A:** itens que somam até 80% do custo.
- **B:** itens entre 80% e 95%.
- **C:** itens finais até 100%.

Como gerar:

1. Monte ou importe o orçamento.
2. Abra **Curva ABC**.
3. Clique em **Gerar Curva ABC**.
4. Revise a tabela e os gráficos.

Use a Classe A para priorizar auditoria, negociação e conferência.

---

## 16. Memória de Cálculo

A **Memória de Cálculo** mostra o detalhamento dos itens:

- custo direto;
- BDI;
- encargos;
- total;
- origem dos dados;
- referência usada.

Use para justificar orçamento em processo licitatório, relatório técnico ou conferência interna.

---

## 17. Análise SINAPI

Use para auditar se a planilha está conforme a referência.

Como operar:

1. Monte ou importe a planilha.
2. Ative **Modo Auditor**, se for o caso.
3. Abra **Análise SINAPI**.
4. Execute a auditoria.
5. Revise os resultados:
   - conforme;
   - alerta;
   - crítico;
   - não encontrado.

Itens críticos devem ser justificados, corrigidos ou negociados.

---

## 18. Conformidade BDI

Verifica se o BDI aplicado está compatível com os limites usados como referência pelo TCU.

Como usar:

1. Configure o BDI.
2. Abra **Conformidade BDI**.
3. Confira limite aplicável ao tipo de obra.
4. Se estiver acima, registre justificativa técnica.

BDI acima do limite não deve ser ignorado.

---

## 19. Planejamento

Transforma orçamento em programação físico-financeira.

Como usar:

1. Abra **Planejamento**.
2. Clique em **Gerar do orçamento**.
3. Ajuste tarefa, início, fim, dependências e produtividade.
4. Acompanhe Gantt e Curva S.

Use para prever execução e organizar medições.

---

## 20. Medições

Registra o que foi executado em cada período.

Como usar:

1. Abra **Medições**.
2. Crie um período, por exemplo “Medição 01”.
3. Informe quantidades executadas por item.
4. Salve a medição.
5. Confira saldo, avanço e itens excedentes.

Use para acompanhamento mensal e fiscalização de contrato.

---

## 21. Quantitativos

Cria memórias auxiliares de quantidade.

Como usar:

1. Abra **Quantitativos**.
2. Escolha o item do orçamento.
3. Cadastre linhas com fórmulas.
4. Confira o total.
5. Clique em **Aplicar qtd** para atualizar a quantidade do item.

Exemplo:

`12 * 3.2 + 8 * 2.7`

Use para paredes, pisos, áreas, volumes e medições geométricas simples.

---

## 22. Backups

Cria pontos de restauração.

Como usar:

1. Abra **Backups**.
2. Informe uma descrição.
3. Clique em criar backup.
4. Se precisar, restaure o ponto anterior.

Boa prática: crie backup antes de grandes importações, substituições de orçamento e alterações de BDI.

---

## 23. Exportar / Relatório

Gera saída profissional para apresentação, licitação ou análise.

Pode incluir:

- planilha orçamentária;
- BDI;
- Curva ABC;
- encargos;
- planejamento;
- medições;
- quantitativos;
- anexos/documentos.

Como exportar:

1. Abra **Exportar / Relatório**.
2. Preencha dados da obra, órgão, responsável técnico, CREA/CAU e ART/RRT.
3. Escolha o modelo de relatório.
4. Pré-visualize as abas.
5. Exporte em Excel ou imprima/salve em PDF.

---

## 24. Copilot TLPlanly

O Copilot é o assistente integrado do sistema.

Você pode perguntar:

- “Como importar uma planilha?”
- “Como configurar BDI?”
- “Como auditar preços?”
- “Como usar a Central de Documentos?”
- “Como gerar Curva ABC?”
- “O que faço nesta tela?”

O Copilot usa:

- base de conhecimento local;
- manual operacional;
- contexto da tela atual;
- dados básicos do orçamento ativo.

Se a IA online estiver indisponível, o modo local continua respondendo dúvidas principais.

---

## 25. Roteiro rápido para construtora

1. Crie ou abra a obra.
2. Configure UF, encargos e tipo de obra.
3. Configure BDI.
4. Importe planilha ou crie orçamento do zero.
5. Ajuste itens, quantidades e preços.
6. Crie CPUs próprias se necessário.
7. Gere Curva ABC.
8. Exporte Excel profissional.

---

## 26. Roteiro rápido para órgão público ou auditor

1. Abra ou importe a planilha do fornecedor.
2. Configure UF, tolerância e base de referência.
3. Confira BDI e encargos.
4. Rode Análise SINAPI.
5. Gere Curva ABC para priorizar fiscalização.
6. Verifique Conformidade BDI.
7. Exporte relatório com itens críticos e alertas.

---

## 27. Problemas comuns

### O PDF não extraiu itens

Tente:

- usar OCR;
- conferir se o PDF é imagem;
- aumentar qualidade do arquivo;
- importar a planilha Excel original, se existir.

### O item ficou “Sem match”

Tente:

- conferir o código;
- revisar descrição;
- pesquisar manualmente na base;
- usar referência de outra base, se aplicável.

### O BDI aparece “Não configurado”

Preencha os componentes em **BDI / Encargos** e clique em **Aplicar ao Orçamento**.

### O orçamento não salvou

Confira o chip de status no topo:

- se estiver **Pendente**, aguarde;
- se estiver **Erro**, tente salvar novamente;
- se estiver **Local**, entre na conta para salvar na nuvem.

### A quantidade importada parece errada

Confira OCR, unidade e vírgulas. Sempre revise antes de confirmar.

---

## 28. Boas práticas finais

- Sempre configure UF, base e BDI antes de fechar o orçamento.
- Revise itens sem match ou com match parcial.
- Gere Curva ABC antes de auditar.
- Crie backup antes de grandes alterações.
- Use a Central de Documentos para manter rastreabilidade.
- Não use estimativa de documentos sem validação técnica.
- Exporte relatório somente após conferir BDI, encargos e itens críticos.

---

## 29. Glossário rápido

- **BDI:** percentual de despesas indiretas, tributos, lucro e riscos.
- **SINAPI:** base oficial Caixa/IBGE para custos da construção civil.
- **SICRO:** base DNIT para infraestrutura e rodovias.
- **CPU:** composição de preço unitário.
- **OCR:** leitura de texto em imagem/PDF escaneado.
- **Curva ABC:** classificação de itens por peso financeiro.
- **ETP:** Estudo Técnico Preliminar.
- **TR:** Termo de Referência.
- **ART/RRT:** responsabilidade técnica da obra/projeto.

---

## 30. Mensagem para apresentação

O TLPlanly une elaboração de orçamento, importação inteligente, OCR, análise por documentos, BDI, Curva ABC, CPU, auditoria SINAPI, planejamento, medições e relatórios em um único fluxo.

Ele atende tanto quem monta a planilha quanto quem precisa conferir se ela está tecnicamente correta.
