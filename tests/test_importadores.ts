import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { SinapiXlsxReader } from '../src/connectors/sinapiXlsxReader';

function exigir(condicao: boolean, mensagem: string): void {
    if (!condicao) throw new Error(mensagem);
}

async function criarXlsxSinapiNacional(caminho: string): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('ISD');

    ws.getRow(3).getCell(2).value = '06/2026';
    ws.getRow(10).getCell(1).value = 'Classificacao';
    ws.getRow(10).getCell(2).value = 'Codigo';
    ws.getRow(10).getCell(3).value = 'Descricao';
    ws.getRow(10).getCell(4).value = 'Unidade';
    ws.getRow(10).getCell(5).value = 'AC';
    ws.getRow(10).getCell(6).value = 'MG';
    ws.getRow(10).getCell(7).value = 'SP';

    ws.getRow(11).getCell(2).value = '12345';
    ws.getRow(11).getCell(3).value = 'CIMENTO PORTLAND CP II';
    ws.getRow(11).getCell(4).value = 'KG';
    ws.getRow(11).getCell(6).value = 0.82;

    ws.getRow(12).getCell(2).value = '67890';
    ws.getRow(12).getCell(3).value = 'AREIA MEDIA LAVADA';
    ws.getRow(12).getCell(4).value = 'M3';
    ws.getRow(12).getCell(6).value = 118.35;

    await wb.xlsx.writeFile(caminho);
}

async function testarImportadores() {
    console.log('TESTE: IMPORTADORES - TLPlanly');

    const caminho = path.resolve('data', 'test_sinapi_import.xlsx');
    try {
        await criarXlsxSinapiNacional(caminho);
        const reader = new SinapiXlsxReader();
        const refs = await reader.lerArquivo(caminho, { uf: 'MG' });

        exigir(refs.length === 2, 'Importador XLSX deveria extrair 2 referencias.');
        exigir(refs[0].codigoSinapi === '12345', 'Codigo da primeira referencia divergente.');
        exigir(refs[0].precoMedio === 0.82, 'Preco MG da primeira referencia divergente.');
        exigir(refs[0].fonte === 'SINAPI/CAIXA/ISD/MG', 'Fonte da primeira referencia divergente.');
        exigir(refs[1].dataReferencia === '06/2026', 'Referencia mensal divergente.');

        console.log('TESTE XLSX PASSOU.');
        console.log('PDF/OCR: pendente de teste automatizado de navegador; fluxo atual depende de pdfjs/Tesseract no frontend.');
    } finally {
        try {
            if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
        } catch {
            // Em pasta montada, a remocao pode falhar sem afetar o resultado do teste.
        }
    }
}

testarImportadores().catch(err => {
    console.error('Teste de importadores interrompido:', err);
    process.exit(1);
});
