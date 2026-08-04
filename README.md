"""# 💻 Steam Dashboard Brutalista & SteamBB (IA Sarcástica)

Um painel de controlo completo para a Steam, construído com uma estética **Dark Neo-Brutalista (Cyberpunk)**. Este projeto vai muito além de uma simples montra de jogos: analisa a tua biblioteca, estima o valor financeiro da tua conta e conta com a **SteamBB**, uma Inteligência Artificial local implacável que julga as tuas escolhas de jogos e o teu tempo perdido.

---

## ✨ Funcionalidades Principais

* 🔍 **Busca de Perfil Avançada:** Consulta dados em tempo real (avatar, status) utilizando apenas o teu `SteamID64`.
* 🎮 **Biblioteca Interativa:** Visualização completa dos teus jogos com capas oficiais da Steam CDN, ordenação personalizada (por horas, nome ou ID) e estatísticas de tempo jogado.
* 💸 **Calculadora de Valor da Conta:** Algoritmo robusto com processamento em lotes e sistema de *Auto-Retry* (anti-bloqueios e proteções contra Rate Limit da Steam) que estima o valor financeiro total da tua biblioteca.
* 🏆 **Diagnóstico de Conquistas Avançado:** Integração com o *Steam Game Schema* para identificar as conquistas em falta de cada jogo, processando os nomes reais e as descrições oficiais em português.
* 🤖 **Terminal SteamBB (IA Local):** Integração com o **Ollama (modelo Llama 3)**. Um assistente sarcástico que lê os teus dados de jogo para te humilhar pessoalmente. A SteamBB vai gozar com os jogos que compraste e nunca abriste, ridicularizar-te pelo valor gasto e chamar-te *tryhard* nos jogos já platinados.

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
* **Ollama** a correr o modelo **Llama 3** localmente (Garantindo que a IA funciona 100% gratuita e *offline* via API local).

---

## 🚀 Instalação e Configuração

### Pré-requisitos
1.  [Node.js](https://nodejs.org/) instalado na máquina.
2.  Uma [Steam API Key](https://steamcommunity.com/dev/apikey) (Chave de Programador).
3.  [Ollama](https://ollama.com/) instalado no teu computador.

### 1. Configurar o Motor de IA (SteamBB)
Abre o teu terminal e descarrega o cérebro da IA para a tua máquina: