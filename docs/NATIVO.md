# Passar a app nativa iOS (uso pessoal)

A web app em `app/` está pronta para ser embrulhada com [Capacitor](https://capacitorjs.com): o mesmo código passa a ser uma app iOS instalada no iPhone, com ícone e sem barra do Safari. Não é preciso reescrever nada.

## O que é preciso

- Um **Mac** com **Xcode** (grátis na App Store). Só é preciso no momento de compilar e instalar; pode ser emprestado.
- Node.js no Mac (https://nodejs.org).
- Um **Apple ID**:
  - conta grátis: a app instala no teu iPhone, mas tem de ser reinstalada a cada **7 dias**;
  - **Apple Developer Program** (99 €/ano): a app dura **1 ano** e também podes usar o TestFlight. Não é preciso publicar na App Store.

## Passos (no Mac)

```
git clone https://github.com/joanaaferraz/Conforme.git
cd Conforme
npm install
npm run ios:criar        # cria a pasta ios/ (só da primeira vez)
npm run ios:atualizar    # copia app/ para o projeto iOS
npm run ios:abrir        # abre no Xcode
```

No Xcode: Signing & Capabilities › Team → escolher o teu Apple ID. Ligar o iPhone por cabo, escolhê-lo como destino e carregar em ▶︎. No iPhone: Definições › Geral › VPN e gestão de dispositivos › confiar no teu perfil de programador.

Depois de cada alteração em `app/`: `npm run ios:atualizar` e ▶︎ no Xcode.

## Porque é que isto funciona sem reescrever

- A lógica (`app/js/core/`) não depende da interface nem do browser, exceto `fetch` e IndexedDB, que existem no WKWebView do iOS.
- Abrir ficheiros usa `<input type="file">`, que no iOS abre a app Ficheiros (com o OneDrive), também dentro da app nativa.
- O formato `.conforme.json` tem versão (`schema/`), por isso o plugin e a app podem evoluir em separado.
- Se um dia quiseres uma app 100% SwiftUI, `app/js/core/` e `schema/` são a especificação a seguir.
