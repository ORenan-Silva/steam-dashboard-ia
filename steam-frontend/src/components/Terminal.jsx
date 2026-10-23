import { useEffect, useRef, useState } from 'react';
import { botaoBrutal, campoBrutal } from '../lib/estilos';

const PERGUNTAS_RAPIDAS = [
  'QUAL É O MEU PIOR VÍCIO?',
  'ME RECOMENDE UM JOGO QUE EU NUNCA ABRI',
  'ME ANALISE COMO GAMER',
];

const Mensagem = ({ msg, digitando }) => (
  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`p-4 max-w-[85%] border-4 text-base font-bold shadow-[4px_4px_0px_0px_#e4e4e7] ${
        msg.role === 'user'
          ? 'bg-zinc-200 text-zinc-950 border-zinc-200'
          : msg.erro
            ? 'bg-zinc-950 text-red-400 border-red-500'
            : 'bg-zinc-800 text-zinc-100 border-zinc-200'
      }`}
    >
      {msg.role === 'ai' && <div className="text-xs text-zinc-400 mb-2 border-b-2 border-zinc-600 pb-1">STEAM_BB diz:</div>}
      {msg.role === 'user' && <div className="text-xs text-zinc-900 mb-2 border-b-2 border-zinc-900 pb-1 text-right">VOCÊ diz:</div>}
      {msg.text ? (
        <p className="whitespace-pre-wrap leading-snug break-words">
          {msg.text}
          {digitando && <span className="inline-block w-2.5 h-5 bg-lime-400 ml-1 align-text-bottom animate-pulse" />}
        </p>
      ) : (
        <span className="animate-pulse font-black">PROCESSANDO...</span>
      )}
    </div>
  </div>
);

const Terminal = ({ messages, isChatting, onEnviar, onReset, aberto, onFechar, temPerfil }) => {
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, aberto]);

  const enviar = (texto) => {
    if (!texto.trim() || isChatting) return;
    onEnviar(texto.trim());
    setChatInput('');
  };

  return (
    <div
      className={`${aberto ? 'fixed inset-0 z-50 flex' : 'hidden'} xl:flex xl:sticky xl:inset-auto xl:z-auto xl:top-8 w-full xl:w-[450px] shrink-0 h-dvh xl:h-[calc(100vh-4rem)] xl:min-h-[600px] flex-col bg-zinc-900 border-4 border-zinc-200 xl:shadow-[12px_12px_0px_0px_#a3e635]`}
    >
      <div className="bg-zinc-200 text-zinc-950 p-4 flex justify-between items-center shrink-0">
        <h3 className="font-black text-base sm:text-xl uppercase tracking-wider sm:tracking-widest flex items-center gap-3 whitespace-nowrap">
          <span className="w-4 h-4 shrink-0 bg-lime-400 border-2 border-zinc-950 animate-pulse"></span>
          TERMINAL STEAM_BB
        </h3>
        <div className="flex gap-2 items-center whitespace-nowrap">
          <button
            onClick={onReset}
            disabled={isChatting}
            className="bg-red-500 hover:bg-red-600 text-zinc-950 font-black uppercase px-2 py-1 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-[10px] cursor-pointer disabled:opacity-50"
            title="Apagar Memória da IA"
          >
            [ RESET ]
          </button>
          <span className="text-xs font-bold text-zinc-950 bg-lime-400 px-3 py-1 border-2 border-zinc-950 hidden sm:inline-block">GPT-OSS</span>
          <button
            onClick={onFechar}
            className="xl:hidden bg-zinc-950 text-zinc-100 font-black px-2 py-1 border-2 border-zinc-950 text-xs cursor-pointer"
            aria-label="Fechar terminal"
          >
            [ X ]
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 bg-zinc-950 border-t-4 border-zinc-200 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"
        aria-live="polite"
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
                className="shrink-0 bg-zinc-950 text-lime-400 hover:bg-lime-400 hover:text-zinc-950 border-2 border-lime-400 px-2 py-1 text-[11px] font-black cursor-pointer transition-colors"
              >
                {pergunta}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); enviar(chatInput); }} className="flex gap-3">
          <input
            type="text"
            placeholder={isChatting ? 'A STEAM_BB ESTÁ FALANDO...' : 'PERGUNTE ALGO...'}
            aria-label="Mensagem para a SteamBB"
            maxLength={500}
            className={`${campoBrutal} flex-1 min-w-0 px-4 py-3 text-base`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatting}
          />
          <button
            type="submit"
            disabled={isChatting || !chatInput.trim()}
            className={`${botaoBrutal} bg-lime-400 hover:bg-lime-500 text-zinc-950 px-6 py-3`}
          >
            [ GO ]
          </button>
        </form>
      </div>
    </div>
  );
};

export default Terminal;
