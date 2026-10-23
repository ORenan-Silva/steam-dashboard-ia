import { cartaoBrutal } from '../lib/estilos';
import { formatarHoras } from '../lib/biblioteca';

const Recentes = ({ recentes, onGameClick, ocupado }) => {
  const totalMinutos = recentes.reduce((soma, g) => soma + g.playtime_2weeks, 0);
  const maior = recentes[0]?.playtime_2weeks || 1;

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col gap-5`}>
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-lg md:text-xl font-black uppercase bg-zinc-200 text-zinc-950 px-4 py-2 shadow-[4px_4px_0px_0px_#fbbf24]">
          ÚLTIMAS 2 SEMANAS
        </h3>
        <span className="text-2xl md:text-3xl font-black text-amber-400 shrink-0">{formatarHoras(totalMinutos)}</span>
      </div>

      {recentes.length === 0 ? (
        <p className="font-bold text-zinc-300 bg-zinc-950 border-4 border-zinc-700 p-4 text-sm">
          🌱 Nenhum jogo nas últimas 2 semanas. Finalmente tocou grama?
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recentes.slice(0, 5).map(game => (
            <button
              key={game.appid}
              type="button"
              onClick={() => onGameClick(game)}
              title={ocupado ? 'Espere a SteamBB terminar de falar' : `Perguntar à SteamBB sobre ${game.name}`}
              className={`text-left bg-zinc-950 border-2 border-zinc-700 hover:border-amber-400 p-3 flex flex-col gap-2 transition-colors ${ocupado ? 'cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="flex justify-between gap-3 text-sm font-bold">
                <span className="truncate uppercase">{game.name}</span>
                <span className="text-amber-400 shrink-0">{formatarHoras(game.playtime_2weeks)}</span>
              </div>
              <div className="h-2 bg-zinc-800">
                <div className="h-full bg-amber-400" style={{ width: `${Math.max(4, (game.playtime_2weeks / maior) * 100)}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recentes;
