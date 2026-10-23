import { useEffect, useRef, useState } from 'react';
import { conversarComIA } from '../lib/api';
import { CHAVE_CONVERSA } from '../lib/legal';

const MENSAGEM_INICIAL = 'SISTEMA INICIADO. AQUI É A STEAM_BB. O QUE VOCÊ QUER SABER DA SUA CONTA?';
const MENSAGEM_RESET = 'SISTEMA RESETADO. MEMÓRIA DA STEAM_BB LIMPA. O QUE VOCÊ QUER AGORA?';

// A conversa fica salva no navegador para não sumir ao recarregar a página
const MAX_MENSAGENS_SALVAS = 50;

const carregarConversa = () => {
  try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE_CONVERSA));
    const valida = Array.isArray(salvas) && salvas.length > 0 &&
      salvas.every(m => (m?.role === 'ai' || m?.role === 'user') && typeof m.text === 'string');
    if (valida) return salvas;
  } catch {
    // localStorage bloqueado (aba anônima) ou conteúdo corrompido: começa do zero
  }
  return [{ role: 'ai', text: MENSAGEM_INICIAL }];
};

// Só a saudação inicial não é conversa: nesse caso não guarda nada
const salvarConversa = (mensagens) => {
  try {
    if (mensagens.length <= 1) localStorage.removeItem(CHAVE_CONVERSA);
    else localStorage.setItem(CHAVE_CONVERSA, JSON.stringify(mensagens.slice(-MAX_MENSAGENS_SALVAS)));
  } catch {
    // Sem armazenamento disponível: a conversa só não sobrevive ao recarregar
  }
};

// Converte as mensagens da tela no histórico que vai para a IA (sem a saudação e sem erros)
const paraHistorico = (mensagens) => mensagens
  .slice(1)
  .filter(msg => !msg.erro && msg.text)
  .map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.text }));

export function useChat() {
  const [messages, setMessages] = useState(carregarConversa);
  const [isChatting, setIsChatting] = useState(false);
  const messagesRef = useRef(messages);
  const ocupadoRef = useRef(false);
  const filaRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Salva só quando a IA termina de falar (e não a cada pedaço do streaming)
  useEffect(() => {
    if (!isChatting) salvarConversa(messages);
  }, [messages, isChatting]);

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

  // Usado pela página Seus dados: volta à conversa inicial (o efeito acima remove o que estava salvo)
  const apagar = () => {
    if (ocupadoRef.current) return;
    setMessages([{ role: 'ai', text: MENSAGEM_INICIAL }]);
  };

  return { messages, isChatting, enviar, resetar, apagar };
}
