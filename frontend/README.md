# TLPlanly Frontend Modular

Esta pasta inicia a separacao do antigo `tlplanly.html` monolitico.

## Estrutura atual

- `index.html`: markup principal sem CSS/JS inline.
- `src/styles.css`: estilos extraidos do HTML original.
- `src/main.js`: logica JavaScript extraida do HTML original.

## Regra de transicao

O arquivo `tlplanly.html` permanece como legado/compatibilidade enquanto a aplicacao modular estabiliza.
O servidor Express ja prioriza `frontend/index.html` em `/`.

## Proximo corte recomendado

1. Separar `src/main.js` por dominio:
   - `state.js`
   - `sinapi.js`
   - `orcamento.js`
   - `bdi.js`
   - `curva-abc.js`
   - `auditoria.js`
   - `copilot.js`
   - `exportacao.js`
2. Trocar globais soltos por um objeto de aplicacao.
3. Adicionar testes de UI com fluxo minimo: carregar base, adicionar item, gerar ABC e exportar.
