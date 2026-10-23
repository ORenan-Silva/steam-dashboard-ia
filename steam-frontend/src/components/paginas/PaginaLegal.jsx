import { useEffect, useRef } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import Icone from '../Icone';
import { botaoBrutal, cartaoBrutal } from '../../lib/estilos';
import { CONTATO_PRIVACIDADE, ULTIMA_ATUALIZACAO } from '../../lib/legal';

// Blocos de texto das páginas legais, no mesmo visual do site
export const Secao = ({ titulo, children }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg md:text-xl font-black uppercase text-lime-400 border-b-4 border-zinc-700 pb-2">{titulo}</h2>
    <div className="flex flex-col gap-3 text-sm md:text-base text-zinc-200 leading-relaxed">{children}</div>
  </section>
);

export const Lista = ({ children }) => <ul className="list-disc pl-5 flex flex-col gap-2 marker:text-lime-400">{children}</ul>;

export const LinkExterno = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-2 text-lime-400 hover:text-lime-300">
    {children}<span className="sr-only"> (abre em outra aba)</span>
  </a>
);

// Contato do canal de privacidade; mostra um aviso enquanto o e-mail não for configurado
export const Contato = () => (
  CONTATO_PRIVACIDADE ? (
    <a href={`mailto:${CONTATO_PRIVACIDADE}`} className="inline-flex items-center gap-2 underline decoration-2 underline-offset-2 text-lime-400 hover:text-lime-300 font-bold">
      <Icone icone={Mail} caixa={false} cor="lima" tamanho={16} /> {CONTATO_PRIVACIDADE}
    </a>
  ) : (
    <strong className="text-amber-300">o e-mail do canal de privacidade está sendo configurado e será publicado aqui em breve</strong>
  )
);

const PaginaLegal = ({ titulo, onVoltar, children }) => {
  const tituloRef = useRef(null);

  // Ao abrir a página, o foco vai para o título (quem usa leitor de tela sabe onde está)
  useEffect(() => {
    tituloRef.current?.focus();
  }, [titulo]);

  return (
    <article className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#a3e635] flex flex-col gap-8 entrada`}>
      <div className="flex flex-col gap-4">
        <button
          onClick={onVoltar}
          className={`${botaoBrutal} self-start bg-zinc-200 hover:bg-white text-zinc-950 px-4 py-2 text-xs flex items-center gap-2`}
        >
          <Icone icone={ArrowLeft} caixa={false} cor="escuro" tamanho={16} /> VOLTAR AO PAINEL
        </button>
        <h1 ref={tituloRef} tabIndex={-1} className="text-3xl md:text-4xl font-black uppercase">{titulo}</h1>
        <p className="text-sm font-bold text-zinc-300">Última atualização: {ULTIMA_ATUALIZACAO}</p>
      </div>
      {children}
    </article>
  );
};

export default PaginaLegal;
