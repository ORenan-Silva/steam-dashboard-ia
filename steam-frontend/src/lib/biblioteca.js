export const formatarHoras = (minutos, casas = 1) =>
  `${(minutos / 60).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}H`;

export const formatarReais = (valor) =>
  `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const capaDoJogo = (appid) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

// Quem ativa "Manter meu tempo de jogo sempre privado" na Steam aparece com 0 horas em todos os jogos.
// Nesse caso, "0 horas" não quer dizer "nunca abriu".
export const tempoDeJogoPrivado = (games) => games.length > 0 && games.every(g => g.playtime_forever === 0);

// Números gerais da biblioteca para os cards do perfil
export const resumirBiblioteca = (games) => {
  const totalMinutos = games.reduce((soma, g) => soma + g.playtime_forever, 0);
  const nuncaAbertos = games.filter(g => g.playtime_forever === 0).length;
  const maisJogado = games.reduce((maior, g) => (!maior || g.playtime_forever > maior.playtime_forever ? g : maior), null);
  return { totalMinutos, nuncaAbertos, maisJogado, tempoPrivado: tempoDeJogoPrivado(games) };
};

// Soma o valor da conta com os preços já consultados (preço cheio da loja BR)
// Situação do jogo na loja: 'pago', 'gratis' ou 'indisponivel' (não vendido sozinho: removido, só em pacote ou sem venda no Brasil).
// Respostas antigas sem "situacao" são deduzidas pelo preço.
export const situacaoDoPreco = (preco) => preco.situacao || (preco.cheio > 0 ? 'pago' : 'gratis');

export const somarValores = (games, precos) => {
  const tempoPrivado = tempoDeJogoPrivado(games);
  let total = 0;
  let desperdicio = 0;
  let pagosNuncaAbertos = 0;
  let foraDaLoja = 0;
  const comPreco = [];
  // Jogos vendidos pelo mesmo pacote contam uma vez só. O primeiro da lista representa o pacote;
  // os outros ficam em "repetidos" (o card mostra "MESMO PACOTE").
  const grupos = new Map();
  const repetidos = new Set();

  for (const game of games) {
    const preco = precos[game.appid];
    if (!preco) continue;
    // Sem venda avulsa não tem preço próprio: fica fora da soma, mas é contado para o aviso
    if (situacaoDoPreco(preco) === 'indisponivel') {
      foraDaLoja++;
      continue;
    }
    const chave = preco.pacote ?? `app-${game.appid}`;
    if (grupos.has(chave)) {
      grupos.get(chave).jogos.push(game);
      repetidos.add(game.appid);
    } else {
      grupos.set(chave, { preco, jogos: [game] });
    }
  }

  for (const { preco, jogos } of grupos.values()) {
    total += preco.cheio;
    if (preco.cheio > 0) comPreco.push({ ...jogos[0], preco: preco.cheio });
    // O pacote só é "dinheiro jogado fora" se nenhum dos jogos dele foi aberto
    if (!tempoPrivado && preco.cheio > 0 && jogos.every(j => j.playtime_forever === 0)) {
      desperdicio += preco.cheio;
      pagosNuncaAbertos++;
    }
  }

  const maisCaros = comPreco.sort((a, b) => b.preco - a.preco).slice(0, 3);
  return { total, desperdicio, pagosNuncaAbertos, foraDaLoja, repetidos, maisCaros, tempoPrivado };
};
