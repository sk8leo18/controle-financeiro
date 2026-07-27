# Controle Financeiro

App de controle financeiro pessoal (receitas, despesas, contas, metas e relatórios), feito em React + Vite.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (algo como `http://localhost:5173`).

## Publicar no Vercel

### Opção 1 — sem usar terminal (mais fácil)

1. Crie uma conta gratuita em [github.com](https://github.com) (se ainda não tiver)
2. Crie um repositório novo e envie esta pasta para lá (pelo site do GitHub, em "uploading an existing file", ou usando o GitHub Desktop)
3. Crie uma conta gratuita em [vercel.com](https://vercel.com) usando o login do GitHub
4. Clique em **Add New → Project**, escolha o repositório que você criou
5. O Vercel detecta automaticamente que é um projeto Vite — não precisa mudar nada
6. Clique em **Deploy**

Em cerca de 1 minuto, o Vercel te dá um link (tipo `seu-projeto.vercel.app`) que já funciona no celular.

### Opção 2 — pelo terminal

```bash
npm install -g vercel
vercel
```

Siga as perguntas na tela (aceite os padrões). No final, você recebe o link do app publicado.

## Usar no celular como um app

Depois de publicado:
1. Abra o link no navegador do celular
2. No Safari (iPhone): toque em compartilhar → "Adicionar à Tela de Início"
3. No Chrome (Android): menu (⋮) → "Adicionar à tela inicial" / "Instalar app"

Isso cria um ícone no celular que abre o app em tela cheia, sem barra de navegador.

## Sobre os dados

Os dados (lançamentos, contas, metas) ficam salvos no `localStorage` do navegador — ou seja, ficam guardados **naquele navegador/celular específico**. Se você limpar os dados do navegador, ou acessar de outro aparelho, os dados não aparecem lá. Se no futuro você quiser os dados sincronizados entre aparelhos, vai precisar de um banco de dados de verdade (ex: Supabase, Firebase) — posso te ajudar a configurar isso depois, se quiser.
