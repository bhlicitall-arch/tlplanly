/**
 * Script de importacao de planilha SINAPI (.xlsx ou .zip contendo .xlsx).
 *
 * Uso:
 *   npm run sinapi:import -- <arquivo.xlsx|arquivo.zip> [--desonerado] [--uf MG]
 *
 * Exemplos:
 *   npm run sinapi:import -- data/SINAPI-2026-04-formato-xlsx.zip
 *   npm run sinapi:import -- data/SINAPI-2026-04-formato-xlsx.zip --uf SP
 *   npm run sinapi:import -- data/SINAPI_Insumos_MG_202605.xlsx --desonerado
 *
 * Fonte oficial dos arquivos:
 *   https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/
 */
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { SinapiXlsxReader } from '../src/connectors/sinapiXlsxReader';

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Uso: npm run sinapi:import -- <arquivo.xlsx|.zip> [--desonerado] [--uf XX]');
        console.error('');
        console.error('Baixe o arquivo em:');
        console.error('  https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/');
        process.exit(1);
    }

    const caminhoEntrada = path.resolve(args[0]);
    const desonerado     = args.includes('--desonerado');
    const ufIdx          = args.indexOf('--uf');
    const uf             = ufIdx >= 0 ? args[ufIdx + 1]?.toUpperCase() : undefined;
    const caminhoRef     = path.resolve('data', 'referencia.json');

    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║      TLPlanly — IMPORTACAO SINAPI (.xlsx / .zip)     ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log(`\nEntrada  : ${caminhoEntrada}`);
    console.log(`Modo     : ${desonerado ? 'Desonerado' : 'Nao desonerado'}`);
    if (uf) console.log(`Filtro UF: ${uf}`);
    console.log(`Destino  : ${caminhoRef}\n`);

    if (!fs.existsSync(caminhoEntrada)) {
        console.error(`❌ Arquivo nao encontrado: ${caminhoEntrada}`);
        process.exit(1);
    }

    const ext = path.extname(caminhoEntrada).toLowerCase();
    const reader = new SinapiXlsxReader();

    if (ext === '.zip') {
        await importarDoZip(caminhoEntrada, caminhoRef, reader, desonerado, uf);
    } else if (ext === '.xlsx' || ext === '.xls') {
        const total = await reader.importarParaJson(caminhoEntrada, caminhoRef, { desonerado });
        console.log(`\n✅ ${total} insumos importados para referencia.json`);
        console.log('   Execute "npm start" para auditar com a nova base.\n');
    } else {
        console.error(`❌ Formato nao suportado: ${ext}. Use .xlsx ou .zip`);
        process.exit(1);
    }
}

async function importarDoZip(
    caminhoZip: string,
    caminhoRef: string,
    reader: SinapiXlsxReader,
    desonerado: boolean,
    uf?: string
) {
    console.log('[ZIP] Extraindo conteudo...');

    const zip = new AdmZip(caminhoZip);
    const entradas = zip.getEntries();

    // Listar todos os .xlsx dentro do ZIP
    const xlsxEntradas = entradas.filter(e =>
        e.entryName.toLowerCase().endsWith('.xlsx') &&
        !e.entryName.startsWith('__MACOSX')
    );

    if (xlsxEntradas.length === 0) {
        console.error('❌ Nenhum arquivo .xlsx encontrado dentro do ZIP.');
        process.exit(1);
    }

    console.log(`[ZIP] ${xlsxEntradas.length} arquivo(s) .xlsx encontrado(s):`);
    xlsxEntradas.forEach(e => console.log(`  - ${e.entryName}`));

    // Prioridade: arquivo de referencia de precos (contém "Referencia" no nome)
    const prioridade = (nome: string) => {
        const n = nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (n.includes('REFERENCIA') || n.includes('PRECO_REF')) return 0;
        if (n.includes('MAO_DE_OBRA') || n.includes('MANUTENCAO')) return 2;
        return 1;
    };
    let alvos = [...xlsxEntradas].sort((a, b) => prioridade(a.entryName) - prioridade(b.entryName));

    // Se houver arquivo por UF especifico, preferir esse
    if (uf) {
        const porUF = alvos.filter(e =>
            e.entryName.toUpperCase().includes(`_${uf}_`) ||
            e.entryName.toUpperCase().includes(`_${uf}.`)
        );
        if (porUF.length > 0) {
            alvos = porUF;
            console.log(`[ZIP] Filtrado para UF=${uf}: ${alvos.length} arquivo(s)`);
        } else {
            console.log(`[ZIP] Formato nacional detectado — UF sera filtrada internamente (--uf ${uf})`);
        }
    }

    // Processar o arquivo de maior prioridade
    const alvo = alvos[0];
    console.log(`\n[ZIP] Processando: ${alvo.entryName}`);

    const tmpDir  = path.resolve('data', 'downloads');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const tmpPath = path.join(tmpDir, path.basename(alvo.entryName));
    fs.writeFileSync(tmpPath, alvo.getData());
    console.log(`[ZIP] Extraido para: ${tmpPath}`);

    const total = await reader.importarParaJson(tmpPath, caminhoRef, { desonerado });

    console.log(`\n✅ ${total} insumos importados para referencia.json`);
    console.log('   Execute "npm start" para auditar com a nova base.\n');

    // Se houver mais arquivos, informar o usuario
    if (alvos.length > 1) {
        console.log(`ℹ️  O ZIP contem ${alvos.length} arquivos. Apenas "${path.basename(alvo.entryName)}" foi importado.`);
        console.log('   Para importar outro estado, use: npm run sinapi:import -- <zip> --uf XX\n');
    }
}

main().catch(err => {
    console.error('❌ Erro na importacao:', err.message);
    process.exit(1);
});
