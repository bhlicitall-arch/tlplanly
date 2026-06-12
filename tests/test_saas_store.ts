import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { hashPassword, hashSessionToken, verifyPassword } from '../src/saas/auth';
import { FileSaasStore } from '../src/saas/store';

async function main(): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlplanly-saas-'));
  const storePath = path.join(dir, 'saas-store.json');
  const store = new FileSaasStore(storePath);
  await store.init();

  const pwd = hashPassword('senha-forte-123');
  const user = await store.createUser({
    name: 'Carlos',
    email: 'CARLOS@EXEMPLO.COM',
    passwordHash: pwd.hash,
    passwordSalt: pwd.salt,
    orgName: 'TechLicense',
  });

  assert.equal(user.email, 'carlos@exemplo.com');
  assert.equal(user.role, 'admin');
  assert.equal(verifyPassword('senha-forte-123', pwd.salt, pwd.hash), true);

  const storedUser = await store.findUserByEmail('carlos@exemplo.com');
  assert.ok(storedUser);
  assert.equal(storedUser.tenantId, user.tenantId);

  const tokenHash = hashSessionToken('token-teste');
  await store.createSession(user.id, tokenHash, new Date(Date.now() + 60_000));
  const sessionUser = await store.getUserBySession(tokenHash);
  assert.equal(sessionUser?.id, user.id);

  const project = await store.createProject(user, {
    name: 'Obra Escola Municipal',
    state: {
      orcamento: [{ cod: '001', desc: 'Servico', qtd: 2, preco: 10 }],
      cpuBiblioteca: [{ cod: 'CPU-001', desc: 'Composicao propria' }],
    },
  });
  assert.equal(project.name, 'Obra Escola Municipal');
  assert.equal(project.state.cpuBiblioteca.length, 1);

  const listed = await store.listProjects(user);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, project.id);

  const updated = await store.updateProject(user, project.id, {
    name: 'Obra Escola Municipal Ajustada',
    state: { orcamento: [], descontoProposta: { final: 680000 } },
  });
  assert.equal(updated?.name, 'Obra Escola Municipal Ajustada');
  assert.equal(updated?.state.descontoProposta.final, 680000);

  const otherPwd = hashPassword('senha-forte-456');
  const otherUser = await store.createUser({
    name: 'Outro Cliente',
    email: 'outro@example.com',
    passwordHash: otherPwd.hash,
    passwordSalt: otherPwd.salt,
    orgName: 'Outro Orgao',
  });
  assert.equal(await store.getProject(otherUser, project.id), null);

  const health = await store.health();
  assert.equal(health.ready, true);
  assert.equal(health.database, false);
  assert.equal(health.projects, 1);

  await store.deleteSession(tokenHash);
  assert.equal(await store.getUserBySession(tokenHash), null);

  assert.equal(await store.deleteProject(user, project.id), true);
  assert.equal((await store.listProjects(user)).length, 0);

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('TESTE SAAS STORE PASSOU.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
