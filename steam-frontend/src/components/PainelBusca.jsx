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
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#a3e635]`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter bg-lime-400 text-zinc-950 border-4 border-zinc-200 py-3 px-6 shadow-[4px_4px_0px_0px_#e4e4e7] inline-block">
          STEAM // DASH
        </h1>

        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-2 bg-zinc-950 border-4 border-zinc-200 px-3 py-2 text-xs font-black"
            title="Status do servidor da SteamBB"
          >
            <span className={`w-3 h-3 border-2 border-zinc-950 ${status.cor}`} />
            <span className="hidden sm:inline">SERVIDOR: </span>{status.texto}
          </span>

          <a
            href="https://ko-fi.com/orenansilva"
            target="_blank"
            rel="noopener noreferrer"
            className={`${botaoBrutal} bg-amber-400 hover:bg-amber-500 text-zinc-950 py-2 px-4 text-sm flex items-center gap-2`}
          >
            <span className="text-lg">☕</span>
            <span className="sm:hidden">CAFÉ</span>
            <span className="hidden sm:inline">ME PAGUE UM CAFÉ</span>
          </a>
        </div>
      </div>

      {statusServidor === 'acordando' && (
        <div className="mb-6 bg-amber-400 text-zinc-950 border-4 border-zinc-200 p-4 text-sm shadow-[4px_4px_0px_0px_#e4e4e7] flex flex-col gap-1">
          <strong className="font-black">⚡ LIGANDO OS SERVIDORES DA STEAM_BB...</strong>
          <span className="font-bold">O plano grátis dorme quando ninguém usa. Leva até 1 minuto.</span>
        </div>
      )}

      <form onSubmit={enviar} className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="STEAMID64, LINK DO PERFIL OU NOME..."
          aria-label="SteamID64, link do perfil ou nome personalizado"
          className={`${campoBrutal} flex-1 px-4 py-4 md:py-3 shadow-[4px_4px_0px_0px_#e4e4e7] text-base md:text-lg`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !busca.trim()}
          className={`${botaoBrutal} bg-lime-400 hover:bg-lime-500 text-zinc-950 py-4 px-8 whitespace-nowrap text-lg`}
        >
          {loading ? 'BUSCANDO...' : '[ CARREGAR ]'}
        </button>
      </form>

      {!compacto && (
        <p className="text-sm font-bold text-zinc-400 mt-4">
          Aceita o SteamID64, o link do perfil (steamcommunity.com/id/seunome) ou só o nome personalizado.
        </p>
      )}

      {error && (
        <p className="text-red-400 font-bold text-sm mt-6 bg-zinc-950 border-4 border-red-500 p-3">{error}</p>
      )}
    </div>
  );
};

export default PainelBusca;
