// Barra de abas fixa no topo. No celular ela também abre o terminal da SteamBB,
// no lugar do botão flutuante (que cobria os botões da página).
const Abas = ({ abas, ativa, onTrocar, onAbrirTerminal, avisoTerminal, digitando }) => (
  <nav className="sticky top-0 z-30 -mx-4 px-4 md:-mx-8 md:px-8 py-3 bg-zinc-950/95 backdrop-blur-sm border-b-4 border-zinc-800">
    <div role="tablist" aria-label="Seções do painel" className="flex gap-2 overflow-x-auto">
      {abas.map(aba => (
        <button
          key={aba.id}
          role="tab"
          aria-selected={ativa === aba.id}
          onClick={() => onTrocar(aba.id)}
          className={`shrink-0 font-black uppercase text-xs sm:text-sm px-2.5 sm:px-4 py-2 border-4 border-zinc-200 cursor-pointer transition-colors ${
            ativa === aba.id
              ? 'bg-amber-400 text-zinc-950 shadow-[3px_3px_0px_0px_#e4e4e7]'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          {aba.rotulo}
          {aba.contador !== undefined && <span className="hidden sm:inline"> [{aba.contador}]</span>}
        </button>
      ))}
      <button
        onClick={onAbrirTerminal}
        className="xl:hidden ml-auto shrink-0 font-black uppercase text-xs sm:text-sm px-2.5 sm:px-4 py-2 border-4 border-zinc-200 bg-lime-400 text-zinc-950 flex items-center gap-2 cursor-pointer"
        aria-label="Abrir terminal da SteamBB"
      >
        <span className={`w-2.5 h-2.5 border-2 border-zinc-950 ${digitando || avisoTerminal ? 'bg-zinc-950 animate-pulse' : 'bg-lime-400'}`} />
        IA
      </button>
    </div>
  </nav>
);

export default Abas;
