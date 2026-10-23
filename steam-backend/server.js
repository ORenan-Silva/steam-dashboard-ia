require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middlewares
// Em produção, defina FRONTEND_URL (ex: https://steambb.vercel.app) para liberar só o seu site.
// Aceita vários endereços separados por vírgula. Sem a variável, libera qualquer origem (modo dev).
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
    : '*';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

const API_KEY = process.env.STEAM_API_KEY;

// Modelo da IA no Groq. Configurável porque o Groq aposenta modelos com frequência
// (o llama-3.1-8b-instant foi removido). Lista atual: https://console.groq.com/docs/models
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Limites para não estourar a cota grátis do Groq (8.000 tokens/minuto)
const MAX_CONTEXT_CHARS = 6000;
const MAX_HISTORY_MESSAGES = 12;

// SteamID64 tem sempre 17 dígitos; appId é numérico. Evita repassar lixo para a URL da Steam.
const isValidSteamId = (id) => /^\d{17}$/.test(id);
const isValidAppId = (id) => /^\d+$/.test(id);

// 1. Rota de Status
app.get('/api/status', (req, res) => {
    res.json({ status: 'Servidor a correr com sucesso!' });
});

// 2. Rota para Buscar o Perfil
app.get('/api/profile/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
        if (!isValidSteamId(steamId)) {
            return res.status(400).json({ error: 'SteamID64 inválido. Ele deve ter 17 dígitos (ex: 76561197960435530).' });
        }
        const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamId}`;
        const response = await axios.get(url);
        const players = response.data.response.players;

        if (!players || players.length === 0) {
            return res.status(404).json({ error: 'Jogador não encontrado.' });
        }
        res.json(players[0]);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar perfil.' });
    }
});

// 3. Rota para Buscar a Biblioteca
app.get('/api/games/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
        if (!isValidSteamId(steamId)) {
            return res.status(400).json({ error: 'SteamID64 inválido.' });
        }
        const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;
        const response = await axios.get(url);
        res.json(response.data.response);
    } catch (error) {
        console.error('Erro ao buscar jogos:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar jogos.' });
    }
});

// 4. Rota para Buscar Conquistas COM NOMES E DESCRIÇÕES REAIS
app.get('/api/achievements/:steamId/:appId', async (req, res) => {
    try {
        const { steamId, appId } = req.params;
        if (!isValidSteamId(steamId) || !isValidAppId(appId)) {
            return res.status(400).json({ error: 'SteamID64 ou appId inválido.' });
        }

        const statsUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${API_KEY}&steamid=${steamId}`;
        const statsResponse = await axios.get(statsUrl);
        const playerStats = statsResponse.data.playerstats.achievements || [];

        const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?key=${API_KEY}&appid=${appId}&l=brazilian`;
        const schemaResponse = await axios.get(schemaUrl);
        const schemaAchievements = schemaResponse.data.game.availableGameStats?.achievements || [];

        const mergedAchievements = playerStats.map(stat => {
            const schemaInfo = schemaAchievements.find(s => s.name === stat.apiname);
            return {
                ...stat,
                displayName: schemaInfo ? schemaInfo.displayName : stat.apiname,
                description: schemaInfo ? schemaInfo.description : 'Sem descrição.',
            };
        });

        res.json({ achievements: mergedAchievements });
    } catch (error) {
        res.status(400).json({ error: 'Sem conquistas para este jogo.' });
    }
});

// 5. Rota de Cálculo em Lote Seguro (COM AUTO-RETRY PARA RATE LIMIT)
app.post('/api/account-value-batch', async (req, res) => {
    try {
        const { appIds } = req.body;

        if (!appIds || !Array.isArray(appIds) || appIds.length === 0) {
            return res.json({ batchValue: 0, successfulCount: 0 });
        }

        let batchValue = 0;

        for (const appId of appIds) {
            let success = false;
            let retries = 0;

            // Tenta até 3 vezes se a Steam bloquear o IP temporariamente
            while (!success && retries < 3) {
                try {
                    const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=br&l=brazilian`;
                    const storeResponse = await axios.get(storeUrl);
                    
                    const gameData = storeResponse.data && storeResponse.data[appId];

                    if (gameData && gameData.success === true && gameData.data) {
                        if (!gameData.data.is_free && gameData.data.price_overview) {
                            const precoInicial = gameData.data.price_overview.initial;
                            if (typeof precoInicial === 'number') {
                                batchValue += precoInicial / 100;
                            }
                        }
                    }
                    
                    success = true; // Funcionou, avança para o próximo
                    await new Promise(resolve => setTimeout(resolve, 250)); 
                } catch (err) {
                    if (err.response && err.response.status === 429) {
                        retries++;
                        console.log(`[STEAM_BB AVISO]: Rate Limit no jogo ${appId}. A aguardar 3 segundos... (Tentativa ${retries}/3)`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    } else {
                        // Se o jogo simplesmente não existir na loja, ignora e avança
                        success = true;
                    }
                }
            }
        }

        res.json({ batchValue });
    } catch (error) {
        console.error('Erro geral no lote:', error.message);
        res.json({ batchValue: 0 });
    }
});

// 6. ROTA DE IA (STEAM_BB via GROQ)
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, contextGames } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Histórico de mensagens vazio.' });
        }

        const systemPrompt = {
            role: 'system',
            content: `Você é a "SteamBB" (uma homenagem ao banco de dados SteamDB), uma IA não-oficial rodando num terminal Cyberpunk Dark Neo-Brutalista. 
            Sua personalidade é ríspida, sarcástica, ácida e você é uma especialista veterana em jogos da Steam. 
            NUNCA seja educada demais. NUNCA use frases clichês como "Olá, como posso ajudar?". 
            Vá direto ao ponto com respostas curtas e impactantes. Fale sempre em português do Brasil.
            Contexto da biblioteca deste usuário: ${String(contextGames || 'Nenhum perfil carregado.').slice(0, MAX_CONTEXT_CHARS)}`
        };

        // Só aceita papéis user/assistant vindos do navegador e manda apenas as últimas mensagens,
        // senão o histórico cresce a cada pergunta até estourar o limite de tokens do Groq
        const history = messages
            .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
            .slice(-MAX_HISTORY_MESSAGES);

        const aiMessages = [systemPrompt, ...history];

        // Faz a chamada diretamente para a API super-rápida do Groq
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: GROQ_MODEL,
            messages: aiMessages,
            temperature: 0.7,
            max_tokens: 1024,
            // Os modelos gpt-oss "pensam" antes de responder; esforço baixo = resposta rápida
            ...(GROQ_MODEL.startsWith('openai/gpt-oss') && { reasoning_effort: 'low' })
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Retorna a resposta extraída do Groq
        res.json({ reply: groqResponse.data.choices[0].message.content });

    } catch (error) {
        console.error('Erro na IA do Groq:', error.response ? error.response.data : error.message);
        const status = error.response?.status;
        if (status === 429 || status === 413) {
            return res.status(429).json({ error: 'A STEAM_BB ESTÁ SOBRECARREGADA (LIMITE DO GROQ). ESPERE UM MINUTO E TENTE DE NOVO.' });
        }
        res.status(500).json({ error: 'ERRO: CONEXÃO COM O CÉREBRO DA STEAM_BB PERDIDA.' });
    }
});

// JSON malformado no corpo da requisição: responde em JSON em vez de vazar o stack trace do servidor
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido.' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Requisição grande demais.' });
    }
    console.error('Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor.' });
});

const PORT = process.env.PORT || 3001;

// No Express 5, erros ao abrir a porta (ex: porta já em uso) chegam neste callback
app.listen(PORT, (error) => {
    if (error) throw error;
    console.log(`Servidor rodando na porta ${PORT}`);
});