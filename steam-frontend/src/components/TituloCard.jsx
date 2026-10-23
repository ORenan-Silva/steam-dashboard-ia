import Icone from './Icone';

// Título dos cards: etiqueta clara com ícone. "sombra" recebe a classe inteira para o Tailwind enxergar a cor.
const TituloCard = ({ icone, sombra, grande = false, children }) => (
  <h2
    className={`group flex items-center gap-3 font-black uppercase bg-zinc-200 text-zinc-950 self-start ${sombra} ${
      grande ? 'text-2xl md:text-3xl px-5 py-3' : 'text-lg md:text-xl px-4 py-2 whitespace-nowrap'
    }`}
  >
    {icone && <Icone icone={icone} caixa={false} cor="escuro" tamanho={grande ? 28 : 22} className="tremer-no-hover" />}
    {children}
  </h2>
);

export default TituloCard;
