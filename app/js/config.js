// Configuração da app Conforme. Tudo o que depende de servidores externos está aqui,
// para poder ser mudado sem mexer no resto (e para a app nativa usar o mesmo ficheiro).

export const VERSAO_APP = '0.1.1';

// Formato do ficheiro que o plugin grava no OneDrive (ver schema/conforme.schema.json).
export const FORMATO = { nome: 'conforme', versaoMaxima: 1 };

// Morada → coordenadas. Nominatim (OpenStreetMap): público, aceita pedidos de páginas web.
// Regras de uso: no máximo 1 pedido por segundo, só quando a pessoa carrega em «Consultar».
export const GEOCODER = {
  // principal: ArcGIS World Geocoder (público, responde a páginas web, encontra números de porta em Lisboa)
  arcgis: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates',
  // alternativa, se o primeiro falhar
  url: 'https://nominatim.openstreetmap.org/search',
  // caixa de Lisboa (oeste, norte, este, sul)
  viewbox: [-9.2305, 38.7955, -9.0865, 38.6913],
};

// Camadas públicas da CML (Lisboa Aberta / geodados-cml, ArcGIS Online). Respondem sem token.
// tipo: como aparece na app; incideSe: distância (m) à volta do ponto para dizer «incide no lote».
const CML = 'https://services.arcgis.com/1dSrzEWVQn5kHHyK/arcgis/rest/services';
export const CAMADAS_PUBLICAS = [
  { id: 'aru', tipo: 'Reabilitação', url: `${CML}/Limites_AUGI_ARU/FeatureServer/1`, nome: 'Área de Reabilitação Urbana (ARU)', campos: ['NOME', 'DESIGNACAO'], artigos: 'RJRU (DL 307/2009) · DL 95/2019', raio: 0 },
  { id: 'augi', tipo: 'Planeamento', url: `${CML}/Limites_AUGI_ARU/FeatureServer/0`, nome: 'Área Urbana de Génese Ilegal (AUGI)', campos: ['NOME', 'DESIGNACAO'], artigos: 'Lei 91/95 (AUGI)', raio: 0 },
  { id: 'pp', tipo: 'Planeamento', url: `${CML}/Planeamento/FeatureServer/0`, nome: 'Plano de Pormenor', campos: ['NOME', 'ESTADO', 'PUBLICACAO'], artigos: 'RJIGT (DL 80/2015)', raio: 0 },
  { id: 'pu', tipo: 'Planeamento', url: `${CML}/Planeamento/FeatureServer/1`, nome: 'Plano de Urbanização', campos: ['NOME', 'ESTADO', 'PUBLICACAO'], artigos: 'RJIGT (DL 80/2015)', raio: 0 },
  { id: 'cl-mun', tipo: 'Património', url: `${CML}/Patrimonio/FeatureServer/15`, nome: 'Imóvel ou conjunto de interesse municipal', campos: ['NOME', 'DESIGNACAO'], artigos: 'Lei 107/2001 · RPDM, Anexo III', raio: 15 },
  { id: 'vc-cml', tipo: 'Património', url: `${CML}/Patrimonio/FeatureServer/16`, nome: 'Imóvel em vias de classificação (CML)', campos: ['NOME', 'DESIGNACAO'], artigos: 'Lei 107/2001', raio: 15 },
  { id: 'mn', tipo: 'Património', url: `${CML}/Patrimonio/FeatureServer/12`, nome: 'Monumento nacional nas proximidades', campos: ['NOME', 'DESIGNACAO'], artigos: 'Lei 107/2001 · DL 309/2009 (zona geral de protecção de 50 m)', raio: 50 },
  { id: 'iip', tipo: 'Património', url: `${CML}/Patrimonio/FeatureServer/11`, nome: 'Imóvel de interesse público nas proximidades', campos: ['NOME', 'DESIGNACAO'], artigos: 'Lei 107/2001 · DL 309/2009 (zona geral de protecção de 50 m)', raio: 50 },
  { id: 'vc-mc', tipo: 'Património', url: `${CML}/Patrimonio/FeatureServer/9`, nome: 'Imóvel em vias de classificação nas proximidades', campos: ['NOME', 'DESIGNACAO'], artigos: 'Lei 107/2001 · DL 309/2009', raio: 50 },
  { id: 'arq', tipo: 'Património', url: `${CML}/Patrimonio/FeatureServer/14`, nome: 'Vestígios arqueológicos nas proximidades', campos: ['NOME', 'DESIGNACAO'], artigos: 'RPDM, arts. 4.º, 26.º e 33.º', raio: 50 },
];

// O que o PDM tem e as camadas públicas ainda não dão. Mostrado na consulta como «por confirmar no LXi»,
// e lido pelo plugin (LXi) quando a morada é de um projeto exportado.
export const SO_NO_LXI = [
  'Qualificação do espaço (Planta de Ordenamento)',
  'Níveis arqueológicos',
  'Zonas especiais de protecção (ZEP)',
  'Servidão aeronáutica e outras servidões (Condicionantes I)',
  'Vulnerabilidade a inundações e riscos',
  'Zonas de estacionamento',
  'Zonamento acústico',
];

// Opcional: serviços do LXi (MuniSIG) através de um intermediário próprio que trate do token.
// Vazio = não usado. Ver docs/MORADA.md.
export const MUNISIG_PROXY = '';

export const LXI_URL = 'https://websig.cm-lisboa.pt/MuniSIG/visualizador/index.html?viewer=LxInterativa';
