// Informações usadas na Política de Privacidade, nos Termos e no aviso de privacidade.
// Ao mudar a política de forma relevante, troque VERSAO_PRIVACIDADE: o aviso aparece de novo para todos.

// E-mail do canal de privacidade (LGPD). Configure VITE_CONTATO_PRIVACIDADE na Vercel e faça um Redeploy.
export const CONTATO_PRIVACIDADE = (import.meta.env.VITE_CONTATO_PRIVACIDADE || '').trim();

export const ULTIMA_ATUALIZACAO = '23 de outubro de 2026';
export const VERSAO_PRIVACIDADE = '2026-10-23';
export const IDADE_MINIMA = 18;

export const CHAVE_CONVERSA = 'steambb-conversa';
export const CHAVE_PRIVACIDADE = 'steambb-privacidade';

// Lido a cada evento do Vercel Analytics: se a pessoa revogar, nada mais é enviado
export const estatisticasPermitidas = () => {
  try {
    const escolha = JSON.parse(localStorage.getItem(CHAVE_PRIVACIDADE));
    return escolha?.versao === VERSAO_PRIVACIDADE && escolha.estatisticas === true;
  } catch {
    return false;
  }
};

// Link mailto: do formulário da LGPD. Monta o e-mail no app da pessoa; nada passa pelos servidores do site.
export const montarMailto = (contato, { pedido, perfil = '', mensagem = '' }) => {
  const cabecalho = [`Pedido: ${pedido}`];
  if (perfil.trim()) cabecalho.push(`Perfil Steam relacionado: ${perfil.trim()}`);
  const corpo = [cabecalho.join('\n'), mensagem.trim()].filter(Boolean).join('\n\n');
  return `mailto:${contato}?subject=${encodeURIComponent(`[LGPD] ${pedido}`)}&body=${encodeURIComponent(corpo)}`;
};

// Remove o ?id= e o ?vs= da URL antes de mandar para o Analytics: eles identificam perfis da Steam
export const urlSemPerfil = (url) => url.split('?')[0].split('#')[0];
