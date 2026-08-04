import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Loader from './components/Loader';

function App() {
  const [steamId, setSteamId] = useState('');
  const [profile, setProfile] = useState(null);
  const [games, setGames] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [sortBy, setSortBy] = useState('hours');
  const [sortOrder, setSortOrder] = useState('desc');

  const [totalAccountValue, setTotalAccountValue] = useState(0);
  const [loadingValue, setLoadingValue] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'SISTEMA INICIADO. AQUI É A STEAM_BB. O QUE VOCÊ QUER SABER DA SUA CONTA?' }
  ]);
  const [isChatting, setIsChatting] = useState(false);
  
  const [triggerAiValue, setTriggerAiValue] = useState(null);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isChatting]);

  const buscarDados = async (e) => {
    e.preventDefault();
    if (!steamId) return;

    setLoading(true);
    setError('');
    setProfile(null);
    setGames([]);
    setTotalAccountValue(0);
    setProgressPercent(0);

    try {
      const profileResponse = await axios.get(`http://localhost:3001/api/profile/${steamId}`);
      setProfile(profileResponse.data);

      const gamesResponse = await axios.get(`http://localhost:3001/api/games/${steamId}`);
      setGames(gamesResponse.data.games || []); 
    } catch (err) {
      console.error(err);
      setError('ERRO: Falha ao buscar dados. Verifique o SteamID e se o perfil é público.');
    } finally {
      setLoading(false);
    }
  };

  const calcularValorCompleto = async () => {
    if (!games || games.length === 0) return;
    if (isChatting) {
      alert("Aguarde a SteamBB terminar de falar antes de calcular o valor!");
      return;
    }

    setLoadingValue(true);
    setTotalAccountValue(0);
    setProgressPercent(0);

    const allAppIds = games.map(game => game.appid);
    const chunkSize = 10;
    let accumulatedValue = 0;

    try {
      for (let i = 0; i < allAppIds.length; i += chunkSize) {
        const chunk = allAppIds.slice(i, i + chunkSize);
        const currentProcessed = Math.min(i + chunkSize, allAppIds.length);
        const percent = Math.round((currentProcessed / allAppIds.length) * 100);

        setProgressPercent(percent);

        const response = await axios.post('http://localhost:3001/api/account-value-batch', {
          appIds: chunk
        });

        const valorDoLote = response.data?.batchValue || 0;
        accumulatedValue += valorDoLote;
        setTotalAccountValue(accumulatedValue);
      }

      if (accumulatedValue > 0) {
        setTriggerAiValue({ value: accumulatedValue });
      }

    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro durante o cálculo.');
    } finally {
      setLoadingValue(false);
    }
  };

  useEffect(() => {
    if (!triggerAiValue) return;

    const zombarDoValor = async () => {
      setIsChatting(true);
      const { value } = triggerAiValue;
      
      const visualMessage = `[ CÁLCULO FINANCEIRO CONCLUÍDO ]: R$ ${value.toFixed(2).replace('.', ',')}`;
      const updatedMessages = [...messages, { role: 'user', text: visualMessage }];
      setMessages(updatedMessages);

      let contextStr = '';
      if (games.length > 0) {
        const allGames = [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);
        contextStr = `Lista completa: ${allGames.map(g => `${g.name} (${(g.playtime_forever/60).toFixed(1)}h)`).join(', ')}.`;
      }

      const promptOculto = `Você é a SteamBB. O painel acabou de calcular que o utilizador já gastou aproximadamente R$ ${value.toFixed(2).replace('.', ',')} na conta da Steam.
      
      Sua tarefa: Faça um comentário direto, brutal e sarcástico sobre esse valor financeiro.
      Regras de Zombaria baseada no valor:
      - Se for menos de R$ 200: Zombe dele por ser "pobre", forreta, jogar em PC fraco ou viver apenas de jogos gratuitos.
      - Se estiver entre R$ 200 e R$ 2000: Diga que é um valor medíocre, mas que ele já está no caminho da falência.
      - Se for mais de R$ 2000: Destrua-o moralmente. Diga que ele não tem vida social, aconselhe-o a pagar uma conta em atraso ou ir tocar em relva verdadeira.
      
      Atenção: Aja com extrema naturalidade. NUNCA use marcadores de texto (como [DICA] ou [ZOMBARIA]). Seja implacável e curta na resposta.
      REGRA MÁXIMA: Responda EXCLUSIVAMENTE em Português do Brasil.`;

      const historyForOllama = updatedMessages
        .filter((msg, index) => index !== 0)
        .map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text === visualMessage ? promptOculto : msg.text
        }));

      try {
        const response = await axios.post('http://localhost:3001/api/chat', {
          messages: historyForOllama,
          contextGames: contextStr
        });
        
        setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', text: 'ERRO: CONEXÃO COM O CÉREBRO LOCAL DA STEAM_BB PERDIDA.' }]);
      } finally {
        setIsChatting(false);
        setTriggerAiValue(null); 
      }
    };

    zombarDoValor();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAiValue]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    
    const updatedMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setChatInput('');
    setIsChatting(true);

    let contextStr = '';
    if (games.length > 0) {
      const allGames = [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);
      contextStr = `Lista completa da biblioteca: ${allGames.map(g => `${g.name} (${(g.playtime_forever/60).toFixed(1)}h)`).join(', ')}.`;
    }

    const historyForOllama = updatedMessages
      .filter((msg, index) => index !== 0)
      .map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));

    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        messages: historyForOllama,
        contextGames: contextStr
      });
      
      setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'ERRO: CONEXÃO COM O CÉREBRO LOCAL DA STEAM_BB PERDIDA.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleGameClick = async (game) => {
    if (isChatting) return; 

    const visualMessage = `[ JOGO SELECIONADO ]: ${game.name}`;
    
    const updatedMessages = [...messages, { role: 'user', text: visualMessage }];
    setMessages(updatedMessages);
    setIsChatting(true);

    let contextStr = '';
    if (games.length > 0) {
      const allGames = [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);
      contextStr = `Lista completa: ${allGames.map(g => `${g.name} (${(g.playtime_forever/60).toFixed(1)}h)`).join(', ')}.`;
    }

    let conquistasPendentesTexto = "Não há conquistas registadas para este jogo na base da Steam ou elas são privadas.";
    let isPlatinado = false;

    try {
      const achResponse = await axios.get(`http://localhost:3001/api/achievements/${steamId}/${game.appid}`);
      if (achResponse.data && achResponse.data.achievements) {
        const pendentes = achResponse.data.achievements.filter(ach => ach.achieved === 0);
        
        if (pendentes.length > 0) {
          const top5Pendentes = pendentes.slice(0, 5).map(ach => `"${ach.displayName}" (${ach.description})`).join(' | ');
          conquistasPendentesTexto = `Conquistas BLOQUEADAS que ele não tem: ${top5Pendentes}.`;
        } else if (achResponse.data.achievements.length > 0) {
          conquistasPendentesTexto = "O jogador já platinou este jogo. Ele tem 100% das conquistas.";
          isPlatinado = true;
        }
      }
    } catch (err) {
      console.log(`Sem conquistas para ${game.appid}`);
    }

    const horasJogadas = (game.playtime_forever / 60).toFixed(1);
    let contextoHoras = "";
    let comandoZombaria = "";
    let instrucaoFinal = "";

    if (game.playtime_forever === 0) {
      contextoHoras = `O usuário comprou este jogo mas tem exatas 0.0 horas jogadas. Nunca sequer abriu.`;
      comandoZombaria = `Zombe severamente do fato dele ser um acumulador compulsivo que compra jogos para deixá-los apodrecendo na biblioteca sem nunca jogar.`;
      instrucaoFinal = `Pergunte, de forma arrogante, se ele clicou por acidente ou se finalmente vai tomar vergonha na cara para instalar o jogo.`;
    } else if (isPlatinado) { 
      contextoHoras = `O usuário já PLATINOU esse jogo (100% das conquistas) e gastou ${horasJogadas} horas da vida nisso.`;
      comandoZombaria = `Zombe do fato dele ser um viciado sem vida social por ter platinado o jogo.`;
      instrucaoFinal = `Pergunte, de forma sarcástica, se ele veio aqui buscar uma medalha, inflar o próprio ego ou o que mais ele quer com um jogo que já zerou completamente. NÃO ofereça ajuda com conquistas.`;
    } else if (game.playtime_forever < 120) { 
      contextoHoras = `O usuário jogou míseras ${horasJogadas} horas e encostou o jogo.`;
      comandoZombaria = `Zombe do fato de ele ter abandonado o jogo tão rápido. Diga que ele provavelmente não conseguiu passar do tutorial ou pediu reembolso.`;
      instrucaoFinal = `NÃO dê dicas de conquistas ainda! Apenas jogue na cara dele a falta de gameplay e pergunte se ele quer tomar coragem pra jogar ou precisa de ajuda pra platinar.`;
    } else { 
      contextoHoras = `O usuário já possui ${horasJogadas} horas da vida dele perdidas jogando isso.`;
      comandoZombaria = `Zombe severamente do fato de ele ter jogado incríveis ${horasJogadas} horas e AINDA ASSIM não ter capacidade para pegar as conquistas básicas.`;
      instrucaoFinal = `NÃO dê dicas de conquistas ainda! Apenas jogue na cara dele o tempo perdido e pergunte, de forma arrogante, se ele finalmente quer ajuda para platinar isso.`;
    }

    const promptOculto = `Você é a SteamBB. O usuário acabou de selecionar um jogo no painel. Siga o contexto abaixo rigorosamente:
    
    DADOS DA SELEÇÃO:
    - Título exato do Jogo: "${game.name}"
    - Situação do Tempo Jogado: ${contextoHoras}
    - Status das Conquistas: ${conquistasPendentesTexto}
    
    Sua tarefa agora:
    Escreva uma resposta curta e direta. ${comandoZombaria}
    ${instrucaoFinal}
    
    Atenção: Aja com naturalidade. O nome do jogo é literalmente "${game.name}", NÃO CONFUNDA o título com horas jogadas!
    REGRA MÁXIMA E ABSOLUTA: Responda EXCLUSIVAMENTE em Português do Brasil.`;

    const historyForOllama = updatedMessages
      .filter((msg, index) => index !== 0)
      .map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text === visualMessage ? promptOculto : msg.text
      }));

    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        messages: historyForOllama,
        contextGames: contextStr
      });
      
      setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'ERRO: CONEXÃO COM O CÉREBRO LOCAL DA STEAM_BB PERDIDA.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const alternarOrdem = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const resetarTerminal = () => {
    setMessages([{ role: 'ai', text: 'SISTEMA RESETADO. MEMÓRIA DA STEAM_BB LIMPA. O QUE VOCÊ QUER AGORA?' }]);
  };

  const sortedGames = [...games].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'id') comparison = a.appid - b.appid;
    else if (sortBy === 'hours') comparison = a.playtime_forever - b.playtime_forever;
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4 md:p-8 selection:bg-fuchsia-500 selection:text-white">
      
      <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row gap-8 xl:gap-12 items-start">
        
        {/* COLUNA ESQUERDA: PERFIL E BIBLIOTECA */}
        <div className="flex-1 w-full flex flex-col gap-8">
          
          <div className="bg-zinc-900 border-4 border-zinc-200 p-6 md:p-8 shadow-[8px_8px_0px_0px_#a3e635] w-full transition-all">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6 bg-lime-400 text-zinc-950 border-4 border-zinc-200 py-3 px-6 shadow-[4px_4px_0px_0px_#e4e4e7] inline-block">
              STEAM // DASH
            </h1>
            
            <form onSubmit={buscarDados} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="DIGITE O STEAMID64..."
                className="flex-1 px-4 py-4 md:py-3 bg-zinc-950 text-zinc-100 font-bold border-4 border-zinc-200 focus:outline-none focus:bg-zinc-800 shadow-[4px_4px_0px_0px_#e4e4e7] placeholder:text-zinc-500 text-base md:text-lg transition-colors"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-black uppercase py-4 px-8 border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_#e4e4e7] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer whitespace-nowrap text-lg"
              >
                {loading ? 'BUSCANDO...' : '[ CARREGAR ]'}
              </button>
            </form>
            {error && <p className="text-red-400 font-bold text-sm mt-6 bg-zinc-950 border-4 border-red-500 p-3">{error}</p>}
          </div>

          {profile && (
            <div className="bg-zinc-900 border-4 border-zinc-200 p-6 md:p-8 shadow-[8px_8px_0px_0px_#22d3ee] w-full flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10 transition-all">
              <div className="flex items-center gap-6 w-full lg:w-auto">
                <div className="relative shrink-0">
                  <img
                    src={profile.avatarfull}
                    alt={`Avatar`}
                    className="w-24 h-24 md:w-32 md:h-32 object-cover border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7]"
                  />
                  <span className={`absolute -bottom-3 -right-3 w-6 h-6 border-4 border-zinc-200 ${profile.personastate === 1 ? 'bg-lime-400' : 'bg-zinc-500'}`} />
                </div>
                <div className="overflow-hidden flex-1">
                  <h2 className="text-3xl md:text-4xl font-black uppercase truncate text-zinc-100">{profile.personaname}</h2>
                  <p className="text-sm md:text-base font-bold mt-2 bg-zinc-800 text-zinc-200 border-2 border-zinc-700 inline-block px-3 py-1">
                    {profile.personastate === 1 ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}
                  </p>
                </div>
              </div>

              <div className="w-full flex-1 flex flex-col justify-center border-t-4 lg:border-t-0 lg:border-l-4 border-zinc-200 pt-6 lg:pt-0 lg:pl-10 mt-2 lg:mt-0">
                {loadingValue ? (
                  <div className="bg-zinc-800 border-4 border-zinc-200 p-4 flex flex-col items-center gap-3 shadow-[4px_4px_0px_0px_#e4e4e7]">
                    <div className="text-3xl font-black text-cyan-400">{progressPercent}%</div>
                    <Loader />
                    <div className="w-full flex justify-between text-sm font-bold border-t-4 border-zinc-200 pt-3 mt-1 text-zinc-100">
                      <span>PARCIAL:</span>
                      <span>R$ {totalAccountValue.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={calcularValorCompleto}
                    disabled={isChatting}
                    className="w-full bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-black uppercase py-4 md:py-6 px-4 border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_#e4e4e7] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer text-base md:text-xl disabled:opacity-50"
                  >
                    $$ CALCULAR VALOR DA CONTA $$
                  </button>
                )}

                {!loadingValue && totalAccountValue > 0 && (
                  <div className="bg-zinc-800 border-4 border-zinc-200 p-6 shadow-[4px_4px_0px_0px_#e4e4e7] flex flex-col gap-2 mt-4 lg:mt-0">
                    <span className="text-sm md:text-base font-black uppercase text-zinc-300">VALOR ESTIMADO:</span>
                    <span className="text-3xl md:text-4xl font-black text-cyan-400">
                      R$ {totalAccountValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {games.length > 0 && (
            <div className="w-full bg-zinc-900 border-4 border-zinc-200 shadow-[8px_8px_0px_0px_#fbbf24] p-6 md:p-8 transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h3 className="text-3xl font-black uppercase bg-zinc-200 text-zinc-950 px-6 py-3 shadow-[4px_4px_0px_0px_#fbbf24]">
                  BIBLIOTECA [{games.length}]
                </h3>
                <div className="flex items-center gap-3 bg-amber-400 border-4 border-zinc-200 p-3 shadow-[4px_4px_0px_0px_#e4e4e7]">
                  <label htmlFor="sort" className="text-sm font-black uppercase hidden sm:block text-zinc-950">ORDENAR:</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-zinc-900 text-zinc-100 font-bold text-sm border-4 border-zinc-200 px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="hours">HORAS</option>
                    <option value="name">NOME</option>
                    <option value="id">ID</option>
                  </select>
                  <button
                    onClick={alternarOrdem}
                    className="bg-zinc-950 text-zinc-100 font-bold border-4 border-zinc-200 w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-zinc-800"
                  >
                    {sortOrder === 'asc' ? '⬆' : '⬇'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {sortedGames.map((game) => (
                  <div 
                    key={game.appid} 
                    onClick={() => handleGameClick(game)}
                    className="bg-zinc-900 border-4 border-zinc-200 shadow-[6px_6px_0px_0px_#fbbf24] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#fbbf24] transition-all flex flex-col cursor-pointer"
                  >
                    <div className="relative bg-zinc-950 aspect-video border-b-4 border-zinc-200">
                      <img
                        src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`}
                        alt={game.name}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300 opacity-80 hover:opacity-100"
                        onError={(e) => { e.target.src = 'https://placehold.co/460x215/18181b/e4e4e7?text=SEM+CAPA' }}
                      />
                    </div>
                    <div className="p-4 grow flex flex-col justify-between gap-4 bg-zinc-900">
                      <h4 className="text-base font-black uppercase line-clamp-2 leading-tight text-zinc-100" title={game.name}>{game.name}</h4>
                      <div className="flex justify-between items-center text-xs pt-3 border-t-4 border-zinc-200 font-bold mt-auto">
                        <span className="bg-amber-400 text-zinc-950 border-2 border-zinc-200 px-2 py-1">⏳ {(game.playtime_forever / 60).toFixed(1)}H</span>
                        <span className="text-zinc-500 font-mono">#{game.appid}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: TERMINAL STEAM_BB */}
        <div className="w-full xl:w-[450px] shrink-0 xl:sticky xl:top-8 h-[75vh] xl:h-[calc(100vh-4rem)] min-h-[600px] flex flex-col bg-zinc-900 border-4 border-zinc-200 shadow-[12px_12px_0px_0px_#f472b6] transition-all">
          
          <div className="bg-zinc-200 text-zinc-950 p-4 border-b-4 border-zinc-200 flex justify-between items-center shrink-0">
            <h3 className="font-black text-xl uppercase tracking-widest flex items-center gap-3">
              <span className="w-4 h-4 bg-fuchsia-500 border-2 border-zinc-950 animate-pulse"></span>
              TERMINAL STEAM_BB
            </h3>
            <div className="flex gap-2 items-center">
              <button 
                onClick={resetarTerminal}
                className="bg-red-500 hover:bg-red-600 text-zinc-950 font-black uppercase px-2 py-1 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-[10px] cursor-pointer"
                title="Apagar Memória da IA"
              >
                [ RESET ]
              </button>
              <span className="text-xs font-bold text-zinc-950 bg-lime-400 px-3 py-1 border-2 border-zinc-950 hidden sm:inline-block">LLAMA_3</span>
            </div>
          </div>

          {/* AREA DE MENSAGENS */}
          <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 bg-zinc-950 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] scroll-smooth"
          >
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 max-w-[85%] border-4 border-zinc-200 text-base font-bold shadow-[4px_4px_0px_0px_#e4e4e7] ${
                  msg.role === 'user' ? 'bg-pink-400 text-zinc-950 rounded-none' : 'bg-zinc-800 text-zinc-100 rounded-none'
                }`}>
                  {msg.role === 'ai' && <div className="text-xs text-zinc-400 mb-2 border-b-2 border-zinc-600 pb-1">STEAM_BB diz:</div>}
                  {msg.role === 'user' && <div className="text-xs text-zinc-900 mb-2 border-b-2 border-zinc-900 pb-1 text-right">VOCÊ diz:</div>}
                  <p className="whitespace-pre-wrap leading-snug">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isChatting && (
              <div className="flex justify-start">
                <div className="p-4 bg-zinc-800 text-zinc-100 border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7]">
                  <span className="animate-pulse font-black text-base">PROCESSANDO...</span>
                </div>
              </div>
            )}
          </div>

          {/* INPUT DO CHAT */}
          <div className="p-5 bg-zinc-900 border-t-4 border-zinc-200 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                placeholder="PERGUNTE ALGO..."
                className="flex-1 px-4 py-3 bg-zinc-950 text-zinc-100 font-bold border-4 border-zinc-200 focus:outline-none focus:bg-zinc-800 text-base transition-colors"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatting}
              />
              <button
                type="submit"
                disabled={isChatting}
                className="bg-lime-400 hover:bg-lime-500 text-zinc-950 font-black uppercase px-6 py-3 border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                [ GO ]
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;