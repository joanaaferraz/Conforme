# Projeto cifrado (`p/<código>.json`, ramo `dados`)

O plugin grava aqui cada projeto **cifrado com a senha da Joana**. O conteúdo em claro é um ficheiro
`conforme.schema.json` (versão 1) com mais o campo `id` = código.

```json
{
  "formato": "conforme-cifrado",
  "versao": 1,
  "kdf": "PBKDF2-SHA256",
  "iteracoes": 310000,
  "sal": "<16 bytes, base64>",
  "iv": "<12 bytes, base64>",
  "dados": "<AES-GCM-256 do JSON em UTF-8, com a etiqueta de 16 bytes no fim, base64>"
}
```

- Chave = PBKDF2(senha, sal, iteracoes, SHA-256) → AES-GCM 256 bits.
- O sal só muda quando a senha muda no plugin; por isso a app guarda a chave derivada (não exportável) e só pede a senha uma vez.
- O código (20 caracteres aleatórios, a–z e 2–7) não diz nada sobre a morada. É o que vai no QR Code:
  `https://joanaaferraz.github.io/Conforme/#p=<código>`.
- Implementações: `app/js/core/cifra.js` (app) e `ui/telemovel.js` (plugin, fora deste repositório).
