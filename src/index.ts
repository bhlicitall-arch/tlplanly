import { OrcamentoParser } from './connectors/sinapiProcessor';
import { SinapiConnector } from './connectors/sinapiConnector';
import { AgenteAuditor } from './services/AgenteAuditor';
import { RelatorioExportador } from './services/RelatorioExportador';
import { AIAgentOrchestrator } from './ai_agents/orchestrator';

/**
 * TLPlanly — Motor de ingestão e auditoria de insumos SINAPI.
 *
 * Pipeline principal:
 *   1. Lê a planilha CSV de orçamento
 *   2. Extrai os itens como OrcamentoItem[]
 *   3. Converte para Insumo[] (formato compatível com auditoria)
 *   4. Carrega a base de referência SINAPI (JSON)
 *   5. Executa a auditoria comparativa
 *   6. Exporta relatório (JSON + CSV + TXT)
 *   7. Exibe o resumo de conformidade
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║        TLPlanly — AUDITORIA DE INSUMOS SINAPI        ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    // ── 1. Parse da planilha de orçamento ──────────────────────────────
    const parser = new OrcamentoParser();
    const caminhoPlanilha = 'data/insumos.csv';

    console.log(`\n📂 Lendo planilha: ${caminhoPlanilha}`);
    let itensOrcamento;
    try {
        itensOrcamento = parser.lerPlanilha(caminhoPlanilha);
        console.log(`✅ ${itensOrcamento.length} itens extraídos da planilha.`);
        if (itensOrcamento.length === 0) {
            throw new Error('Nenhum item extraído — formato não reconhecido.');
        }
    } catch (err) {
        console.error(`❌ Erro ao ler planilha: ${(err as Error).message}`);
        console.log('\n⚠️  Usando dados simulados para demonstração...\n');
        itensOrcamento = gerarDadosSimulados();
    }

    // ── 2. Converter para Insumo[] ────────────────────────────────────
    const insumos = parser.paraInsumos(itensOrcamento);
    console.log(`📦 ${insumos.length} insumos preparados para auditoria.`);

    // ── 3. Carregar base de referência SINAPI ─────────────────────────
    const connector = new SinapiConnector();
    const precosRef = connector.carregarPrecosReferencia();
    console.log(`📚 Base de referência SINAPI: ${precosRef.length} preços carregados.`);

    // ── 4. Executar auditoria ─────────────────────────────────────────
    const auditor = new AgenteAuditor({ toleranciaAprovado: 5, toleranciaAlerta: 15 });
    const relatorio = await auditor.comparar(insumos);

    // ── 5. Análise adicional com IA (orquestrador) ────────────────────
    console.log('\n🤖 Orquestrador de IA disponível para análise avançada.');
    if (relatorio.criticos > 0) {
        const orquestrador = new AIAgentOrchestrator();
        const analiseIA = await orquestrador.executeTask(
            `Analisar ${relatorio.criticos} itens criticos na auditoria de precos SINAPI. ` +
            `Diferença total: R$ ${relatorio.diferencaTotal.toFixed(2)}.`
        );
        console.log(`   ${analiseIA}`);
    }

    // ── 6. Exportar relatório ─────────────────────────────────────────
    const exportador = new RelatorioExportador({ pasta: 'relatorios' });
    exportador.exportarTudo(relatorio);

    // ── 7. Resumo final ───────────────────────────────────────────────
    const indiceConformidade =
        relatorio.totalInsumos > 0
            ? ((relatorio.aprovados / relatorio.totalInsumos) * 100).toFixed(1)
            : '0.0';

    console.log(`\n📊 Índice de Conformidade: ${indiceConformidade}%`);
    console.log('✅ Auditoria concluída com sucesso!');
}

/**
 * Dados simulados para demonstração quando a planilha real não pode ser parseada.
 */
function gerarDadosSimulados() {
    return [
        { codigo: '9856',  descricao: 'Concreto Betuminoso (CBUQ)',     unidade: 'M3', quantidade: 100,  precoUnitario: 450,  precoTotal: 45000,  categoria: 'Pavimentacao', fonte: 'SIMULADO' },
        { codigo: '96541', descricao: 'Areia media',                     unidade: 'M3', quantidade: 50,   precoUnitario: 95,   precoTotal: 4750,   categoria: 'Agregados',    fonte: 'SIMULADO' },
        { codigo: '96543', descricao: 'Brita 1',                         unidade: 'M3', quantidade: 80,   precoUnitario: 110,  precoTotal: 8800,   categoria: 'Agregados',    fonte: 'SIMULADO' },
        { codigo: '96640', descricao: 'Grama sintetica 20mm',            unidade: 'M2', quantidade: 500,  precoUnitario: 85,   precoTotal: 42500,  categoria: 'Paisagismo',   fonte: 'SIMULADO' },
        { codigo: '96655', descricao: 'Alambrado tela galvanizada',      unidade: 'M2', quantidade: 300,  precoUnitario: 35,   precoTotal: 10500,  categoria: 'Cercas',       fonte: 'SIMULADO' },
        { codigo: '99640', descricao: 'Cesta de basquete',               unidade: 'UN', quantidade: 2,    precoUnitario: 1800, precoTotal: 3600,   categoria: 'Equipamentos', fonte: 'SIMULADO' },
        { codigo: '99635', descricao: 'Conjunto de playground',          unidade: 'UN', quantidade: 1,    precoUnitario: 4500, precoTotal: 4500,   categoria: 'Equipamentos', fonte: 'SIMULADO' },
        { codigo: '96665', descricao: 'Luminaria LED 150W',              unidade: 'UN', quantidade: 10,   precoUnitario: 780,  precoTotal: 7800,   categoria: 'Iluminacao',   fonte: 'SIMULADO' },
        { codigo: '74920', descricao: 'Cimento Portland CP II F-32',     unidade: 'KG', quantidade: 2000, precoUnitario: 1.20, precoTotal: 2400,   categoria: 'Materiais',    fonte: 'SIMULADO' },
        { codigo: '96550', descricao: 'Aco CA-50',                       unidade: 'KG', quantidade: 1500, precoUnitario: 9.50, precoTotal: 14250,  categoria: 'Estrutura',    fonte: 'SIMULADO' },
    ];
}

main().catch(console.error);
