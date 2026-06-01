import { AIAgentOrchestrator } from '../src/ai_agents/orchestrator';

async function rodarTeste() {
    console.log(">>> TESTE INICIADO <<<");
    const orchestrator = new AIAgentOrchestrator();
    
    try {
        const resultado = await orchestrator.executeTask("Cálculo de alvenaria");
        console.log(">>> SUCESSO! <<<");
        console.log(resultado);
    } catch (erro) {
        console.error(">>> ERRO NO TESTE <<<", erro);
    }
}

rodarTeste();