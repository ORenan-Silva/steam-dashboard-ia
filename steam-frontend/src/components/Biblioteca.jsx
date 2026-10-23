import { useMemo, useState } from 'react';
import CartaoJogo from './CartaoJogo';
import { botaoBrutal, campoBrutal, cartaoBrutal } from '../lib/estilos';

const POR_PAGINA = 48;

const FILTROS = {
  todos: { rotulo: 'TODOS', teste: () => true },
  nunca: { rotulo: 'NUNCA ABERTOS', teste: (g) => g.playtime_forever === 0 },
  jogados: { rotulo: 'JOGADOS', teste: (g) => g.playtime_forever > 0 },
  vicio: { rotulo: '+100H', teste: (g) => g.playtime_forever >= 6000 },
};

const Biblioteca = ({ games, precos, onGameClick, ocupado, tempoPrivado }) => {
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [sortBy, setSortBy] = useState('hours');
  const [sortOrder, setSortOrder] = useState('desc');
  const [limite, setLimite] = useState(POR_PAGINA);

  const temPrecos = Object.keys(precos).length > 0;

  const jogosVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = games.filter(g => FILTROS[filtro].teste(g) && (!termo || g.name?.toLowerCase().includes(termo)));

    return filtrados.sort((a, b) => {
      let comparison;
      if (sortBy === 'name') comparison = (a.name || '').localeCompare(b.name || '');
      else if (sortBy === 'id') comparison = a.appid - b.appid;
      else if (sortBy === 'price') comparison = (precos[a.appid]?.cheio ?? -1) - (precos[b.appid]?.cheio ?? -1);
      else comparison = a.playtime_forever - b.playtime_forever;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [games, precos, filtro, busca, sortBy, sortOrder]);

  // Qualquer mudança de filtro volta para a primeira página
  const mudar = (setter) => (valor) => {
    setter(valor);
    setLimite(POR_PAGINA);
  };

  return (
    <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24]`}>
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-3xl font-black uppercase bg-zinc-200 text-zinc-950 px-6 py-3 shadow-[4px_4px_0px_0px_#fbbf24]">
            BIBLIOTECA [{games.length}]
          </h3>
          <div className="flex items-center gap-3 bg-amber-400 border-4 border-zinc-200 p-3 shadow-[4px_4px_0px_0px_#e4e4e7]">
            <label htmlFor="sort" className="text-sm font-black uppercase hidden sm:block text-zinc-950">ORDENAR:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => mudar(setSortBy)(e.target.value)}
              className="bg-zinc-900 text-zinc-100 font-bold text-sm border-4 border-zinc-200 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="hours">HORAS</option>
              <option value="name">NOME</option>
              <option value="id">ID</option>
              {temPrecos && <option value="price">PREÇO</option>}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label={sortOrder === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
              className="bg-zinc-950 text-zinc-100 font-bold border-4 border-zinc-200 w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-zinc-800"
            >
              {sortOrder === 'asc' ? '⬆' : '⬇'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <input
            type="search"
            placeholder="FILTRAR POR NOME..."
            aria-label="Filtrar jogos por nome"
            value={busca}
            onChange={(e) => mudar(setBusca)(e.target.value)}
            className={`${campoBrutal} flex-1 px-4 py-3 text-sm`}
          />
          <div className="flex flex-wrap gap-2">
            {/* Sem as horas, os filtros por tempo de jogo não fazem sentido */}
            {Object.entries(FILTROS).filter(([chave]) => !tempoPrivado || chave === 'todos').map(([chave, { rotulo }]) => (
              <button
                key={chave}
                onClick={() => mudar(setFiltro)(chave)}
                aria-pressed={filtro === chave}
                className={`font-black text-xs uppercase border-4 border-zinc-200 px-3 py-2 cursor-pointer transition-colors ${
                  filtro === chave ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {jogosVisiveis.length === 0 ? (
        <p className="font-black uppercase text-zinc-400 bg-zinc-950 border-4 border-zinc-700 p-6 text-center">
          NADA AQUI. NEM SUA BIBLIOTECA TEM ESSE JOGO.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
          {jogosVisiveis.slice(0, limite).map((game) => (
            <CartaoJogo
              key={game.appid}
              game={game}
              preco={precos[game.appid]}
              onClick={onGameClick}
              ocupado={ocupado}
              tempoPrivado={tempoPrivado}
            />
          ))}
        </div>
      )}

      {jogosVisiveis.length > limite && (
        <div className="flex flex-col items-center gap-3 mt-10">
          <span className="text-xs font-bold text-zinc-400 uppercase">
            MOSTRANDO {limite} DE {jogosVisiveis.length}
          </span>
          <button
            onClick={() => setLimite(limite + POR_PAGINA)}
            className={`${botaoBrutal} bg-amber-400 hover:bg-amber-500 text-zinc-950 px-8 py-3`}
          >
            CARREGAR MAIS [+{Math.min(POR_PAGINA, jogosVisiveis.length - limite)}]
          </button>
        </div>
      )}
    </div>
  );
};

export default Biblioteca;
