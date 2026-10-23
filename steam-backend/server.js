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

// Modelos da IA no Groq, em ordem de preferência. Configuráveis porque o Groq aposenta modelos
// com frequência (o llama-3.1-8b-instant foi removido). Lista atual: https://console.groq.com/docs/models
// O limite de tokens por minuto do Groq é separado por modelo: quando o principal lota, o reserva assume.
const GROQ_MODELS = [
    process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b'
].filter((modelo, i, lista) => modelo && lista.indexOf(modelo) === i);

// Respostas curtas que começam assim são a IA se recusando a responder
const RECUSA = /^\W*(desculp|sinto muito|lamento|infelizmente,? n[ãa]o|n[ãa]o posso|i'?m sorry|sorry|i can'?t)/i;
const TAMANHO_MAX_RECUSA = 200;

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
const cacheRecentes = criarCache(10 * 60 * 1000, 1000);
const cacheQuasePlatinados = criarCache(30 * 60 * 1000, 500);

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

// Jogos abertos nas últimas 2 semanas (playtime_2weeks em minutos)
const buscarRecentes = async (steamId) => {
    const emCache = cacheRecentes.get(steamId);
    if (emCache) return emCache;

    const { data } = await axios.get(`${STEAM_API}/IPlayerService/GetRecentlyPlayedGames/v0001/`, {
        params: { key: API_KEY, steamid: steamId, count: 0 }
    });
    const recentes = (data.response?.games || [])
        .map(({ appid, name, playtime_2weeks, playtime_forever }) => ({ appid, name, playtime_2weeks, playtime_forever }))
        .sort((a, b) => b.playtime_2weeks - a.playtime_2weeks);
    cacheRecentes.set(steamId, recentes);
    return recentes;
};

const buscarPerfis = async (steamIds) => {
    const { data } = await axios.get(`${STEAM_API}/ISteamUser/GetPlayerSummaries/v0002/`, {
        params: { key: API_KEY, steamids: steamIds.join(',') }
    });
    return data.response?.players || [];
};

// Executa as tarefas com no máximo "limite" rodando ao mesmo tempo (para não martelar a Steam)
const emParalelo = async (itens, limite, tarefa) => {
    const resultados = new Array(itens.length);
    let proximo = 0;
    const trabalhador = async () => {
        while (proximo < itens.length) {
            const i = proximo++;
            resultados[i] = await tarefa(itens[i]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
    return resultados;
};

// Varre as conquistas dos jogos mais jogados e separa os que estão perto dos 100%
const QUASE_JOGOS_ANALISADOS = 30;
const QUASE_PORCENTAGEM_MINIMA = 0.6;

const buscarQuasePlatinados = async (steamId) => {
    const emCache = cacheQuasePlatinados.get(steamId);
    if (emCache) return emCache;

    const jogos = (await buscarJogos(steamId))
        .filter(j => j.playtime_forever > 0)
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .slice(0, QUASE_JOGOS_ANALISADOS);

    const progresso = await emParalelo(jogos, 6, async (jogo) => {
        try {
            const { data } = await axios.get(`${STEAM_API}/ISteamUserStats/GetPlayerAchievements/v0001/`, {
                params: { appid: jogo.appid, key: API_KEY, steamid: steamId }
            });
            const conquistas = data.playerstats?.achievements || [];
            if (conquistas.length === 0) return null;
            const feitas = conquistas.filter(c => c.achieved === 1).length;
            return { appid: jogo.appid, name: jogo.name, playtime_forever: jogo.playtime_forever, feitas, total: conquistas.length };
        } catch {
            // Jogo sem conquistas ou com estatísticas privadas
            return null;
        }
    });

    const comConquistas = progresso.filter(Boolean);
    const resultado = {
        analisados: comConquistas.length,
        platinados: comConquistas.filter(p => p.feitas === p.total).length,
        quase: comConquistas
            .filter(p => p.feitas < p.total && p.feitas / p.total >= QUASE_PORCENTAGEM_MINIMA)
            .sort((a, b) => (a.total - a.feitas) - (b.total - b.feitas) || b.feitas / b.total - a.feitas / a.total)
            .slice(0, 8)
    };
    cacheQuasePlatinados.set(steamId, resultado);
    return resultado;
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
const resumirJogos = (jogos) => {
    const porHoras = [...jogos].sort((a, b) => b.playtime_forever - a.playtime_forever);
    return {
        porHoras,
        nuncaJogados: porHoras.filter(j => j.playtime_forever === 0),
        totalMinutos: jogos.reduce((soma, j) => soma + j.playtime_forever, 0),
    };
};

const montarContexto = (jogos, recentes = []) => {
    if (jogos.length === 0) return 'Nenhum perfil carregado.';

    const { porHoras, nuncaJogados, totalMinutos } = resumirJogos(jogos);
    const maisJogados = porHoras
        .filter(j => j.playtime_forever > 0)
        .slice(0, 40)
        .map(j => `${j.name} (${formatarHoras(j.playtime_forever)})`)
        .join(', ');
    const amostraNuncaJogados = nuncaJogados.slice(0, 20).map(j => j.name).join(', ');
    const ultimasSemanas = recentes.map(j => `${j.name} (${formatarHoras(j.playtime_2weeks)})`).join(', ');

    return `Total: ${jogos.length} jogos, ${formatarHoras(totalMinutos)} jogadas no total, ${nuncaJogados.length} jogos NUNCA abertos.
    Jogados nas últimas 2 semanas: ${ultimasSemanas || 'nenhum (não abriu a Steam nas últimas 2 semanas)'}.
    Mais jogados: ${maisJogados || 'nenhum'}.
    Alguns que ele comprou e nunca abriu: ${amostraNuncaJogados || 'nenhum'}.`.slice(0, MAX_CONTEXT_CHARS);
};

const fichaDoDuelo = (nome, jogos) => {
    const { porHoras, nuncaJogados, totalMinutos } = resumirJogos(jogos);
    const vicio = porHoras[0];
    const porcentagem = jogos.length ? Math.round((nuncaJogados.length / jogos.length) * 100) : 0;
    return `- ${nome}: ${jogos.length} jogos, ${formatarHoras(totalMinutos)} jogadas, ${nuncaJogados.length} jogos nunca abertos (${porcentagem}% da biblioteca). Maior vício: ${vicio ? `${vicio.name} (${formatarHoras(vicio.playtime_forever)})` : 'nenhum'}. Top 5: ${porHoras.slice(0, 5).map(j => j.name).join(', ') || 'nenhum'}.`;
};

const promptDoDuelo = (desafiante, rival) => `Você é a SteamBB. O usuário desafiou um amigo para um DUELO de bibliotecas Steam, e os dois querem ser zoados.
    ${fichaDoDuelo(desafiante.nome, desafiante.jogos)}
    ${fichaDoDuelo(rival.nome, rival.jogos)}

    Sua tarefa: Compare os dois como um juiz de stand-up debochado. Zoe os hábitos de jogo de cada um (acumular jogos sem abrir, horas demais no mesmo jogo, gosto duvidoso).
    No final, declare em uma linha separada quem é o PIOR GAMER do duelo, no formato: "VEREDITO: <nome> PERDEU."
    Zoe só os hábitos de jogo, nunca a aparência ou a vida pessoal. Seja curta, no máximo um parágrafo antes do veredito.
    REGRA MÁXIMA: Responda EXCLUSIVAMENTE em Português do Brasil.`;

const promptDoSistema = (contexto) => `Você é a "SteamBB" (uma homenagem ao banco de dados SteamDB), uma IA não-oficial rodando num terminal Cyberpunk Dark Neo-Brutalista.
    Sua personalidade é ríspida, sarcástica, ácida e você é uma especialista veterana em jogos da Steam.
    NUNCA seja educada demais. NUNCA use frases clichês como "Olá, como posso ajudar?".
    Vá direto ao ponto com respostas curtas e impactantes. Fale sempre em português do Brasil.
    Este é um painel de humor: o usuário abriu o site justamente para ser zoado pelos próprios hábitos de jogo (um "roast" consentido, como entre amigos).
    Zoe com sarcasmo os gastos, as horas jogadas e as escolhas de jogos dele, sem ofensas pessoais, palavrões pesados ou preconceito.
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

// Escrito como "roast" de comédia sobre os gastos: a versão que mandava "destruir moralmente"
// e chamar de "pobre" fazia o gpt-oss recusar (~30% das vezes) com "Desculpe, não posso atender"
const promptDoValor = ({ total, desperdicio }) => `Você é a SteamBB. O painel acabou de calcular que a biblioteca Steam do usuário vale aproximadamente ${formatarReais(total)} (preço cheio atual da loja).
    Desse valor, ${formatarReais(desperdicio)} são de jogos que ele comprou e NUNCA abriu.

    Sua tarefa: Faça um "roast" curto, debochado e sarcástico sobre esses gastos, como um comediante de stand-up zoando um amigo gamer.
    Tom de acordo com o valor:
    - Menos de R$ 200: Brinque que ele é mão de vaca, vive de jogo grátis e só compra em promoção de R$ 2,99.
    - Entre R$ 200 e R$ 2000: Diga que é um valor medíocre, mas que ele já está no caminho de virar um colecionador compulsivo.
    - Mais de R$ 2000: Exagere no drama. Compare o valor com algo concreto e engraçado que daria para comprar com esse dinheiro e mande ele sair de casa e tocar grama.
    Se o dinheiro em jogos nunca abertos for alto, jogue isso na cara dele também.
    Zoe os hábitos de compra e de jogo, nunca a renda, a aparência ou a vida pessoal dele.

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

// 6. Rota dos Jogos das Últimas 2 Semanas
app.get('/api/recent/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
        if (!isValidSteamId(steamId)) {
            return res.status(400).json({ error: 'SteamID64 inválido.' });
        }
        res.json({ games: await buscarRecentes(steamId) });
    } catch (error) {
        console.error('Erro ao buscar jogos recentes:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar jogos recentes.' });
    }
});

// 7. Rota dos Quase Platinados (varre as conquistas dos jogos mais jogados)
app.get('/api/almost/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
        if (!isValidSteamId(steamId)) {
            return res.status(400).json({ error: 'SteamID64 inválido.' });
        }
        res.json(await buscarQuasePlatinados(steamId));
    } catch (error) {
        console.error('Erro ao buscar quase platinados:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar conquistas.' });
    }
});

// 8. Rota de Preços em Lote (com cache e AUTO-RETRY PARA RATE LIMIT)
app.post('/api/prices', async (req, res) => {
    const { appIds } = req.body || {};
    if (!Array.isArray(appIds)) {
        return res.status(400).json({ error: 'Envie uma lista de appIds.' });
    }
    const ids = [...new Set(appIds.map(String))].filter(isValidAppId).slice(0, MAX_APPS_PER_REQUEST);
    res.json(await buscarPrecos(ids));
});

const abrirStreamDoGroq = async (modelo, mensagens, signal) => {
    const { data } = await axios.post(GROQ_URL, {
        model: modelo,
        messages: mensagens,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
        // Os modelos gpt-oss "pensam" antes de responder; esforço baixo = resposta rápida
        ...(modelo.startsWith('openai/gpt-oss') && { reasoning_effort: 'low' })
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        responseType: 'stream',
        signal
    });
    return data;
};

// Transforma o streaming do Groq (linhas "data: {...}") em pedaços de texto
async function* textoDoStream(stream) {
    stream.setEncoding('utf8');
    let buffer = '';
    for await (const chunk of stream) {
        buffer += chunk;
        const linhas = buffer.split('\n');
        buffer = linhas.pop();
        for (const linha of linhas) {
            const texto = lerLinhaDoStream(linha);
            if (texto) yield texto;
        }
    }
}

const iniciarResposta = (res) => {
    if (res.headersSent) return;
    res.set({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
};

// Tenta os modelos em ordem. Troca de modelo se o Groq der erro (limite, modelo removido) ou se a
// IA recusar. Para detectar a recusa, o começo da resposta fica guardado até passar de
// TAMANHO_MAX_RECUSA caracteres; depois disso o texto vai direto para o navegador.
const responderComIA = async (res, mensagens, signal) => {
    const tentativas = GROQ_MODELS.length > 1 ? GROQ_MODELS : [GROQ_MODELS[0], GROQ_MODELS[0]];
    let ultimoErro;

    for (const [indice, modelo] of tentativas.entries()) {
        const ultimaTentativa = indice === tentativas.length - 1;
        let guardado = '';
        let liberado = false;

        try {
            const stream = await abrirStreamDoGroq(modelo, mensagens, signal);
            for await (const texto of textoDoStream(stream)) {
                if (liberado) {
                    res.write(texto);
                    continue;
                }
                guardado += texto;
                if (guardado.length > TAMANHO_MAX_RECUSA) {
                    iniciarResposta(res);
                    res.write(guardado);
                    liberado = true;
                }
            }
        } catch (error) {
            if (signal.aborted) return;
            if (liberado) {
                console.error('Streaming do Groq caiu:', error.message);
                return res.end('\n[ERRO: A CONEXÃO CAIU NO MEIO DA RESPOSTA]');
            }
            ultimoErro = error;
            console.error(`Erro na IA do Groq (${modelo}):`, error.response?.status || error.message);
            continue;
        }

        if (liberado) return res.end();
        if (RECUSA.test(guardado.trim()) && !ultimaTentativa) {
            console.log(`[STEAM_BB AVISO]: ${modelo} recusou a resposta. Tentando de novo...`);
            continue;
        }
        iniciarResposta(res);
        return res.end(guardado || 'A STEAM_BB FICOU SEM PALAVRAS. TENTE DE NOVO.');
    }

    // Nenhum modelo conseguiu nem começar a responder
    const status = ultimoErro?.response?.status;
    if (status === 429 || status === 413) {
        return res.status(429).json({ error: 'A STEAM_BB ESTÁ SOBRECARREGADA (LIMITE DO GROQ). ESPERE UM MINUTO E TENTE DE NOVO.' });
    }
    res.status(500).json({ error: 'ERRO: CONEXÃO COM O CÉREBRO DA STEAM_BB PERDIDA.' });
};

// 9. ROTA DE IA (STEAM_BB via GROQ, resposta em streaming)
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
    let recentes = [];
    if (steamId) {
        const [resultadoJogos, resultadoRecentes] = await Promise.allSettled([buscarJogos(steamId), buscarRecentes(steamId)]);
        if (resultadoJogos.status === 'fulfilled') jogos = resultadoJogos.value;
        else console.error('Erro ao buscar jogos para a IA:', resultadoJogos.reason.message);
        if (resultadoRecentes.status === 'fulfilled') recentes = resultadoRecentes.value;
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
    } else if (event?.type === 'duel') {
        const rivalId = event.rivalId;
        if (!steamId || !isValidSteamId(rivalId) || rivalId === steamId) {
            return res.status(400).json({ error: 'Duelo inválido: escolha outro perfil para desafiar.' });
        }
        let perfis;
        let jogosRival;
        try {
            [perfis, jogosRival] = await Promise.all([buscarPerfis([steamId, rivalId]), buscarJogos(rivalId)]);
        } catch (error) {
            console.error('Erro ao montar o duelo:', error.message);
            return res.status(500).json({ error: 'Erro ao buscar os dados do duelo.' });
        }
        const nome = (id) => perfis.find(p => p.steamid === id)?.personaname || 'Anônimo';
        history.push({
            role: 'user',
            content: promptDoDuelo({ nome: nome(steamId), jogos }, { nome: nome(rivalId), jogos: jogosRival })
        });
    } else if (history.length === 0 || history[history.length - 1].role !== 'user') {
        return res.status(400).json({ error: 'Histórico de mensagens vazio.' });
    }

    const controller = new AbortController();
    res.on('close', () => controller.abort());

    const mensagens = [{ role: 'system', content: promptDoSistema(montarContexto(jogos, recentes)) }, ...history];
    await responderComIA(res, mensagens, controller.signal);
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
module.exports = { app, cachePrecos, cacheJogos, cacheRecentes, cacheQuasePlatinados, promptDoSistema, promptDoValor, promptDoJogo, promptDoDuelo };

if (require.main === module) {
    const PORT = process.env.PORT || 3001;

    // No Express 5, erros ao abrir a porta (ex: porta já em uso) chegam neste callback
    app.listen(PORT, (error) => {
        if (error) throw error;
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}
