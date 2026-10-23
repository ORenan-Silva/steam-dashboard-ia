import { useRef } from 'react';
import { Bot } from 'lucide-react';

// Barra de abas fixa no topo. No celular ela também abre o terminal da SteamBB.
// Teclado (padrão WAI-ARIA de abas): setas trocam de aba, Home/End vão para a primeira/última.
const Abas = ({ abas, ativa, onTrocar, onAbrirTerminal, avisoTerminal, digitando }) => {
  const botoesRef = useRef({});

  const aoTeclar = (e, indice) => {
    const destinos = { ArrowRight: indice + 1, ArrowLeft: indice - 1, Home: 0, End: abas.length - 1 };
    if (!(e.key in destinos)) return;
    e.preventDefault();
    const proxima = abas[(destinos[e.key] + abas.length) % abas.length];
    onTrocar(proxima.id);
    botoesRef.current[proxima.id]?.focus();
  };

  return (
    <nav aria-label="Seções do painel" className="sticky top-0 z-30 -mx-4 px-4 md:-mx-8 md:px-8 py-3 bg-zinc-950/95 backdrop-blur-sm border-b-4 border-zinc-800">
      <div className="flex gap-2 overflow-x-auto p-1">
        <div role="tablist" aria-label="Seções do perfil" className="flex gap-2">
          {abas.map((aba, indice) => {
            const selecionada = ativa === aba.id;
            return (
              <button
                key={aba.id}
                ref={(el) => { botoesRef.current[aba.id] = el; }}
                id={`aba-${aba.id}`}
                role="tab"
                aria-selected={selecionada}
                aria-controls={`painel-${aba.id}`}
                tabIndex={selecionada ? 0 : -1}
                onClick={() => onTrocar(aba.id)}
                onKeyDown={(e) => aoTeclar(e, indice)}
                className={`shrink-0 font-black uppercase text-xs sm:text-sm px-2.5 sm:px-4 py-2 border-4 border-zinc-200 cursor-pointer transition-all ${
                  selecionada
                    ? 'bg-amber-400 text-zinc-950 shadow-[3px_3px_0px_0px_#e4e4e7] -translate-y-0.5'
                    : 'sombra-glitch bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {aba.rotulo}
                {aba.contador !== undefined && <span className="hidden sm:inline"> [{aba.contador}]</span>}
              </button>
            );
          })}
        </div>
        <button
          onClick={onAbrirTerminal}
          className="xl:hidden ml-auto shrink-0 font-black uppercase text-xs sm:text-sm px-2.5 sm:px-4 py-2 border-4 border-zinc-200 bg-lime-400 text-zinc-950 flex items-center gap-2 cursor-pointer"
        >
          <Bot size={16} strokeWidth={3} aria-hidden="true" className={digitando || avisoTerminal ? 'animate-pulse' : ''} />
          IA
          <span className="sr-only">
            {' (abrir terminal da SteamBB'}{digitando ? ', respondendo' : avisoTerminal ? ', resposta nova' : ''}{')'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Abas;
