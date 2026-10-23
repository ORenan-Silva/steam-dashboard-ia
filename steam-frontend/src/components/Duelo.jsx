import { useState } from 'react';
import { Gavel, Lock, Repeat, Skull, Swords, TriangleAlert } from 'lucide-react';
import Icone from './Icone';
import TituloCard from './TituloCard';
import { botaoBrutal, campoBrutal, cartaoBrutal } from '../lib/estilos';
import { formatarHoras } from '../lib/biblioteca';

// Em cada critério, quem tiver o número MAIOR leva a caveira (é o "pior").
// Critérios com usaHoras não existem para quem esconde o tempo de jogo na Steam.
const CRITERIOS = [
  { rotulo: 'JOGOS', valor: (l) => l.totalJogos, formatar: (v) => v },
  { rotulo: 'HORAS TOTAIS', usaHoras: true, valor: (l) => l.resumo.totalMinutos, formatar: (v) => formatarHoras(v, 0) },
  { rotulo: 'NUNCA ABERTOS', usaHoras: true, valor: (l) => l.resumo.nuncaAbertos, formatar: (v) => v },
  {
    rotulo: '% ABANDONADA',
    usaHoras: true,
    valor: (l) => (l.totalJogos ? Math.round((l.resumo.nuncaAbertos / l.totalJogos) * 100) : 0),
    formatar: (v) => `${v}%`,
  },
  { rotulo: 'MAIOR VÍCIO', usaHoras: true, valor: (l) => l.resumo.maisJogado?.playtime_forever || 0, formatar: (v) => formatarHoras(v, 0) },
];

const OCULTO = 'OCULTO';

// Compara um critério; se algum lado esconde as horas, ninguém leva caveira nele
const comparar = (c, a, b) => {
  const aOculto = c.usaHoras && a.resumo.tempoPrivado;
  const bOculto = c.usaHoras && b.resumo.tempoPrivado;
  const va = c.valor(a);
  const vb = c.valor(b);
  const comparavel = !aOculto && !bOculto;
  return {
    textoA: aOculto ? OCULTO : c.formatar(va),
    textoB: bOculto ? OCULTO : c.formatar(vb),
    piorA: comparavel && va > vb,
    piorB: comparavel && vb > va,
  };
};

// A caveira fica no canto para sobrar espaço para o número no celular
const Celula = ({ texto, pior, atraso }) => (
  <div
    className={`surgir relative px-2 py-3 border-2 text-center font-black text-base sm:text-lg md:text-xl ${
      pior ? 'bg-red-500 text-zinc-950 border-zinc-200' : 'bg-zinc-950 text-zinc-100 border-zinc-700'
    }`}
    style={{ animationDelay: `${atraso}ms` }}
  >
    {pior && (
      <span className="absolute -top-3 -left-3 bg-zinc-950 border-2 border-zinc-200 p-0.5 text-red-400 tremer" style={{ '--atraso': `${atraso + 300}ms` }}>
        <Skull size={16} strokeWidth={2.75} aria-hidden="true" />
      </span>
    )}
    <span className="flex items-center justify-center gap-1 truncate">
      {texto === OCULTO && <Lock size={16} strokeWidth={2.75} aria-hidden="true" />}
      {texto}
    </span>
    {pior && <span className="sr-only">(pior neste critério)</span>}
  </div>
);

// O nome aparece logo abaixo, então o avatar é decorativo (alt vazio)
const Jogador = ({ profile }) => (
  <div className="flex flex-col items-center gap-2 min-w-0 estalo">
    <img src={profile.avatarfull} alt="" width="80" height="80" className="w-16 h-16 md:w-20 md:h-20 border-4 border-zinc-200 object-cover bg-zinc-800" />
    <span className="font-black uppercase text-sm md:text-base truncate max-w-full" title={profile.personaname}>{profile.personaname}</span>
  </div>
);

const Duelo = ({ desafiante, rival, carregando, erro, onDesafiar, onTrocar, onVeredito, ocupado }) => {
  const [busca, setBusca] = useState('');

  const comparacoes = rival ? CRITERIOS.map(c => ({ c, ...comparar(c, desafiante, rival) })) : [];
  const placar = {
    desafiante: comparacoes.filter(x => x.piorA).length,
    rival: comparacoes.filter(x => x.piorB).length,
  };
  const escondem = rival ? [desafiante, rival].filter(l => l.resumo.tempoPrivado).map(l => l.profile.personaname) : [];

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#ef4444] flex flex-col gap-6 entrada`}>
      <TituloCard icone={Swords} sombra="shadow-[4px_4px_0px_0px_#ef4444]" grande>DUELO DE BIBLIOTECAS</TituloCard>

      {!rival && (
        <>
          <p className="text-sm font-bold text-zinc-300">
            Coloque um amigo no ringue. A SteamBB compara as bibliotecas e decide quem é o pior gamer.
            {' '}<strong className="text-zinc-100">Só desafie quem topou a zoeira.</strong>
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); onDesafiar(busca); }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <label htmlFor="busca-rival" className="sr-only">Perfil do amigo para o duelo</label>
            <input
              id="busca-rival"
              type="text"
              placeholder="SteamID, link ou nome do amigo..."
              autoComplete="off"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`${campoBrutal} flex-1 px-4 py-3 text-sm`}
            />
            <button
              type="submit"
              disabled={carregando || !busca.trim()}
              className={`${botaoBrutal} bg-red-500 hover:bg-red-400 text-zinc-950 py-3 px-6 flex items-center justify-center gap-2`}
            >
              {carregando ? <span className="glitch-distorce">CARREGANDO...</span> : (
                <>
                  <Icone icone={Swords} caixa={false} cor="escuro" /> DESAFIAR
                </>
              )}
            </button>
          </form>
          {erro && (
            <p role="alert" className="text-red-400 font-bold text-sm bg-zinc-950 border-4 border-red-500 p-3 flex gap-2 items-start surgir">
              <Icone icone={TriangleAlert} caixa={false} cor="vermelho" tamanho={18} className="mt-0.5" />
              <span>{erro}</span>
            </p>
          )}
        </>
      )}

      {rival && (
        <>
          <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-4 md:gap-x-4 items-center">
            <span className="glitch text-2xl font-black text-red-400" data-texto="VS" aria-hidden="true">VS</span>
            <Jogador profile={desafiante.profile} />
            <Jogador profile={rival.profile} />

            {comparacoes.map(({ c, textoA, textoB, piorA, piorB }, i) => [
              <span key={`${c.rotulo}-r`} className="text-[11px] sm:text-xs font-black text-zinc-300 uppercase break-words">{c.rotulo}</span>,
              <Celula key={`${c.rotulo}-a`} texto={textoA} pior={piorA} atraso={i * 90} />,
              <Celula key={`${c.rotulo}-b`} texto={textoB} pior={piorB} atraso={i * 90 + 45} />,
            ])}

            <span className="text-[11px] sm:text-xs font-black text-zinc-300 uppercase break-words">PLACAR DA VERGONHA</span>
            <div className="text-center text-4xl font-black text-red-400 estalo" style={{ '--atraso': '600ms' }}>{placar.desafiante}</div>
            <div className="text-center text-4xl font-black text-red-400 estalo" style={{ '--atraso': '650ms' }}>{placar.rival}</div>
          </div>

          {escondem.length > 0 && (
            <p className="text-sm font-bold text-amber-300 bg-zinc-950 border-4 border-amber-400 p-3 flex gap-2 items-start">
              <Icone icone={Lock} caixa={false} cor="ambar" tamanho={18} className="mt-0.5" />
              <span>
                {escondem.join(' e ')} esconde{escondem.length > 1 ? 'm' : ''} o tempo de jogo na Steam, então os critérios de horas ficam fora do placar.
                {' '}Para liberar: Steam &gt; Privacidade &gt; desmarque "Manter meu tempo de jogo sempre privado".
              </span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onVeredito}
              disabled={ocupado}
              className={`${botaoBrutal} flex-1 bg-red-500 hover:bg-red-400 text-zinc-950 py-4 px-4 text-base md:text-lg flex items-center justify-center gap-3`}
            >
              <Icone icone={Gavel} caixa={false} cor="escuro" tamanho={22} /> STEAM_BB, QUEM PERDEU?
            </button>
            <button
              onClick={onTrocar}
              className={`${botaoBrutal} bg-zinc-200 hover:bg-white text-zinc-950 py-4 px-6 text-sm flex items-center justify-center gap-2`}
            >
              <Icone icone={Repeat} caixa={false} cor="escuro" tamanho={18} /> TROCAR RIVAL
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Duelo;
