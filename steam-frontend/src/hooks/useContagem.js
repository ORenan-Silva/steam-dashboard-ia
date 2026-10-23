import { useEffect, useRef, useState } from 'react';

const prefereMenosMovimento = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// Número que "conta" de onde estava até o valor novo (para estatísticas e valores em R$).
// Quem pediu menos movimento no sistema vê o valor final direto.
export function useContagem(alvo, duracao = 900) {
  const [atual, setAtual] = useState(() => (prefereMenosMovimento() ? alvo : 0));
  const atualRef = useRef(atual);

  useEffect(() => {
    const partida = atualRef.current;
    let inicio;
    let quadro;
    const passo = (agora) => {
      inicio ??= agora;
      const progresso = prefereMenosMovimento() ? 1 : Math.min((agora - inicio) / duracao, 1);
      // Desacelera no fim (ease-out cúbico)
      const valor = partida + (alvo - partida) * (1 - (1 - progresso) ** 3);
      atualRef.current = valor;
      setAtual(valor);
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracao]);

  return atual;
}
