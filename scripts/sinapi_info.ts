import { SinapiDownloader } from '../src/connectors/sinapiDownloader';
const d = new SinapiDownloader({ uf: 'MG', mesReferencia: '2026-05' });
const info = d.infoCache();
console.log('Cache SINAPI:', info);
