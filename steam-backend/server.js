require('dotenv').config({ quiet: true });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const app = express();

// No Render a requisição passa por 3 proxies (Cloudflare, balanceador e proxy local).
// Sem confiar neles, o servidor veria o IP interno do Render e o limite por visitante não funcionaria.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 3));

// Middlewares
// Em produção, defina FRONTEND_URL (ex: https://steambb.vercel.app) para liberar só o seu site.
// Aceita vários endereços separados por vírgula. Sem a variável, libera qualquer origem (modo dev).
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
    : '*';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '50kb' }));

const API_KEY = process.env.STEAM_API_KEY;
const STEAM_API = 'https://api.steampowered.com';
const STORE_API = 'https://store.steampowered.com/api/appdetails';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Modelo da IA no Groq. Configurável porque o Groq aposenta modelos com frequência
// (o llama-3.1-8b-instant foi removido). Lista atual: https://console.groq.com/docs/models
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Limites para não estourar a cota grátis do Groq (8.000 tokens/minuto)
const MAX_CONTEXT_CHARS = 6000;
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1000;
const CHAT_LIMIT_PER_MINUTE = Number(process.env.CHAT_LIMIT_PER_MINUTE || 10);

// Loja da Steam: quantos jogos por consulta e pausa entre consultas (anti Rate Limit)
const STORE_BATCH_SIZE = 25;
const STORE_DELAY_MS = Number(process.env.STORE_DELAY_MS ?? 300);
const STORE_RETRY_MS = Number(process.env.STORE_RETRY_MS ?? 2000);
const MAX_APPS_PER_REQUEST = 100;

// SteamID64 tem sempre 17 dígitos; appId é numérico. Evita repassar lixo para a URL da Steam.
const isValidSteamId = (id) => /^\d{17}$/.test(id);
const isValidAppId = (id) => /^\d+$/.test(id);

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const formatarHoras = (minutos) => `${(minutos / 60).toFixed(1)}h`;
const formatarReais = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

// Cache em memória com validade e tamanho máximo (o plano grátis do Render roda uma instância só)
const criarCache = (validadeMs, maxItens) => {
    const itens = new Map();
    return {
        get(chave) {
            const item = itens.get(chave);
            if (!item) return undefined;
            if (Date.now() > item.expira) {
                itens.delete(chave);
                return undefined;
            }
            return item.valor;
        },
        set(chave, valor) {
            if (itens.size >= maxItens) itens.delete(itens.keys().next().value);
            itens.set(chave, { valor, expira: Date.now() + validadeMs });
        },
        clear() {
            itens.clear();
        }
    };
};

const cachePrecos = criarCache(12 * 60 * 60 * 1000, 50000);
const cacheJogos = criarCache(10 * 60 * 1000, 1000);

// Limites de uso por IP
const responderLimite = (mensagem) => (req, res) => res.status(429).json({ error: mensagem });

const limiteGeral = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: responderLimite('MUITAS REQUISIÇÕES. ESPERE UM MINUTO.')
});

// Protege a cota do Groq: sem isso, uma pessoa só consegue derrubar a IA para todo mundo
const limiteChat = rateLimit({
    windowMs: 60 * 1000,
    limit: CHAT_LIMIT_PER_MINUTE,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: responderLimite(`CALMA. A STEAM_BB SÓ RESPONDE ${CHAT_LIMIT_PER_MINUTE} MENSAGENS POR MINUTO. VAI TOMAR UMA ÁGUA.`)
});

app.use('/api', limiteGeral);

// ---------- Steam ----------

// Aceita SteamID64, link do perfil (/profiles/ID ou /id/nome) ou só o nome personalizado
const resolverSteamId = async (entrada) => {
    const texto = String(entrada || '').trim().replace(/\/+$/, '');
    if (isValidSteamId(texto)) return texto;

    const porPerfil = texto.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
    if (porPerfil) return porPerfil[1];

    const porNome = texto.match(/steamcommunity\.com\/id\/([^/?#]+)/i);
    const nome = porNome ? porNome[1] : texto;
    if (!/^[A-Za-z0-9_-]{2,32}$/.test(nome)) return null;

    const { data } = await axios.get(`${STEAM_API}/ISteamUser/ResolveVanityURL/v0001/`, {
        params: { key: API_KEY, vanityurl: nome }
    });
    return data.response?.success === 1 ? data.response.steamid : null;
};

const buscarJogos = async (steamId) => {
    const emCache = cacheJogos.get(steamId);
    if (emCache) return emCache;

    const { data } = await axios.get(`${STEAM_API}/IPlayerService/GetOwnedGames/v0001/`, {
        params: { key: API_KEY, steamid: steamId, include_appinfo: true, include_played_free_games: true, format: 'json' }
    });
    const jogos = data.response?.games || [];
    // Biblioteca vazia geralmente é privada: não guarda, para a pessoa poder abrir e tentar de novo
    if (jogos.length > 0) cacheJogos.set(steamId, jogos);
    return jogos;
};

// Conquistas do jogador com nomes e descrições reais em português do Brasil
const buscarConquistas = async (steamId, appId) => {
    const [stats, schema] = await Promise.allSettled([
        axios.get(`${STEAM_API}/ISteamUserStats/GetPlayerAchievements/v0001/`, {
            params: { appid: appId, key: API_KEY, steamid: steamId }
        }),
        axios.get(`${STEAM_API}/ISteamUserStats/GetSchemaForGame/v0002/`, {
            params: { key: API_KEY, appid: appId, l: 'brazilian' }
        })
    ]);

    // A Steam responde erro para jogos sem conquistas ou com estatísticas privadas
    if (stats.status === 'rejected') return [];

    const playerStats = stats.value.data.playerstats?.achievements || [];
    const schemaAchievements = schema.status === 'fulfilled'
        ? schema.value.data.game?.availableGameStats?.achievements || []
        : [];
    const porNome = new Map(schemaAchievements.map(s => [s.name, s]));

    return playerStats.map(stat => ({
        ...stat,
        displayName: porNome.get(stat.apiname)?.displayName || stat.apiname,
        description: porNome.get(stat.apiname)?.description || 'Sem descrição.',
    }));
};

// Jogos grátis vêm com data = [] e jogos removidos da loja com success = false: ambos valem R$ 0
const lerPreco = (entrada) => {
    const preco = entrada?.success && entrada.data?.price_overview;
    return preco ? { cheio: preco.initial / 100, atual: preco.final / 100 } : { cheio: 0, atual: 0 };
};

// Com filters=price_overview a loja aceita vários appids numa chamada só
const consultarLoja = async (appIds) => {
    for (let tentativa = 1; ; tentativa++) {
        try {
            const { data } = await axios.get(STORE_API, {
                params: { appids: appIds.join(','), filters: 'price_overview', cc: 'br' }
            });
            return data;
        } catch (err) {
            if (err.response?.status !== 429 || tentativa === 3) throw err;
            console.log(`[STEAM_BB AVISO]: Rate Limit na loja. Aguardando... (Tentativa ${tentativa}/3)`);
            await esperar(STORE_RETRY_MS * tentativa);
        }
    }
};

const buscarPrecos = async (appIds) => {
    const precos = {};
    const falharam = [];
    const faltando = [];

    for (const appId of appIds) {
        const emCache = cachePrecos.get(appId);
        if (emCache) precos[appId] = emCache;
        else faltando.push(appId);
    }

    for (let i = 0; i < faltando.length; i += STORE_BATCH_SIZE) {
        const lote = faltando.slice(i, i + STORE_BATCH_SIZE);
        if (i > 0) await esperar(STORE_DELAY_MS);

        try {
            let data = await consultarLoja(lote);

            // Se a loja recusar a consulta em lote, cai para um jogo por vez
            if (!data && lote.length > 1) {
                data = {};
                for (const appId of lote) {
                    Object.assign(data, await consultarLoja([appId]));
                    await esperar(STORE_DELAY_MS);
                }
            }

            for (const appId of lote) {
                if (!data || !(appId in data)) {
                    falharam.push(appId);
                    continue;
                }
                precos[appId] = lerPreco(data[appId]);
                cachePrecos.set(appId, precos[appId]);
            }
        } catch (err) {
            console.error('Erro ao consultar a loja:', err.message);
            falharam.push(...lote);
        }
    }

    return { precos, falharam };
};

// ---------- Prompts da SteamBB ----------

// Resumo da biblioteca enviado para a IA. Mandar a lista inteira estoura o limite grátis
// do Groq em bibliotecas com mais de ~400 jogos.
const montarContexto = (jogos) => {
    if (jogos.length === 0) return 'Nenhum perfil carregado.';

    const porHoras = [...jogos].sort((a, b) => b.playtime_forever - a.playtime_forever);
    const nuncaJogados = porHoras.filter(j => j.playtime_forever === 0);
    const totalMinutos = jogos.reduce((soma, j) => soma + j.playtime_forever, 0);

    const maisJogados = porHoras
        .filter(j => j.playtime_forever > 0)
        .slice(0, 40)
        .map(j => `${j.name} (${formatarHoras(j.playtime_forever)})`)
        .join(', ');
    const amostraNuncaJogados = nuncaJogados.slice(0, 20).map(j => j.name).join(', ');

    return `Total: ${jogos.length} jogos, ${formatarHoras(totalMinutos)} jogadas no total, ${nuncaJogados.length} jogos NUNCA abertos.
    Mais jogados: ${maisJogados || 'nenhum'}.
    Alguns que ele comprou e nunca abriu: ${amostraNuncaJogados || 'nenhum'}.`.slice(0, MAX_CONTEXT_CHARS);
};

const promptDoSistema = (contexto) => `Você é a "SteamBB" (uma homenagem ao banco de dados SteamDB), uma IA não-oficial rodando num terminal Cyberpunk Dark Neo-Brutalista.
    Sua personalidade é ríspida, sarcástica, ácida e você é uma especialista veterana em jogos da Steam.
    NUNCA seja educada demais. NUNCA use frases clichês como "Olá, como posso ajudar?".
    Vá direto ao ponto com respostas curtas e impactantes. Fale sempre em português do Brasil.
    Contexto da biblioteca deste usuário: ${contexto}`;

const promptDoJogo = (jogo, conquistas) => {
    const horasJogadas = formatarHoras(jogo.playtime_forever);
    const pendentes = conquistas.filter(c => c.achieved === 0);
    const isPlatinado = conquistas.length > 0 && pendentes.length === 0;

    let conquistasTexto = 'Não há conquistas registadas para este jogo na base da Steam ou elas são privadas.';
    if (pendentes.length > 0) {
        const top5 = pendentes.slice(0, 5).map(c => `"${c.displayName}" (${c.description})`).join(' | ');
        conquistasTexto = `Ele tem ${conquistas.length - pendentes.length} de ${conquistas.length} conquistas. Conquistas BLOQUEADAS que ele não tem: ${top5}.`;
    } else if (isPlatinado) {
        conquistasTexto = 'O jogador já platinou este jogo. Ele tem 100% das conquistas.';
    }

    let contextoHoras;
    let comandoZombaria;
    let instrucaoFinal;

    if (jogo.playtime_forever === 0) {
        contextoHoras = 'O usuário comprou este jogo mas tem exatas 0.0 horas jogadas. Nunca sequer abriu.';
        comandoZombaria = 'Zombe severamente do fato dele ser um acumulador compulsivo que compra jogos para deixá-los apodrecendo na biblioteca sem nunca jogar.';
        instrucaoFinal = 'Pergunte, de forma arrogante, se ele clicou por acidente ou se finalmente vai tomar vergonha na cara para instalar o jogo.';
    } else if (isPlatinado) {
        contextoHoras = `O usuário já PLATINOU esse jogo (100% das conquistas) e gastou ${horasJogadas} da vida nisso.`;
        comandoZombaria = 'Zombe do fato dele ser um viciado sem vida social por ter platinado o jogo.';
        instrucaoFinal = 'Pergunte, de forma sarcástica, se ele veio aqui buscar uma medalha, inflar o próprio ego ou o que mais ele quer com um jogo que já zerou completamente. NÃO ofereça ajuda com conquistas.';
    } else if (jogo.playtime_forever < 120) {
        contextoHoras = `O usuário jogou míseras ${horasJogadas} e encostou o jogo.`;
        comandoZombaria = 'Zombe do fato de ele ter abandonado o jogo tão rápido. Diga que ele provavelmente não conseguiu passar do tutorial ou pediu reembolso.';
        instrucaoFinal = 'NÃO dê dicas de conquistas ainda! Apenas jogue na cara dele a falta de gameplay e pergunte se ele quer tomar coragem pra jogar ou precisa de ajuda pra platinar.';
    } else {
        contextoHoras = `O usuário já possui ${horasJogadas} da vida dele perdidas jogando isso.`;
        comandoZombaria = `Zombe severamente do fato de ele ter jogado incríveis ${horasJogadas} e AINDA ASSIM não ter capacidade para pegar as conquistas básicas.`;
        instrucaoFinal = 'NÃO dê dicas de conquistas ainda! Apenas jogue na cara dele o tempo perdido e pergunte, de forma arrogante, se ele finalmente quer ajuda para platinar isso.';
    }

    return `Você é a SteamBB. O usuário acabou de selecionar um jogo no painel. Siga o contexto abaixo rigorosamente:

    DADOS DA SELEÇÃO:
    - Título exato do Jogo: "${jogo.name}"
    - Situação do Tempo Jogado: ${contextoHoras}
    - Status das Conquistas: ${conquistasTexto}

    Sua tarefa agora:
    Escreva uma resposta curta e direta. ${comandoZombaria}
    ${instrucaoFinal}

    Atenção: Aja com naturalidade. O nome do jogo é literalmente "${jogo.name}", NÃO CONFUNDA o título com horas jogadas!
    REGRA MÁXIMA E ABSOLUTA: Responda EXCLUSIVAMENTE em Português do Brasil.`;
};

const promptDoValor = ({ total, desperdicio }) => `Você é a SteamBB. O painel acabou de calcular que o utilizador já gastou aproximadamente ${formatarReais(total)} na conta da Steam.
    Desse valor, ${formatarReais(desperdicio)} são de jogos que ele comprou e NUNCA abriu.

    Sua tarefa: Faça um comentário direto, brutal e sarcástico sobre esse valor financeiro.
    Regras de Zombaria baseada no valor:
    - Se for menos de R$ 200: Zombe dele por ser "pobre", forreta, jogar em PC fraco ou viver apenas de jogos gratuitos.
    - Se estiver entre R$ 200 e R$ 2000: Diga que é um valor medíocre, mas que ele já está no caminho da falência.
    - Se for mais de R$ 2000: Destrua-o moralmente. Diga que ele não tem vida social, aconselhe-o a pagar uma conta em atraso ou ir tocar em relva verdadeira.
    Se o dinheiro em jogos nunca abertos for alto, jogue isso na cara dele também.

    Atenção: Aja com extrema naturalidade. NUNCA use marcadores de texto (como [DICA] ou [ZOMBARIA]). Seja implacável e curta na resposta.
    REGRA MÁXIMA: Responda EXCLUSIVAMENTE em Português do Brasil.`;

// Extrai o texto de uma linha do streaming do Groq ("data: {...}")
const lerLinhaDoStream = (linha) => {
    if (!linha.startsWith('data: ')) return '';
    const payload = linha.slice(6).trim();
    if (payload === '[DONE]') return '';
    try {
        return JSON.parse(payload).choices?.[0]?.delta?.content || '';
    } catch {
        return '';
    }
};

// ---------- Rotas ----------

// 1. Rota de Status (o front chama ao abrir a página para "acordar" o servidor do Render)
app.get('/api/status', (req, res) => {
    res.json({ status: 'Servidor a correr com sucesso!', ip: req.ip });
});

// 2. Rota para descobrir o SteamID64 a partir do que a pessoa digitou
app.get('/api/resolve', async (req, res) => {
    try {
        const steamId = await resolverSteamId(req.query.q);
        if (!steamId) {
            return res.status(404).json({ error: 'Perfil não encontrado. Use o SteamID64, o link do perfil ou o nome personalizado da URL.' });
        }
        res.json({ steamId });
    } catch (error) {
        console.error('Erro ao resolver perfil:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar perfil.' });
    }
});

// 3. Rota para Buscar o Perfil
app.get('/api/profile/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
        if (!isValidSteamId(steamId)) {
            return res.status(400).json({ error: 'SteamID64 inválido. Ele deve ter 17 dígitos (ex: 76561197960435530).' });
        }
        const { data } = await axios.get(`${STEAM_API}/ISteamUser/GetPlayerSummaries/v0002/`, {
            params: { key: API_KEY, steamids: steamId }
        });
        const players = data.response.players;

        if (!players || players.length === 0) {
            return res.status(404).json({ error: 'Jogador não encontrado.' });
        }
        res.json(players[0]);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar perfil.' });
    }
});

// 4. Rota para Buscar a Biblioteca
app.get('/api/games/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
        if (!isValidSteamId(steamId)) {
            return res.status(400).json({ error: 'SteamID64 inválido.' });
        }
        const games = await buscarJogos(steamId);
        res.json({ game_count: games.length, games });
    } catch (error) {
        console.error('Erro ao buscar jogos:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar jogos.' });
    }
});

// 5. Rota para Buscar Conquistas COM NOMES E DESCRIÇÕES REAIS
app.get('/api/achievements/:steamId/:appId', async (req, res) => {
    const { steamId, appId } = req.params;
    if (!isValidSteamId(steamId) || !isValidAppId(appId)) {
        return res.status(400).json({ error: 'SteamID64 ou appId inválido.' });
    }
    const achievements = await buscarConquistas(steamId, appId);
    if (achievements.length === 0) {
        return res.status(400).json({ error: 'Sem conquistas para este jogo.' });
    }
    res.json({ achievements });
});

// 6. Rota de Preços em Lote (com cache e AUTO-RETRY PARA RATE LIMIT)
app.post('/api/prices', async (req, res) => {
    const { appIds } = req.body || {};
    if (!Array.isArray(appIds)) {
        return res.status(400).json({ error: 'Envie uma lista de appIds.' });
    }
    const ids = [...new Set(appIds.map(String))].filter(isValidAppId).slice(0, MAX_APPS_PER_REQUEST);
    res.json(await buscarPrecos(ids));
});

// 7. ROTA DE IA (STEAM_BB via GROQ, resposta em streaming)
app.post('/api/chat', limiteChat, async (req, res) => {
    const { messages = [], steamId, event } = req.body || {};

    if (!Array.isArray(messages)) {
        return res.status(400).json({ error: 'Histórico de mensagens inválido.' });
    }
    if (steamId !== undefined && !isValidSteamId(steamId)) {
        return res.status(400).json({ error: 'SteamID64 inválido.' });
    }

    // Só aceita papéis user/assistant vindos do navegador e manda apenas as últimas mensagens,
    // senão o histórico cresce a cada pergunta até estourar o limite de tokens do Groq
    const history = messages
        .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
        .map(msg => ({ role: msg.role, content: msg.content.slice(0, MAX_MESSAGE_CHARS) }))
        .slice(-MAX_HISTORY_MESSAGES);

    let jogos = [];
    if (steamId) {
        try {
            jogos = await buscarJogos(steamId);
        } catch (error) {
            console.error('Erro ao buscar jogos para a IA:', error.message);
        }
    }

    // Os prompts de zombaria são montados aqui, e não no navegador, para ninguém
    // conseguir mandar instruções próprias como se fossem do painel
    if (event?.type === 'game') {
        const jogo = jogos.find(j => String(j.appid) === String(event.appId));
        if (!jogo) {
            return res.status(400).json({ error: 'Jogo não encontrado na biblioteca.' });
        }
        const conquistas = await buscarConquistas(steamId, jogo.appid);
        history.push({ role: 'user', content: promptDoJogo(jogo, conquistas) });
    } else if (event?.type === 'value') {
        const total = Number(event.total);
        const desperdicio = Number(event.wasted);
        if (!Number.isFinite(total) || !Number.isFinite(desperdicio) || total < 0 || desperdicio < 0) {
            return res.status(400).json({ error: 'Valor da conta inválido.' });
        }
        history.push({ role: 'user', content: promptDoValor({ total, desperdicio }) });
    } else if (history.length === 0 || history[history.length - 1].role !== 'user') {
        return res.status(400).json({ error: 'Histórico de mensagens vazio.' });
    }

    const controller = new AbortController();
    res.on('close', () => controller.abort());

    let groqResponse;
    try {
        groqResponse = await axios.post(GROQ_URL, {
            model: GROQ_MODEL,
            messages: [{ role: 'system', content: promptDoSistema(montarContexto(jogos)) }, ...history],
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
            // Os modelos gpt-oss "pensam" antes de responder; esforço baixo = resposta rápida
            ...(GROQ_MODEL.startsWith('openai/gpt-oss') && { reasoning_effort: 'low' })
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream',
            signal: controller.signal
        });
    } catch (error) {
        const status = error.response?.status;
        console.error('Erro na IA do Groq:', status || error.message);
        if (status === 429 || status === 413) {
            return res.status(429).json({ error: 'A STEAM_BB ESTÁ SOBRECARREGADA (LIMITE DO GROQ). ESPERE UM MINUTO E TENTE DE NOVO.' });
        }
        return res.status(500).json({ error: 'ERRO: CONEXÃO COM O CÉREBRO DA STEAM_BB PERDIDA.' });
    }

    // Repassa o texto para o navegador conforme o Groq vai gerando
    res.set({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();

    const stream = groqResponse.data;
    stream.setEncoding('utf8');
    let buffer = '';
    let escreveuAlgo = false;

    stream.on('data', (chunk) => {
        buffer += chunk;
        const linhas = buffer.split('\n');
        buffer = linhas.pop();
        for (const linha of linhas) {
            const texto = lerLinhaDoStream(linha);
            if (texto) {
                res.write(texto);
                escreveuAlgo = true;
            }
        }
    });
    stream.on('end', () => {
        res.end(escreveuAlgo ? '' : 'A STEAM_BB FICOU SEM PALAVRAS. TENTE DE NOVO.');
    });
    stream.on('error', (error) => {
        if (controller.signal.aborted) return;
        console.error('Streaming do Groq caiu:', error.message);
        res.end('\n[ERRO: A CONEXÃO CAIU NO MEIO DA RESPOSTA]');
    });
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

// Exporta o app para os testes; só abre a porta quando roda com "node server.js"
module.exports = { app, cachePrecos, cacheJogos };

if (require.main === module) {
    const PORT = process.env.PORT || 3001;

    // No Express 5, erros ao abrir a porta (ex: porta já em uso) chegam neste callback
    app.listen(PORT, (error) => {
        if (error) throw error;
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}
