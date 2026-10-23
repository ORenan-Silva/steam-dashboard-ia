import { Hourglass, Lock } from 'lucide-react';
import { capaDoJogo, formatarHoras, formatarReais } from '../lib/biblioteca';

// Capa reserva embutida no próprio site (antes vinha do placehold.co, um serviço de terceiros a menos)
const CAPA_RESERVA = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 215"><rect width="460" height="215" fill="#18181b"/>' +
  '<text x="230" y="118" fill="#e4e4e7" font-family="monospace" font-size="34" font-weight="900" text-anchor="middle">SEM CAPA</text></svg>'
)}`;

const CartaoJogo = ({ game, preco, onClick, ocupado, tempoPrivado }) => {
  const nuncaAberto = !tempoPrivado && game.playtime_forever === 0;
  const textoPreco = preco ? (preco.cheio > 0 ? formatarReais(preco.cheio) : 'GRÁTIS') : null;

  return (
    <button
      type="button"
      onClick={() => onClick(game)}
      className={`group entrada text-left bg-zinc-900 border-4 border-zinc-200 shadow-[6px_6px_0px_0px_#fbbf24] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#fbbf24] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200 flex flex-col ${ocupado ? 'cursor-wait' : 'cursor-pointer'}`}
    >
      {/* O nome do jogo já aparece no card, então a capa é decorativa (alt vazio) */}
      <span className="capa-brilho block relative bg-zinc-950 aspect-[460/215] w-full border-b-4 border-zinc-200">
        <img
          src={capaDoJogo(game.appid)}
          alt=""
          loading="lazy"
          width="460"
          height="215"
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-focus-visible:grayscale-0 transition-all duration-300 opacity-80 group-hover:opacity-100 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = CAPA_RESERVA; }}
        />
        {nuncaAberto && (
          <span className="carimbo absolute top-3 -left-1 bg-red-500 text-zinc-950 border-4 border-zinc-950 px-2 py-0.5 text-xs font-black">
            NUNCA ABERTO
          </span>
        )}
      </span>
      <span className="p-4 grow flex flex-col justify-between gap-4 w-full">
        <span className="text-base font-black uppercase line-clamp-2 leading-tight text-zinc-100" title={game.name}>{game.name}</span>
        <span className="flex justify-between items-center gap-2 text-xs pt-3 border-t-4 border-zinc-200 font-bold mt-auto">
          <span className="bg-amber-400 text-zinc-950 border-2 border-zinc-200 px-2 py-1 flex items-center gap-1">
            {tempoPrivado ? (
              <><Lock size={13} strokeWidth={3} aria-hidden="true" /> OCULTO</>
            ) : (
              <><Hourglass size={13} strokeWidth={3} aria-hidden="true" /> {formatarHoras(game.playtime_forever)}</>
            )}
          </span>
          {textoPreco ? (
            <span className="bg-cyan-400 text-zinc-950 border-2 border-zinc-200 px-2 py-1 estalo">{textoPreco}</span>
          ) : (
            <span className="text-zinc-400 font-mono">#{game.appid}</span>
          )}
        </span>
        <span className="sr-only"> (perguntar à SteamBB)</span>
      </span>
    </button>
  );
};

export default CartaoJogo;
