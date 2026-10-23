import { useState } from 'react';
import { botaoBrutal, cartaoBrutal } from '../lib/estilos';
import { formatarHoras } from '../lib/biblioteca';

const Estatistica = ({ rotulo, valor, detalhe, cor }) => (
  <div className="bg-zinc-950 border-4 border-zinc-200 p-4 flex flex-col gap-1 min-w-0">
    <span className="text-xs font-black text-zinc-400 uppercase">{rotulo}</span>
    <span className={`text-2xl md:text-3xl font-black truncate ${cor}`} title={String(valor)}>{valor}</span>
    {detalhe && <span className="text-xs font-bold text-zinc-500 uppercase truncate" title={detalhe}>{detalhe}</span>}
  </div>
);

const CartaoPerfil = ({ profile, totalJogos, resumo }) => {
  const [copiado, setCopiado] = useState(false);
  const online = profile.personastate > 0;
  const porcentagemNunca = totalJogos > 0 ? Math.round((resumo.nuncaAbertos / totalJogos) * 100) : 0;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o link do seu perfil:', window.location.href);
    }
  };

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#22d3ee] flex flex-col gap-6`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative shrink-0">
          <img
            src={profile.avatarfull}
            alt={`Avatar de ${profile.personaname}`}
            className="w-24 h-24 md:w-32 md:h-32 object-cover border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7]"
          />
          <span className={`absolute -bottom-3 -right-3 w-6 h-6 border-4 border-zinc-200 ${online ? 'bg-lime-400' : 'bg-zinc-500'}`} />
        </div>

        <div className="overflow-hidden flex-1 min-w-0">
          <h2 className="text-3xl md:text-4xl font-black uppercase truncate text-zinc-100" title={profile.personaname}>
            {profile.personaname}
          </h2>
          <p className="text-sm md:text-base font-bold mt-2 bg-zinc-800 text-zinc-200 border-2 border-zinc-700 inline-block px-3 py-1">
            {online ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}
          </p>
        </div>

        <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
          <a
            href={profile.profileurl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${botaoBrutal} bg-zinc-200 text-zinc-950 hover:bg-white px-4 py-2 text-xs text-center flex-1`}
          >
            VER NA STEAM ↗
          </a>
          <button
            onClick={copiarLink}
            className={`${botaoBrutal} bg-pink-400 text-zinc-950 hover:bg-pink-500 px-4 py-2 text-xs flex-1`}
          >
            {copiado ? 'LINK COPIADO!' : 'COMPARTILHAR'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Estatistica rotulo="Jogos" valor={totalJogos} cor="text-zinc-100" />
        <Estatistica rotulo="Horas totais" valor={formatarHoras(resumo.totalMinutos, 0)} cor="text-amber-400" />
        <Estatistica
          rotulo="Nunca abertos"
          valor={resumo.nuncaAbertos}
          detalhe={`${porcentagemNunca}% DA BIBLIOTECA`}
          cor="text-red-400"
        />
        <Estatistica
          rotulo="Maior vício"
          valor={resumo.maisJogado ? formatarHoras(resumo.maisJogado.playtime_forever, 0) : '—'}
          detalhe={resumo.maisJogado?.name}
          cor="text-lime-400"
        />
      </div>
    </div>
  );
};

export default CartaoPerfil;
