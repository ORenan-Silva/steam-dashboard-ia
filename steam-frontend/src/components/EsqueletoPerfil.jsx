import { cartaoBrutal } from '../lib/estilos';

// Silhueta do cartão de perfil enquanto os dados chegam (pode levar até 1 min se o servidor estiver acordando)
const Bloco = ({ className }) => <div className={`bg-zinc-800 animate-pulse ${className}`} />;

// Olho vigiando: adaptado do loader "brown-puma-30" de 0xnihilism (Uiverse.io, MIT)
const OlhoDaSteamBB = () => (
  <div className="olho-loader mx-auto" aria-hidden="true">
    <div className="holofote" />
    <div className="olho">
      <div className="pupila" />
      <div className="palpebra" />
    </div>
    <div className="texto">A STEAM_BB ESTÁ DE OLHO</div>
    <div className="linhas" />
  </div>
);

const EsqueletoPerfil = () => (
  <div
    className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col lg:flex-row gap-8 items-center entrada`}
    role="status"
    aria-label="Carregando perfil"
  >
    <div className="w-full max-w-[260px] shrink-0">
      <OlhoDaSteamBB />
    </div>
    <div className="flex flex-col gap-6 flex-1 w-full">
      <div className="flex items-center gap-6">
        <Bloco className="w-20 h-20 md:w-24 md:h-24 border-4 border-zinc-700 shrink-0" />
        <div className="flex flex-col gap-3 flex-1">
          <Bloco className="h-8 md:h-10 w-2/3" />
          <Bloco className="h-6 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-950 border-4 border-zinc-700 p-4 flex flex-col gap-2">
            <Bloco className="h-3 w-16" />
            <Bloco className="h-8 w-24" />
          </div>
        ))}
      </div>
      <p className="text-sm font-bold text-zinc-300">Vasculhando sua biblioteca na Steam...</p>
    </div>
  </div>
);

export default EsqueletoPerfil;
