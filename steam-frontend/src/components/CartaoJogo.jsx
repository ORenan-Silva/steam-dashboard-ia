import { capaDoJogo, formatarHoras, formatarReais } from '../lib/biblioteca';

const CAPA_RESERVA = 'https://placehold.co/460x215/18181b/e4e4e7?text=SEM+CAPA';

const CartaoJogo = ({ game, preco, onClick, ocupado, tempoPrivado }) => {
  const nuncaAberto = !tempoPrivado && game.playtime_forever === 0;

  return (
    <button
      type="button"
      onClick={() => onClick(game)}
      title={ocupado ? 'Espere a SteamBB terminar de falar' : `Perguntar à SteamBB sobre ${game.name}`}
      className={`group text-left bg-zinc-900 border-4 border-zinc-200 shadow-[6px_6px_0px_0px_#fbbf24] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#fbbf24] focus-visible:outline-4 focus-visible:outline-fuchsia-500 transition-all flex flex-col ${ocupado ? 'cursor-wait' : 'cursor-pointer'}`}
    >
      <div className="relative bg-zinc-950 aspect-[460/215] w-full border-b-4 border-zinc-200 overflow-hidden">
        <img
          src={capaDoJogo(game.appid)}
          alt={game.name}
          loading="lazy"
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 opacity-80 group-hover:opacity-100"
          onError={(e) => { e.target.src = CAPA_RESERVA; }}
        />
        {nuncaAberto && (
          <span className="absolute top-3 -left-1 bg-red-500 text-zinc-950 border-4 border-zinc-950 px-2 py-0.5 text-xs font-black -rotate-3">
            NUNCA ABERTO
          </span>
        )}
      </div>
      <div className="p-4 grow flex flex-col justify-between gap-4 w-full">
        <h4 className="text-base font-black uppercase line-clamp-2 leading-tight text-zinc-100" title={game.name}>{game.name}</h4>
        <div className="flex justify-between items-center gap-2 text-xs pt-3 border-t-4 border-zinc-200 font-bold mt-auto">
          <span className="bg-amber-400 text-zinc-950 border-2 border-zinc-200 px-2 py-1">{tempoPrivado ? '🔒 OCULTO' : `⏳ ${formatarHoras(game.playtime_forever)}`}</span>
          {preco ? (
            <span className="bg-cyan-400 text-zinc-950 border-2 border-zinc-200 px-2 py-1">
              {preco.cheio > 0 ? formatarReais(preco.cheio) : 'GRÁTIS'}
            </span>
          ) : (
            <span className="text-zinc-500 font-mono">#{game.appid}</span>
          )}
        </div>
      </div>
    </button>
  );
};

export default CartaoJogo;
