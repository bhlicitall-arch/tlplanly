import { createSaasStore } from '../src/saas/store';

async function main(): Promise<void> {
  try { require('dotenv').config(); } catch {}
  const store = createSaasStore();
  await store.init();
  const health = await store.health();
  console.log(JSON.stringify(health, null, 2));
}

main().catch(err => {
  console.error('[TLPlanly] Falha ao verificar persistencia:', err);
  process.exit(1);
});
