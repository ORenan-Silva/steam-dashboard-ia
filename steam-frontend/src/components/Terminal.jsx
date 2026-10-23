import { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send, X } from 'lucide-react';
import Icone from './Icone';
import { botaoBrutal, campoBrutal } from '../lib/estilos';

const PERGUNTAS_RAPIDAS = [
  'QUAL É O MEU PIOR VÍCIO?',
  'ME RECOMENDE UM JOGO QUE EU NUNCA ABRI',
  'ME ANALISE COMO GAMER',
];

const Mensagem = ({ msg, digitando }) => (
  <div className={`surgir flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`relative z-[2] p-4 max-w-[85%] border-4 text-base font-bold shadow-[4px_4px_0px_0px_#e4e4e7] ${
        msg.role === 'user'
          ? 'bg-zinc-200 text-zinc-950 border-zinc-200'
          : msg.erro
            ? 'bg-zinc-950 text-red-400 border-red-500'
            : 'bg-zinc-800 text-zinc-100 border-zinc-200'
      }`}
    >
      {msg.role === 'ai' && (
        <div className="text-xs text-zinc-300 mb-2 border-b-2 border-zinc-600 pb-1 flex items-center gap-1.5">
          <Bot size={13} strokeWidth={3} aria-hidden="true" /> STEAM_BB diz:
        </div>
      )}
      {msg.role === 'user' && <div className="text-xs text-zinc-800 mb-2 border-b-2 border-zinc-900 pb-1 text-right">VOCÊ diz:</div>}
      {msg.text ? (
        <p className="whitespace-pre-wrap leading-snug break-words">
          {msg.text}
          {digitando && <span className="inline-block w-2.5 h-5 bg-lime-400 ml-1 align-text-bottom animate-pulse" aria-hidden="true" />}
        </p>
      ) : (
        <span className="glitch-distorce font-black text-lime-400">PROCESSANDO...</span>
      )}
    </div>
  </div>
);

const Terminal = ({ messages, isChatting, onEnviar, onReset, aberto, onFechar, temPerfil }) => {
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef(null);
  const campoRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, aberto]);

  // Abaixo de 1280px (xl) o terminal abre por cima da página, como um diálogo
  const sobreposto = aberto && !window.matchMedia('(min-width: 1280px)').matches;
  const fecharRef = useRef(onFechar);
  useEffect(() => {
    fecharRef.current = onFechar;
  });

  // Quando sobreposto: o foco vai para o campo uma vez e Esc fecha
  useEffect(() => {
    if (!sobreposto) return;
    campoRef.current?.focus();
    const aoTeclar = (e) => {
      if (e.key === 'Escape') fecharRef.current();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [sobreposto]);

  const enviar = (texto) => {
    if (!texto.trim() || isChatting) return;
    onEnviar(texto.trim());
    setChatInput('');
  };

  return (
    <div
      aria-label="Terminal da SteamBB"
      role={sobreposto ? 'dialog' : 'complementary'}
      {...(sobreposto && { 'aria-modal': true })}
      className={`${aberto ? 'fixed inset-0 z-50 flex deslizar-cima' : 'hidden'} xl:flex xl:sticky xl:inset-auto xl:z-auto xl:top-8 w-full xl:w-[450px] shrink-0 h-dvh xl:h-[calc(100vh-4rem)] xl:min-h-[600px] flex-col bg-zinc-900 border-4 border-zinc-200 xl:shadow-[12px_12px_0px_0px_#a3e635] entrada`}
      style={{ '--atraso': '200ms' }}
    >
      <div className="bg-zinc-200 text-zinc-950 p-4 flex justify-between items-center shrink-0">
        <h2 className="font-black text-base sm:text-xl uppercase tracking-wider sm:tracking-widest flex items-center gap-3 whitespace-nowrap">
          <span className="bg-lime-400 border-2 border-zinc-950 p-0.5 animate-pulse" aria-hidden="true">
            <Bot size={18} strokeWidth={3} />
          </span>
          TERMINAL STEAM_BB
        </h2>
        <div className="flex gap-2 items-center whitespace-nowrap">
          <button
            onClick={onReset}
            disabled={isChatting}
            className="bg-red-500 hover:bg-red-400 text-zinc-950 font-black uppercase px-2 py-1 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-[11px] cursor-pointer disabled:opacity-50 flex items-center gap-1"
            title="Apagar a memória da conversa"
          >
            <RotateCcw size={12} strokeWidth={3} aria-hidden="true" /> RESET
          </button>
          <span className="text-xs font-bold text-zinc-950 bg-lime-400 px-3 py-1 border-2 border-zinc-950 hidden sm:inline-block">GPT-OSS</span>
          <button
            onClick={onFechar}
            className="xl:hidden bg-zinc-950 text-zinc-100 font-black p-1 border-2 border-zinc-950 cursor-pointer"
            aria-label="Fechar terminal"
          >
            <X size={18} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="crt flex-1 overflow-y-auto p-5 flex flex-col gap-6 bg-zinc-950 border-t-4 border-zinc-200 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"
        aria-live="polite"
        aria-label="Conversa com a SteamBB"
      >
        {messages.map((msg, index) => (
          <Mensagem
            key={index}
            msg={msg}
            digitando={isChatting && index === messages.length - 1 && msg.role === 'ai'}
          />
        ))}
      </div>

      <div className="p-4 bg-zinc-900 border-t-4 border-zinc-200 shrink-0 flex flex-col gap-3">
        {temPerfil && !isChatting && (
          <div className="flex flex-wrap gap-2">
            {PERGUNTAS_RAPIDAS.map(pergunta => (
              <button
                key={pergunta}
                onClick={() => enviar(pergunta)}
                className="sombra-glitch shrink-0 bg-zinc-950 text-lime-400 hover:bg-lime-400 hover:text-zinc-950 border-2 border-lime-400 px-2 py-1 text-[11px] font-black cursor-pointer transition-colors"
              >
                {pergunta}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); enviar(chatInput); }} className="flex gap-3">
          <label htmlFor="mensagem-steambb" className="sr-only">Mensagem para a SteamBB</label>
          <input
            ref={campoRef}
            id="mensagem-steambb"
            type="text"
            placeholder={isChatting ? 'A STEAM_BB ESTÁ FALANDO...' : 'Pergunte algo...'}
            maxLength={500}
            autoComplete="off"
            className={`${campoBrutal} flex-1 min-w-0 px-4 py-3 text-base`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatting}
          />
          <button
            type="submit"
            disabled={isChatting || !chatInput.trim()}
            className={`${botaoBrutal} bg-lime-400 hover:bg-lime-300 text-zinc-950 px-4 py-3 flex items-center gap-2`}
          >
            <Icone icone={Send} caixa={false} cor="escuro" tamanho={18} />
            <span className="sr-only sm:not-sr-only">ENVIAR</span>
          </button>
        </form>
        <p className="text-[11px] font-bold text-zinc-400 leading-snug">
          Respostas geradas por IA, em tom de humor ácido e com palavrões. Podem conter erros e não representam fatos.
          A conversa é enviada ao Groq para gerar a resposta.
        </p>
      </div>
    </div>
  );
};

export default Terminal;
