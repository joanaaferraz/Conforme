// Configuração da app Conforme. Tudo o que depende de servidores externos está aqui,
// para poder ser mudado sem mexer no resto (e para a app nativa usar o mesmo ficheiro).

export const VERSAO_APP = '0.2.0';

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
const GIS = 'https://gisapps.cm-lisboa.pt/arcgis/rest/services';
const SIG = 'https://sigservices.cm-lisboa.pt/arcgis/rest/services';
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
  { id: 'int-arq', tipo: 'Património', url: `${CML}/CAL_TrabalhosArqueologicos/FeatureServer/0`, nome: 'Intervenção arqueológica da CML nas proximidades', campos: ['DESIGNACAO', 'NOME', 'TIPO'], artigos: 'RPDM (património arqueológico) · Lei 107/2001', raio: 30 },
  // Riscos do PDM (Planta de Ordenamento — riscos naturais e antrópicos), servidores da CML, sem token.
  { id: 'inund', tipo: 'Riscos (PDM)', url: `${SIG}/APP_Resist/App_Resist_Layers_BDSIG/FeatureServer/2`, nome: 'Vulnerabilidade às inundações', campos: ['VULNERABIL'], artigoCampo: 'ART_RPDM', artigos: 'RPDM (riscos naturais)', raio: 0 },
  { id: 'mare', tipo: 'Riscos (PDM)', url: `${SIG}/APP_Resist/App_Resist_Layers_BDSIG/FeatureServer/1`, nome: 'Suscetibilidade ao efeito de maré directo', campos: ['NOME', 'INFOPDM'], artigoCampo: 'ART_RPDM', artigos: 'RPDM (riscos naturais)', raio: 0 },
  { id: 'sismo', tipo: 'Riscos (PDM)', url: `${GIS}/Arcgis_Online/Riscos/MapServer/1`, nome: 'Vulnerabilidade sísmica dos solos', campos: ['VULNSOLOS', 'GRAU', 'NOME'], artigoCampo: 'ART_RPDM', artigos: 'RPDM (riscos naturais)', raio: 0 },
  { id: 'vertentes', tipo: 'Riscos (PDM)', url: `${GIS}/Arcgis_Online/Riscos/MapServer/0`, nome: 'Movimentos de massa em vertentes', campos: ['CLASSENOME', 'CLASSE'], artigoCampo: 'ART_RPDM', artigos: 'RPDM (riscos naturais)', raio: 0 },
  { id: 'hidrico', tipo: 'Condicionantes', url: `${SIG}/APP_Resist/App_Resist_Layers_BDSIG/FeatureServer/6`, nome: 'Domínio hídrico', campos: ['CONDICIONA', 'NOME'], artigos: 'Lei 54/2005 · Lei 58/2005', raio: 10 },
];

// O que o PDM tem e as camadas públicas ainda não dão. Mostrado na consulta como «por confirmar no LXi»,
// e lido pelo plugin (LXi) quando a morada é de um projeto exportado.
export const SO_NO_LXI = [
  'Qualificação do espaço (Planta de Ordenamento)',
  'Níveis arqueológicos',
  'Zonas especiais de protecção (ZEP)',
  'Servidão aeronáutica e outras servidões (Condicionantes I)',
  'Zonas de estacionamento',
  'Zonamento acústico',
];

// Opcional: serviços do LXi (MuniSIG) através de um intermediário próprio que trate do token.
// Vazio = não usado. Ver docs/MORADA.md.
export const MUNISIG_PROXY = '';

export const LXI_URL = 'https://websig.cm-lisboa.pt/MuniSIG/visualizador/index.html?viewer=LxInterativa';

// Projetos enviados pelo plugin (cifrados) — ramo «dados» do repositório, pasta p/.
// O ramo é separado do main para não voltar a publicar a app a cada envio.
export const REMOTO = {
  api: 'https://api.github.com/repos/joanaaferraz/Conforme/contents/p',
  raw: 'https://raw.githubusercontent.com/joanaaferraz/Conforme/dados/p',
  ramo: 'dados',
  intervalo: 60000, // de quanto em quanto tempo procura uma versão nova, com a app aberta
};
// Endereço que o QR Code abre (o plugin acrescenta #p=<código>)
export const APP_URL = 'https://joanaaferraz.github.io/Conforme/';
