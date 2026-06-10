import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { SinapiXlsxReader } from '../src/connectors/sinapiXlsxReader';
import {
    certificarItensExtraidos,
    linhaDeImportacaoIgnorada,
    parsearLinhasOrcamentarias,
    parsearLinhaOrcamentaria,
} from '../src/services/ExtracaoCertificador';

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

        const linhaReal = '100742 SINAPI PINTURA COM TINTA ALQUIDICA DE ACABAMENTO (ESMALTE SINTETICO ACETINADO) APLICADA A ROLO OU PINCEL SOBRE SUPERFICIES METALICAS M2 342,3376 24,73 R$ 8.466,01';
        const item = parsearLinhaOrcamentaria(linhaReal);
        exigir(!!item, 'Parser deveria reconhecer linha orcamentaria real do PDF.');
        exigir(item!.cod === '100742', 'Codigo 100742 deveria ser preservado.');
        exigir(item!.unid === 'M2', 'Unidade M2 deveria ser preservada.');
        exigir(Math.abs((item!.qtd || 0) - 342.3376) < 0.0001, 'Quantidade do item 100742 divergente.');
        exigir(Math.abs((item!.preco || 0) - 24.73) < 0.001, 'Preco unitario do item 100742 divergente.');
        exigir(Math.abs((item!.totalLinha || 0) - 8466.01) < 0.01, 'Total do item 100742 divergente.');

        const linhaDimensoes = '10778 SINAPI LOCACAO DE CONTAINER 2,30 X 6,00 M, ALT. 2,50 M, PARA SANITARIO, COM 4 BACIAS, 8 CHUVEIROS,1 LAVATORIO E 1 MICTORIO (NAO INCLUI MOBILIZACAO/DESMOBILIZACAO) MES 8 1.218,75R$ 9.750,00R$';
        const itemDimensoes = parsearLinhaOrcamentaria(linhaDimensoes);
        exigir(!!itemDimensoes, 'Parser deveria reconhecer linha com medidas dentro da descricao.');
        exigir(itemDimensoes!.unid === 'MES', 'Unidade real deveria ser MES, nao o M das dimensoes.');
        exigir(Math.abs((itemDimensoes!.qtd || 0) - 8) < 0.001, 'Quantidade da locacao de container divergente.');
        exigir(Math.abs((itemDimensoes!.preco || 0) - 1218.75) < 0.001, 'Preco unitario da locacao de container divergente.');
        exigir(Math.abs((itemDimensoes!.totalLinha || 0) - 9750) < 0.01, 'Total da locacao de container divergente.');

        const corrigidoPorCauda = certificarItensExtraidos([{
            cod: '10778',
            desc: 'LOCACAO DE CONTAINER 2,30 X 6,00 M, ALT. 2,50 M, PARA SANITARIO',
            unid: 'M',
            qtd: 2.3,
            preco: 6,
            totalLinha: 9750,
            numerosOrigem: [2.3, 6, 2.5, 8, 1218.75, 9750],
            linhaOrigem: linhaDimensoes,
        }]);
        exigir(corrigidoPorCauda.itens[0].certStatus !== 'bloqueado', 'Certificador deveria corrigir item por quantidade, preco e total no fim da linha.');
        exigir(Math.abs((corrigidoPorCauda.itens[0].qtd || 0) - 8) < 0.001, 'Certificador deveria usar a quantidade da cauda da linha.');
        exigir(Math.abs((corrigidoPorCauda.itens[0].preco || 0) - 1218.75) < 0.001, 'Certificador deveria usar o preco da cauda da linha.');

        const linhaColada = '98459 SINAPI TAPUME COM TELHA METÁLICA. AF_03/2024 M2 220 76,50R$ R$ 16.830,00 105130 SINAPI EXECUÇÃO DE PILARETES PARA TAPUMES M 25,83 2.841,30R$ 73.402,78R$ 10778 SINAPI LOCACAO DE CONTAINER 2,30 X 6,00 M, ALT. 2,50 M, PARA SANITARIO MES 8 1.218,75R$ 9.750,00R$';
        const itensLinhaColada = parsearLinhasOrcamentarias([linhaColada]);
        exigir(itensLinhaColada.length === 3, 'Linha de PDF com varios codigos deveria ser segmentada em 3 itens.');
        exigir(itensLinhaColada[0].cod === '98459' && Math.abs((itensLinhaColada[0].qtd || 0) - 220) < 0.001, 'Primeiro item colado deveria preservar quantidade 220.');
        exigir(itensLinhaColada[2].cod === '10778' && itensLinhaColada[2].unid === 'MES', 'Terceiro item colado deveria preservar unidade MES.');

        const linhaCotacao = 'XX.XX.XX COTACAO ITEM DE MERCADO VG 12 80,00R$ 960,00R$';
        const itemCotacao = parsearLinhaOrcamentaria(linhaCotacao);
        exigir(!!itemCotacao, 'Parser deveria reconhecer codigo de cotacao XX.XX.XX.');
        exigir(itemCotacao!.cod === 'XX.XX.XX', 'Codigo de cotacao deveria ser preservado.');
        exigir(itemCotacao!.unid === 'VG', 'Unidade da cotacao deveria ser VG.');
        exigir(Math.abs((itemCotacao!.totalLinha || 0) - 960) < 0.01, 'Total da cotacao divergente.');

        const linhaCodigoCurto = '7253 SINAPI TERRA VEGETAL M3 1,5 142,85R$ 214,28R$';
        const itemCodigoCurto = parsearLinhaOrcamentaria(linhaCodigoCurto);
        exigir(!!itemCodigoCurto, 'Parser deveria reconhecer codigo SINAPI curto seguido da fonte.');
        exigir(itemCodigoCurto!.cod === '7253', 'Codigo curto 7253 deveria ser preservado.');
        exigir(itemCodigoCurto!.unid === 'M3', 'Unidade do codigo curto deveria ser M3.');
        exigir(Math.abs((itemCodigoCurto!.totalLinha || 0) - 214.28) < 0.01, 'Total do codigo curto divergente.');

        const linhaCodigoTresDigitos = '359 SINAPI MUDA DE ARVORE UN 2 305,74R$ 611,48R$';
        const itemCodigoTresDigitos = parsearLinhaOrcamentaria(linhaCodigoTresDigitos);
        exigir(!!itemCodigoTresDigitos, 'Parser deveria reconhecer codigo SINAPI de 3 digitos seguido da fonte.');
        exigir(itemCodigoTresDigitos!.cod === '359', 'Codigo 359 deveria ser preservado.');
        exigir(itemCodigoTresDigitos!.unid === 'UN', 'Unidade do codigo 359 deveria ser UN.');
        exigir(Math.abs((itemCodigoTresDigitos!.totalLinha || 0) - 611.48) < 0.01, 'Total do codigo 359 divergente.');

        const linhaColadaComCodigoCurto = '10826 SINAPI ALUGUEL DE CAMINHAO GUINDAUTO MES 4 1.961,115R$ 7.844,46R$ 359 SINAPI MUDA DE ARVORE UN 2 305,74R$ 611,48R$';
        const itensCodigoCurto = parsearLinhasOrcamentarias([linhaColadaComCodigoCurto]);
        exigir(itensCodigoCurto.length === 2, 'Linha colada com codigo curto deveria ser segmentada em 2 itens.');
        exigir(itensCodigoCurto[0].cod === '10826' && Math.abs((itensCodigoCurto[0].totalLinha || 0) - 7844.46) < 0.01, 'Primeiro item com codigo curto colado divergente.');
        exigir(itensCodigoCurto[1].cod === '359' && Math.abs((itensCodigoCurto[1].totalLinha || 0) - 611.48) < 0.01, 'Segundo item com codigo curto colado divergente.');

        const linhaComNumerosTecnicos = '10826 SINAPI CABO WRX 24030 CONFORME NBR 16820 MES 4 1.961,115R$ 7.844,46R$';
        const itensNumerosTecnicos = parsearLinhasOrcamentarias([linhaComNumerosTecnicos]);
        exigir(itensNumerosTecnicos.length === 1, 'Numeros tecnicos na descricao nao devem virar novos itens.');
        exigir(itensNumerosTecnicos[0].cod === '10826', 'Codigo real deve ser mantido quando ha NBR/modelo numerico na descricao.');

        const linhaSudecap = '01.09.21 SUDECAP 10/2024 CONTAINER SIMPLES MES 16 1.000,00R$ 16.000,00R$';
        const itemSudecap = parsearLinhaOrcamentaria(linhaSudecap);
        exigir(!!itemSudecap, 'Parser deveria reconhecer codigo SUDECAP no formato 01.09.21.');
        exigir(itemSudecap!.cod === '01.09.21', 'Codigo SUDECAP deveria ser preservado.');
        exigir(itemSudecap!.unid === 'MES', 'Unidade SUDECAP deveria ser MES.');
        exigir(itemSudecap!.qtd === 16, 'Quantidade SUDECAP divergente.');

        const linhaSicor = 'ED-48199 SICOR ALVENARIA ESTRUTURAL COM BLOCO DE CONCRETO, ESP. 19CM, (FBK 4,5MPA), PARA REVESTIMENTO, INCLUSIVE ARGAMASSA PARA ASSENTAMENTO m2 45,08 91,86R$ 4.141,05R$';
        const itemSicor = parsearLinhaOrcamentaria(linhaSicor);
        exigir(!!itemSicor, 'Parser deveria reconhecer codigo SICOR ED-48199.');
        exigir(itemSicor!.cod === 'ED-48199', 'Codigo SICOR deveria ser preservado.');
        exigir(itemSicor!.unid === 'M2', 'Unidade SICOR deveria ser M2.');

        exigir(linhaDeImportacaoIgnorada('TOTAL SEM BDI 656.296,72'), 'TOTAL SEM BDI deve ser tratado como rodape.');
        exigir(linhaDeImportacaoIgnorada('TOTAL COM BDI 853.185,74'), 'TOTAL COM BDI deve ser tratado como rodape.');
        exigir(linhaDeImportacaoIgnorada('PREFEITURA MUNICIPAL DE BELO HORIZONTE - MG'), 'Cabecalho institucional deve ser ignorado.');
        exigir(linhaDeImportacaoIgnorada("02 =PROCV(A8;'MEMORIA - CAMPO DO LEBLON'!B:E;3;0)"), 'Formula PROCV deve ser ignorada.');

        const certificado = certificarItensExtraidos([
            item!,
            { cod: '100742', desc: 'TOTAL SEM BDI 656.296,72 TOTAL COM BDI 853.185,74', unid: 'UNID', qtd: 656296.72, preco: 853185.74, linhaOrigem: 'TOTAL SEM BDI 656.296,72 TOTAL COM BDI 853.185,74' },
        ]);
        exigir(certificado.itens[0].certStatus !== 'bloqueado', 'Item 100742 valido nao deveria ser bloqueado.');
        exigir(certificado.itens[1].certStatus === 'bloqueado', 'Rodape importado como item deve ser bloqueado.');

        console.log('TESTE CERTIFICADOR DE EXTRACAO PASSOU.');
        console.log('PDF/OCR em navegador continua dependente de pdfjs/Tesseract, mas o parser/certificador agora tem teste de regressao.');
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
