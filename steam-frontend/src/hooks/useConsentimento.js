import { useState } from 'react';
import { CHAVE_PRIVACIDADE, VERSAO_PRIVACIDADE } from '../lib/legal';

const lerEscolha = () => {
  try {
    const escolha = JSON.parse(localStorage.getItem(CHAVE_PRIVACIDADE));
    return escolha?.versao === VERSAO_PRIVACIDADE ? escolha : null;
  } catch {
    return null;
  }
};

// Escolha de privacidade da pessoa (estatísticas sim/não). Fica só no navegador dela.
export function useConsentimento() {
  const [escolha, setEscolha] = useState(lerEscolha);
  const [aberto, setAberto] = useState(() => lerEscolha() === null);

  const salvar = (estatisticas) => {
    const nova = { versao: VERSAO_PRIVACIDADE, estatisticas, data: new Date().toISOString() };
    try {
      localStorage.setItem(CHAVE_PRIVACIDADE, JSON.stringify(nova));
    } catch {
      // Sem armazenamento (aba anônima bloqueada): a escolha vale só até fechar a página
    }
    setEscolha(nova);
    setAberto(false);
  };

  return { escolha, aberto, abrir: () => setAberto(true), salvar };
}
