# Violão Fácil

Aplicativo Android de estudo de violão com catálogo inicial Gospel e Popular, cifras próprias, diagramas, transposição, acompanhamento, metrônomo e histórico local.

## Recursos desta versão
- Biblioteca inicial de exercícios Gospel e Popular.
- Cadastro local de sequências de acordes.
- Diagramas de G, D, Em, C, Am, A7 e F.
- Transposição de acordes.
- Modo de acompanhamento automático e manual.
- Sintetizador instrumental de acordes gerado no aparelho.
- Metrônomo sonoro com acento no primeiro tempo.
- Cronômetro e histórico local de prática.

## Requisitos
- Node.js LTS
- Expo Go no Android para a primeira prévia
- Conta Expo para compilar o APK com EAS Build

## Instalar e testar
No terminal do Codespaces, dentro desta pasta:

```bash
npm install
npx expo start
```

Abra o Expo Go no Android e leia o QR Code apresentado pelo terminal.

## Gerar APK de teste
Instale a ferramenta EAS:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

O EAS fornecerá um link para baixar o APK quando a compilação terminar. A compilação ainda precisa ser executada e testada em um aparelho Android.

## Observações
- O som é sintetizado por software e serve como guia de acordes; não é uma gravação de violão acústico real.
- O primeiro catálogo usa exercícios e sequências de estudo. Não inclui letras protegidas por direitos autorais.
- As músicas e o histórico personalizados ficam no aparelho nesta versão.
- Afinador por microfone, reconhecimento de acordes, sincronização em nuvem e testes completos ainda estão pendentes.
