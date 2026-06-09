---
name: manual-operacao-tlplanly
description: Base de conhecimento operacional do TLPlanly para orientar usuários leigos sobre todas as telas, fluxos e funcionalidades do sistema.
---

# Manual Operacional TLPlanly - Base do Copilot

Use esta skill quando o usuário perguntar como operar o TLPlanly, como usar determinada tela, por onde começar, como importar arquivos, como auditar, como configurar BDI, como gerar relatório ou como resolver dúvidas práticas de uso.

## Regra de resposta

Responda como tutor de produto, em português brasileiro, com passos práticos. Evite jargão desnecessário. Quando fizer sentido, diga exatamente qual menu abrir e qual botão clicar.

## Fluxo recomendado para iniciantes

1. Abrir **Configurações** e conferir UF, tolerância, tipo de obra, moeda, modelo de relatório e regime de encargos.
2. Abrir **Bases de Referência** e confirmar SINAPI/SICRO/ORSE carregados.
3. Abrir **BDI / Encargos**, preencher AC, S, R, DF, L e I, conferir limite TCU e clicar em **Aplicar ao Orçamento**.
4. Usar **Central de Documentos** para anexar edital, TR, ETP, projeto básico, memorial, planilhas e pranchas.
5. Usar **Analisar Documentos** quando não há planilha pronta.
6. Usar **Importar Planilha/PDF** quando há Excel, CSV, PDF digital, PDF escaneado ou imagem.
7. Revisar a extração. Nada deve entrar automaticamente no orçamento sem validação humana.
8. Clicar em **Enviar para Elaborar Orçamento** ou **Confirmar e enviar para Elaboração**.
9. Ajustar itens em **Elaborar Orçamento**.
10. Gerar **Curva ABC**, **Memória de Cálculo**, **Análise SINAPI** e **Conformidade BDI**.
11. Exportar em **Exportar / Relatório**.

## Telas e finalidade

- **Dashboard:** mostra resumo do orçamento ativo, total, BDI, itens e alertas.
- **Elaborar Orçamento:** cria orçamento do zero, importa Excel/PDF, pesquisa SINAPI, edita descrição, unidade, quantidade, preço, capítulo e categoria.
- **Composições (CPU):** cria composição de preço unitário com insumos, coeficientes, encargos e biblioteca própria.
- **Importar Planilha/PDF:** extrai itens de Excel, CSV, PDF digital, PDF escaneado e imagem; aplica OCR quando necessário; abre revisão antes de importar.
- **Analisar Documentos:** lê edital, TR, ETP, projeto básico, memorial e projetos para sugerir escopo, serviços, composições preliminares e referências.
- **Central de Documentos:** guarda documentos da obra, lote de arquivos, documentos classificados, OCR, revisões pendentes e histórico de extrações.
- **BDI / Encargos:** calcula BDI pela fórmula do Decreto 7.983/2013, compara limites TCU e define regime de encargos.
- **Curva ABC:** classifica itens por impacto financeiro: A até 80%, B até 95%, C até 100%.
- **Memória de Cálculo:** detalha itens, custos, BDI, encargos, origem e referência.
- **Planejamento:** gera tarefas do orçamento, datas, dependências, Gantt e Curva S.
- **Medições:** registra quantidade executada por período e acompanha saldo/excedentes.
- **Quantitativos:** cria memórias auxiliares com fórmulas e aplica resultado na quantidade do item.
- **Análise SINAPI:** audita preços contra referência e aponta conforme, alerta, crítico e não encontrado.
- **Conformidade BDI:** verifica se o BDI está compatível com limites de referência TCU.
- **Exportar / Relatório:** gera Excel/PDF profissional com planilha, BDI, ABC, encargos, planejamento, medições, quantitativos e anexos.
- **Backups:** cria e restaura pontos de segurança locais.

## Como explicar importação

Se o usuário perguntar como importar:
1. Diga para abrir **Importar Planilha/PDF** ou clicar em **Importar planilha** dentro de **Elaborar Orçamento**.
2. Informar que aceita lote de Excel, CSV, PDF digital, PDF escaneado e imagens.
3. Explicar que OCR roda automaticamente quando o PDF não tem texto útil.
4. Mandar revisar código, descrição, unidade, quantidade, preço, referência e match.
5. Só depois clicar em **Confirmar e enviar para Elaboração**.

## Como explicar análise por documentos

Se o usuário tiver edital, TR, ETP, projeto básico e memorial:
1. Abrir **Central de Documentos**.
2. Clicar em **Selecionar lote** e anexar todos os arquivos da obra.
3. Clicar em **Analisar agora**.
4. Conferir documentos classificados.
5. Revisar serviços sugeridos, confiança e pendências.
6. Ajustar itens e clicar em **Enviar para Elaborar Orçamento**.
7. Alertar que é estimativa preliminar e precisa de validação técnica.

## Como explicar BDI

BDI é Benefícios e Despesas Indiretas. No TLPlanly, o usuário deve preencher AC, S, R, DF, L e I na tela **BDI / Encargos**, escolher tipo de obra, conferir limite TCU e clicar em **Aplicar ao Orçamento**. Se aparecer "Não configurado", o BDI ainda não foi aplicado.

## Como explicar auditoria

Para auditar uma planilha:
1. Importar ou montar a planilha.
2. Ativar **Modo Auditor** se necessário.
3. Conferir UF, tolerância e base.
4. Abrir **Análise SINAPI**.
5. Executar auditoria.
6. Revisar itens conformes, alertas, críticos e não encontrados.
7. Gerar relatório final.

## Como explicar relatórios

Para exportar:
1. Abrir **Exportar / Relatório**.
2. Preencher dados da obra, órgão, responsável técnico, CREA/CAU e ART/RRT.
3. Escolher modelo.
4. Pré-visualizar.
5. Exportar Excel profissional ou imprimir/salvar PDF.

## Problemas comuns

- PDF não extraiu: usar OCR, melhorar resolução ou preferir Excel original.
- Item sem match: revisar código/descrição e pesquisar manualmente.
- BDI não configurado: preencher componentes e aplicar ao orçamento.
- Salvamento pendente: aguardar chip ficar "Salvo".
- Quantidade errada: conferir OCR, vírgulas, unidades e memória quantitativa.

## Referência documental

Existe um manual completo em:
- `docs/manual_usuario_tlplanly.md`
- `docs/manual_usuario_tlplanly.html`

Quando o usuário pedir "manual", "guia", "treinamento", "apresentação" ou "como operar", recomende abrir o manual HTML pela rota `/manual` quando disponível.
