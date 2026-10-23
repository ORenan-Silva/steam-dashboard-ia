import { IDADE_MINIMA } from '../lib/legal';

const LINKS = [
  { destino: '/privacidade', texto: 'Política de Privacidade' },
  { destino: '/termos', texto: 'Termos de Uso' },
  { destino: '/seus-dados', texto: 'Seus dados (LGPD)' },
];

const classeLink = 'underline decoration-2 underline-offset-4 text-zinc-200 hover:text-lime-400 cursor-pointer';

const Rodape = ({ onAbrirPagina, onAbrirPreferencias }) => (
  <footer className="flex flex-col gap-3 text-xs font-bold text-zinc-400 text-center pb-24 xl:pb-0 border-t-4 border-zinc-800 pt-6">
    <nav aria-label="Informações legais" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
      {LINKS.map(({ destino, texto }) => (
        <a key={destino} href={destino} onClick={(e) => { e.preventDefault(); onAbrirPagina(destino); }} className={classeLink}>
          {texto}
        </a>
      ))}
      <button onClick={onAbrirPreferencias} className={classeLink}>Preferências de privacidade</button>
      <a href="/licencas.txt" target="_blank" rel="noopener noreferrer" className={classeLink}>
        Créditos e licenças<span className="sr-only"> (abre em outra aba)</span>
      </a>
    </nav>
    <p>
      Projeto independente, não afiliado à Valve. Steam e o logotipo da Steam são marcas da Valve Corporation. Nomes e imagens
      de jogos pertencem aos respectivos donos. Dados da Steam Web API.
    </p>
    <p>
      Respostas geradas por IA, em tom de humor, para maiores de {IDADE_MINIMA} anos. Valores são estimativas. Criado com
      sarcasmo, café e código.
    </p>
  </footer>
);

export default Rodape;
