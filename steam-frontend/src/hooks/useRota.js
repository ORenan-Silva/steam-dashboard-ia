import { useEffect, useState } from 'react';

// Navegação mínima para as páginas legais (/privacidade, /termos, /seus-dados) sem biblioteca de rotas
export function useRota() {
  const [caminho, setCaminho] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');

  useEffect(() => {
    const aoVoltar = () => setCaminho(window.location.pathname.replace(/\/+$/, '') || '/');
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

  const navegar = (destino) => {
    if (destino === caminho) return;
    window.history.pushState(null, '', destino);
    setCaminho(destino.split('?')[0]);
    window.scrollTo({ top: 0 });
  };

  return { caminho, navegar };
}
