import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { PrecoReferencia } from '../models/Auditoria';

export interface OpcoesSinapiXlsx {
    uf?: string;
    desonerado?: boolean;
    semEncargos?: boolean;
}

function getCellValue(cell: ExcelJS.Cell): string {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    const v = cell.value;
    if (typeof v === 'object' && 'richText' in (v as any))
        return (v as ExcelJS.CellRichTextValue).richText.map(r => r.text).join('');
    if (typeof v === 'object' && 'result' in (v as any))
        return String((v as ExcelJS.CellFormulaValue).result ?? '');
    return String(v);
}

function getNumValue(cell: ExcelJS.Cell): number {
    if (!cell || cell.value === null || cell.value === undefined) return 0;
    const v = cell.value;
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && 'result' in (v as any)) {
        const r = (v as ExcelJS.CellFormulaValue).result;
        return typeof r === 'number' ? r : 0;
    }
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

async function salvarJson(caminho: string, refs: PrecoReferencia[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const stream = fs.createWriteStream(caminho, { encoding: 'utf-8' });
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.write('[\n');
        refs.forEach((r, i) => {
            const sep = i < refs.length - 1 ? ',\n' : '\n';
            stream.write('    ' + JSON.stringify(r) + sep);
        });
        stream.end(']');
    });
}

export class SinapiXlsxReader {

    public async importarParaJson(
        caminhoXlsx: string,
        caminhoReferencia: string,
        opcoes: OpcoesSinapiXlsx = {}
    ): Promise<number> {
        const refs = await this.lerArquivo(caminhoXlsx, opcoes);
        await salvarJson(caminhoReferencia, refs);
        console.log(`[XLSX] referencia.json atualizado: ${refs.length} insumos em ${caminhoReferencia}`);
        return refs.length;
    }

    public async lerArquivo(
        caminhoXlsx: string,
        opcoes: OpcoesSinapiXlsx = {}
    ): Promise<PrecoReferencia[]> {
        const uf = (opcoes.uf ?? 'MG').toUpperCase();
        console.log(`[XLSX] Lendo: ${path.basename(caminhoXlsx)}`);
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(caminhoXlsx);
        if (wb.getWorksheet('ISD')) {
            return this.lerFormatoNacional(wb, uf, opcoes);
        }
        return this.lerFormatoEstado(wb, opcoes);
    }

    private lerFormatoNacional(
        wb: ExcelJS.Workbook,
        uf: string,
        opcoes: OpcoesSinapiXlsx
    ): PrecoReferencia[] {
        let nomAba = 'ISD';
        if (opcoes.semEncargos) nomAba = 'ISE';
        else if (opcoes.desonerado) nomAba = 'ICD';

        const ws = wb.getWorksheet(nomAba);
        if (!ws) throw new Error(`Aba "${nomAba}" nao encontrada.`);

        console.log(`[XLSX] Aba: ${nomAba} — ${ws.rowCount} linhas`);

        const mesRef = getCellValue(ws.getRow(3).getCell(2));
        console.log(`[XLSX] Mes de referencia: ${mesRef}`);

        const linhaCab = ws.getRow(10);
        let colUF = -1;
        for (let c = 5; c <= 35; c++) {
            if (getCellValue(linhaCab.getCell(c)).trim().toUpperCase() === uf) {
                colUF = c;
                break;
            }
        }
        if (colUF < 0) {
            const ufsDisp: string[] = [];
            for (let c = 5; c <= 35; c++) {
                const v = getCellValue(linhaCab.getCell(c)).trim();
                if (v) ufsDisp.push(v);
            }
            throw new Error(`UF "${uf}" nao encontrada. Disponiveis: ${ufsDisp.join(', ')}`);
        }
        console.log(`[XLSX] UF ${uf} na coluna ${colUF}`);

        const refs: PrecoReferencia[] = [];
        ws.eachRow((row, rowNum) => {
            if (rowNum < 11) return;
            const codigoRaw = getCellValue(row.getCell(2)).trim();
            if (!codigoRaw || isNaN(Number(codigoRaw))) return;
            const preco = getNumValue(row.getCell(colUF));
            if (preco <= 0) return;
            refs.push({
                codigoSinapi: codigoRaw,
                descricao:    getCellValue(row.getCell(3)).trim(),
                unidade:      getCellValue(row.getCell(4)).trim(),
                precoMedio:   preco,
                dataReferencia: mesRef || new Date().toISOString(),
                desonerado:   opcoes.desonerado ?? false,
                fonte:        `SINAPI/CAIXA/${nomAba}/${uf}`,
            });
        });
        console.log(`[XLSX] ${refs.length} insumos extraidos para UF=${uf}`);
        return refs;
    }

    private lerFormatoEstado(
        wb: ExcelJS.Workbook,
        opcoes: OpcoesSinapiXlsx
    ): PrecoReferencia[] {
        const ws = wb.worksheets[0];
        if (!ws) throw new Error('Nenhuma planilha encontrada.');

        console.log(`[XLSX] Planilha: "${ws.name}" — ${ws.rowCount} linhas`);

        let headerRow = -1;
        let colCodigo = -1, colDesc = -1, colUnid = -1, colPreco = -1;

        ws.eachRow((row, rowNum) => {
            if (headerRow >= 0 || rowNum > 15) return;
            for (let c = 1; c <= row.cellCount; c++) {
                const v = getCellValue(row.getCell(c)).toLowerCase().trim();
                if (v.includes('cod') && colCodigo < 0) colCodigo = c;
                if (v.includes('desc') && colDesc < 0) colDesc = c;
                if (v.includes('unid') && colUnid < 0) colUnid = c;
                if ((v.includes('preco') || v.includes('custo') || v.includes('medio')) && colPreco < 0) colPreco = c;
            }
            if (colCodigo >= 0 && colDesc >= 0) {
                headerRow = rowNum;
                console.log(`[XLSX] Cabecalho na linha ${rowNum}`);
            }
        });

        if (headerRow < 0) throw new Error('Cabecalho nao encontrado nas primeiras 15 linhas.');

        const refs: PrecoReferencia[] = [];
        ws.eachRow((row, rowNum) => {
            if (rowNum <= headerRow) return;
            const codigo = getCellValue(row.getCell(colCodigo)).trim();
            if (!codigo || isNaN(Number(codigo))) return;
            const preco = colPreco > 0 ? getNumValue(row.getCell(colPreco)) : 0;
            if (preco <= 0) return;
            refs.push({
                codigoSinapi: codigo,
                descricao:  colDesc > 0 ? getCellValue(row.getCell(colDesc)).trim() : '',
                unidade:    colUnid > 0 ? getCellValue(row.getCell(colUnid)).trim() : 'UN',
                precoMedio: preco,
                dataReferencia: new Date().toISOString(),
                desonerado: opcoes.desonerado ?? false,
                fonte: 'SINAPI/CAIXA',
            });
        });
        console.log(`[XLSX] ${refs.length} insumos extraidos`);
        return refs;
    }
}
