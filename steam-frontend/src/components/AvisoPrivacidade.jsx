import { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import Icone from './Icone';
import { botaoBrutal } from '../lib/estilos';
import { IDADE_MINIMA } from '../lib/legal';

// Aviso do primeiro acesso: idade mínima, o que é guardado e a escolha sobre estatísticas.
// O site não usa cookies; as estatísticas (Vercel Analytics) só ligam se a pessoa aceitar.
const AvisoPrivacidade = ({ onEscolher, onAbrirPagina }) => {
  const tituloRef = useRef(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  const link = (destino, texto) => (
    <a
      href={destino}
      onClick={(e) => { e.preventDefault(); onAbrirPagina(destino); }}
      className="underline decoration-2 underline-offset-2 text-lime-400 hover:text-lime-300"
    >
      {texto}
    </a>
  );

  return (
    <section
      role="region"
      aria-labelledby="aviso-privacidade-titulo"
      className="deslizar-cima fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4"
    >
      <div className="max-w-4xl mx-auto bg-zinc-900 border-4 border-zinc-200 shadow-[8px_8px_0px_0px_#a3e635] p-5 flex flex-col gap-4">
        <h2
          id="aviso-privacidade-titulo"
          ref={tituloRef}
          tabIndex={-1}
          className="font-black uppercase text-lg flex items-center gap-3"
        >
          <Icone icone={ShieldCheck} cor="lima" tamanho={22} />
          Antes de entrar no ringue
        </h2>
        <div className="flex flex-col gap-2 text-sm text-zinc-200">
          <p>
            <strong className="text-zinc-100">Conteúdo para maiores de {IDADE_MINIMA} anos:</strong> a SteamBB é uma IA de humor
            ácido e solta palavrão. Ao usar o site, você declara ter {IDADE_MINIMA} anos ou mais e concorda com os{' '}
            {link('/termos', 'Termos de Uso')}.
          </p>
          <p>
            <strong className="text-zinc-100">Não usamos cookies.</strong> Guardamos no seu navegador só a conversa com a IA e esta
            escolha. Se você permitir, contamos visitas de forma anônima com o Vercel Analytics, sem guardar qual perfil você
            pesquisou. Detalhes na {link('/privacidade', 'Política de Privacidade')}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onEscolher(true)}
            className={`${botaoBrutal} bg-lime-400 hover:bg-lime-300 text-zinc-950 px-5 py-3 text-sm`}
          >
            Permitir estatísticas
          </button>
          <button
            onClick={() => onEscolher(false)}
            className={`${botaoBrutal} bg-zinc-200 hover:bg-white text-zinc-950 px-5 py-3 text-sm`}
          >
            Só o essencial
          </button>
        </div>
      </div>
    </section>
  );
};

export default AvisoPrivacidade;
