import { Coffee, Search, TriangleAlert, Zap } from 'lucide-react';
import Icone from './Icone';
import { botaoBrutal, campoBrutal, cartaoBrutal } from '../lib/estilos';

const STATUS_SERVIDOR = {
  verificando: { texto: 'CONECTANDO...', cor: 'bg-zinc-400' },
  acordando: { texto: 'ACORDANDO...', cor: 'bg-amber-400 animate-pulse' },
  online: { texto: 'ONLINE', cor: 'bg-lime-400' },
  offline: { texto: 'OFFLINE', cor: 'bg-red-500' },
};

const PainelBusca = ({ busca, setBusca, onBuscar, loading, error, statusServidor, compacto }) => {
  const status = STATUS_SERVIDOR[statusServidor];

  const enviar = (e) => {
    e.preventDefault();
    onBuscar(busca);
  };

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#a3e635] entrada`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter bg-lime-400 text-zinc-950 border-4 border-zinc-200 py-3 px-6 shadow-[4px_4px_0px_0px_#e4e4e7] inline-block">
          {/* Passe o mouse para o glitch completo; de tempos em tempos ele "falha" sozinho */}
          <span className="glitch" data-texto="STEAM // DASH">STEAM // DASH</span>
        </h1>

        <div className="flex items-center gap-3">
          <span
            role="status"
            className="flex items-center gap-2 bg-zinc-950 border-4 border-zinc-200 px-3 py-2 text-xs font-black"
            title="Status do servidor da SteamBB"
          >
            <span className={`w-3 h-3 border-2 border-zinc-950 ${status.cor}`} aria-hidden="true" />
            <span className="hidden sm:inline">SERVIDOR: </span>{status.texto}
          </span>

          <a
            href="https://ko-fi.com/orenansilva"
            target="_blank"
            rel="noopener noreferrer"
            className={`${botaoBrutal} group bg-amber-400 hover:bg-amber-500 text-zinc-950 py-2 px-4 text-sm flex items-center gap-2`}
          >
            <Icone icone={Coffee} caixa={false} cor="escuro" className="tremer-no-hover" />
            <span className="sm:hidden">CAFÉ</span>
            <span className="hidden sm:inline">ME PAGUE UM CAFÉ</span>
            <span className="sr-only">(abre o Ko-fi em outra aba)</span>
          </a>
        </div>
      </div>

      {statusServidor === 'acordando' && (
        <div role="status" className="mb-8 bg-amber-400 text-zinc-950 border-4 border-zinc-200 p-4 text-sm shadow-[4px_4px_0px_0px_#e4e4e7] flex gap-3 items-start deslizar-cima">
          <Icone icone={Zap} caixa={false} cor="escuro" tamanho={22} className="animate-pulse mt-0.5" />
          <div className="flex flex-col gap-1">
            <strong className="font-black">LIGANDO OS SERVIDORES DA STEAM_BB...</strong>
            <span className="font-bold">O plano grátis dorme quando ninguém usa. Leva até 1 minuto.</span>
          </div>
        </div>
      )}

      <form onSubmit={enviar} className="flex flex-col sm:flex-row gap-5 sm:gap-6 pt-3">
        <div className="campo-moldura flex-1">
          <label
            htmlFor="busca-perfil"
            className="campo-etiqueta bg-zinc-200 text-zinc-950 text-xs font-black px-2.5 py-1 uppercase"
          >
            Perfil Steam
          </label>
          <input
            id="busca-perfil"
            type="text"
            placeholder="SteamID64, link do perfil ou nome..."
            autoComplete="off"
            spellCheck={false}
            className={`${campoBrutal} campo-destaque w-full px-4 pt-5 pb-3 text-base md:text-lg`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !busca.trim()}
          className={`${botaoBrutal} bg-lime-400 hover:bg-lime-300 text-zinc-950 py-4 px-8 whitespace-nowrap text-lg flex items-center justify-center gap-2`}
        >
          {loading ? (
            <span className="glitch-distorce">BUSCANDO...</span>
          ) : (
            <>
              <Icone icone={Search} caixa={false} cor="escuro" />
              CARREGAR
            </>
          )}
        </button>
      </form>

      {!compacto && (
        <p className="text-sm font-bold text-zinc-400 mt-5">
          Aceita o SteamID64, o link do perfil (steamcommunity.com/id/seunome) ou só o nome personalizado.
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-400 font-bold text-sm mt-6 bg-zinc-950 border-4 border-red-500 p-3 flex gap-2 items-start surgir">
          <Icone icone={TriangleAlert} caixa={false} cor="vermelho" tamanho={18} className="mt-0.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default PainelBusca;
