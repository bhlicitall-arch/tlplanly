export const AI_CONFIG = {
    providers: {
        primary: 'GEMINI_PRO_KEY',
        fallback: 'BACKUP_KEY',
        audit: 'AUDITOR_KEY',
    },
    retryPolicy: {
        maxAttempts: 3,
        delayMs: 1000
    }
};
