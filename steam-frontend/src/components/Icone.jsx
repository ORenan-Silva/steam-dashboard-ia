// Ícone (Lucide, licença ISC) dentro de uma caixinha brutalista, no lugar dos emojis
const CORES = {
  lima: 'text-lime-400',
  ambar: 'text-amber-400',
  ciano: 'text-cyan-400',
  vermelho: 'text-red-400',
  claro: 'text-zinc-100',
  escuro: 'text-zinc-950',
};

const Icone = ({ icone: Desenho, cor = 'claro', tamanho = 20, caixa = true, className = '' }) => {
  const svg = <Desenho size={tamanho} strokeWidth={2.75} aria-hidden="true" focusable="false" />;
  if (!caixa) return <span className={`inline-flex shrink-0 ${CORES[cor]} ${className}`}>{svg}</span>;
  return (
    <span className={`inline-flex items-center justify-center shrink-0 bg-zinc-950 border-2 border-zinc-200 p-1.5 ${CORES[cor]} ${className}`}>
      {svg}
    </span>
  );
};

export default Icone;
