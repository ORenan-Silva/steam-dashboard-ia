import { botaoBrutal, campoBrutal, cartaoBrutal } from '../lib/estilos';

const STATUS_SERVIDOR = {
  verificando: { texto: 'CONECTANDO...', cor: 'bg-zinc-400' },
  acordando: { texto: 'ACORDANDO...', cor: 'bg-amber-400 animate-pulse' },
  online: { texto: 'ONLINE', cor: 'bg-lime-400' },
  offline: { texto: 'OFFLINE', cor: 'bg-red-500' },
};

const PainelBusca = ({ busca, setBusca, onBuscar, loading, error, statusServidor }) => {
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

        <div className="flex flex-wrap items-center gap-3">
          <span
            className="flex items-center gap-2 bg-zinc-950 border-4 border-zinc-200 px-3 py-2 text-xs font-black"
            title="Status do servidor da SteamBB"
          >
            <span className={`w-3 h-3 border-2 border-zinc-950 ${status.cor}`} />
            SERVIDOR: {status.texto}
          </span>

          <a
            href="https://ko-fi.com/orenansilva"
            target="_blank"
            rel="noopener noreferrer"
            className={`${botaoBrutal} bg-amber-400 hover:bg-amber-500 text-zinc-950 py-2 px-4 text-sm flex items-center gap-2`}
          >
            <span className="text-lg">☕</span> ME PAGUE UM CAFÉ
          </a>
        </div>
      </div>

      {statusServidor === 'acordando' && (
        <div className="mb-6 bg-amber-400 text-zinc-950 border-4 border-zinc-200 p-4 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#e4e4e7]">
          ⚡ LIGANDO OS SERVIDORES DA STEAM_BB... O PLANO GRÁTIS DORME QUANDO NINGUÉM USA. LEVA ATÉ 1 MINUTO.
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
          className={`${botaoBrutal} bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-4 px-8 whitespace-nowrap text-lg`}
        >
          {loading ? 'BUSCANDO...' : '[ CARREGAR ]'}
        </button>
      </form>

      <p className="text-xs font-bold text-zinc-500 mt-4 uppercase">
        Aceita: 76561197960435530 • steamcommunity.com/id/seunome • seunome
      </p>

      {error && (
        <p className="text-red-400 font-bold text-sm mt-6 bg-zinc-950 border-4 border-red-500 p-3">{error}</p>
      )}
    </div>
  );
};

export default PainelBusca;
