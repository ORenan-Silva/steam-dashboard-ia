// URL do backend: em produção vem da variável VITE_API_URL (definida na Vercel)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ERRO_PADRAO = 'ERRO: CONEXÃO COM O SERVIDOR PERDIDA.';

// fetch com a mensagem de erro do backend (ex: limite de mensagens) virando um Error legível.
// Consultas de leitura (GET) tentam mais uma vez se a rede falhar no meio do caminho.
async function pedir(caminho, opcoes) {
  const tentativas = opcoes?.method && opcoes.method !== 'GET' ? 1 : 2;
  let res;
  for (let tentativa = 1; !res; tentativa++) {
    try {
      res = await fetch(`${API_URL}${caminho}`, opcoes);
    } catch {
      if (tentativa >= tentativas) throw new Error('ERRO: SERVIDOR FORA DO AR OU SEM INTERNET.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  if (!res.ok) {
    let mensagem;
    try {
      mensagem = (await res.json()).error;
    } catch {
      // resposta sem JSON: usa a mensagem padrão
    }
    throw Object.assign(new Error(mensagem || ERRO_PADRAO), { status: res.status });
  }
  return res;
}

export const getJson = async (caminho) => (await pedir(caminho)).json();

export const postJson = async (caminho, corpo) => (await pedir(caminho, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo),
})).json();

// A resposta da IA chega aos pedaços (streaming); cada pedaço vai para aoReceberTexto
export async function conversarComIA(corpo, aoReceberTexto) {
  const res = await pedir('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const leitor = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    aoReceberTexto(decoder.decode(value, { stream: true }));
  }
}
