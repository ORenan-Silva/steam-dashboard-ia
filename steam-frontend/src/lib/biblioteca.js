export const formatarHoras = (minutos, casas = 1) =>
  `${(minutos / 60).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}H`;

export const formatarReais = (valor) =>
  `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const capaDoJogo = (appid) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

// Números gerais da biblioteca para os cards do perfil
export const resumirBiblioteca = (games) => {
  const totalMinutos = games.reduce((soma, g) => soma + g.playtime_forever, 0);
  const nuncaAbertos = games.filter(g => g.playtime_forever === 0).length;
  const maisJogado = games.reduce((maior, g) => (!maior || g.playtime_forever > maior.playtime_forever ? g : maior), null);
  return { totalMinutos, nuncaAbertos, maisJogado };
};

// Soma o valor da conta com os preços já consultados (preço cheio da loja BR)
export const somarValores = (games, precos) => {
  let total = 0;
  let desperdicio = 0;
  let pagosNuncaAbertos = 0;
  const comPreco = [];

  for (const game of games) {
    const preco = precos[game.appid];
    if (!preco) continue;
    total += preco.cheio;
    if (preco.cheio > 0) comPreco.push({ ...game, preco: preco.cheio });
    if (game.playtime_forever === 0 && preco.cheio > 0) {
      desperdicio += preco.cheio;
      pagosNuncaAbertos++;
    }
  }

  const maisCaros = comPreco.sort((a, b) => b.preco - a.preco).slice(0, 3);
  return { total, desperdicio, pagosNuncaAbertos, maisCaros };
};
