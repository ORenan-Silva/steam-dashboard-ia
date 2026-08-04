# 💻 Steam Dashboard Brutalista & SteamBB (IA Sarcástica)

Um painel de controle completo para a Steam, construído com uma estética **Dark Neo-Brutalista (Cyberpunk)**. Este projeto vai muito além de uma simples vitrine de jogos: analisa a sua biblioteca, estima o valor financeiro da sua conta e conta com a **SteamBB**, uma Inteligência Artificial local implacável que julga as suas escolhas de jogos e o seu tempo perdido.

---

## ✨ Funcionalidades Principais

* 🔍 **Busca de Perfil Avançada:** Consulta dados em tempo real (avatar, status) utilizando apenas o seu `SteamID64`.
* 🎮 **Biblioteca Interativa:** Visualização completa dos seus jogos com capas oficiais da Steam CDN, ordenação personalizada (por horas, nome ou ID) e estatísticas de tempo jogado.
* 💸 **Calculadora de Valor da Conta:** Algoritmo robusto com processamento em lotes e sistema de *Auto-Retry* (anti-bloqueios e proteções contra Rate Limit da Steam) que estima o valor financeiro total da sua biblioteca.
* 🏆 **Diagnóstico de Conquistas Avançado:** Integração com o *Steam Game Schema* para identificar as conquistas pendentes de cada jogo, processando os nomes reais e as descrições oficiais em português do Brasil.
* 🤖 **Terminal SteamBB (IA Local):** Integração com o **Ollama (modelo Llama 3)**. Um assistente sarcástico que lê os seus dados de jogo para te humilhar pessoalmente. A SteamBB vai zombar dos jogos que você comprou e nunca abriu, te ridicularizar pelo valor gasto e te chamar de *tryhard* nos jogos já platinados.

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
* **Ollama** rodando o modelo **Llama 3** localmente (Garantindo que a IA funciona 100% gratuita e *offline* via API local).

---

## 🚀 Instalação e Configuração

### Pré-requisitos
1.  [Node.js](https://nodejs.org/) instalado na máquina.
2.  Uma [Steam API Key](https://steamcommunity.com/dev/apikey) (Chave de Desenvolvedor).
3.  [Ollama](https://ollama.com/) instalado no seu computador.

### 1. Configurar o Motor de IA (SteamBB)
Abra o seu terminal e baixe o cérebro da IA para a sua máquina:
ollama run llama3

(Mantenha o Ollama rodando em segundo plano na porta 11434)

### 2. Configurar o Back-end
Navegue até a pasta do servidor e instale as dependências necessárias:

# Na pasta do backend
npm install express axios cors dotenv

# Crie um arquivo .env na raiz do backend e adicione a sua chave da Steam:
STEAM_API_KEY=COLE_AQUI_A_SUA_CHAVE_DA_STEAM
PORT=3001

# Inicie o servidor Node:
node server.js

### 3. Configurar o Front-end
Navegue até a pasta do frontend e instale as bibliotecas:

# Na pasta do frontend
npm install
npm install styled-components axios

# Inicie a aplicação React/Vite:
npm run dev

### Segurança da Aplicação
NUNCA compartilhe o seu arquivo .env na nuvem. Para garantir a segurança, o projeto está devidamente blindado com um arquivo .gitignore configurado na raiz para evitar vazamentos da STEAM_API_KEY para o GitHub.

# Exemplo do .gitignore
node_modules/
.env
dist/

### Criado com muito sarcasmo, café e código. ###