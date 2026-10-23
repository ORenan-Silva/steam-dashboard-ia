# 💻 Steam Dashboard Brutalista & SteamBB (IA Sarcástica)

Um painel de controle completo para a Steam, construído com uma estética **Dark Neo-Brutalista (Cyberpunk)**. Este projeto vai muito além de uma simples vitrine de jogos: analisa a sua biblioteca, estima o valor financeiro da sua conta e conta com a **SteamBB**, uma Inteligência Artificial implacável que julga as suas escolhas de jogos e o seu tempo perdido.

---

## ✨ Funcionalidades Principais

* 👋 **Primeira Tela que Explica o Site:** Mostra o que o painel entrega, tem um botão **VER UM EXEMPLO** (carrega um perfil público sem precisar procurar o seu) e um passo a passo de "onde acho meu perfil?".
* 🗂️ **Navegação por Abas:** **PERFIL | VALOR | DUELO | JOGOS**, fixas no topo ao rolar. Trocar de aba não perde cálculos nem varreduras, e um link de duelo já abre na aba DUELO.
* 🔍 **Busca de Perfil Flexível:** Aceita o `SteamID64`, o link do perfil (`steamcommunity.com/id/seunome`) ou só o nome personalizado.
* 🔗 **Link Compartilhável com Prévia:** Depois da busca, a URL vira `?id=seunome`. No WhatsApp, Discord e Telegram o link aparece com um card brutalista gerado na hora, com nome, horas e jogos nunca abertos.
* ⚔ **Duelo de Bibliotecas:** Coloque um amigo no ringue (`?id=voce&vs=amigo`). O painel compara as duas contas, marca com 💀 quem está pior em cada critério e a SteamBB dá o veredito.
* 🕹️ **Últimas 2 Semanas:** O que você jogou recentemente, com as horas de cada jogo (a SteamBB também usa isso para te zoar).
* 🏆 **Quase Platinados:** Varre as conquistas dos seus 30 jogos mais jogados e mostra os que você largou perto dos 100%.
* 🎮 **Biblioteca Interativa:** Capas oficiais da Steam CDN, busca por nome, filtros (nunca abertos, jogados, +100h), ordenação por horas, nome, ID ou preço e paginação.
* 📊 **Raio-X do Perfil:** Total de jogos, horas totais, porcentagem de jogos nunca abertos e o seu maior vício.
* 🔒 **Tempo de Jogo Escondido:** Quem ativa "Manter meu tempo de jogo sempre privado" na Steam aparece com 0 horas em todos os jogos. O painel reconhece isso e mostra **OCULTO** (em vez de "nunca abriu nada"), tira as horas do placar do duelo e avisa a IA para não zoar dados falsos.
* 💸 **Calculadora de Valor da Conta:** Consulta preços em lote na loja da Steam (BR), com cache e *Auto-Retry* contra Rate Limit. Mostra os jogos mais caros e o **dinheiro jogado fora** em jogos que você nunca abriu.
* 🏆 **Diagnóstico de Conquistas Avançado:** Integração com o *Steam Game Schema* para identificar as conquistas pendentes de cada jogo, processando os nomes reais e as descrições oficiais em português do Brasil.
* 🤖 **Terminal SteamBB (IA):** Integração com a API do **Groq (modelo GPT-OSS 120B)**. Um assistente sarcástico que lê os seus dados de jogo para te humilhar pessoalmente. A SteamBB vai zombar dos jogos que você comprou e nunca abriu, te ridicularizar pelo valor gasto e te chamar de *tryhard* nos jogos já platinados. As respostas aparecem em tempo real (streaming), como num terminal de verdade, e a conversa fica salva no navegador.

---

## 🎨 Identidade Visual
Dark Neo-Brutalista: bordas grossas, sombras sólidas deslocadas, fonte monoespaçada e títulos em caixa alta (textos explicativos ficam em minúsculas, para facilitar a leitura). Cada cor tem um significado:

| Cor | Significado | Onde aparece |
|---|---|---|
| 🟢 Verde-limão | Marca, SteamBB e ações principais | Logo, terminal da IA, botões CARREGAR / GO / IA |
| 🟡 Âmbar | Dados | Cards do perfil, recentes, quase platinados, biblioteca, aba ativa |
| 🔵 Ciano | Dinheiro | Valor da conta, preço de cada jogo |
| 🔴 Vermelho | Vergonha | Jogos nunca abertos, dinheiro jogado fora, duelo, caveiras 💀 |

---

## 🛠️ Tecnologias Utilizadas

### Front-end
* **React** (com Vite)
* **Tailwind CSS** (para o design Neo-Brutalista de alto contraste)
* **Styled-Components** (para animações de *loading* personalizadas e dinâmicas)
* **satori + resvg** (imagem de prévia dos links, gerada numa função Node.js da Vercel)
* **Vercel Analytics** (contagem de visitas)
* **Vitest** (testes)

### Back-end
* **Node.js**
* **Express**
* **Axios** (para consumir a Steam Web API e a Steam Storefront API de forma estruturada)
* **express-rate-limit** (limite de mensagens por IP para proteger a cota do Groq)

### Inteligência Artificial
* **Groq API** rodando o modelo **GPT-OSS 120B** na nuvem (rápido e com plano gratuito), com o **GPT-OSS 20B** como reserva: o limite de tokens do Groq é separado por modelo, então quando o principal lota (ou é aposentado) o reserva assume sozinho. Se a IA recusar uma resposta, o servidor tenta de novo antes de mostrar.

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
O servidor sobe em `http://localhost:3001` (teste em `/api/status`). Para rodar os testes automatizados: `npm test`.

Variáveis opcionais do backend:
| Variável | Padrão | Para que serve |
|---|---|---|
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Modelo principal da IA no Groq |
| `GROQ_FALLBACK_MODEL` | `openai/gpt-oss-20b` | Modelo reserva, usado quando o principal falha |
| `CHAT_LIMIT_PER_MINUTE` | `10` | Mensagens por minuto que cada visitante pode mandar para a IA |
| `FRONTEND_URL` | (vazio = libera tudo) | Endereço do site em produção, para o CORS |
| `TRUST_PROXY` | `3` | Quantos proxies existem na frente do servidor (no Render são 3: Cloudflare, balanceador e proxy local) |

### 2. Front-end
```bash
cd steam-frontend
npm install
npm run dev
npm test        # testes com Vitest
```
Por padrão o front conversa com `http://localhost:3001`. Para apontar para outro backend, crie um `.env.local` com `VITE_API_URL=...` (veja `.env.example`). O botão **VER UM EXEMPLO** da primeira tela carrega o perfil definido em `VITE_PERFIL_EXEMPLO` (padrão: `arcticeaagle`).

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

> ⚠️ **Quando o Render publica:** só em commits que mexem em `steam-backend/` (o `rootDir` do serviço) **e** cujas verificações no GitHub passaram todas, incluindo o deploy da Vercel. Se a Vercel falhar num commit, o Render pula aquele deploy; nesse caso, use **Manual Deploy → Deploy latest commit** no painel do Render.

### Front-end → [Vercel](https://vercel.com)
1. **Add New → Project** e importe este repositório.
2. Root Directory: `steam-frontend` (o preset Vite é detectado sozinho).
3. Em **Environment Variables**, adicione `VITE_API_URL` = URL do backend no Render (sem `/` no final).
4. Deploy! Depois volte no Render e coloque a URL da Vercel em `FRONTEND_URL`.
5. (Opcional) Em **Analytics**, clique em **Enable** para ver quantas pessoas usam o site.

A pasta `steam-frontend/api/` tem funções da Vercel para a prévia dos links: `/api/og` gera a imagem e `/api/compartilhar` entrega as meta tags. O `vercel.json` manda só os robôs de prévia (WhatsApp, Discord etc.) para lá; as pessoas continuam recebendo o site normal.

### Manter o backend acordado
O workflow `.github/workflows/manter-acordado.yml` acessa o backend a cada 10 minutos, para a primeira visita não esperar ~1 min. O agendamento do GitHub pode atrasar, então para algo mais pontual crie também um monitor grátis no [UptimeRobot](https://uptimerobot.com):
1. **Add New Monitor** → tipo **HTTP(s)**.
2. URL: `https://SEU-BACKEND.onrender.com/api/status`.
3. Intervalo: **5 minutes** → **Create Monitor**.

---

## ✅ Integração Contínua
A cada push na `main`, o GitHub Actions (`.github/workflows/ci.yml`) roda os testes do backend e o lint, os testes e o build do frontend. Se algo quebrar, o erro aparece na aba **Actions** do repositório.

---

## 🔒 Segurança da Aplicação
NUNCA suba o seu arquivo `.env` para o GitHub. O `.gitignore` na raiz já bloqueia os arquivos `.env`, e as chaves `STEAM_API_KEY` e `GROQ_API_KEY` ficam apenas no servidor (nunca no front-end). Os prompts da IA são montados no servidor e cada visitante tem um limite de mensagens por minuto. Use os arquivos `.env.example` como modelo.

### Criado com muito sarcasmo, café e código. ###
