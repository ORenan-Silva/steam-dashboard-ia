import { CalendarClock, Sprout } from 'lucide-react';
import Icone from './Icone';
import Numero from './Numero';
import TituloCard from './TituloCard';
import { cartaoBrutal } from '../lib/estilos';
import { formatarHoras } from '../lib/biblioteca';

const Recentes = ({ recentes, onGameClick, ocupado }) => {
  const totalMinutos = recentes.reduce((soma, g) => soma + g.playtime_2weeks, 0);
  const maior = recentes[0]?.playtime_2weeks || 1;

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col gap-5 entrada`} style={{ '--atraso': '150ms' }}>
      <div className="flex flex-wrap justify-between items-start gap-4">
        <TituloCard icone={CalendarClock} sombra="shadow-[4px_4px_0px_0px_#fbbf24]">ÚLTIMAS 2 SEMANAS</TituloCard>
        <span className="text-2xl md:text-3xl font-black text-amber-400 shrink-0">
          <Numero valor={totalMinutos} formatar={(m) => formatarHoras(m)} />
        </span>
      </div>

      {recentes.length === 0 ? (
        <p className="font-bold text-zinc-300 bg-zinc-950 border-4 border-zinc-700 p-4 text-sm flex gap-2 items-center">
          <Icone icone={Sprout} caixa={false} cor="lima" />
          Nenhum jogo nas últimas 2 semanas. Finalmente tocou grama?
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {recentes.slice(0, 5).map((game, i) => (
            <li key={game.appid}>
              <button
                type="button"
                onClick={() => onGameClick(game)}
                className={`w-full text-left bg-zinc-950 border-2 border-zinc-700 hover:border-amber-400 hover:-translate-y-0.5 p-3 flex flex-col gap-2 transition-all ${ocupado ? 'cursor-wait' : 'cursor-pointer'}`}
              >
                <span className="flex justify-between gap-3 text-sm font-bold">
                  <span className="truncate uppercase">{game.name}</span>
                  <span className="text-amber-400 shrink-0">{formatarHoras(game.playtime_2weeks)}</span>
                </span>
                <span className="sr-only"> (perguntar à SteamBB)</span>
                <span className="block h-2 bg-zinc-800">
                  <span
                    className="block h-full bg-amber-400 crescer"
                    style={{ width: `${Math.max(4, (game.playtime_2weeks / maior) * 100)}%`, '--atraso': `${200 + i * 80}ms` }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Recentes;
