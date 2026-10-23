import Loader from './Loader';
import { botaoBrutal, cartaoBrutal } from '../lib/estilos';
import { formatarReais } from '../lib/biblioteca';

const ValorDaConta = ({ calculo, valores, onCalcular }) => {
  const { estado, progresso, falharam } = calculo;

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#f472b6] flex flex-col gap-6`}>
      <h3 className="text-2xl md:text-3xl font-black uppercase bg-zinc-200 text-zinc-950 px-6 py-3 shadow-[4px_4px_0px_0px_#f472b6] self-start">
        $$ VALOR DA CONTA $$
      </h3>

      {estado === 'parado' && (
        <button
          onClick={onCalcular}
          className={`${botaoBrutal} w-full bg-cyan-400 hover:bg-cyan-500 text-zinc-950 py-4 md:py-6 px-4 text-base md:text-xl`}
        >
          CALCULAR QUANTO VOCÊ JÁ TORROU
        </button>
      )}

      {estado === 'calculando' && (
        <div className="bg-zinc-800 border-4 border-zinc-200 p-4 flex flex-col items-center gap-3 shadow-[4px_4px_0px_0px_#e4e4e7]">
          <div className="text-3xl font-black text-cyan-400">{progresso}%</div>
          <div className="w-full h-4 bg-zinc-950 border-2 border-zinc-200">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progresso}%` }} />
          </div>
          <Loader />
          <div className="w-full flex justify-between text-sm font-bold border-t-4 border-zinc-200 pt-3 text-zinc-100">
            <span>PARCIAL:</span>
            <span>{formatarReais(valores.total)}</span>
          </div>
        </div>
      )}

      {estado === 'pronto' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950 border-4 border-zinc-200 p-6 flex flex-col gap-2">
              <span className="text-sm font-black uppercase text-zinc-400">VALOR ESTIMADO:</span>
              <span className="text-3xl md:text-4xl font-black text-cyan-400 break-all">{formatarReais(valores.total)}</span>
            </div>
            <div className="bg-red-500 text-zinc-950 border-4 border-zinc-200 p-6 flex flex-col gap-2">
              <span className="text-sm font-black uppercase">💀 DINHEIRO JOGADO FORA:</span>
              {valores.tempoPrivado ? (
                <>
                  <span className="text-3xl md:text-4xl font-black">🔒 ???</span>
                  <span className="text-xs font-black uppercase">
                    VOCÊ ESCONDE O TEMPO DE JOGO, ENTÃO NÃO DÁ PRA SABER O QUE NUNCA FOI ABERTO. SUSPEITO.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl md:text-4xl font-black break-all">{formatarReais(valores.desperdicio)}</span>
                  <span className="text-xs font-black uppercase">
                    EM {valores.pagosNuncaAbertos} JOGOS PAGOS QUE VOCÊ NUNCA ABRIU
                  </span>
                </>
              )}
            </div>
          </div>

          {valores.maisCaros.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase text-zinc-400">OS MAIS CAROS DA SUA COLEÇÃO:</span>
              {valores.maisCaros.map((game, i) => (
                <div key={game.appid} className="flex justify-between gap-4 bg-zinc-950 border-2 border-zinc-700 px-3 py-2 text-sm font-bold">
                  <span className="truncate">#{i + 1} {game.name}</span>
                  <span className="text-cyan-400 shrink-0">{formatarReais(game.preco)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-zinc-500 uppercase">
            <span>
              PREÇO CHEIO ATUAL DA LOJA (BR), NÃO O QUE VOCÊ PAGOU.
              {falharam > 0 && <span className="text-amber-400"> {falharam} JOGOS SEM PREÇO (A STEAM BLOQUEOU A CONSULTA).</span>}
            </span>
            <button
              onClick={onCalcular}
              className={`${botaoBrutal} bg-zinc-200 text-zinc-950 hover:bg-white px-4 py-2 text-xs shrink-0`}
            >
              RECALCULAR
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ValorDaConta;
