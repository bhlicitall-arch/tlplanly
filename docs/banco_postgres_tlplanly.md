# TLPlanly - Banco de dados PostgreSQL

Este projeto usa uma camada SaaS com login, organizacao/cliente, sessoes e obras/orcamentos persistidos.

## O que fica no banco

- Usuarios e senhas com hash PBKDF2.
- Organizacao/cliente (`tenant`).
- Sessoes de login.
- Obras/orcamentos salvos pelo usuario.
- Estado completo da obra em `jsonb`, incluindo:
  - orcamento;
  - BDI e encargos;
  - documentos e extracoes;
  - planejamento, medicoes e quantitativos;
  - grupos de custo;
  - insumos importados;
  - biblioteca de CPUs;
  - memoria de readequacao de proposta do pregao.

## Como o servidor escolhe a persistencia

- Com `DATABASE_URL`: usa PostgreSQL.
- Sem `DATABASE_URL`: usa arquivo local em `.tlplanly-data/saas-store.json`.

O fallback local existe para desenvolvimento e testes, mas producao deve usar PostgreSQL.

## Render

O `render.yaml` ja declara:

- web service `tlplanly`;
- banco `tlplanly-postgres`;
- variavel `DATABASE_URL` apontando para o `connectionString` privado do banco;
- `SESSION_SECRET` gerado automaticamente.

Se o servico foi criado como **Blueprint**, o Render deve provisionar o Postgres e injetar a variavel automaticamente.

Se o servico foi criado manualmente como **New Web Service**, crie um PostgreSQL no Render e copie o Internal Database URL para:

```text
DATABASE_URL
```

Depois faca um novo deploy.

## Verificacao

Abra:

```text
https://tlplanly.onrender.com/health
```

O resultado esperado em producao com banco ativo:

```json
{
  "persistence": "postgres",
  "database": true,
  "databaseReady": true
}
```

Tambem existe:

```text
https://tlplanly.onrender.com/api/saas/status
```

## Tabelas criadas automaticamente

- `saas_schema_migrations`
- `saas_tenants`
- `saas_users`
- `saas_sessions`
- `saas_projects`

O servidor cria e atualiza esse esquema na inicializacao.
