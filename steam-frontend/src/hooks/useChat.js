import { useEffect, useRef, useState } from 'react';
import { conversarComIA } from '../lib/api';

const MENSAGEM_INICIAL = 'SISTEMA INICIADO. AQUI É A STEAM_BB. O QUE VOCÊ QUER SABER DA SUA CONTA?';
const MENSAGEM_RESET = 'SISTEMA RESETADO. MEMÓRIA DA STEAM_BB LIMPA. O QUE VOCÊ QUER AGORA?';

// Converte as mensagens da tela no histórico que vai para a IA (sem a saudação e sem erros)
const paraHistorico = (mensagens) => mensagens
  .slice(1)
  .filter(msg => !msg.erro && msg.text)
  .map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.text }));

export function useChat() {
  const [messages, setMessages] = useState([{ role: 'ai', text: MENSAGEM_INICIAL }]);
  const [isChatting, setIsChatting] = useState(false);
  const messagesRef = useRef(messages);
  const ocupadoRef = useRef(false);
  const filaRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const atualizarUltima = (alterar) =>
    setMessages(prev => [...prev.slice(0, -1), alterar(prev[prev.length - 1])]);

  // Com "event", o texto visível é só um rótulo: quem monta o prompt de verdade é o servidor
  const conversar = async ({ textoVisivel, steamId, event }) => {
    const historico = paraHistorico(messagesRef.current);
    setMessages(prev => [...prev, { role: 'user', text: textoVisivel }, { role: 'ai', text: '' }]);

    try {
      await conversarComIA(
        {
          steamId: steamId || undefined,
          event,
          messages: event ? historico : [...historico, { role: 'user', content: textoVisivel }],
        },
        (pedaco) => atualizarUltima(msg => ({ ...msg, text: msg.text + pedaco }))
      );
    } catch (err) {
      atualizarUltima(() => ({ role: 'ai', text: err.message, erro: true }));
    }
  };

  const processarFila = async () => {
    ocupadoRef.current = true;
    setIsChatting(true);
    while (filaRef.current.length > 0) {
      await conversar(filaRef.current.shift());
      // Deixa o React aplicar a resposta antes de montar o histórico da próxima
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    ocupadoRef.current = false;
    setIsChatting(false);
  };

  // Cliques e perguntas são ignorados enquanto a IA fala; com esperarVez, a mensagem entra na fila
  const enviar = ({ esperarVez = false, ...pedido }) => {
    if (ocupadoRef.current && !esperarVez) return;
    filaRef.current.push(pedido);
    if (!ocupadoRef.current) processarFila();
  };

  const resetar = () => {
    if (ocupadoRef.current) return;
    setMessages([{ role: 'ai', text: MENSAGEM_RESET }]);
  };

  return { messages, isChatting, enviar, resetar };
}
