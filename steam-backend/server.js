require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json()); 

const API_KEY = process.env.STEAM_API_KEY;

// 1. Rota de Status
app.get('/api/status', (req, res) => {
    res.json({ status: 'Servidor a correr com sucesso!' });
});

// 2. Rota para Buscar o Perfil
app.get('/api/profile/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
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
        
        const statsUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${API_KEY}&steamid=${steamId}`;
        const statsResponse = await axios.get(statsUrl);
        const playerStats = statsResponse.data.playerstats.achievements || [];

        const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?key=${API_KEY}&appid=${appId}&l=portuguese`;
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
                    const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=br&l=portuguese`;
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

// 6. ROTA DE IA (STEAM_BB)
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, contextGames } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Histórico de mensagens vazio.' });
        }

        const systemPrompt = {
            role: 'system',
            content: `Você é a "SteamBB", uma IA não-oficial rodando num terminal Cyberpunk Dark Neo-Brutalista. 
            Sua personalidade é ríspida, sarcástica, ácida e você é uma especialista veterana em jogos da Steam. 
            NUNCA seja educada demais. NUNCA use frases clichês como "Olá, como posso ajudar?". 
            Vá direto ao ponto com respostas curtas e impactantes. Fale sempre em português do Brasil.
            Contexto da biblioteca completa deste usuário: ${contextGames || 'Nenhum perfil carregado.'}`
        };

        const ollamaMessages = [systemPrompt, ...messages];

        const ollamaResponse = await axios.post('http://localhost:11434/api/chat', {
            model: 'llama3',
            messages: ollamaMessages,
            stream: false
        });

        res.json({ reply: ollamaResponse.data.message.content });
    } catch (error) {
        console.error('Erro na IA Local:', error.message);
        res.status(500).json({ error: 'Erro ao conectar com o Ollama.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});