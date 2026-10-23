import { afterEach, describe, expect, test, vi } from 'vitest';
import { CHAVE_PRIVACIDADE, VERSAO_PRIVACIDADE, estatisticasPermitidas, montarMailto, urlSemPerfil } from './legal';

// localStorage simples para os testes (o Vitest roda em Node, sem navegador)
const armazenamentoFalso = (inicial = {}) => {
  const dados = { ...inicial };
  return {
    getItem: (chave) => (chave in dados ? dados[chave] : null),
    setItem: (chave, valor) => { dados[chave] = String(valor); },
    removeItem: (chave) => { delete dados[chave]; },
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('urlSemPerfil', () => {
  test('tira o ?id= e o ?vs= (que identificam perfis) antes de mandar para o Analytics', () => {
    expect(urlSemPerfil('https://site.app/?id=arcticeaagle&vs=amigo')).toBe('https://site.app/');
    expect(urlSemPerfil('https://site.app/privacidade#topo')).toBe('https://site.app/privacidade');
    expect(urlSemPerfil('https://site.app/termos')).toBe('https://site.app/termos');
  });
});

describe('estatisticasPermitidas', () => {
  test('sem escolha salva, nada é enviado (estatísticas começam desligadas)', () => {
    vi.stubGlobal('localStorage', armazenamentoFalso());
    expect(estatisticasPermitidas()).toBe(false);
  });

  test('só libera com consentimento explícito na versão atual da política', () => {
    const escolha = (estatisticas, versao = VERSAO_PRIVACIDADE) => armazenamentoFalso({
      [CHAVE_PRIVACIDADE]: JSON.stringify({ versao, estatisticas }),
    });
    vi.stubGlobal('localStorage', escolha(true));
    expect(estatisticasPermitidas()).toBe(true);

    vi.stubGlobal('localStorage', escolha(false));
    expect(estatisticasPermitidas()).toBe(false);

    // Política mudou: o consentimento antigo não vale mais
    vi.stubGlobal('localStorage', escolha(true, '2000-01-01'));
    expect(estatisticasPermitidas()).toBe(false);
  });

  test('armazenamento bloqueado ou corrompido conta como "não"', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado'); } });
    expect(estatisticasPermitidas()).toBe(false);
    vi.stubGlobal('localStorage', armazenamentoFalso({ [CHAVE_PRIVACIDADE]: '{quebrado' }));
    expect(estatisticasPermitidas()).toBe(false);
  });
});

describe('montarMailto (formulário da LGPD)', () => {
  test('monta assunto e corpo com o pedido, o perfil e a mensagem', () => {
    const link = montarMailto('privacidade@exemplo.com', {
      pedido: 'Acessar meus dados',
      perfil: ' steamcommunity.com/id/fulano ',
      mensagem: 'Quero saber o que vocês têm & de onde veio.',
    });
    const url = new URL(link);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe('privacidade@exemplo.com');
    expect(url.searchParams.get('subject')).toBe('[LGPD] Acessar meus dados');
    expect(url.searchParams.get('body')).toBe(
      'Pedido: Acessar meus dados\nPerfil Steam relacionado: steamcommunity.com/id/fulano\n\nQuero saber o que vocês têm & de onde veio.'
    );
  });

  test('sem perfil, a linha do perfil não aparece', () => {
    const url = new URL(montarMailto('a@b.com', { pedido: 'Revogar meu consentimento', mensagem: 'Oi' }));
    expect(url.searchParams.get('body')).toBe('Pedido: Revogar meu consentimento\n\nOi');
  });

  test('sem mensagem, o corpo tem só o cabeçalho', () => {
    const url = new URL(montarMailto('a@b.com', { pedido: 'Acessar meus dados' }));
    expect(url.searchParams.get('body')).toBe('Pedido: Acessar meus dados');
  });
});
