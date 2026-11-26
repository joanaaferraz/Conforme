# Conforme · app para iPhone

Web app que leva para o telemóvel o que o plugin **Conforme para Revit** recolhe num projeto, e que consulta, a partir de uma morada de Lisboa, condicionantes, requisitos e legislação aplicável.

**Abrir no iPhone:** https://joanaaferraz.github.io/Conforme/ → no Safari, Partilhar › **Adicionar ao ecrã principal**.

## O que faz

| Separador | O quê | De onde vêm os dados |
| --- | --- | --- |
| Projetos | Resumo, lote, verificação de normas, medições e documentos de cada projeto | Ficheiros `.conforme.json` gravados pelo plugin em `OneDrive\Conforme\Telemóvel` |
| Morada | Morada → coordenadas → camadas da CML no ponto → requisitos e legislação | OpenStreetMap (Nominatim), dados abertos da CML, `regras.json` e tabela de legislação do plugin |
| Legislação | Tabela de legislação do Conforme, com pesquisa e ligações ao DR | `app/data/legislacao.json` (do `leg-v2.js` do plugin) |
| Ficheiros | Abrir ou atualizar projetos | App Ficheiros do iPhone (OneDrive) |

## Estrutura

```
app/                  a web app (sem passo de compilação)
  js/core/            lógica sem interface: formato do ficheiro, consulta por morada, legislação, planta, armazenamento
  js/main.js          interface
  js/config.js        servidores externos e camadas consultadas
  data/               legislação e regras (cópias dos ficheiros do plugin) e um projeto de exemplo
schema/               formato do ficheiro .conforme.json (versão 1)
docs/                 como passar a app nativa e notas sobre a consulta por morada
capacitor.config.json para gerar o projeto iOS nativo (ver docs/NATIVO.md)
```

O código do plugin não está neste repositório (o repositório é público).

## Testar no computador

```
npm run servir        # abre em http://localhost:8080
```
