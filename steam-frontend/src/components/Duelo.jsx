import { useState } from 'react';
import { botaoBrutal, campoBrutal, cartaoBrutal } from '../lib/estilos';
import { formatarHoras } from '../lib/biblioteca';

// Em cada critério, quem tiver o número MAIOR leva a caveira (é o "pior")
const CRITERIOS = [
  { rotulo: 'JOGOS', valor: (l) => l.totalJogos, formatar: (v) => v },
  { rotulo: 'HORAS TOTAIS', valor: (l) => l.resumo.totalMinutos, formatar: (v) => formatarHoras(v, 0) },
  { rotulo: 'NUNCA ABERTOS', valor: (l) => l.resumo.nuncaAbertos, formatar: (v) => v },
  {
    rotulo: '% ABANDONADA',
    valor: (l) => (l.totalJogos ? Math.round((l.resumo.nuncaAbertos / l.totalJogos) * 100) : 0),
    formatar: (v) => `${v}%`,
  },
  { rotulo: 'MAIOR VÍCIO', valor: (l) => l.resumo.maisJogado?.playtime_forever || 0, formatar: (v) => formatarHoras(v, 0) },
];

// A caveira fica no canto para sobrar espaço para o número no celular
const Celula = ({ texto, pior }) => (
  <div className={`relative px-2 py-3 border-2 text-center font-black text-base sm:text-lg md:text-xl ${pior ? 'bg-red-500 text-zinc-950 border-zinc-200' : 'bg-zinc-950 text-zinc-100 border-zinc-700'}`}>
    {pior && <span className="absolute -top-3 -left-3 text-lg leading-none" aria-label="pior">💀</span>}
    <span className="block truncate">{texto}</span>
  </div>
);

const Jogador = ({ profile }) => (
  <div className="flex flex-col items-center gap-2 min-w-0">
    <img src={profile.avatarfull} alt="" className="w-16 h-16 md:w-20 md:h-20 border-4 border-zinc-200 object-cover" />
    <span className="font-black uppercase text-sm md:text-base truncate max-w-full" title={profile.personaname}>{profile.personaname}</span>
  </div>
);

const Duelo = ({ desafiante, rival, carregando, erro, onDesafiar, onTrocar, onVeredito, ocupado }) => {
  const [busca, setBusca] = useState('');

  const placar = rival ? CRITERIOS.reduce((total, c) => {
    const a = c.valor(desafiante);
    const b = c.valor(rival);
    if (a > b) total.desafiante++;
    if (b > a) total.rival++;
    return total;
  }, { desafiante: 0, rival: 0 }) : null;

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#ef4444] flex flex-col gap-6`}>
      <h3 className="text-2xl md:text-3xl font-black uppercase bg-zinc-200 text-zinc-950 px-6 py-3 shadow-[4px_4px_0px_0px_#ef4444] self-start">
        ⚔ DUELO DE BIBLIOTECAS
      </h3>

      {!rival && (
        <>
          <p className="text-sm font-bold text-zinc-400 uppercase">
            COLOQUE UM AMIGO NO RINGUE. A STEAM_BB COMPARA AS BIBLIOTECAS E DECIDE QUEM É O PIOR GAMER.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); onDesafiar(busca); }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <input
              type="text"
              placeholder="STEAMID, LINK OU NOME DO AMIGO..."
              aria-label="Perfil do amigo para o duelo"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`${campoBrutal} flex-1 px-4 py-3 text-sm`}
            />
            <button
              type="submit"
              disabled={carregando || !busca.trim()}
              className={`${botaoBrutal} bg-red-500 hover:bg-red-600 text-zinc-950 py-3 px-6`}
            >
              {carregando ? 'CARREGANDO...' : 'DESAFIAR'}
            </button>
          </form>
          {erro && <p className="text-red-400 font-bold text-sm bg-zinc-950 border-4 border-red-500 p-3">{erro}</p>}
        </>
      )}

      {rival && (
        <>
          <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-4 md:gap-x-4 items-center">
            <span className="text-xs font-black text-zinc-500 uppercase">VS</span>
            <Jogador profile={desafiante.profile} />
            <Jogador profile={rival.profile} />

            {CRITERIOS.map(c => {
              const a = c.valor(desafiante);
              const b = c.valor(rival);
              return [
                <span key={`${c.rotulo}-r`} className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase break-words">{c.rotulo}</span>,
                <Celula key={`${c.rotulo}-a`} texto={c.formatar(a)} pior={a > b} />,
                <Celula key={`${c.rotulo}-b`} texto={c.formatar(b)} pior={b > a} />,
              ];
            })}

            <span className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase break-words">PLACAR DA VERGONHA</span>
            <div className="text-center text-3xl font-black text-red-400">{placar.desafiante}</div>
            <div className="text-center text-3xl font-black text-red-400">{placar.rival}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onVeredito}
              disabled={ocupado}
              className={`${botaoBrutal} flex-1 bg-red-500 hover:bg-red-600 text-zinc-950 py-4 px-4 text-base md:text-lg`}
            >
              STEAM_BB, QUEM PERDEU?
            </button>
            <button
              onClick={onTrocar}
              className={`${botaoBrutal} bg-zinc-200 hover:bg-white text-zinc-950 py-4 px-6 text-sm`}
            >
              TROCAR RIVAL
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Duelo;
