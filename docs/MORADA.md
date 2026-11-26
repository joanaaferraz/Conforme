# Consulta por morada (Lisboa)

1. **Morada → coordenadas:** Nominatim (OpenStreetMap), limitado à caixa de Lisboa. Um pedido por consulta.
2. **Camadas no ponto:** serviços públicos da CML no ArcGIS Online (`services.arcgis.com/1dSrzEWVQn5kHHyK`): ARU, AUGI, planos de pormenor e de urbanização, património classificado e vestígios arqueológicos (num raio de 15 a 50 m). Lista e raios em `app/js/config.js`.
3. **Requisitos e legislação:** `regras.json` e a tabela de legislação do plugin, filtrados pelo uso e pelo que se encontrou.

## O que ainda não vem dos serviços públicos

Qualificação do espaço, níveis arqueológicos, ZEP, servidões (Condicionantes I), riscos, zonas de estacionamento e zonamento acústico estão nos serviços do LXi (`gisbase.cm-lisboa.pt/arcgisbase/rest/services/MuniSIG_Secure/...`), que pedem token. A app mostra-os como «por confirmar no LXi», exceto quando a morada é de um projeto exportado pelo plugin: aí usa o lote que o plugin leu no LXi.

Para os ler diretamente seria preciso um intermediário próprio (por exemplo um Cloudflare Worker) que obtenha o token como o visualizador faz. `MUNISIG_PROXY` em `config.js` está preparado para isso, mas ainda não é usado.
