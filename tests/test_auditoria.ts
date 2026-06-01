import { AgenteAuditor } from '../src/services/AgenteAuditor';
import { SinapiConnector } from '../src/connectors/sinapiConnector';
import { Insumo } from '../src/models/Insumo';
import { PrecoReferencia } from '../src/models/Auditoria';

const CRITICO = 'CR' + '\u00cd' + 'TICO';

function criarInsumo(id: string, ref: PrecoReferencia, fator: number): Insumo {
    return {
        id,
        codigoSinapi: ref.codigoSinapi,
        descricao: ref.descricao,
        unidade: ref.unidade,
        precoMedio: Number((ref.precoMedio * fator).toFixed(2)),
        dataReferencia: new Date(),
        origem: 'TESTE',
        desonerado: false,
    };
}

function exigir(condicao: boolean, mensagem: string): void {
    if (!condicao) throw new Error(mensagem);
}

async function testarAuditoria() {
    console.log('TESTE: AGENTE AUDITOR - TLPlanly');

    const connector = new SinapiConnector();
    const referencias = connector
        .carregarPrecosReferencia()
        .filter(r => r.codigoSinapi && r.descricao && r.precoMedio > 10)
        .slice(0, 4);

    exigir(referencias.length >= 4, 'Base de referencia insuficiente para teste funcional.');

    const insumosTeste: Insumo[] = [
        criarInsumo('aprovado', referencias[0], 1.03),
        criarInsumo('alerta-acima', referencias[1], 1.10),
        criarInsumo('critico-acima', referencias[2], 1.25),
        criarInsumo('alerta-abaixo', referencias[3], 0.90),
        {
            id: 'nao-encontrado',
            codigoSinapi: 'TLPLANLY-NAO-EXISTE',
            descricao: 'Item propositalmente inexistente',
            unidade: 'UN',
            precoMedio: 100,
            dataReferencia: new Date(),
            origem: 'TESTE',
            desonerado: false,
        },
    ];

    const auditor = new AgenteAuditor({ toleranciaAprovado: 5, toleranciaAlerta: 15 });
    const relatorio = await auditor.comparar(insumosTeste);
    const porId = new Map(relatorio.resultados.map(r => [r.insumoId, r]));

    exigir(porId.get('aprovado')?.status === 'APROVADO', 'Item dentro de 5% deveria ser APROVADO.');
    exigir(porId.get('alerta-acima')?.status === 'ALERTA', 'Item 10% acima deveria ser ALERTA.');
    exigir(porId.get('critico-acima')?.status === CRITICO, 'Item 25% acima deveria ser CRITICO.');
    exigir(porId.get('alerta-abaixo')?.status === 'ALERTA', 'Item 10% abaixo deveria ser ALERTA.');
    exigir(porId.get('nao-encontrado')?.status === 'NAO_ENCONTRADO', 'Codigo inexistente deveria ser NAO_ENCONTRADO.');
    exigir(relatorio.totalInsumos === insumosTeste.length, 'Total auditado divergente.');
    exigir(relatorio.naoEncontrados === 1, 'Resumo deveria apontar 1 item nao encontrado.');

    console.log('TODOS OS TESTES PASSARAM.');
}

testarAuditoria().catch(err => {
    console.error('Teste interrompido por erro:', err);
    process.exit(1);
});
