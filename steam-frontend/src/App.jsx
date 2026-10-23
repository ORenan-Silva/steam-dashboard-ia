import { useEffect, useMemo, useRef, useState } from 'react';
import PainelBusca from './components/PainelBusca';
import CartaoPerfil from './components/CartaoPerfil';
import Recentes from './components/Recentes';
import QuasePlatinados from './components/QuasePlatinados';
import ValorDaConta from './components/ValorDaConta';
import Duelo from './components/Duelo';
import Biblioteca from './components/Biblioteca';
import Terminal from './components/Terminal';
import { getJson, postJson } from './lib/api';
import { formatarReais, resumirBiblioteca, somarValores } from './lib/biblioteca';
import { useChat } from './hooks/useChat';
import { useStatusServidor } from './hooks/useStatusServidor';

const LOTE_DE_PRECOS = 50;
const CALCULO_INICIAL = { estado: 'parado', progresso: 0, falharam: 0 };

// Link compartilhável: usa o nome personalizado do perfil quando existe, senão o SteamID64
const idParaLink = (perfil) => perfil.profileurl?.match(/\/id\/([^/]+)/)?.[1] || perfil.steamid;
const parametroDaUrl = (nome) => new URLSearchParams(window.location.search).get(nome) || '';

const atualizarUrl = (perfil, perfilRival) => {
  const params = new URLSearchParams({ id: idParaLink(perfil) });
  if (perfilRival) params.set('vs', idParaLink(perfilRival));
  window.history.replaceState(null, '', `?${params}`);
};

// Descobre o SteamID64 a partir do que foi digitado e busca perfil e biblioteca juntos
const buscarPerfilCompleto = async (texto) => {
  const { steamId } = await getJson(`/api/resolve?q=${encodeURIComponent(texto)}`);
  const [profile, biblioteca] = await Promise.all([
    getJson(`/api/profile/${steamId}`),
    getJson(`/api/games/${steamId}`),
  ]);
  return { steamId, profile, games: biblioteca.games || [] };
};

const mensagemDeErro = (err) => (err.message.startsWith('ERRO') ? err.message : `ERRO: ${err.message}`);

function App() {
  const [busca, setBusca] = useState(() => parametroDaUrl('id'));
  const [steamId, setSteamId] = useState('');
  const [profile, setProfile] = useState(null);
  const [games, setGames] = useState([]);
  const [recentes, setRecentes] = useState([]);
  const [loading, setLoading] = useState(() => parametroDaUrl('id') !== '');
  const [error, setError] = useState('');

  const [precos, setPrecos] = useState({});
  const [calculo, setCalculo] = useState(CALCULO_INICIAL);

  const [rival, setRival] = useState(null);
  const [carregandoRival, setCarregandoRival] = useState(false);
  const [erroRival, setErroRival] = useState('');

  const statusServidor = useStatusServidor();
  const { messages, isChatting, enviar, resetar } = useChat();

  const [terminalAberto, setTerminalAberto] = useState(false);
  const [mensagensVistas, setMensagensVistas] = useState(() => messages.length);

  // Cada busca ganha um número; um cálculo de valor antigo para se o perfil mudar no meio
  const buscaAtualRef = useRef(0);

  const resumo = useMemo(() => resumirBiblioteca(games), [games]);
  const valores = useMemo(() => somarValores(games, precos), [games, precos]);

  const buscarDados = (entrada) => {
    const texto = entrada.trim();
    if (!texto) return;

    setLoading(true);
    setError('');
    setProfile(null);
    setGames([]);
    setRecentes([]);
    setSteamId('');
    setPrecos({});
    setCalculo(CALCULO_INICIAL);
    setRival(null);
    setErroRival('');
    carregarPerfil(texto);
  };

  // Só mexe no estado depois das respostas, então pode ser chamada direto ao abrir a página
  const carregarPerfil = async (texto, textoRival = '') => {
    const numeroDaBusca = ++buscaAtualRef.current;
    try {
      const dados = await buscarPerfilCompleto(texto);
      if (numeroDaBusca !== buscaAtualRef.current) return;

      setSteamId(dados.steamId);
      setProfile(dados.profile);
      setGames(dados.games);
      atualizarUrl(dados.profile);

      // Perfil público com biblioteca privada: a Steam responde sem a lista de jogos
      if (dados.games.length === 0) {
        setError('AVISO: Biblioteca vazia ou privada. Em Steam > Privacidade, deixe "Detalhes do jogo" como Público.');
      }

      getJson(`/api/recent/${dados.steamId}`)
        .then(r => numeroDaBusca === buscaAtualRef.current && setRecentes(r.games))
        .catch(() => {});

      if (textoRival) carregarRival(textoRival, dados);
    } catch (err) {
      if (numeroDaBusca !== buscaAtualRef.current) return;
      setError(mensagemDeErro(err));
    } finally {
      if (numeroDaBusca === buscaAtualRef.current) setLoading(false);
    }
  };

  const carregarRival = async (texto, desafiante = { steamId, profile }) => {
    if (!texto.trim()) return;
    const numeroDaBusca = buscaAtualRef.current;
    setCarregandoRival(true);
    setErroRival('');
    try {
      const dados = await buscarPerfilCompleto(texto.trim());
      if (numeroDaBusca !== buscaAtualRef.current) return;
      if (dados.steamId === desafiante.steamId) {
        setErroRival('ERRO: Duelar contra você mesmo? Até a SteamBB tem limites.');
        return;
      }
      if (dados.games.length === 0) {
        setErroRival('ERRO: A biblioteca desse amigo é privada. Covarde.');
        return;
      }
      setRival({ ...dados, totalJogos: dados.games.length, resumo: resumirBiblioteca(dados.games) });
      atualizarUrl(desafiante.profile, dados.profile);
    } catch (err) {
      if (numeroDaBusca === buscaAtualRef.current) setErroRival(mensagemDeErro(err));
    } finally {
      if (numeroDaBusca === buscaAtualRef.current) setCarregandoRival(false);
    }
  };

  const trocarRival = () => {
    setRival(null);
    setErroRival('');
    atualizarUrl(profile);
  };

  // Link compartilhado (?id=...&vs=...): carrega os perfis assim que a página abre
  useEffect(() => {
    const id = parametroDaUrl('id');
    if (id) carregarPerfil(id, parametroDaUrl('vs'));
    // Roda uma vez só, ao abrir a página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calcularValor = async () => {
    if (games.length === 0) return;
    const numeroDaBusca = buscaAtualRef.current;
    const appIds = games.map(game => game.appid);
    const novosPrecos = {};
    let falharam = 0;

    setCalculo({ estado: 'calculando', progresso: 0, falharam: 0 });

    try {
      for (let i = 0; i < appIds.length; i += LOTE_DE_PRECOS) {
        const resposta = await postJson('/api/prices', { appIds: appIds.slice(i, i + LOTE_DE_PRECOS) });
        if (numeroDaBusca !== buscaAtualRef.current) return;

        Object.assign(novosPrecos, resposta.precos);
        falharam += resposta.falharam.length;
        const processados = Math.min(i + LOTE_DE_PRECOS, appIds.length);
        setPrecos({ ...novosPrecos });
        setCalculo({ estado: 'calculando', progresso: Math.round((processados / appIds.length) * 100), falharam });
      }
    } catch (err) {
      if (numeroDaBusca !== buscaAtualRef.current) return;
      setError(err.message);
      setCalculo(CALCULO_INICIAL);
      return;
    }

    setCalculo({ estado: 'pronto', progresso: 100, falharam });

    const { total, desperdicio } = somarValores(games, novosPrecos);
    if (total > 0) {
      // Se a SteamBB estiver falando, o comentário entra na fila e sai logo depois
      enviar({
        textoVisivel: `[ CÁLCULO FINANCEIRO CONCLUÍDO ]: ${formatarReais(total)}`,
        event: { type: 'value', total, wasted: desperdicio },
        esperarVez: true,
      });
    }
  };

  const clicarNoJogo = (game) => {
    if (isChatting) return;
    abrirTerminal();
    enviar({
      textoVisivel: `[ JOGO SELECIONADO ]: ${game.name}`,
      steamId,
      event: { type: 'game', appId: game.appid },
    });
  };

  const pedirVeredito = () => {
    if (isChatting || !rival) return;
    abrirTerminal();
    enviar({
      textoVisivel: `[ DUELO ]: ${profile.personaname} VS ${rival.profile.personaname}`,
      steamId,
      event: { type: 'duel', rivalId: rival.steamId },
    });
  };

  const perguntar = (texto) => enviar({ textoVisivel: texto, steamId });

  // No celular o terminal é uma tela por cima; o botão flutuante avisa quando chega resposta nova
  const abrirTerminal = () => {
    setTerminalAberto(true);
    setMensagensVistas(messages.length);
  };
  const fecharTerminal = () => {
    setTerminalAberto(false);
    setMensagensVistas(messages.length);
  };
  const temNovidade = !terminalAberto && messages.length > mensagensVistas;

  const temBiblioteca = profile && games.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4 md:p-8 selection:bg-fuchsia-500 selection:text-white">
      <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row gap-8 xl:gap-12 items-start">

        {/* COLUNA ESQUERDA: PERFIL E BIBLIOTECA */}
        <main className="flex-1 w-full min-w-0 flex flex-col gap-8">
          <PainelBusca
            busca={busca}
            setBusca={setBusca}
            onBuscar={buscarDados}
            loading={loading}
            error={error}
            statusServidor={statusServidor}
          />

          {profile && (
            <CartaoPerfil profile={profile} totalJogos={games.length} resumo={resumo} />
          )}

          {temBiblioteca && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <Recentes recentes={recentes} onGameClick={clicarNoJogo} ocupado={isChatting} />
              <QuasePlatinados key={steamId} steamId={steamId} onGameClick={clicarNoJogo} ocupado={isChatting} />
            </div>
          )}

          {temBiblioteca && (
            <ValorDaConta calculo={calculo} valores={valores} onCalcular={calcularValor} />
          )}

          {temBiblioteca && (
            <Duelo
              desafiante={{ profile, totalJogos: games.length, resumo }}
              rival={rival}
              carregando={carregandoRival}
              erro={erroRival}
              onDesafiar={(texto) => carregarRival(texto)}
              onTrocar={trocarRival}
              onVeredito={pedirVeredito}
              ocupado={isChatting}
            />
          )}

          {games.length > 0 && (
            <Biblioteca
              key={steamId}
              games={games}
              precos={precos}
              onGameClick={clicarNoJogo}
              ocupado={isChatting}
              tempoPrivado={resumo.tempoPrivado}
            />
          )}

          <footer className="text-xs font-bold text-zinc-600 uppercase text-center pb-20 xl:pb-0">
            Criado com sarcasmo, café e código • Dados da Steam Web API • Não afiliado à Valve
          </footer>
        </main>

        {/* COLUNA DIREITA: TERMINAL STEAM_BB */}
        <Terminal
          messages={messages}
          isChatting={isChatting}
          onEnviar={perguntar}
          onReset={resetar}
          aberto={terminalAberto}
          onFechar={fecharTerminal}
          temPerfil={games.length > 0}
        />
      </div>

      {!terminalAberto && (
        <button
          onClick={abrirTerminal}
          className="xl:hidden fixed bottom-4 right-4 z-40 bg-fuchsia-500 text-white text-sm font-black uppercase px-4 py-3 border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center gap-3 cursor-pointer"
        >
          <span className={`w-3 h-3 border-2 border-zinc-950 ${isChatting || temNovidade ? 'bg-lime-400 animate-pulse' : 'bg-zinc-950'}`} />
          {isChatting ? 'STEAM_BB DIGITANDO...' : '▶ STEAM_BB'}
        </button>
      )}
    </div>
  );
}

export default App;
