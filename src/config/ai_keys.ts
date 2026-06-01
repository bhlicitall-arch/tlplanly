/**
 * Configuração de chaves de API para provedores de IA.
 *
 * Estratégia de failover: Se o provedor primário falhar,
 * o orquestrador tenta o fallback, depois o audit.
 */

export const AI_CONFIG = {
    providers: {
        primary: process.env.AI_PRIMARY_KEY,
        fallback: process.env.AI_FALLBACK_KEY,
        audit: process.env.AI_AUDITOR_KEY,
    },

    // Configuração de failover
    retryPolicy: {
        maxAttempts: 3,
        delayMs: 1000,
    },
};
