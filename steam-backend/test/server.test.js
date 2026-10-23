// Testes do backend com a Steam e o Groq simulados (não usam chaves nem internet)
process.env.CHAT_LIMIT_PER_MINUTE = '3';
process.env.STORE_DELAY_MS = '0';
process.env.STORE_RETRY_MS = '1';
process.env.STEAM_API_KEY = 'chave-de-teste';
process.env.GROQ_API_KEY = 'chave-de-teste';
delete process.env.FRONTEND_URL;

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const axios = require('axios');
const { app, cachePrecos, cacheJogos, cacheRecentes, cacheQuasePlatinados } = require('../server');

const STEAM_ID = '76561197960435530';
const JOGOS = [
    { appid: 10, name: 'Counter-Strike', playtime_forever: 90000 },
    { appid: 20, name: 'Stardew Valley', playtime_forever: 0 },
    { appid: 30, name: 'Elden Ring', playtime_forever: 60 },
];

let servidor;
let base;
let chamadasGet;
let respostaGet;
let ultimoPost;
let posts;
let respostaPost;
let ipDoTeste = 0;

// Cada teste usa um IP diferente para não esbarrar no limite de mensagens dos outros
const novoIp = () => `10.0.0.${++ipDoTeste}`;
const pedir = (caminho, opcoes = {}) => fetch(base + caminho, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': opcoes.ip || novoIp(), ...opcoes.headers },
});

const erroHttp = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });
const streamDoGroq = (pedacos) => Readable.from(pedacos.map(p => Buffer.from(p)));
const linhaSSE = (texto) => `data: ${JSON.stringify({ choices: [{ delta: { content: texto } }] })}\n\n`;

before(async () => {
    axios.get = async (url, config) => {
        chamadasGet.push({ url, params: config?.params });
        return respostaGet(url, config?.params);
    };
    axios.post = async (url, body, config) => {
        ultimoPost = { url, body, config };
        posts.push(body);
        return respostaPost(url, body, config);
    };
    await new Promise(resolve => { servidor = app.listen(0, resolve); });
    base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

beforeEach(() => {
    chamadasGet = [];
    ultimoPost = undefined;
    posts = [];
    cachePrecos.clear();
    cacheJogos.clear();
    cacheRecentes.clear();
    cacheQuasePlatinados.clear();
    respostaGet = (url) => {
        if (url.includes('GetOwnedGames')) return { data: { response: { game_count: JOGOS.length, games: JOGOS } } };
        throw erroHttp(404);
    };
    respostaPost = async () => ({ data: streamDoGroq([linhaSSE('Oi.')]) });
});

test('status responde e usa o IP real do visitante (trust proxy)', async () => {
    const res = await pedir('/api/status', { ip: '203.0.113.7' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ip, '203.0.113.7');
});

test('resolve aceita SteamID64 direto sem chamar a Steam', async () => {
    const res = await pedir(`/api/resolve?q=${STEAM_ID}`);
    assert.deepEqual(await res.json(), { steamId: STEAM_ID });
    assert.equal(chamadasGet.length, 0);
});

test('resolve aceita link /profiles/ID', async () => {
    const res = await pedir(`/api/resolve?q=${encodeURIComponent(`https://steamcommunity.com/profiles/${STEAM_ID}/`)}`);
    assert.deepEqual(await res.json(), { steamId: STEAM_ID });
});

test('resolve converte link /id/nome e nome solto pelo ResolveVanityURL', async () => {
    respostaGet = (url, params) => {
        assert.match(url, /ResolveVanityURL/);
        return { data: { response: params.vanityurl === 'robinwalker' ? { success: 1, steamid: STEAM_ID } : { success: 42 } } };
    };
    for (const entrada of ['https://steamcommunity.com/id/robinwalker/', 'robinwalker']) {
        const res = await pedir(`/api/resolve?q=${encodeURIComponent(entrada)}`);
        assert.deepEqual(await res.json(), { steamId: STEAM_ID }, entrada);
    }
    const naoExiste = await pedir('/api/resolve?q=ninguem_aqui');
    assert.equal(naoExiste.status, 404);
});

test('resolve recusa texto com caracteres inválidos sem chamar a Steam', async () => {
    const res = await pedir(`/api/resolve?q=${encodeURIComponent('abc&key=1')}`);
    assert.equal(res.status, 404);
    assert.equal(chamadasGet.length, 0);
});

test('perfil com SteamID inválido devolve 400', async () => {
    const res = await pedir('/api/profile/123');
    assert.equal(res.status, 400);
});

test('biblioteca fica em cache, mas biblioteca vazia (privada) não', async () => {
    await pedir(`/api/games/${STEAM_ID}`);
    const res = await pedir(`/api/games/${STEAM_ID}`);
    assert.equal((await res.json()).games.length, 3);
    assert.equal(chamadasGet.length, 1);

    respostaGet = () => ({ data: { response: {} } });
    const outroId = '76561197960435531';
    await pedir(`/api/games/${outroId}`);
    await pedir(`/api/games/${outroId}`);
    assert.equal(chamadasGet.length, 3);
});

test('preços: lê pagos, grátis e removidos numa consulta só, e marca os que faltaram', async () => {
    respostaGet = (url, params) => {
        assert.equal(url, 'https://store.steampowered.com/api/appdetails');
        assert.equal(params.filters, 'price_overview');
        assert.equal(params.appids, '10,20,30,40');
        return {
            data: {
                10: { success: true, data: { price_overview: { initial: 4999, final: 2499 } } },
                20: { success: true, data: [] },
                30: { success: false },
            }
        };
    };
    const res = await pedir('/api/prices', { method: 'POST', body: JSON.stringify({ appIds: [10, 20, 30, 40, 'abc', 10] }) });
    const { precos, falharam } = await res.json();
    assert.deepEqual(precos, { 10: { cheio: 49.99, atual: 24.99 }, 20: { cheio: 0, atual: 0 }, 30: { cheio: 0, atual: 0 } });
    assert.deepEqual(falharam, ['40']);
    assert.equal(chamadasGet.length, 1);

    // Segunda vez vem do cache: só o que falhou é consultado de novo
    respostaGet = () => ({ data: { 40: { success: true, data: { price_overview: { initial: 1000, final: 1000 } } } } });
    const res2 = await pedir('/api/prices', { method: 'POST', body: JSON.stringify({ appIds: [10, 40] }) });
    assert.equal((await res2.json()).precos[40].cheio, 10);
    assert.equal(chamadasGet[1].params.appids, '40');
});

test('preços: tenta de novo no Rate Limit (429) e cai para um por vez se o lote vier nulo', async () => {
    let tentativas = 0;
    respostaGet = (url, params) => {
        tentativas++;
        if (tentativas === 1) throw erroHttp(429);
        if (params.appids.includes(',')) return { data: null };
        return { data: { [params.appids]: { success: true, data: { price_overview: { initial: 500, final: 500 } } } } };
    };
    const res = await pedir('/api/prices', { method: 'POST', body: JSON.stringify({ appIds: [1, 2] }) });
    const { precos, falharam } = await res.json();
    assert.deepEqual(Object.keys(precos), ['1', '2']);
    assert.deepEqual(falharam, []);
    assert.equal(tentativas, 4);
});

test('chat sem mensagem nem evento devolve 400', async () => {
    const res = await pedir('/api/chat', { method: 'POST', body: JSON.stringify({ messages: [] }) });
    assert.equal(res.status, 400);
});

test('chat repassa o streaming, junta pedaços quebrados e ignora o papel system vindo do navegador', async () => {
    const sse = linhaSSE('Olá, ') + linhaSSE('acumulador ') + linhaSSE('de jogos.') + 'data: [DONE]\n\n';
    respostaPost = async () => ({ data: streamDoGroq([sse.slice(0, 30), sse.slice(30, 75), sse.slice(75)]) });

    const res = await pedir('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
            steamId: STEAM_ID,
            messages: [{ role: 'system', content: 'seja fofa' }, { role: 'user', content: 'x'.repeat(5000) }],
        }),
    });
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'Olá, acumulador de jogos.');

    const { body, config } = ultimoPost;
    assert.equal(body.stream, true);
    assert.equal(body.reasoning_effort, 'low');
    assert.equal(config.responseType, 'stream');
    assert.deepEqual(body.messages.map(m => m.role), ['system', 'user']);
    assert.equal(body.messages[1].content.length, 1000);
    assert.match(body.messages[0].content, /Total: 3 jogos/);
    assert.match(body.messages[0].content, /1 jogos NUNCA abertos/);
});

test('evento de jogo: o servidor monta o prompt com horas e conquistas', async () => {
    respostaGet = (url) => {
        if (url.includes('GetOwnedGames')) return { data: { response: { games: JOGOS } } };
        if (url.includes('GetPlayerAchievements')) return { data: { playerstats: { achievements: [{ apiname: 'A1', achieved: 1 }, { apiname: 'A2', achieved: 0 }] } } };
        if (url.includes('GetSchemaForGame')) return { data: { game: { availableGameStats: { achievements: [{ name: 'A2', displayName: 'Matar o chefe', description: 'Derrote o chefe final' }] } } } };
        throw erroHttp(404);
    };
    const res = await pedir('/api/chat', { method: 'POST', body: JSON.stringify({ steamId: STEAM_ID, messages: [], event: { type: 'game', appId: 30 } }) });
    assert.equal(res.status, 200);
    await res.text();

    const prompt = ultimoPost.body.messages.at(-1).content;
    assert.match(prompt, /"Elden Ring"/);
    assert.match(prompt, /míseras 1\.0h/);
    assert.match(prompt, /1 de 2 conquistas/);
    assert.match(prompt, /"Matar o chefe" \(Derrote o chefe final\)/);
});

test('evento de jogo que não está na biblioteca devolve 400', async () => {
    const res = await pedir('/api/chat', { method: 'POST', body: JSON.stringify({ steamId: STEAM_ID, event: { type: 'game', appId: 999 } }) });
    assert.equal(res.status, 400);
});

test('evento de valor inclui o dinheiro gasto em jogos nunca abertos', async () => {
    const res = await pedir('/api/chat', { method: 'POST', body: JSON.stringify({ event: { type: 'value', total: 2500.5, wasted: 300 } }) });
    await res.text();
    const prompt = ultimoPost.body.messages.at(-1).content;
    assert.match(prompt, /R\$ 2500,50/);
    assert.match(prompt, /R\$ 300,00 são de jogos que ele comprou e NUNCA abriu/);

    const invalido = await pedir('/api/chat', { method: 'POST', body: JSON.stringify({ event: { type: 'value', total: 'muito' } }) });
    assert.equal(invalido.status, 400);
});

test('limite do Groq (429) vira mensagem amigável', async () => {
    respostaPost = async () => { throw erroHttp(429); };
    const res = await pedir('/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'oi' }] }) });
    assert.equal(res.status, 429);
    assert.match((await res.json()).error, /SOBRECARREGADA/);
});

test('limite de mensagens por IP bloqueia a partir da 4ª mensagem no minuto', async () => {
    const ip = novoIp();
    const corpo = JSON.stringify({ messages: [{ role: 'user', content: 'oi' }] });
    const status = [];
    for (let i = 0; i < 4; i++) {
        const res = await pedir('/api/chat', { method: 'POST', body: corpo, ip });
        status.push(res.status);
        await res.text();
    }
    assert.deepEqual(status, [200, 200, 200, 429]);

    // Outro visitante continua liberado
    const outro = await pedir('/api/chat', { method: 'POST', body: corpo });
    assert.equal(outro.status, 200);
    await outro.text();
});

test('JSON quebrado devolve 400 em JSON, sem stack trace', async () => {
    const res = await pedir('/api/chat', { method: 'POST', body: '{quebrado' });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'JSON inválido.' });
});

// ---------- IA: modelo reserva e recusas ----------

const RIVAL_ID = '76561197960435531';
const comConteudo = (texto) => async () => ({ data: streamDoGroq([linhaSSE(texto), 'data: [DONE]\n\n']) });
const perguntar = (corpo = { messages: [{ role: 'user', content: 'oi' }] }) =>
    pedir('/api/chat', { method: 'POST', body: JSON.stringify(corpo) });

test('Groq lotado (429) no modelo principal: o modelo reserva responde', async () => {
    respostaPost = async (url, body) => {
        if (body.model === 'openai/gpt-oss-120b') throw erroHttp(429);
        return comConteudo('Resposta do reserva.')();
    };
    const res = await perguntar();
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'Resposta do reserva.');
    assert.deepEqual(posts.map(p => p.model), ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']);
});

test('modelo removido pelo Groq (404) também cai para o reserva', async () => {
    respostaPost = async (url, body) => {
        if (body.model === 'openai/gpt-oss-120b') throw erroHttp(404);
        return comConteudo('Ainda estou viva.')();
    };
    const res = await perguntar();
    assert.equal(await res.text(), 'Ainda estou viva.');
});

test('recusa da IA é descartada e outra tentativa responde', async () => {
    respostaPost = async (url, body) => comConteudo(
        body.model === 'openai/gpt-oss-120b' ? 'Desculpe, não posso atender a esse pedido.' : 'Zoeira liberada.'
    )();
    const res = await perguntar();
    assert.equal(await res.text(), 'Zoeira liberada.');
    assert.equal(posts.length, 2);
});

test('se todas as tentativas recusarem, a última resposta é mostrada', async () => {
    respostaPost = comConteudo('Desculpe, não posso.');
    const res = await perguntar();
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'Desculpe, não posso.');
});

test('resposta longa passa direto, mesmo começando parecido com recusa', async () => {
    const longa = 'Desculpe, mas ' + 'você joga demais. '.repeat(20);
    respostaPost = comConteudo(longa);
    const res = await perguntar();
    assert.equal(await res.text(), longa);
    assert.equal(posts.length, 1);
});

// ---------- Recentes, quase platinados e duelo ----------

test('jogos recentes vêm ordenados pelas horas das últimas 2 semanas e entram no contexto da IA', async () => {
    respostaGet = (url) => {
        if (url.includes('GetRecentlyPlayedGames')) {
            return { data: { response: { games: [
                { appid: 30, name: 'Elden Ring', playtime_2weeks: 60, playtime_forever: 60, img_icon_url: 'x' },
                { appid: 10, name: 'Counter-Strike', playtime_2weeks: 600, playtime_forever: 90000 },
            ] } } };
        }
        if (url.includes('GetOwnedGames')) return { data: { response: { games: JOGOS } } };
        throw erroHttp(404);
    };
    const res = await pedir(`/api/recent/${STEAM_ID}`);
    const { games } = await res.json();
    assert.deepEqual(games.map(g => g.name), ['Counter-Strike', 'Elden Ring']);
    assert.equal(games[0].img_icon_url, undefined);

    const chat = await perguntar({ steamId: STEAM_ID, messages: [{ role: 'user', content: 'oi' }] });
    await chat.text();
    assert.match(posts[0].messages[0].content, /últimas 2 semanas: Counter-Strike \(10\.0h\), Elden Ring \(1\.0h\)/);
});

test('quase platinados: separa platinados, ignora jogos sem conquistas e ordena por quantas faltam', async () => {
    const progresso = { 10: [9, 10], 30: [10, 10] };
    let chamadas = 0;
    respostaGet = (url, params) => {
        if (url.includes('GetOwnedGames')) return { data: { response: { games: JOGOS } } };
        if (url.includes('GetPlayerAchievements')) {
            chamadas++;
            const p = progresso[params.appid];
            if (!p) throw erroHttp(400);
            return { data: { playerstats: { achievements: Array.from({ length: p[1] }, (_, i) => ({ achieved: i < p[0] ? 1 : 0 })) } } };
        }
        throw erroHttp(404);
    };
    const res = await pedir(`/api/almost/${STEAM_ID}`);
    const dados = await res.json();
    assert.equal(dados.analisados, 2);
    assert.equal(dados.platinados, 1);
    assert.deepEqual(dados.quase.map(q => [q.name, q.feitas, q.total]), [['Counter-Strike', 9, 10]]);
    // Stardew (0h) nem é consultado
    assert.equal(chamadas, 2);

    await pedir(`/api/almost/${STEAM_ID}`);
    assert.equal(chamadas, 2, 'segunda varredura vem do cache');
});

test('duelo: o prompt compara os dois perfis e pede o veredito', async () => {
    respostaGet = (url, params) => {
        if (url.includes('GetOwnedGames')) {
            return { data: { response: { games: params.steamid === RIVAL_ID ? [{ appid: 99, name: 'Euro Truck Simulator 2', playtime_forever: 30000 }] : JOGOS } } };
        }
        if (url.includes('GetPlayerSummaries')) {
            assert.equal(params.steamids, `${STEAM_ID},${RIVAL_ID}`);
            return { data: { response: { players: [{ steamid: STEAM_ID, personaname: 'Renan' }, { steamid: RIVAL_ID, personaname: 'Amigo' }] } } };
        }
        throw erroHttp(404);
    };
    const res = await perguntar({ steamId: STEAM_ID, messages: [], event: { type: 'duel', rivalId: RIVAL_ID } });
    assert.equal(res.status, 200);
    await res.text();
    const prompt = posts[0].messages.at(-1).content;
    assert.match(prompt, /- Renan: 3 jogos, 1501\.0h jogadas, 1 jogos nunca abertos \(33% da biblioteca\)/);
    assert.match(prompt, /- Amigo: 1 jogos, 500\.0h jogadas.*Maior vício: Euro Truck Simulator 2/);
    assert.match(prompt, /VEREDITO: <nome> PERDEU/);
});

test('duelo contra si mesmo ou sem rival válido devolve 400', async () => {
    for (const rivalId of [STEAM_ID, 'abc', undefined]) {
        const res = await perguntar({ steamId: STEAM_ID, event: { type: 'duel', rivalId } });
        assert.equal(res.status, 400, String(rivalId));
    }
});

// ---------- Tempo de jogo escondido (todos os jogos com 0 horas) ----------

const JOGOS_ESCONDIDOS = [
    { appid: 10, name: 'Counter-Strike', playtime_forever: 0 },
    { appid: 20, name: 'Stardew Valley', playtime_forever: 0 },
];

test('tempo de jogo escondido: o duelo não trata o rival como "nunca abriu nada"', async () => {
    respostaGet = (url, params) => {
        if (url.includes('GetOwnedGames')) return { data: { response: { games: params.steamid === RIVAL_ID ? JOGOS_ESCONDIDOS : JOGOS } } };
        if (url.includes('GetPlayerSummaries')) return { data: { response: { players: [{ steamid: STEAM_ID, personaname: 'Renan' }, { steamid: RIVAL_ID, personaname: 'Amigo' }] } } };
        throw erroHttp(404);
    };
    const res = await perguntar({ steamId: STEAM_ID, messages: [], event: { type: 'duel', rivalId: RIVAL_ID } });
    await res.text();
    const prompt = posts[0].messages.at(-1).content;
    assert.match(prompt, /- Amigo: 2 jogos, mas ESCONDE o tempo de jogo/);
    assert.doesNotMatch(prompt, /- Amigo: .*nunca abertos \(100%/);
    assert.match(prompt, /- Renan: 3 jogos, 1501\.0h jogadas/);
});

test('tempo de jogo escondido: contexto e prompt do jogo avisam a IA para não dizer "nunca abriu"', async () => {
    respostaGet = (url) => {
        if (url.includes('GetOwnedGames')) return { data: { response: { games: JOGOS_ESCONDIDOS } } };
        throw erroHttp(400);
    };
    const res = await perguntar({ steamId: STEAM_ID, messages: [], event: { type: 'game', appId: 20 } });
    await res.text();
    const [sistema, , ] = posts[0].messages;
    const promptJogo = posts[0].messages.at(-1).content;
    assert.match(sistema.content, /ESCONDE o tempo de jogo/);
    assert.doesNotMatch(sistema.content, /NUNCA abertos/);
    assert.match(promptJogo, /Desconhecido: o usuário ESCONDE o tempo de jogo/);
    assert.doesNotMatch(promptJogo, /Nunca sequer abriu/);
});

test('tempo de jogo escondido: quase platinados ainda analisa os jogos', async () => {
    let chamadas = 0;
    respostaGet = (url) => {
        if (url.includes('GetOwnedGames')) return { data: { response: { games: JOGOS_ESCONDIDOS } } };
        if (url.includes('GetPlayerAchievements')) {
            chamadas++;
            return { data: { playerstats: { achievements: [{ achieved: 1 }, { achieved: 1 }, { achieved: 0 }] } } };
        }
        throw erroHttp(404);
    };
    const dados = await (await pedir(`/api/almost/${STEAM_ID}`)).json();
    assert.equal(chamadas, 2);
    assert.equal(dados.quase.length, 2);
});
