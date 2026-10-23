import { cartaoBrutal } from '../lib/estilos';

// Silhueta do cartão de perfil enquanto os dados chegam (pode levar até 1 min se o servidor estiver acordando)
const Bloco = ({ className }) => <div className={`bg-zinc-800 animate-pulse ${className}`} />;

const EsqueletoPerfil = () => (
  <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col gap-6`} aria-busy="true" aria-label="Carregando perfil">
    <div className="flex items-center gap-6">
      <Bloco className="w-24 h-24 md:w-32 md:h-32 border-4 border-zinc-700 shrink-0" />
      <div className="flex flex-col gap-3 flex-1">
        <Bloco className="h-8 md:h-10 w-2/3" />
        <Bloco className="h-6 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bg-zinc-950 border-4 border-zinc-700 p-4 flex flex-col gap-2">
          <Bloco className="h-3 w-16" />
          <Bloco className="h-8 w-24" />
        </div>
      ))}
    </div>
    <p className="text-sm font-bold text-zinc-400 animate-pulse">Vasculhando sua biblioteca na Steam...</p>
  </div>
);

export default EsqueletoPerfil;
