export type ModoCalculoEquipamento = 'parcelas_calculadas' | 'parcelas_informadas' | 'nao_calcular';

export type ParcelaInsumoCusto =
  | 'mao_obra'
  | 'material'
  | 'aluguel'
  | 'outros';

export interface InsumoCustoHorario {
  codigo: string;
  descricao: string;
  unidade: string;
  tipo?: string;
  consumo: number;
  precoUnitario: number;
  parcela: ParcelaInsumoCusto;
  fonte?: string;
}

export interface ParcelasCustoHorario {
  depreciacao: number;
  juros: number;
  impostosSeguros: number;
  manutencao: number;
  material: number;
  maoObra: number;
  aluguel: number;
  outros: number;
}

export interface CalculoEquipamentoInput {
  modo: ModoCalculoEquipamento;
  valorAquisicao?: number;
  valorResidual?: number;
  vidaUtilHoras?: number;
  kDepreciacao?: number;
  kManutencao?: number;
  jurosHora?: number;
  impostosSegurosHora?: number;
  insumos?: InsumoCustoHorario[];
  ajustes?: Partial<Pick<ParcelasCustoHorario, 'material' | 'maoObra' | 'aluguel' | 'outros'>>;
  parcelasInformadas?: Partial<ParcelasCustoHorario>;
}

export interface CalculoEquipamentoResultado {
  parcelas: ParcelasCustoHorario;
  produtivo: number;
  improdutivo: number;
  memoria: string;
  alertas: string[];
}

export interface BeneficioMaoObra {
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  periodicidade: 'mensal' | 'diaria' | 'semanal' | 'viagem' | 'direto';
  diasMes?: number;
  semanasMes?: number;
  viagensMes?: number;
  codigo?: string;
  fonte?: string;
}

export interface CalculoMaoObraInput {
  salarioMensal: number;
  beneficiosMensais?: number;
  encargosPercentual: number;
  horasProdutivasMes: number;
  encargosSobreBeneficios?: boolean;
}

export interface CalculoMaoObraResultado {
  salarioMensal: number;
  beneficiosMensais: number;
  encargosValor: number;
  custoHora: number;
  memoria: string;
}

const EMPTY_PARCELAS: ParcelasCustoHorario = {
  depreciacao: 0,
  juros: 0,
  impostosSeguros: 0,
  manutencao: 0,
  material: 0,
  maoObra: 0,
  aluguel: 0,
  outros: 0,
};

export function numeroPositivo(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function roundCusto(value: number, casas = 4): number {
  const factor = 10 ** casas;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export function calcularBeneficiosMensais(itens: BeneficioMaoObra[]): number {
  return roundCusto((itens || []).reduce((total, item) => {
    const subtotal = numeroPositivo(item.quantidade) * numeroPositivo(item.precoUnitario);
    if (item.periodicidade === 'diaria') return total + subtotal * (numeroPositivo(item.diasMes) || 22);
    if (item.periodicidade === 'semanal') return total + subtotal * (numeroPositivo(item.semanasMes) || 4.33);
    if (item.periodicidade === 'viagem') return total + subtotal * (numeroPositivo(item.viagensMes) || 1);
    return total + subtotal;
  }, 0));
}

export function calcularMaoObraHoraria(input: CalculoMaoObraInput): CalculoMaoObraResultado {
  const salarioMensal = numeroPositivo(input.salarioMensal);
  const beneficiosMensais = numeroPositivo(input.beneficiosMensais);
  const encargosPercentual = numeroPositivo(input.encargosPercentual);
  const horasProdutivasMes = Math.max(1, numeroPositivo(input.horasProdutivasMes) || 189);
  const baseEncargos = input.encargosSobreBeneficios === false
    ? salarioMensal
    : salarioMensal + beneficiosMensais;
  const encargosValor = baseEncargos * encargosPercentual / 100;
  const custoHora = (salarioMensal + beneficiosMensais + encargosValor) / horasProdutivasMes;
  const incidencia = input.encargosSobreBeneficios === false ? 'salario' : 'salario + beneficios';

  return {
    salarioMensal: roundCusto(salarioMensal),
    beneficiosMensais: roundCusto(beneficiosMensais),
    encargosValor: roundCusto(encargosValor),
    custoHora: roundCusto(custoHora),
    memoria: `(${salarioMensal.toFixed(2)} salario + ${beneficiosMensais.toFixed(2)} beneficios + ${encargosPercentual.toFixed(2)}% encargos sobre ${incidencia}) / ${horasProdutivasMes} h produtivas`,
  };
}

export function calcularEquipamentoCustoHorario(input: CalculoEquipamentoInput): CalculoEquipamentoResultado {
  const alertas: string[] = [];
  const modo = input.modo || 'parcelas_calculadas';

  if (modo === 'nao_calcular') {
    return {
      parcelas: { ...EMPTY_PARCELAS },
      produtivo: 0,
      improdutivo: 0,
      memoria: 'Equipamento marcado como nao calcular.',
      alertas,
    };
  }

  const parcelas: ParcelasCustoHorario = { ...EMPTY_PARCELAS };

  if (modo === 'parcelas_informadas') {
    Object.assign(parcelas, normalizarParcelas(input.parcelasInformadas || {}));
  } else {
    const valorAquisicao = numeroPositivo(input.valorAquisicao);
    const valorResidual = Math.min(valorAquisicao, numeroPositivo(input.valorResidual));
    const vidaUtilHoras = numeroPositivo(input.vidaUtilHoras);
    const kDepreciacao = numeroPositivo(input.kDepreciacao);
    const kManutencao = input.kManutencao === undefined || input.kManutencao === null
      ? kDepreciacao
      : numeroPositivo(input.kManutencao);

    if (!valorAquisicao) alertas.push('Valor de aquisicao nao informado.');
    if (!vidaUtilHoras) alertas.push('Vida util em horas nao informada.');

    if (valorAquisicao && vidaUtilHoras) {
      parcelas.depreciacao = ((valorAquisicao - valorResidual) * kDepreciacao) / vidaUtilHoras;
      parcelas.manutencao = (valorAquisicao * kManutencao) / vidaUtilHoras;
    }

    parcelas.juros = numeroPositivo(input.jurosHora);
    parcelas.impostosSeguros = numeroPositivo(input.impostosSegurosHora);

    for (const insumo of input.insumos || []) {
      const subtotal = numeroPositivo(insumo.consumo) * numeroPositivo(insumo.precoUnitario);
      if (insumo.parcela === 'mao_obra') parcelas.maoObra += subtotal;
      else if (insumo.parcela === 'aluguel') parcelas.aluguel += subtotal;
      else if (insumo.parcela === 'outros') parcelas.outros += subtotal;
      else parcelas.material += subtotal;
    }

    const ajustes = input.ajustes || {};
    parcelas.material += numeroPositivo(ajustes.material);
    parcelas.maoObra += numeroPositivo(ajustes.maoObra);
    parcelas.aluguel += numeroPositivo(ajustes.aluguel);
    parcelas.outros += numeroPositivo(ajustes.outros);
  }

  const normalizadas = normalizarParcelas(parcelas);
  const produtivo = normalizadas.depreciacao
    + normalizadas.juros
    + normalizadas.impostosSeguros
    + normalizadas.manutencao
    + normalizadas.material
    + normalizadas.maoObra
    + normalizadas.aluguel
    + normalizadas.outros;
  const improdutivo = normalizadas.depreciacao + normalizadas.maoObra;

  return {
    parcelas: normalizadas,
    produtivo: roundCusto(produtivo),
    improdutivo: roundCusto(improdutivo),
    memoria: montarMemoriaEquipamento(modo, normalizadas, produtivo, improdutivo),
    alertas,
  };
}

export function normalizarParcelas(parcelas: Partial<ParcelasCustoHorario>): ParcelasCustoHorario {
  return {
    depreciacao: roundCusto(numeroPositivo(parcelas.depreciacao)),
    juros: roundCusto(numeroPositivo(parcelas.juros)),
    impostosSeguros: roundCusto(numeroPositivo(parcelas.impostosSeguros)),
    manutencao: roundCusto(numeroPositivo(parcelas.manutencao)),
    material: roundCusto(numeroPositivo(parcelas.material)),
    maoObra: roundCusto(numeroPositivo(parcelas.maoObra)),
    aluguel: roundCusto(numeroPositivo(parcelas.aluguel)),
    outros: roundCusto(numeroPositivo(parcelas.outros)),
  };
}

function montarMemoriaEquipamento(
  modo: ModoCalculoEquipamento,
  p: ParcelasCustoHorario,
  produtivo: number,
  improdutivo: number,
): string {
  const origem = modo === 'parcelas_informadas' ? 'Parcelas informadas' : 'Parcelas calculadas';
  return `${origem}: depreciacao ${p.depreciacao.toFixed(4)}/h + juros ${p.juros.toFixed(4)}/h + impostos/seguros ${p.impostosSeguros.toFixed(4)}/h + manutencao ${p.manutencao.toFixed(4)}/h + material ${p.material.toFixed(4)}/h + mao de obra ${p.maoObra.toFixed(4)}/h + aluguel ${p.aluguel.toFixed(4)}/h + outros ${p.outros.toFixed(4)}/h = produtivo ${roundCusto(produtivo).toFixed(4)}/h; improdutivo = depreciacao + mao de obra = ${roundCusto(improdutivo).toFixed(4)}/h.`;
}
