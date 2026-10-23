import { afterEach, describe, expect, test, vi } from 'vitest';
import { conversarComIA, getJson } from './api';

const respostaJson = (status, corpo) => new Response(JSON.stringify(corpo), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

afterEach(() => vi.unstubAllGlobals());

describe('getJson', () => {
  test('devolve o JSON quando dá certo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaJson(200, { steamId: '123' })));
    await expect(getJson('/api/resolve?q=x')).resolves.toEqual({ steamId: '123' });
  });

  test('usa a mensagem de erro do backend (ex: limite de mensagens)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaJson(429, { error: 'CALMA. VAI TOMAR UMA ÁGUA.' })));
    await expect(getJson('/api/chat')).rejects.toMatchObject({ message: 'CALMA. VAI TOMAR UMA ÁGUA.', status: 429 });
  });

  test('erro sem JSON vira mensagem padrão', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>502</html>', { status: 502 })));
    await expect(getJson('/api/status')).rejects.toThrow('ERRO: CONEXÃO COM O SERVIDOR PERDIDA.');
  });

  test('sem internet ou servidor fora do ar (depois de tentar 2 vezes)', async () => {
    const fetchFalso = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    vi.stubGlobal('fetch', fetchFalso);
    await expect(getJson('/api/status')).rejects.toThrow('ERRO: SERVIDOR FORA DO AR OU SEM INTERNET.');
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  test('queda momentânea de rede: a segunda tentativa resolve', async () => {
    const fetchFalso = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(respostaJson(200, { ok: true }));
    vi.stubGlobal('fetch', fetchFalso);
    await expect(getJson('/api/almost/1')).resolves.toEqual({ ok: true });
  });

  test('mensagens para a IA (POST) não são reenviadas sozinhas', async () => {
    const fetchFalso = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    vi.stubGlobal('fetch', fetchFalso);
    await expect(conversarComIA({ messages: [] }, () => {})).rejects.toThrow('SEM INTERNET');
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });
});

describe('conversarComIA', () => {
  test('entrega a resposta em pedaços, inclusive caracteres acentuados quebrados entre pedaços', async () => {
    const bytes = new TextEncoder().encode('Você é um acumulador.');
    // "ê" ocupa 2 bytes: corta bem no meio dele
    const corte = 3;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, corte));
        controller.enqueue(bytes.slice(corte));
        controller.close();
      },
    });
    const fetchFalso = vi.fn(async () => new Response(stream, { status: 200 }));
    vi.stubGlobal('fetch', fetchFalso);

    const pedacos = [];
    await conversarComIA({ messages: [] }, (texto) => pedacos.push(texto));

    expect(pedacos.join('')).toBe('Você é um acumulador.');
    expect(pedacos.length).toBe(2);
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body)).toEqual({ messages: [] });
  });
});
