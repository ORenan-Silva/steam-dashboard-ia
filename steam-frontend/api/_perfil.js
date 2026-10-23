// Funções compartilhadas pelas rotas de prévia de link (arquivos com "_" não viram rota na Vercel)
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const buscar = async (caminho, timeoutMs) => {
  const res = await fetch(`${API_URL}${caminho}`, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${caminho}`);
  return res.json();
};

// Dados resumidos do perfil para a prévia. Devolve null se algo falhar (a prévia vira genérica).
export async function buscarResumoDoPerfil(entrada, { comJogos = true, timeoutMs = 8000 } = {}) {
  if (!entrada) return null;
  try {
    const { steamId } = await buscar(`/api/resolve?q=${encodeURIComponent(entrada)}`, timeoutMs);
    const [perfil, biblioteca] = await Promise.all([
      buscar(`/api/profile/${steamId}`, timeoutMs),
      comJogos ? buscar(`/api/games/${steamId}`, timeoutMs) : Promise.resolve({ games: [] }),
    ]);
    const jogos = biblioteca.games || [];
    const maisJogado = jogos.reduce((maior, j) => (!maior || j.playtime_forever > maior.playtime_forever ? j : maior), null);
    return {
      nome: perfil.personaname,
      avatar: perfil.avatarfull,
      jogos: jogos.length,
      horas: Math.round(jogos.reduce((soma, j) => soma + j.playtime_forever, 0) / 60),
      nuncaAbertos: jogos.filter(j => j.playtime_forever === 0).length,
      maisJogado: maisJogado && { nome: maisJogado.name, horas: Math.round(maisJogado.playtime_forever / 60) },
      // "Manter meu tempo de jogo sempre privado": todos os jogos chegam com 0 horas
      tempoPrivado: jogos.length > 0 && jogos.every(j => j.playtime_forever === 0),
    };
  } catch (err) {
    console.error('Prévia sem dados do perfil:', err.message);
    return null;
  }
}
