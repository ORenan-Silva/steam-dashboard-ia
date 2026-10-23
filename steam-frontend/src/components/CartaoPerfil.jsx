import { useState } from 'react';
import { Check, ExternalLink, Flame, Gamepad2, Hourglass, Lock, Share2, Skull } from 'lucide-react';
import Icone from './Icone';
import Numero from './Numero';
import { botaoBrutal, cartaoBrutal } from '../lib/estilos';
import { formatarHoras } from '../lib/biblioteca';

const horasInteiras = (minutos) => formatarHoras(minutos, 0);

const Estatistica = ({ icone, rotulo, children, detalhe, cor, corIcone, atraso }) => (
  <div
    className="group entrada bg-zinc-950 border-4 border-zinc-200 p-4 flex flex-col gap-1 min-w-0 transition-transform duration-200 hover:-translate-y-1"
    style={{ '--atraso': `${atraso}ms` }}
  >
    <span className="text-xs font-black text-zinc-300 uppercase flex items-center gap-2">
      <Icone icone={icone} caixa={false} cor={corIcone} tamanho={16} className="tremer-no-hover" />
      {rotulo}
    </span>
    <span className={`text-2xl md:text-3xl font-black truncate ${cor}`}>{children}</span>
    {detalhe && <span className="text-xs font-bold text-zinc-400 uppercase truncate" title={detalhe}>{detalhe}</span>}
  </div>
);

const Oculto = () => (
  <span className="flex items-center gap-2">
    <Icone icone={Lock} caixa={false} tamanho={22} /> OCULTO
  </span>
);

const CartaoPerfil = ({ profile, totalJogos, resumo }) => {
  const [copiado, setCopiado] = useState(false);
  const online = profile.personastate > 0;
  const porcentagemNunca = totalJogos > 0 ? Math.round((resumo.nuncaAbertos / totalJogos) * 100) : 0;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      window.prompt('Copie o link do seu perfil:', window.location.href);
    }
  };

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col gap-6 entrada`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative shrink-0 estalo">
          <img
            src={profile.avatarfull}
            alt={`Avatar de ${profile.personaname} na Steam`}
            width="128"
            height="128"
            className="w-24 h-24 md:w-32 md:h-32 object-cover border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7] bg-zinc-800"
          />
          <span
            aria-hidden="true"
            className={`absolute -bottom-3 -right-3 w-6 h-6 border-4 border-zinc-200 ${online ? 'bg-lime-400 animate-pulse' : 'bg-zinc-500'}`}
          />
        </div>

        <div className="overflow-hidden flex-1 min-w-0">
          <h2 className="text-3xl md:text-4xl font-black uppercase truncate text-zinc-100" title={profile.personaname}>
            {profile.personaname}
          </h2>
          <p className="text-sm md:text-base font-bold mt-2 bg-zinc-800 text-zinc-200 border-2 border-zinc-700 inline-block px-3 py-1">
            {online ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}
          </p>
        </div>

        <div className="flex sm:flex-col gap-3 w-full sm:w-auto relative">
          <a
            href={profile.profileurl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${botaoBrutal} bg-zinc-200 text-zinc-950 hover:bg-white px-4 py-2 text-xs flex-1 flex items-center justify-center gap-2`}
          >
            VER NA STEAM <Icone icone={ExternalLink} caixa={false} cor="escuro" tamanho={14} />
            <span className="sr-only">(abre em outra aba)</span>
          </a>
          <button
            onClick={copiarLink}
            className={`${botaoBrutal} bg-lime-400 text-zinc-950 hover:bg-lime-300 px-4 py-2 text-xs flex-1 flex items-center justify-center gap-2`}
          >
            <Icone icone={copiado ? Check : Share2} caixa={false} cor="escuro" tamanho={14} />
            {copiado ? 'COPIADO!' : 'COMPARTILHAR'}
          </button>
          {copiado && (
            <span role="status" className="deslizar-cima absolute -top-11 right-0 bg-lime-400 text-zinc-950 border-4 border-zinc-200 px-3 py-1 text-xs font-black whitespace-nowrap shadow-[4px_4px_0px_0px_#e4e4e7]">
              LINK NA ÁREA DE TRANSFERÊNCIA
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Estatistica icone={Gamepad2} rotulo="Jogos" cor="text-zinc-100" corIcone="claro" atraso={100}>
          <Numero valor={totalJogos} />
        </Estatistica>
        {resumo.tempoPrivado ? (
          <>
            <Estatistica icone={Hourglass} rotulo="Horas totais" detalhe="TEMPO DE JOGO ESCONDIDO" cor="text-amber-400" corIcone="ambar" atraso={180}>
              <Oculto />
            </Estatistica>
            <Estatistica icone={Skull} rotulo="Nunca abertos" detalhe="TEMPO DE JOGO ESCONDIDO" cor="text-red-400" corIcone="vermelho" atraso={260}>
              <Oculto />
            </Estatistica>
            <Estatistica icone={Flame} rotulo="Maior vício" detalhe="TEMPO DE JOGO ESCONDIDO" cor="text-lime-400" corIcone="lima" atraso={340}>
              <Oculto />
            </Estatistica>
          </>
        ) : (
          <>
            <Estatistica icone={Hourglass} rotulo="Horas totais" cor="text-amber-400" corIcone="ambar" atraso={180}>
              <Numero valor={resumo.totalMinutos} formatar={horasInteiras} />
            </Estatistica>
            <Estatistica
              icone={Skull}
              rotulo="Nunca abertos"
              detalhe={`${porcentagemNunca}% DA BIBLIOTECA`}
              cor="text-red-400"
              corIcone="vermelho"
              atraso={260}
            >
              <Numero valor={resumo.nuncaAbertos} />
            </Estatistica>
            <Estatistica
              icone={Flame}
              rotulo="Maior vício"
              detalhe={resumo.maisJogado?.name}
              cor="text-lime-400"
              corIcone="lima"
              atraso={340}
            >
              {resumo.maisJogado ? <Numero valor={resumo.maisJogado.playtime_forever} formatar={horasInteiras} /> : '—'}
            </Estatistica>
          </>
        )}
      </div>

      {resumo.tempoPrivado && (
        <p className="text-sm font-bold text-amber-300 bg-zinc-950 border-4 border-amber-400 p-3 flex gap-2 items-start">
          <Icone icone={Lock} caixa={false} cor="ambar" tamanho={18} className="mt-0.5" />
          <span>
            Essa conta esconde o tempo de jogo. Para ver as horas: Steam &gt; Privacidade &gt; desmarque "Manter meu tempo de jogo sempre privado".
          </span>
        </p>
      )}
    </div>
  );
};

export default CartaoPerfil;
