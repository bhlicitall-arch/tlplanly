import {
    calcularBeneficiosMensais,
    calcularEquipamentoCustoHorario,
    calcularMaoObraHoraria,
} from '../src/services/CustosHorarios';

function exigir(condicao: boolean, mensagem: string): void {
    if (!condicao) throw new Error(mensagem);
}

function perto(valor: number, esperado: number, tolerancia = 0.0001): boolean {
    return Math.abs(valor - esperado) <= tolerancia;
}

function testarEquipamentoCalculado(): void {
    const resultado = calcularEquipamentoCustoHorario({
        modo: 'parcelas_calculadas',
        valorAquisicao: 1110000,
        vidaUtilHoras: 10000,
        kDepreciacao: 1,
        kManutencao: 0.8,
        insumos: [
            {
                codigo: 'IH1001',
                descricao: 'Operador de trator de esteira',
                unidade: 'h',
                consumo: 1,
                precoUnitario: 91.8058,
                parcela: 'mao_obra',
            },
            {
                codigo: 'IM0001',
                descricao: 'Oleo diesel',
                unidade: 'l',
                consumo: 19.1,
                precoUnitario: 5.38,
                parcela: 'material',
            },
        ],
    });

    exigir(perto(resultado.parcelas.depreciacao, 111), 'Depreciacao deveria ser 111,0000/h.');
    exigir(perto(resultado.parcelas.manutencao, 88.8), 'Manutencao deveria ser 88,8000/h.');
    exigir(perto(resultado.parcelas.material, 102.758), 'Material deveria ser 102,7580/h.');
    exigir(perto(resultado.parcelas.maoObra, 91.8058), 'Mao de obra deveria ser 91,8058/h.');
    exigir(perto(resultado.produtivo, 394.3638), 'Produtivo deveria somar todas as parcelas.');
    exigir(perto(resultado.improdutivo, 202.8058), 'Improdutivo deveria ser depreciacao + mao de obra.');
}

function testarParcelasInformadas(): void {
    const resultado = calcularEquipamentoCustoHorario({
        modo: 'parcelas_informadas',
        parcelasInformadas: {
            depreciacao: 10,
            juros: 2,
            impostosSeguros: 3,
            manutencao: 4,
            material: 5,
            maoObra: 6,
        },
    });

    exigir(perto(resultado.produtivo, 30), 'Produtivo manual deveria somar parcelas informadas.');
    exigir(perto(resultado.improdutivo, 16), 'Improdutivo manual deveria ser depreciacao + mao de obra.');
    exigir(resultado.memoria.includes('Parcelas informadas'), 'Memoria deveria registrar origem manual.');
}

function testarMaoObraBeneficios(): void {
    const beneficios = calcularBeneficiosMensais([
        { descricao: 'Almoco', quantidade: 1, precoUnitario: 25, periodicidade: 'diaria', diasMes: 22 },
        { descricao: 'Cesta basica', quantidade: 1, precoUnitario: 180, periodicidade: 'mensal' },
        { descricao: 'Viagem', quantidade: 2, precoUnitario: 70, periodicidade: 'viagem', viagensMes: 1 },
    ]);
    exigir(perto(beneficios, 870), 'Beneficios mensalizados deveriam totalizar 870.');

    const maoObra = calcularMaoObraHoraria({
        salarioMensal: 1800,
        beneficiosMensais: beneficios,
        encargosPercentual: 127.5,
        horasProdutivasMes: 189,
    });

    exigir(perto(maoObra.custoHora, 32.1389), 'Custo horario da mao de obra divergente.');
    exigir(maoObra.memoria.includes('salario + beneficios'), 'Memoria deveria indicar incidencia dos encargos.');
}

function main(): void {
    console.log('TESTE: CUSTOS HORARIOS - TLPlanly');
    testarEquipamentoCalculado();
    testarParcelasInformadas();
    testarMaoObraBeneficios();
    console.log('TESTE CUSTOS HORARIOS PASSOU.');
}

main();
