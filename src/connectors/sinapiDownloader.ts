import fs from 'fs';
import path from 'path';
import https from 'https';
import { PrecoReferencia } from '../models/Auditoria';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SinapiDownloader — Estratégia de automação para o portal da CAIXA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  A CAIXA disponibiliza as planilhas SINAPI mensalmente em:
 *    https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/
 *
 *  Estrutura de URLs (padrão observado):
 *    https://www.caixa.gov.br/Downloads/sinapi-indices/<MES>_<ANO>_<UF>_<MODO>.xlsx
 *
 *  Modos disponíveis:
 *    - DESONERADO   : preços sem encargos sociais (obras públicas)
 *    - NAO_DESONERADO: preços com encargos sociais completos
 *
 *  ESTRATÉGIA DE AUTOMAÇÃO (3 camadas):
 *
 *  Camada 1 — Download direto (quando a URL é conhecida):
 *    Usa https.get() para baixar o XLSX e converter com xlsx/exceljs.
 *    Veja método: baixarPlanilhaDireta()
 *
 *  Camada 2 — Scraping assistido (quando a URL muda mensalmente):
 *    Faz GET na página de listagem, extrai links .xlsx com regex,
 *    filtra pelo estado e mês desejados.
 *    Veja método: descobrirUrlAtual()
 *
 *  Camada 3 — Cache local (fallback offline):
 *    Se o download falhar, usa o último referencia.json disponível.
 *    Veja método: usarCacheLocal()
 *
 *  DEPENDÊNCIAS NECESSÁRIAS PARA DOWNLOAD REAL:
 *    npm install exceljs     # leitura de .xlsx
 *    npm install cheerio     # scraping HTML (Camada 2)
 *    npm install node-fetch  # fetch moderno (Node < 18)
 *
 *  STATUS ATUAL: implementação de referência com stubs documentados.
 *  Para ativar cada camada, siga os comentários "ATIVAR:" abaixo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type UnidadeFederativa =
    | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
    | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR'
    | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

export interface ConfigDownloader {
    /** Estado da federação (ex: 'MG') */
    uf: UnidadeFederativa;
    /** Mês de referência no formato "YYYY-MM" (ex: "2026-05") */
    mesReferencia: string;
    /** Se true, usa preços desonerados (padrão obras públicas) */
    desonerado?: boolean;
    /** Pasta de destino para arquivos baixados */
    pastaDownload?: string;
    /** Caminho do referencia.json a ser atualizado */
    caminhoReferencia?: string;
}

export interface ResultadoDownload {
    sucesso: boolean;
    fonte: 'download' | 'cache';
    quantidadeItens: number;
    mensagem: string;
    caminhoArquivo?: string;
}

export class SinapiDownloader {
    private config: Required<ConfigDownloader>;

    // URL base do portal CAIXA (sujeita a mudanças — verificar mensalmente)
    private static readonly BASE_URL =
        'https://www.caixa.gov.br/Downloads/sinapi-indices';

    // Página de listagem para scraping
    private static readonly LISTAGEM_URL =
        'https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx';

    constructor(config: ConfigDownloader) {
        this.config = {
            desonerado: false,
            pastaDownload: path.resolve('data', 'downloads'),
            caminhoReferencia: path.resolve('data', 'referencia.json'),
            ...config,
        };
    }

    // ── Ponto de entrada ──────────────────────────────────────────────

    /**
     * Executa a atualização da base de referência:
     * tenta download direto → fallback para cache local.
     */
    public async atualizar(): Promise<ResultadoDownload> {
        console.log(`[DOWNLOADER] Iniciando atualização SINAPI...`);
        console.log(`  UF: ${this.config.uf} | Ref: ${this.config.mesReferencia} | Desonerado: ${this.config.desonerado}`);

        this.garantirPasta();

        // Camada 1: tentativa de download direto
        try {
            const resultado = await this.baixarPlanilhaDireta();
            if (resultado.sucesso) return resultado;
        } catch (err) {
            console.warn(`[DOWNLOADER] Download direto falhou: ${(err as Error).message}`);
        }

        // Camada 2: scraping da página de listagem
        try {
            const url = await this.descobrirUrlAtual();
            if (url) {
                const resultado = await this.baixarDeUrl(url);
                if (resultado.sucesso) return resultado;
            }
        } catch (err) {
            console.warn(`[DOWNLOADER] Scraping falhou: ${(err as Error).message}`);
        }

        // Camada 3: cache local
        return this.usarCacheLocal();
    }

    // ── Camada 1: Download direto ─────────────────────────────────────

    /**
     * Monta a URL padrão e tenta baixar o XLSX.
     *
     * ATIVAR: instale `exceljs` e descomente o bloco de parse abaixo.
     */
    private async baixarPlanilhaDireta(): Promise<ResultadoDownload> {
        const url = this.montarUrl();
        console.log(`[DOWNLOADER] Tentando URL: ${url}`);

        return this.baixarDeUrl(url);
    }

    /**
     * Monta a URL padrão CAIXA com base nas configurações.
     *
     * Exemplo de URL real observada:
     *   .../SINAPI_Preco_Ref_Insumos_MG_202604_NaoDesonerado.xlsx
     */
    private montarUrl(): string {
        const [ano, mes] = this.config.mesReferencia.split('-');
        const modo = this.config.desonerado ? 'Desonerado' : 'NaoDesonerado';
        const arquivo = `SINAPI_Preco_Ref_Insumos_${this.config.uf}_${ano}${mes}_${modo}.xlsx`;
        return `${SinapiDownloader.BASE_URL}/${arquivo}`;
    }

    // ── Camada 2: Scraping HTML ───────────────────────────────────────

    /**
     * Busca a URL atual na página de listagem da CAIXA.
     *
     * ATIVAR: instale `node-fetch` e `cheerio`, depois implemente:
     *
     *   const response = await fetch(SinapiDownloader.LISTAGEM_URL);
     *   const html = await response.text();
     *   const $ = cheerio.load(html);
     *   const links = $('a[href$=".xlsx"]')
     *       .map((_, el) => $(el).attr('href'))
     *       .get()
     *       .filter(href => href.includes(this.config.uf) &&
     *                        href.includes(`${ano}${mes}`));
     *   return links[0] ?? null;
     */
    private async descobrirUrlAtual(): Promise<string | null> {
        console.log('[DOWNLOADER] Camada 2 (scraping) não ativada — instale node-fetch + cheerio.');
        return null;
    }

    // ── Download HTTP genérico ────────────────────────────────────────

    /**
     * Baixa um arquivo via HTTPS e o processa como planilha SINAPI.
     *
     * ATIVAR parse XLSX: instale `exceljs` e substitua o stub abaixo por:
     *
     *   const workbook = new ExcelJS.Workbook();
     *   await workbook.xlsx.readFile(caminhoXlsx);
     *   const sheet = workbook.worksheets[0];
     *   const referencias: PrecoReferencia[] = [];
     *
     *   sheet.eachRow((row, num) => {
     *       if (num < 8) return; // pular cabeçalhos SINAPI
     *       const codigo  = String(row.getCell(1).value ?? '').trim();
     *       const descricao = String(row.getCell(2).value ?? '').trim();
     *       const unidade = String(row.getCell(3).value ?? '').trim();
     *       const preco   = Number(row.getCell(5).value ?? 0);
     *       if (!codigo || preco === 0) return;
     *       referencias.push({
     *           codigoSinapi: codigo,
     *           descricao,
     *           unidade,
     *           precoMedio: preco,
     *           dataReferencia: this.config.mesReferencia,
     *           desonerado: this.config.desonerado,
     *           fonte: 'SINAPI/CAIXA',
     *       });
     *   });
     *
     *   this.salvarReferencia(referencias);
     */
    private async baixarDeUrl(url: string): Promise<ResultadoDownload> {
        const nomeArquivo = path.basename(url);
        const destino = path.join(this.config.pastaDownload, nomeArquivo);

        await this.fazerDownloadHttps(url, destino);

        // TODO: parse XLSX com exceljs (ver comentário acima)
        console.log(`[DOWNLOADER] Arquivo salvo: ${destino}`);
        console.log('[DOWNLOADER] Parse XLSX pendente — instale exceljs para ativar.');

        return {
            sucesso: false,
            fonte: 'download',
            quantidadeItens: 0,
            mensagem: `Arquivo baixado em ${destino}. Instale exceljs para converter automaticamente.`,
            caminhoArquivo: destino,
        };
    }

    /** Wrapper Promise em torno de https.get(). */
    private fazerDownloadHttps(url: string, destino: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const arquivo = fs.createWriteStream(destino);
            https.get(url, res => {
                if (res.statusCode !== 200) {
                    arquivo.close();
                    fs.unlinkSync(destino);
                    return reject(new Error(`HTTP ${res.statusCode} para ${url}`));
                }
                res.pipe(arquivo);
                arquivo.on('finish', () => { arquivo.close(); resolve(); });
            }).on('error', err => {
                arquivo.close();
                if (fs.existsSync(destino)) fs.unlinkSync(destino);
                reject(err);
            });
        });
    }

    // ── Camada 3: Cache local ─────────────────────────────────────────

    /**
     * Retorna os dados já presentes no referencia.json como fallback.
     */
    private usarCacheLocal(): ResultadoDownload {
        const caminho = this.config.caminhoReferencia;
        if (!fs.existsSync(caminho)) {
            return {
                sucesso: false,
                fonte: 'cache',
                quantidadeItens: 0,
                mensagem: 'Nenhum cache local disponível. Execute com conexão à internet.',
            };
        }

        const dados = JSON.parse(fs.readFileSync(caminho, 'utf-8')) as PrecoReferencia[];
        console.log(`[DOWNLOADER] Usando cache local: ${dados.length} itens.`);

        return {
            sucesso: true,
            fonte: 'cache',
            quantidadeItens: dados.length,
            mensagem: `Cache local usado (${dados.length} insumos). Última atualização: ${dados[0]?.dataReferencia ?? 'desconhecida'}.`,
            caminhoArquivo: caminho,
        };
    }

    // ── Persistência ──────────────────────────────────────────────────

    /**
     * Salva a lista de PrecoReferencia no arquivo JSON de referência.
     * Chamado pelo parse XLSX após ativação do exceljs.
     */
    public salvarReferencia(referencias: PrecoReferencia[]): void {
        const caminho = this.config.caminhoReferencia;
        fs.writeFileSync(caminho, JSON.stringify(referencias, null, 4), 'utf-8');
        console.log(`[DOWNLOADER] referencia.json atualizado: ${referencias.length} insumos.`);
    }

    /** Retorna informações sobre o estado atual do cache. */
    public infoCache(): { existe: boolean; itens: number; referencia: string | null } {
        const caminho = this.config.caminhoReferencia;
        if (!fs.existsSync(caminho)) {
            return { existe: false, itens: 0, referencia: null };
        }
        const dados = JSON.parse(fs.readFileSync(caminho, 'utf-8')) as PrecoReferencia[];
        return {
            existe: true,
            itens: dados.length,
            referencia: dados[0]?.dataReferencia ?? null,
        };
    }

    private garantirPasta(): void {
        if (!fs.existsSync(this.config.pastaDownload)) {
            fs.mkdirSync(this.config.pastaDownload, { recursive: true });
        }
    }
}
