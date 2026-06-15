# Manual de Instruções do TLPlanly

Versão: 2.0  
Atualização: 15/06/2026  
Produto: TLPlanly-Orçamentos  
Público: construtoras, orçamentistas, engenheiros, fiscais, analistas de licitação, órgãos públicos e equipes de controle.

---

## 1. O que é o TLPlanly

O TLPlanly é uma plataforma SaaS para elaborar, importar, revisar, auditar, planejar e exportar orçamentos de obras. Ele pode ser usado para:

- criar planilhas orçamentárias do zero;
- importar planilhas em Excel, CSV, PDF digital, PDF escaneado e imagens;
- anexar edital, termo de referência, ETP, projeto básico, memorial, pranchas e documentos da obra;
- rodar OCR quando o arquivo estiver digitalizado;
- revisar extrações antes de enviar ao orçamento;
- calcular BDI e encargos sociais;
- montar composições de preço unitário;
- comparar preços com SINAPI, SICRO, ORSE e bases estaduais;
- gerar Curva ABC, memória de cálculo e relatórios;
- readequar planilha após desconto de pregão;
- organizar planejamento, medições, quantitativos, frentes de serviço, custos horários e cotações.

Frase operacional:

> Anexe documentos ou planilhas. O TLPlanly extrai, organiza, calcula, audita e gera a planilha para revisão e exportação.

---

## 2. Acesso, conta e planos

O TLPlanly exige login para uso da plataforma.

### Como acessar

1. Abra o sistema.
2. Informe e-mail e senha, se já tiver conta.
3. Para criar conta, preencha nome, e-mail, senha, organização e o código recebido.
4. Clique em **Criar conta**.
5. Após entrar, o sistema libera os módulos e cria ou carrega a obra ativa.

### Código de autorização

O código recebido libera o plano correspondente. Se o código estiver inválido, vencido ou já utilizado, o cadastro será bloqueado.

### Planos

A tela **Planos e Preços** mostra os planos disponíveis:

- **Teste Autorizado:** uso demonstrativo.
- **Profissional:** uso individual para orçamentistas, engenheiros e consultores.
- **Equipe:** pequenas equipes de engenharia e construtoras.
- **Licitações Pro:** empresas que atuam com pregões, propostas e auditoria.
- **Órgão Público / Controle:** equipes de fiscalização e controle.

### Salvamento

O sistema salva a obra vinculada ao cliente logado. O chip no topo mostra:

- **Entrar:** usuário não autenticado.
- **Conta:** usuário conectado, mas sem obra selecionada.
- **Pendente:** existem alterações aguardando salvamento.
- **Salvando:** gravação em andamento.
- **Salvo:** obra persistida.
- **Erro:** falha de salvamento.

Boa prática: confirme o status **Salvo** antes de fechar o navegador.

---

## 3. Fluxo recomendado para iniciantes

Use este roteiro quando estiver começando:

1. Entre na conta.
2. Abra ou crie a obra.
3. Vá em **Configurações** e confira UF, tipo de obra, tolerância e encargos.
4. Vá em **Bases de Referência** e confirme SINAPI/SICRO/ORSE ou carregue as bases necessárias.
5. Vá em **BDI / Encargos** e configure o BDI.
6. Se tiver planilha pronta, use **Importar Planilha/PDF**.
7. Se tiver edital, TR, ETP, projeto básico ou memorial, use **Central de Documentos** ou **Analisar Documentos**.
8. Revise todos os itens extraídos.
9. Envie a revisão para **Elaborar Orçamento**.
10. Ajuste itens, quantidades, preços, capítulos, categorias e composições.
11. Gere **Curva ABC**, **Memória de Cálculo**, **Análise SINAPI** e **Conformidade BDI**.
12. Exporte em **Excel** e **PDF**.

Regra principal: nada extraído de documento, OCR ou PDF deve entrar no orçamento sem revisão humana.

---

## 4. Modos de operação

No topo existem dois modos:

- **Construtor:** foco em montar, ajustar, importar e exportar planilhas.
- **Auditor:** foco em conferir preços, BDI, descontos, referências e conformidade.

Use **Construtor** quando estiver preparando uma proposta.  
Use **Auditor** quando estiver fiscalizando, conferindo proposta de terceiro ou analisando desconto.

---

## 5. Dashboard

O **Dashboard** mostra a situação geral da obra:

- total do orçamento;
- quantidade de itens;
- BDI aplicado;
- total com BDI;
- itens acima da referência;
- gráficos de distribuição;
- itens críticos;
- atalhos para frentes, cotações e exportação.

Como usar:

1. Abra **Dashboard**.
2. Confira se há itens no orçamento.
3. Verifique se o BDI aparece configurado.
4. Observe itens críticos e distribuição por categoria.
5. Use os atalhos para abrir Curva ABC, Frentes ou Cotações.

Também é possível exportar o dashboard em HTML para apresentação rápida.

---

## 6. Configurações

A tela **Configurações** define os parâmetros gerais da obra.

Campos principais:

- **UF:** estado usado para referências.
- **Tolerância:** percentual aceito antes de gerar alerta.
- **Regime de encargos:** desonerado ou não desonerado.
- **Tipo de obra:** civil, elétrica, materiais ou outro enquadramento.
- **Moeda de exibição:** BRL, USD, EUR ou GBP.
- **Cotação da moeda:** usada quando exibir valores convertidos.
- **Modelo de relatório:** público, construtora, medição ou auditoria.

Como usar:

1. Abra **Configurações**.
2. Escolha a UF correta.
3. Defina a tolerância de auditoria.
4. Selecione regime de encargos e tipo de obra.
5. Ajuste moeda e modelo de relatório, se necessário.
6. Salve e volte ao orçamento.

Impacto: UF, encargos e tipo de obra afetam auditoria, BDI e relatório.

---

## 7. Bases de Referência

A tela **Bases de Referência** gerencia tabelas de preços.

Bases previstas:

- SINAPI/CAIXA;
- SICRO/DNIT;
- ORSE;
- bases estaduais;
- DER-MG;
- SUDECAP;
- EMOP;
- SEINFRA e bases equivalentes.

Funcionalidades:

- carregar lote de planilhas;
- aceitar arquivos onerados e desonerados;
- aceitar planilhas de produtos, insumos, serviços e composições separadas;
- carregar XLSX, XLS, CSV e ZIP;
- buscar por código ou descrição em todas as bases;
- marcar bases ativas;
- consultar total de itens disponíveis;
- usar OCR auxiliar em PDFs escaneados.

Como carregar bases em lote:

1. Abra **Bases de Referência**.
2. Clique em **Selecionar lote** ou arraste arquivos para a área indicada.
3. Envie todos os arquivos da competência.
4. Aguarde o processamento.
5. Confira se os cards das bases indicam que estão ativos.
6. Use a busca universal para confirmar que os itens foram carregados.

Boa prática: carregue a base de referência antes de auditar ou elaborar orçamento.

---

## 8. BDI e Encargos Sociais

A tela **BDI / Encargos** calcula BDI conforme fórmula adotada para obras públicas:

BDI = [(1 + AC + S + R) × (1 + DF) × (1 + L) / (1 - I) - 1] × 100

Campos:

- **AC:** administração central.
- **S:** seguros.
- **R:** riscos.
- **DF:** despesas financeiras.
- **L:** lucro.
- **I:** impostos.

Funcionalidades:

- cálculo automático do BDI;
- alerta de limite TCU;
- comparação por tipo de obra;
- aplicação do BDI ao orçamento;
- alternância de encargos sociais desonerado/não desonerado;
- composição detalhada para relatório.

Como usar:

1. Abra **BDI / Encargos**.
2. Preencha os componentes.
3. Escolha o tipo de obra.
4. Confira o BDI calculado.
5. Verifique o alerta de limite.
6. Clique em **Aplicar ao Orçamento**.

Se o BDI ficar acima do limite, o sistema alerta. Nesses casos, revise os componentes ou prepare justificativa técnica.

---

## 9. Elaborar Orçamento

A tela **Elaborar Orçamento** é o centro de montagem da planilha.

É possível:

- criar item próprio;
- pesquisar item SINAPI/base;
- importar Excel/PDF;
- ajustar descrição, código, unidade, quantidade e preço;
- definir categoria e capítulo;
- reordenar itens;
- duplicar itens;
- zerar quantidades sem apagar estrutura;
- aplicar BDI;
- conferir total com BDI;
- enviar dados para Curva ABC, auditoria e relatórios.

### Criar orçamento do zero

1. Abra **Elaborar Orçamento**.
2. Pesquise um serviço/insumo na base.
3. Selecione o item.
4. Informe quantidade.
5. Ajuste preço, unidade, capítulo e categoria, se necessário.
6. Repita até montar a planilha.
7. Salve e gere relatório.

### Importar dentro de Elaborar

1. Clique em **Importar Excel/PDF**.
2. Selecione o arquivo.
3. Revise a extração.
4. Confirme o envio para orçamento.
5. Ajuste os itens na tabela editável.

### Readequar proposta de pregão

Use quando o edital possui planilha estimativa e, após o lance, o cliente precisa entregar planilha ajustada.

1. Importe ou monte a planilha estimativa.
2. Abra o bloco **Readequar Proposta do Pregão**.
3. Informe valor original ou clique em **Usar total atual**.
4. Informe valor vencedor ou percentual de desconto.
5. Clique em **Calcular prévia**.
6. Confira o fator de ajuste.
7. Clique em **Aplicar na planilha**.
8. Exporte Excel e PDF.

### Desconto avançado

Use quando o desconto não deve ser linear para todos os itens.

1. Abra **Desconto avançado por seleção**.
2. Escolha o alvo: todos, categoria, capítulo ou itens Classe A.
3. Informe filtro, quando aplicável.
4. Informe percentual.
5. Clique em **Aplicar seleção**.
6. Confira o resumo antes de exportar.

---

## 10. Importar Planilha/PDF

O módulo **Importar Planilha/PDF** extrai itens de arquivos externos.

Tipos aceitos:

- Excel XLSX/XLS;
- CSV;
- PDF digital;
- PDF escaneado;
- imagens PNG/JPG/TIFF;
- arquivos vindos de editais.

Funcionalidades:

- upload de lote;
- pré-visualização;
- mapeamento inteligente de colunas;
- mapeamento manual quando o layout é livre;
- identificação de código, descrição, unidade, quantidade, preço unitário e total;
- identificação de grupos de custo;
- identificação de insumos;
- identificação de composições;
- validação de números;
- bloqueio de cabeçalhos, fórmulas, restos de PDF e valores deslocados;
- geração de memória em Excel/PDF;
- envio para **Elaborar Orçamento**.

Fluxo:

1. Abra **Importar Planilha/PDF**.
2. Arraste arquivos ou clique para selecionar.
3. Escolha páginas inicial/final, se for PDF.
4. Aguarde extração.
5. Revise a grade.
6. Ajuste mapeamento de colunas, se necessário.
7. Verifique itens bloqueados ou com alerta.
8. Confirme a importação.
9. Envie os itens para **Elaborar Orçamento**.

Para arquivos da estrutura TCOP/TOTVS, use a sequência: grupos de custos, insumos e depois composições.

---

## 11. OCR

OCR é a leitura de texto em imagem ou PDF escaneado.

O TLPlanly usa OCR no navegador para:

- PDFs sem texto selecionável;
- imagens de planilhas;
- anexos digitalizados;
- páginas escaneadas de edital.

Como usar:

1. Abra **Bases de Referência** ou **Importar Planilha/PDF**.
2. Envie PDF escaneado ou imagem.
3. Escolha idioma OCR, se disponível.
4. Aguarde progresso por página.
5. Revise os itens extraídos.
6. Exporte memória ou envie para orçamento.

Cuidados:

- use arquivos com boa resolução;
- prefira PDF digital ou Excel quando houver;
- revise quantidades, vírgulas e unidades;
- nunca aceite OCR sem conferência.

---

## 12. Central de Documentos da Obra

A **Central de Documentos** organiza todos os arquivos vinculados à obra.

Aceita:

- edital;
- termo de referência;
- ETP;
- projeto básico;
- memorial descritivo;
- planilhas;
- pranchas;
- PDFs digitais;
- PDFs escaneados;
- imagens;
- Excel e CSV.

Funcionalidades:

- upload em lote;
- classificação de documentos;
- contadores de documentos, OCR e extrações;
- histórico de análises;
- reabertura de revisão;
- exportação de dossiê em Excel/PDF;
- envio para importação ou analisador.

Como usar:

1. Abra **Central de Documentos**.
2. Arraste o lote de documentos.
3. Confira tipo e status.
4. Clique em **Analisar documentos** ou **Importar planilha/PDF**.
5. Revise os resultados.
6. Exporte o dossiê quando precisar comprovar rastreabilidade.

---

## 13. Analisador de Documentos da Obra

O **Analisador de Documentos** usa documentos da obra para sugerir uma primeira versão de orçamento.

Ele pode:

- classificar arquivos;
- extrair escopo;
- extrair especificações;
- identificar serviços prováveis;
- sugerir itens preliminares;
- cruzar descrição com bases de referência;
- atribuir confiança;
- apontar pendências;
- gerar memória de análise;
- enviar itens revisados para **Elaborar Orçamento**.

Fluxo:

1. Abra **Analisar Documentos**.
2. Envie edital, TR, ETP, projeto básico, memorial e pranchas.
3. Aguarde extração e classificação.
4. Leia escopo e especificações encontradas.
5. Revise a lista de serviços sugeridos.
6. Confira confiança e pendências.
7. Marque apenas itens válidos.
8. Clique em **Enviar para Elaborar Orçamento**.

Importante: o analisador gera estimativa preliminar. A responsabilidade técnica continua exigindo revisão humana.

---

## 14. Composições Analíticas (CPU)

A tela **Composições (CPU)** monta composições de preço unitário.

É possível:

- criar CPU própria;
- adicionar insumos;
- informar coeficientes;
- definir unidade;
- calcular custo unitário;
- vincular itens ao orçamento;
- criar biblioteca de composições;
- exportar biblioteca em Excel/PDF.

Fluxo:

1. Abra **Composições (CPU)**.
2. Crie uma nova composição.
3. Informe código, descrição e unidade.
4. Adicione insumos por código ou descrição.
5. Informe coeficiente de cada insumo.
6. Confira custo total.
7. Salve a composição.
8. Use a CPU no orçamento ou exporte a biblioteca.

Boa prática: revise coeficientes, encargos e origem dos preços antes de usar a CPU em relatório.

---

## 15. Custos Horários

A tela **Custos Horários** controla equipamentos, mão de obra e custos operacionais por hora.

Use para:

- cadastrar equipamentos;
- cadastrar mão de obra horária;
- calcular custo horário produtivo/improdutivo;
- organizar dados para composições;
- exportar em Excel/PDF.

Fluxo:

1. Abra **Custos Horários**.
2. Cadastre equipamento ou equipe.
3. Informe custo, produtividade ou valor horário.
4. Revise o total.
5. Use o valor nas composições ou no orçamento.
6. Exporte quando necessário.

---

## 16. Banco de Cotações

A tela **Cotações** organiza preços de fornecedores e mercado.

Funcionalidades:

- cadastro manual de cotação;
- importação Excel/CSV;
- comparação por código e descrição;
- aplicação aos custos;
- escolha de critério: menor preço, média, mediana ou menor preço com margem;
- atualização de orçamento, CPU ou ambos;
- exportação em Excel/PDF.

Como usar:

1. Abra **Cotações**.
2. Cadastre fornecedores ou importe arquivo.
3. Revise código, descrição, unidade e preço.
4. Escolha critério de aplicação.
5. Clique em **Aplicar aos custos**.
6. Confira o orçamento atualizado.
7. Exporte o banco de cotações.

---

## 17. Frentes de Serviço

A tela **Frentes de Serviço** separa a obra por local, etapa ou equipe.

É possível:

- cadastrar frentes manualmente;
- criar frentes por capítulo;
- vincular itens do orçamento a cada frente;
- acompanhar planejado e realizado;
- localizar pendências;
- exportar Excel/PDF.

Fluxo:

1. Abra **Frentes de Serviço**.
2. Clique em **Adicionar frente** ou **Criar por capítulo**.
3. Vincule os itens do orçamento.
4. Confira valor planejado por frente.
5. Atualize realizado, quando aplicável.
6. Exporte o resumo.

---

## 18. Planejamento Físico-Financeiro

A tela **Planejamento** transforma orçamento em cronograma.

Funcionalidades:

- criar tarefas;
- gerar planejamento a partir do orçamento;
- informar início e fim;
- acompanhar percentual físico;
- distribuir valor financeiro;
- exportar Excel/PDF.

Como usar:

1. Abra **Planejamento**.
2. Gere tarefas a partir do orçamento ou cadastre manualmente.
3. Informe datas.
4. Ajuste percentuais.
5. Confira distribuição financeira.
6. Exporte o planejamento.

---

## 19. Medições

A tela **Medições** acompanha execução da obra.

Use para:

- registrar medições por período;
- informar quantidades executadas;
- comparar planejado x executado;
- manter histórico;
- gerar relatório de medição;
- exportar Excel/PDF.

Fluxo:

1. Abra **Medições**.
2. Crie uma medição.
3. Informe período.
4. Preencha quantidades executadas.
5. Revise totais.
6. Exporte o relatório.

---

## 20. Quantitativos

A tela **Quantitativos** organiza memória quantitativa.

Funcionalidades:

- vincular quantitativos a itens do orçamento;
- registrar fórmulas;
- separar ambientes, trechos ou elementos;
- justificar quantidades;
- manter memória de cálculo;
- exportar dados.

Fluxo:

1. Abra **Quantitativos**.
2. Escolha item do orçamento.
3. Registre local, fórmula ou memória.
4. Informe quantidade calculada.
5. Revise total.
6. Use a quantidade na planilha.

---

## 21. Curva ABC

A **Curva ABC** classifica itens por peso financeiro.

Classes:

- **A:** itens mais relevantes financeiramente.
- **B:** impacto intermediário.
- **C:** menor impacto individual.

Como usar:

1. Abra **Curva ABC** após montar o orçamento.
2. Clique para gerar ou atualizar.
3. Analise itens Classe A.
4. Use a lista para priorizar auditoria, negociação ou revisão.
5. Exporte em Excel/PDF pelo relatório.

Boa prática: audite primeiro os itens Classe A.

---

## 22. Memória de Cálculo

A **Memória de Cálculo** detalha como cada item foi calculado.

Mostra:

- código;
- descrição;
- unidade;
- quantidade;
- preço unitário;
- subtotal;
- BDI;
- total;
- referência;
- observações.

Como usar:

1. Abra **Memória de Cálculo**.
2. Revise item por item.
3. Confira se quantidade e preço têm justificativa.
4. Use a memória no relatório final.

---

## 23. Análise SINAPI

A **Análise SINAPI** compara os itens do orçamento com bases de referência.

Funcionalidades:

- comparação por código;
- comparação por descrição;
- fuzzy match;
- cálculo de desvio;
- classificação conforme, alerta, crítico ou não encontrado;
- indicação de possível sobrepreço;
- resumo financeiro da diferença.

Como usar:

1. Carregue ou confirme a base de referência.
2. Monte ou importe o orçamento.
3. Abra **Análise SINAPI**.
4. Execute a auditoria.
5. Revise itens críticos.
6. Ajuste preços ou justifique tecnicamente.
7. Exporte relatório.

---

## 24. Conformidade BDI

A tela **Conformidade BDI** verifica o BDI aplicado.

Ela ajuda a responder:

- o BDI foi configurado?
- o BDI está dentro do limite de referência?
- quais componentes foram usados?
- há necessidade de justificativa?

Como usar:

1. Configure BDI em **BDI / Encargos**.
2. Abra **Conformidade BDI**.
3. Confira o status.
4. Revise alertas.
5. Inclua no relatório final.

---

## 25. Exportar / Relatório

A tela **Exportar / Relatório** gera entregáveis profissionais.

Campos:

- nome da obra;
- órgão/cliente;
- responsável técnico;
- CREA/CAU;
- ART/RRT;
- modelo de relatório;
- observações.

Exportações:

- planilha orçamentária em Excel;
- relatório em PDF;
- composição BDI;
- Curva ABC;
- resumo executivo;
- anexos operacionais;
- planejamento;
- medições;
- quantitativos;
- custos horários;
- cotações;
- frentes de serviço;
- memória de readequação de pregão, quando existir.

Fluxo:

1. Abra **Exportar / Relatório**.
2. Preencha dados da obra.
3. Escolha o modelo.
4. Pré-visualize abas.
5. Gere **Excel Profissional**.
6. Gere **PDF Profissional**.
7. Confira o arquivo antes de enviar ao cliente ou órgão.

---

## 26. Backups e Restauração

A tela **Backups** cria pontos de restauração.

Use antes de:

- importar arquivo grande;
- aplicar desconto de pregão;
- alterar BDI;
- carregar nova base;
- fazer ajustes em lote.

Como usar:

1. Abra **Backups**.
2. Crie um ponto de restauração.
3. Faça as alterações.
4. Se algo sair errado, restaure o backup.
5. Exporte o estado completo quando precisar arquivar.

---

## 27. Copilot TLPlanly

O Copilot é o assistente integrado ao sistema.

Ele ajuda com:

- navegação;
- explicação de módulos;
- BDI;
- SINAPI;
- Curva ABC;
- importação;
- OCR;
- auditoria;
- readequação de proposta;
- exportação;
- dúvidas operacionais.

Como usar:

1. Clique no botão do Copilot.
2. Pergunte em linguagem natural.
3. Use os botões sugeridos.
4. Peça orientação da tela atual.

Exemplos:

- Como importar uma planilha?
- Como usar OCR?
- Como calcular BDI?
- Como gerar planilha ajustada após pregão?
- Como auditar preços?
- Como exportar PDF?

Se a IA online estiver indisponível, o Copilot usa respostas locais para dúvidas principais.

---

## 28. Planos e Preços

A tela **Planos e Preços** apresenta os planos comerciais.

O usuário pode:

- comparar planos;
- ver usuários incluídos;
- ver limites de obras e recursos;
- entender funções principais de cada plano;
- clicar em **Tenho um código** para criar conta ou liberar acesso.

Observação: detalhes administrativos de geração e controle de códigos não aparecem para o usuário final.

---

## 29. Roteiros práticos

### Criar orçamento do zero

1. Entre na conta.
2. Configure UF, encargos e BDI.
3. Carregue bases.
4. Abra **Elaborar Orçamento**.
5. Pesquise itens.
6. Adicione quantidades.
7. Crie CPUs, se necessário.
8. Gere Curva ABC e relatório.

### Importar planilha de edital

1. Abra **Importar Planilha/PDF**.
2. Envie Excel/PDF.
3. Revise mapeamento.
4. Bloqueie itens suspeitos.
5. Confirme importação.
6. Envie para **Elaborar Orçamento**.
7. Ajuste e exporte.

### Analisar edital e documentos

1. Abra **Central de Documentos**.
2. Envie edital, TR, ETP, projeto básico, memorial e planilhas.
3. Abra **Analisar Documentos**.
4. Revise escopo e serviços sugeridos.
5. Marque itens válidos.
6. Envie para orçamento.

### Gerar planilha ajustada após pregão

1. Importe planilha estimativa.
2. Abra **Elaborar Orçamento**.
3. Use **Readequar Proposta do Pregão**.
4. Informe valor vencedor ou desconto.
5. Aplique desconto.
6. Exporte Excel e PDF.

### Auditar proposta de fornecedor

1. Importe a proposta.
2. Configure UF, tolerância e BDI.
3. Carregue bases.
4. Gere Curva ABC.
5. Rode **Análise SINAPI**.
6. Rode **Conformidade BDI**.
7. Exporte relatório.

### Acompanhar obra

1. Monte orçamento.
2. Crie frentes de serviço.
3. Gere planejamento.
4. Registre quantitativos.
5. Lance medições.
6. Exporte relatório de acompanhamento.

---

## 30. Problemas comuns

| Problema | O que fazer |
|---|---|
| Código de acesso inválido | Confira se digitou exatamente o código recebido. |
| Não consigo fechar a tela de login | O login é obrigatório para usar o sistema. |
| PDF não extraiu itens | Use OCR ou procure a planilha Excel original. |
| OCR trouxe números errados | Revise vírgulas, unidade e qualidade do arquivo. |
| Item sem match | Pesquise por descrição, revise código ou use outra base. |
| BDI aparece não configurado | Preencha componentes e clique em aplicar. |
| Total parece errado | Verifique quantidade, preço unitário, BDI e item importado. |
| Exportação incompleta | Confira se o orçamento tem itens e dados da obra preenchidos. |
| Obra não salvou | Aguarde status Salvo ou reabra o painel de conta. |
| Base não carregou | Confirme formato do arquivo e tente carregar lote novamente. |

---

## 31. Boas práticas

- Crie uma obra por edital, contrato ou empreendimento.
- Configure UF e encargos antes de importar.
- Faça backup antes de grandes alterações.
- Revise tudo que veio de OCR.
- Use Curva ABC antes da auditoria.
- Justifique itens sem referência.
- Exporte Excel e PDF ao final.
- Mantenha documentos originais na Central de Documentos.
- Não entregue planilha readequada sem conferir centavos e totais.
- Não use estimativa gerada por documentos sem validação técnica.

---

## 32. Glossário

- **BDI:** Benefícios e Despesas Indiretas.
- **SINAPI:** Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil.
- **SICRO:** Sistema de Custos Referenciais de Obras do DNIT.
- **ORSE:** base de referência de obras de Sergipe.
- **CPU:** Composição de Preço Unitário.
- **OCR:** reconhecimento de texto em imagem ou PDF escaneado.
- **Curva ABC:** classificação dos itens por impacto financeiro.
- **ETP:** Estudo Técnico Preliminar.
- **TR:** Termo de Referência.
- **ART/RRT:** responsabilidade técnica do engenheiro ou arquiteto.
- **Readequação:** ajuste da planilha ao valor vencedor de uma disputa.
- **Fuzzy match:** comparação aproximada por descrição.
- **Tenant:** ambiente isolado de cada cliente.

---

## 33. Resumo para apresentação

O TLPlanly une em uma única plataforma:

- elaboração de orçamento;
- importação inteligente;
- OCR;
- análise de documentos;
- BDI e encargos;
- CPU;
- Curva ABC;
- auditoria SINAPI;
- conformidade BDI;
- cotações;
- custos horários;
- frentes de serviço;
- planejamento;
- medições;
- quantitativos;
- backups;
- Copilot;
- relatórios em Excel e PDF.

Ele atende tanto quem precisa montar a planilha quanto quem precisa conferir se ela está tecnicamente correta.
