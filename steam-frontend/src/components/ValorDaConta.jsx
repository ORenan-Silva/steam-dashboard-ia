import { Banknote, Calculator, Lock, RotateCcw, Skull } from 'lucide-react';
import Icone from './Icone';
import Loader from './Loader';
import Numero from './Numero';
import TituloCard from './TituloCard';
import { botaoBrutal, cartaoBrutal } from '../lib/estilos';
import { formatarReais } from '../lib/biblioteca';

const ValorDaConta = ({ calculo, valores, onCalcular }) => {
  const { estado, progresso, falharam } = calculo;

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#22d3ee] flex flex-col gap-6 entrada`}>
      <TituloCard icone={Banknote} sombra="shadow-[4px_4px_0px_0px_#22d3ee]" grande>VALOR DA CONTA</TituloCard>

      {estado === 'parado' && (
        <>
          <p className="text-sm font-bold text-zinc-300">
            Somamos o preço cheio atual de cada jogo na loja brasileira da Steam. É uma estimativa, não o que você pagou.
          </p>
          <button
            onClick={onCalcular}
            className={`${botaoBrutal} w-full bg-cyan-400 hover:bg-cyan-300 text-zinc-950 py-4 md:py-6 px-4 text-base md:text-xl flex items-center justify-center gap-3`}
          >
            <Icone icone={Calculator} caixa={false} cor="escuro" tamanho={24} />
            ESTIMAR QUANTO VOCÊ JÁ TORROU
          </button>
        </>
      )}

      {estado === 'calculando' && (
        <div className="bg-zinc-950 border-4 border-zinc-200 p-4 flex flex-col items-center gap-3 shadow-[4px_4px_0px_0px_#e4e4e7]">
          <div className="text-3xl font-black text-cyan-400" aria-hidden="true">{progresso}%</div>
          <div
            className="w-full h-5 bg-zinc-900 border-2 border-zinc-200"
            role="progressbar"
            aria-label="Consultando preços na loja"
            aria-valuenow={progresso}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-cyan-400 listrada transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
          <Loader rotulo="Consultando preços" />
          <div className="w-full flex justify-between text-sm font-bold border-t-4 border-zinc-200 pt-3 text-zinc-100">
            <span>PARCIAL:</span>
            <span className="text-cyan-400"><Numero valor={valores.total} formatar={formatarReais} /></span>
          </div>
        </div>
      )}

      {estado === 'pronto' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950 border-4 border-zinc-200 p-6 flex flex-col gap-2 surgir">
              <span className="text-sm font-black uppercase text-zinc-300 flex items-center gap-2">
                <Icone icone={Banknote} caixa={false} cor="ciano" tamanho={18} /> VALOR ESTIMADO
              </span>
              <span className="text-3xl md:text-4xl font-black text-cyan-400 break-all">
                <Numero valor={valores.total} formatar={formatarReais} />
              </span>
            </div>
            <div className="bg-red-500 text-zinc-950 border-4 border-zinc-200 p-6 flex flex-col gap-2 carimbo-leve" style={{ '--atraso': '350ms' }}>
              <span className="text-sm font-black uppercase flex items-center gap-2">
                <Icone icone={Skull} caixa={false} cor="escuro" tamanho={18} className="tremer" /> DINHEIRO JOGADO FORA
              </span>
              {valores.tempoPrivado ? (
                <>
                  <span className="text-3xl md:text-4xl font-black flex items-center gap-2">
                    <Icone icone={Lock} caixa={false} cor="escuro" tamanho={30} /> ???
                  </span>
                  <span className="text-sm font-bold">
                    Você esconde o tempo de jogo, então não dá pra saber o que nunca foi aberto. Suspeito.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl md:text-4xl font-black break-all">
                    <Numero valor={valores.desperdicio} formatar={formatarReais} />
                  </span>
                  <span className="text-sm font-bold">
                    Preço atual de {valores.pagosNuncaAbertos} jogos pagos que você nunca abriu.
                  </span>
                </>
              )}
            </div>
          </div>

          {valores.maisCaros.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase text-zinc-300">OS MAIS CAROS DA SUA COLEÇÃO:</span>
              <ol className="flex flex-col gap-2">
                {valores.maisCaros.map((game, i) => (
                  <li
                    key={game.appid}
                    className="surgir flex justify-between gap-4 bg-zinc-950 border-2 border-zinc-700 px-3 py-2 text-sm font-bold"
                    style={{ animationDelay: `${500 + i * 90}ms` }}
                  >
                    <span className="truncate">#{i + 1} {game.name}</span>
                    <span className="text-cyan-400 shrink-0">{formatarReais(game.preco)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold text-zinc-300">
            <p>
              Estimativa pelo preço cheio atual da loja brasileira. Não considera o que você pagou, promoções, presentes,
              pacotes nem reembolsos.
              {falharam > 0 && <span className="text-amber-300"> {falharam} jogos ficaram sem preço (a Steam bloqueou a consulta).</span>}
            </p>
            <button
              onClick={onCalcular}
              className={`${botaoBrutal} bg-zinc-200 text-zinc-950 hover:bg-white px-4 py-2 text-xs shrink-0 flex items-center justify-center gap-2`}
            >
              <Icone icone={RotateCcw} caixa={false} cor="escuro" tamanho={14} /> RECALCULAR
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ValorDaConta;
