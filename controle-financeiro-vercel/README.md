# Controle Financeiro

App de controle financeiro pessoal (receitas, despesas, contas, metas e relatórios), feito em React + Vite.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (algo como `http://localhost:5173`).

## Modo app (tela cheia, sem barra do navegador)

Este projeto já vem configurado como PWA (Progressive Web App). Isso significa que, ao adicionar o link à tela inicial do celular, ele abre em **tela cheia**, sem a barra de endereço nem os menus do navegador — como um app instalado de verdade.

Depois de publicar no Vercel:
1. Abra o link publicado no navegador do celular
2. Adicione à tela inicial (Safari: compartilhar → "Adicionar à Tela de Início" / Chrome: menu ⋮ → "Adicionar à tela inicial" ou "Instalar app")
3. **Remova o ícone antigo** da tela inicial, se você já tinha adicionado antes dessa atualização, e adicione de novo — assim ele já abre no modo tela cheia
4. Abra pelo novo ícone: ele deve abrir sem barra de navegador

Um service worker também foi incluído, o que permite o app abrir mesmo com internet instável, depois da primeira vez que for carregado.

## Login com Google e dados na nuvem (opcional)

O app já vem preparado para login com Google, usando o Firebase (gratuito). **Enquanto você não configurar isso, o app continua funcionando normalmente**, salvando os dados só no aparelho — nada quebra.

### Passo 1 — Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e entre com sua conta Google
2. Clique em **"Adicionar projeto"** (ou "Create a project")
3. Dê um nome (ex: `controle-financeiro`) e siga os passos padrão (pode desativar o Google Analytics, não é necessário)

### Passo 2 — Ativar o login com Google

1. No menu à esquerda, clique em **"Authentication"**
2. Clique em **"Get started"** (se for a primeira vez)
3. Na aba **"Sign-in method"**, clique em **"Google"** na lista de provedores
4. Ative o botão (toggle) e clique em **"Save"**

### Passo 3 — Criar o banco de dados (Firestore)

1. No menu à esquerda, clique em **"Firestore Database"**
2. Clique em **"Create database"**
3. Escolha **"Start in production mode"** e clique em "Next", depois escolha a região mais próxima (ex: `southamerica-east1` para o Brasil) e clique em **"Enable"**
4. Depois de criado, clique na aba **"Rules"** (Regras) e substitua o conteúdo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Clique em **"Publish"**. Isso garante que cada pessoa só acessa os próprios dados.

### Passo 4 — Pegar as chaves de configuração

1. Clique na engrenagem ⚙️ ao lado de "Project Overview" → **"Project settings"**
2. Role até **"Your apps"** e clique no ícone **`</>`** (Web) para criar um app
3. Dê um apelido (ex: `web`) e clique em **"Register app"**
4. Copie os valores do objeto `firebaseConfig` que aparece (algo como `apiKey: "AIza...")

### Passo 5 — Adicionar as chaves no projeto

**No Vercel** (para o app publicado):
1. No painel do projeto, vá em **Settings → Environment Variables**
2. Adicione uma por uma (Key = nome da variável, Value = valor copiado do Firebase):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Depois de adicionar todas, vá em **Deployments** → menu **"..."** do último deploy → **"Redeploy"**

### Passo 6 — Autorizar o domínio do Vercel no Firebase

1. De volta no Firebase, vá em **Authentication → Settings → Authorized domains**
2. Clique em **"Add domain"** e cole o domínio do seu app (ex: `seu-app.vercel.app`)

Depois disso, um botão **"Entrar com Google"** aparece automaticamente no topo do app. Ao entrar, os dados que já existiam no aparelho são enviados para a nuvem automaticamente, e passam a sincronizar em qualquer aparelho que você fizer login.

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
