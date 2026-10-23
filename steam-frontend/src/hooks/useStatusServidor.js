import { useEffect, useState } from 'react';
import { getJson } from '../lib/api';

// O plano grátis do Render "dorme" sem uso. Chamar o status assim que a página abre
// acorda o servidor enquanto a pessoa ainda está digitando o perfil.
export function useStatusServidor() {
  const [status, setStatus] = useState('verificando');

  useEffect(() => {
    let ativo = true;
    const demorando = setTimeout(() => {
      if (ativo) setStatus(atual => (atual === 'verificando' ? 'acordando' : atual));
    }, 2500);

    getJson('/api/status')
      .then(() => ativo && setStatus('online'))
      .catch(() => ativo && setStatus('offline'))
      .finally(() => clearTimeout(demorando));

    return () => {
      ativo = false;
      clearTimeout(demorando);
    };
  }, []);

  return status;
}
