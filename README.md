# 💻 Steam Dashboard Brutalista & SteamBB (IA Sarcástica)

Um painel de controle completo para a Steam, construído com uma estética **Dark Neo-Brutalista (Cyberpunk)**. Este projeto vai muito além de uma simples vitrine de jogos: analisa a sua biblioteca, estima o valor financeiro da sua conta e conta com a **SteamBB**, uma Inteligência Artificial implacável que julga as suas escolhas de jogos e o seu tempo perdido.

---

## ✨ Funcionalidades Principais

* 🔍 **Busca de Perfil Avançada:** Consulta dados em tempo real (avatar, status) utilizando apenas o seu `SteamID64`.
* 🎮 **Biblioteca Interativa:** Visualização completa dos seus jogos com capas oficiais da Steam CDN, ordenação personalizada (por horas, nome ou ID) e estatísticas de tempo jogado.
* 💸 **Calculadora de Valor da Conta:** Algoritmo robusto com processamento em lotes e sistema de *Auto-Retry* (anti-bloqueios e proteções contra Rate Limit da Steam) que estima o valor financeiro total da sua biblioteca.
* 🏆 **Diagnóstico de Conquistas Avançado:** Integração com o *Steam Game Schema* para identificar as conquistas pendentes de cada jogo, processando os nomes reais e as descrições oficiais em português do Brasil.
* 🤖 **Terminal SteamBB (IA):** Integração com a API do **Groq (modelo GPT-OSS 120B)**. Um assistente sarcástico que lê os seus dados de jogo para te humilhar pessoalmente. A SteamBB vai zombar dos jogos que você comprou e nunca abriu, te ridicularizar pelo valor gasto e te chamar de *tryhard* nos jogos já platinados.

---

## 🛠️ Tecnologias Utilizadas

### Front-end
* **React** (com Vite)
* **Tailwind CSS** (para o design Neo-Brutalista de alto contraste)
* **Styled-Components** (para animações de *loading* personalizadas e dinâmicas)
* **Axios**

### Back-end
* **Node.js**
* **Express**
* **Axios** (para consumir a Steam Web API e a Steam Storefront API de forma estruturada)

### Inteligência Artificial
* **Groq API** rodando o modelo **GPT-OSS 120B** na nuvem (rápido e com plano gratuito). O modelo pode ser trocado pela variável `GROQ_MODEL`.

---

## 🚀 Instalação e Configuração (local)

### Pré-requisitos
1. [Node.js](https://nodejs.org/) 20 ou superior.
2. Uma [Steam API Key](https://steamcommunity.com/dev/apikey) (chave de desenvolvedor).
3. Uma [Groq API Key](https://console.groq.com/keys) (gratuita), usada pela IA da SteamBB.

### 1. Back-end
```bash
cd steam-backend
npm install
cp .env.example .env   # depois preencha STEAM_API_KEY e GROQ_API_KEY
npm start              # ou: npm run dev (reinicia ao salvar)
```
O servidor sobe em `http://localhost:3001` (teste em `/api/status`).

### 2. Front-end
```bash
cd steam-frontend
npm install
npm run dev
```
Por padrão o front conversa com `http://localhost:3001`. Para apontar para outro backend, crie um `.env.local` com `VITE_API_URL=...` (veja `.env.example`).

---

## 🌐 Deploy (publicar online)

O projeto é dividido em duas partes, publicadas separadamente (ambas com plano gratuito):

### Back-end → [Render](https://render.com)
1. **New → Blueprint** e selecione este repositório (o `render.yaml` na raiz já configura tudo), **ou** **New → Web Service** com:
   - Root Directory: `steam-backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
2. Em **Environment**, adicione `STEAM_API_KEY`, `GROQ_API_KEY` e `FRONTEND_URL` (o endereço do front na Vercel, preenchido após o passo seguinte).
3. Anote a URL gerada, ex: `https://steam-backend.onrender.com`.

> No plano gratuito o Render "dorme" após 15 min sem uso; a primeira requisição depois disso pode levar ~1 min.

### Front-end → [Vercel](https://vercel.com)
1. **Add New → Project** e importe este repositório.
2. Root Directory: `steam-frontend` (o preset Vite é detectado sozinho).
3. Em **Environment Variables**, adicione `VITE_API_URL` = URL do backend no Render (sem `/` no final).
4. Deploy! Depois volte no Render e coloque a URL da Vercel em `FRONTEND_URL`.

---

## 🔒 Segurança da Aplicação
NUNCA suba o seu arquivo `.env` para o GitHub. O `.gitignore` na raiz já bloqueia os arquivos `.env`, e as chaves `STEAM_API_KEY` e `GROQ_API_KEY` ficam apenas no servidor (nunca no front-end). Use os arquivos `.env.example` como modelo.

### Criado com muito sarcasmo, café e código. ###
