import { SinapiDownloader } from '../src/connectors/sinapiDownloader';
new SinapiDownloader({ uf: 'MG', mesReferencia: '2026-05' })
    .atualizar()
    .then(r => console.log('Resultado:', r))
    .catch(console.error);
