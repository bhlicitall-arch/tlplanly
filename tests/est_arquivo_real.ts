import fs from 'fs';
import path from 'path';
import { OrcamentoParser } from '../src/connectors/sinapiProcessor';
import { AgenteAuditor } from '../src/services/AgenteAuditor';
import { RelatorioExportador } from '../src/services/RelatorioExportador';

// CSV no padrao SINAPI com cabecalho multi-linha
const CSV_SIMULADO = [
    'PREFEITURA MUNICIPAL DE BELO HORIZONTE;;;;;',
    'SECRETARIA MUNICIPAL DE OBRAS;;;;;',
    'OBRA: Reforma de Praca Publica - Bairro Centro;;;;;',
    'DATA: Maio/2026;;;;;',
    ';;;;;',
    'CODIGO;DESCRICAO;UNIDADE;QUANTIDADE;PRECO UNITARIO;PRECO TOTAL',
    '9856;Concreto Betuminoso (CBUQ) usinado a quente;M3;120;480,00;57600,00',
    '96541;Areia media lavada;M3;80;95,00;7600,00',
    '96543;Brita 1 pedra britada;M3;60;110,00;6600,00',
    '96640;Grama sintetica 20mm;M2;800;85,00;68000,00',
    '96655;Alambrado tela galvanizada;M2;500;35,00;17500,00',
    '74920;Cimento Portland CP II F-32;KG;5000;1,20;6000,00',
    '96550;Aco CA-50;KG;2000;9,50;19000,00',
    '96645;Piso intertravado concreto 8cm;M2;300;52,00;15600,00',
    '96665;Luminaria LED 150W;UN;15;850,00;12750,00',
    '99640;Cesta de basquete oficial;UN;4;2200,00;8800,00',
    '73962;Lastro de brita para pavimentos;M3;50;85,00;4250,00',
    '99635;Conjunto de playground;UN;2;4800,00;9600,00',
].join('\n');

async function rodarTesteArquivoReal() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║    TESTE INTEGRACAO — ARQUIVO CSV REAL (TLPlanly)    ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    const caminhoCsv = path.resolve('data', 'test_real_temp.csv');
    fs.writeFileSync(caminhoCsv, CSV_SIMULADO, 'utf-8');
    console.log('\n📄 CSV de teste criado: ' + caminhoCsv);

    let erros = 0;

    try {
        // Parse
        const parser = new OrcamentoParser();
        const itens = parser.lerPlanilha(caminhoCsv, ';');
        console.log('✅ ' + itens.length + ' itens extraidos do CSV.');

        if (itens.length === 0) {
            console.error('❌ Nenhum item extraido — verificar formato do CSV.');
            erros++;
        }

        const primeiro = itens[0];
        if (!primeiro || !primeiro.codigo) {
            console.error('❌ Primeiro item invalido.');
            erros++;
        } else {
            console.log('✅ Primeiro item: [' + primeiro.codigo + '] ' + primeiro.descricao + ' — R$ ' + primeiro.precoUnitario.toFixed(2));
        }

        const comZero = itens.filter(i => i.precoUnitario === 0 && i.quantidade > 0);
        if (comZero.length > 0) {
            console.warn('⚠️  ' + comZero.length + ' item(ns) com preco zero: ' + comZero.map(i => i.codigo).join(', '));
        } else {
            console.log('✅ Todos os itens com preco unitario valido.');
        }

        // Conversao
        const insumos = parser.paraInsumos(itens);
        if (insumos.length !== itens.length) {
            console.error('❌ Conversao falhou: ' + itens.length + ' itens → ' + insumos.length + ' insumos');
            erros++;
        } else {
            console.log('✅ ' + insumos.length + ' insumos convertidos.');
        }

        // Auditoria
        const auditor = new AgenteAuditor({ toleranciaAprovado: 5, toleranciaAlerta: 15 });
        const relatorio = await auditor.comparar(insumos);

        const somaStatus = relatorio.aprovados + relatorio.alertas + relatorio.criticos + relatorio.naoEncontrados;
        if (somaStatus !== relatorio.totalInsumos) {
            console.error('❌ Soma de status (' + somaStatus + ') != total (' + relatorio.totalInsumos + ')');
            erros++;
        } else {
            console.log('✅ Soma de status consistente: ' + somaStatus + ' = ' + relatorio.totalInsumos);
        }

        // Cimento 74920 esta 41% acima de 0,85 → deve ser CRITICO
        const cimento = relatorio.resultados.find(r => r.codigoSinapi === '74920');
        if (!cimento) {
            console.error('❌ Insumo 74920 (cimento) nao encontrado no relatorio');
            erros++;
        } else if (cimento.status !== 'CRÍTICO') {
            console.error('❌ Cimento: esperado CRITICO, obtido ' + cimento.status + ' (' + cimento.diferencaPercentual?.toFixed(2) + '%)');
            erros++;
        } else {
            console.log('✅ Cimento [74920]: ' + cimento.status + ' — ' + cimento.diferencaPercentual?.toFixed(2) + '% acima da referencia');
        }

        // Exportacao
        const exportador = new RelatorioExportador({ pasta: 'relatorios', prefixo: 'teste_real', timestamp: false });
        const caminhos = exportador.exportarTudo(relatorio);

        for (const [fmt, caminho] of Object.entries(caminhos)) {
            if (!fs.existsSync(caminho)) {
                console.error('❌ Arquivo ' + fmt.toUpperCase() + ' nao gerado: ' + caminho);
                erros++;
            } else {
                const kb = (fs.statSync(caminho).size / 1024).toFixed(1);
                console.log('✅ Exportacao ' + fmt.toUpperCase() + ': ' + path.basename(caminho) + ' (' + kb + ' KB)');
            }
        }

    } finally {
        try { if (fs.existsSync(caminhoCsv)) fs.unlinkSync(caminhoCsv); } catch { /* pasta montada pode nao permitir unlink */ }
    }

    console.log('\n' + '═'.repeat(54));
    if (erros === 0) {
        console.log('🎉 TODOS OS TESTES DE INTEGRACAO PASSARAM!');
    } else {
        console.error('❌ ' + erros + ' teste(s) de integracao falharam.');
    }
    console.log('═'.repeat(54));

    process.exit(erros > 0 ? 1 : 0);
}

rodarTesteArquivoReal().catch(err => {
    console.error('❌ Teste interrompido por erro:', err);
    process.exit(1);
});
