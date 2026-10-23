import { useState } from 'react';
import Loader from './Loader';
import { getJson } from '../lib/api';
import { botaoBrutal, cartaoBrutal } from '../lib/estilos';

const QuasePlatinados = ({ steamId, onGameClick, ocupado }) => {
  const [estado, setEstado] = useState('parado');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  const escanear = async () => {
    setEstado('carregando');
    setErro('');
    try {
      setDados(await getJson(`/api/almost/${steamId}`));
      setEstado('pronto');
    } catch (err) {
      setErro(err.message);
      setEstado('parado');
    }
  };

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col gap-5`}>
      <h3 className="text-lg md:text-xl font-black uppercase bg-zinc-200 text-zinc-950 px-4 py-2 shadow-[4px_4px_0px_0px_#fbbf24] self-start">
        🏆 QUASE PLATINADOS
      </h3>

      {estado === 'parado' && (
        <>
          <p className="text-sm font-bold text-zinc-300">
            A SteamBB varre as conquistas dos seus 30 jogos mais jogados e acha os que você largou perto dos 100%.
          </p>
          <button
            onClick={escanear}
            className={`${botaoBrutal} bg-amber-400 hover:bg-amber-500 text-zinc-950 py-3 px-4`}
          >
            ESCANEAR CONQUISTAS
          </button>
          {erro && <p className="text-red-400 font-bold text-sm">{erro}</p>}
        </>
      )}

      {estado === 'carregando' && (
        <div className="flex flex-col items-center gap-2 py-4">
          <Loader />
          <span className="text-sm font-bold text-zinc-300 animate-pulse">Vasculhando suas conquistas...</span>
        </div>
      )}

      {estado === 'pronto' && dados && (
        <>
          <p className="text-sm font-black uppercase">
            <span className="text-amber-400 text-2xl">{dados.platinados}</span> PLATINADOS ENTRE {dados.analisados} JOGOS COM CONQUISTAS
          </p>
          {dados.quase.length === 0 ? (
            <p className="font-bold text-zinc-300 bg-zinc-950 border-4 border-zinc-700 p-4 text-sm">
              Nenhum jogo perto dos 100%. Nem isso você termina.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {dados.quase.map(game => {
                const faltam = game.total - game.feitas;
                return (
                  <button
                    key={game.appid}
                    type="button"
                    onClick={() => onGameClick(game)}
                    title={ocupado ? 'Espere a SteamBB terminar de falar' : `Perguntar à SteamBB sobre ${game.name}`}
                    className={`text-left bg-zinc-950 border-2 border-zinc-700 hover:border-amber-400 p-3 flex flex-col gap-2 transition-colors ${ocupado ? 'cursor-wait' : 'cursor-pointer'}`}
                  >
                    <div className="flex justify-between gap-3 text-sm font-bold">
                      <span className="truncate uppercase">{game.name}</span>
                      <span className="text-amber-400 shrink-0">FALTA{faltam > 1 ? 'M' : ''} {faltam}</span>
                    </div>
                    <div className="h-2 bg-zinc-800">
                      <div className="h-full bg-amber-400" style={{ width: `${(game.feitas / game.total) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-zinc-400">{game.feitas}/{game.total} CONQUISTAS</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuasePlatinados;
