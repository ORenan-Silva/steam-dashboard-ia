// Desenho da imagem de prévia (1200x630), separado da rota para poder ser testado sem a Vercel

const COR = {
  fundo: '#09090b', cartao: '#18181b', borda: '#e4e4e7', texto: '#f4f4f5', apagado: '#a1a1aa',
  lima: '#a3e635', ambar: '#fbbf24', vermelho: '#f87171', ciano: '#22d3ee', rosa: '#f472b6',
};

// Satori (o motor do @vercel/og) aceita objetos { type, props } no lugar de JSX
const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

const numero = (n) => n.toLocaleString('pt-BR');

// Fonte monoespaçada em negrito, igual ao site. Se não carregar, usa a fonte padrão.
let fontePromessa;
export const carregarFonte = () => {
  fontePromessa ??= (async () => {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Space+Mono:wght@700')).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) throw new Error('fonte não encontrada');
    return (await fetch(url)).arrayBuffer();
  })().catch((err) => {
    console.error('Fonte da prévia indisponível:', err.message);
    fontePromessa = undefined;
    return null;
  });
  return fontePromessa;
};

const estatistica = (rotulo, valor, cor, detalhe) => h('div', {
  flexDirection: 'column', flex: 1, minWidth: 0, background: COR.fundo, border: `5px solid ${COR.borda}`, padding: '14px 18px', gap: 4,
},
  h('div', { fontSize: 19, color: COR.apagado }, rotulo),
  h('div', { fontSize: 44, color: cor }, valor),
  h('div', { fontSize: 16, color: COR.apagado, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }, detalhe || ' '),
);

const cabecalho = (host) => h('div', { justifyContent: 'space-between', alignItems: 'center' },
  h('div', {
    background: COR.lima, color: COR.fundo, fontSize: 40, padding: '8px 24px', border: `5px solid ${COR.borda}`,
    boxShadow: `8px 8px 0 0 ${COR.borda}`,
  }, 'STEAM // DASH'),
  h('div', { fontSize: 22, color: COR.apagado }, host),
);

const rodape = (texto) => h('div', {
  background: COR.ambar, color: COR.fundo, fontSize: 26, padding: '12px 24px', border: `5px solid ${COR.borda}`,
  boxShadow: `8px 8px 0 0 ${COR.rosa}`, justifyContent: 'center',
}, texto);

// A margem fica num quadro absoluto: no Satori, padding + width 100% estoura os 1200x630
const moldura = (...conteudo) => h('div', { width: 1200, height: 630, background: COR.fundo, color: COR.texto, position: 'relative' },
  h('div', { position: 'absolute', top: 40, left: 44, right: 52, bottom: 48, flexDirection: 'column', justifyContent: 'space-between' }, ...conteudo),
);

export const cardDoPerfil = (resumo, host) => moldura(
  cabecalho(host),
  h('div', { alignItems: 'center', gap: 32 },
    resumo.avatar
      ? { type: 'img', props: { src: resumo.avatar, width: 120, height: 120, style: { border: `5px solid ${COR.borda}`, boxShadow: `8px 8px 0 0 ${COR.ciano}` } } }
      : h('div', {}, ''),
    h('div', { flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 },
      h('div', { fontSize: 24, color: COR.rosa }, 'A STEAM_BB JULGOU ESTA CONTA:'),
      h('div', { fontSize: 58, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }, resumo.nome.toUpperCase()),
    ),
  ),
  h('div', { gap: 18 },
    estatistica('JOGOS', numero(resumo.jogos), COR.texto),
    estatistica('HORAS', `${numero(resumo.horas)}H`, COR.ambar),
    estatistica('NUNCA ABERTOS', numero(resumo.nuncaAbertos), COR.vermelho),
    estatistica('MAIOR VÍCIO', resumo.maisJogado ? `${numero(resumo.maisJogado.horas)}H` : '—', COR.lima, resumo.maisJogado?.nome),
  ),
  rodape('QUANTO VOCÊ JÁ TORROU NA STEAM? DESCUBRA →'),
);

export const cardGenerico = (host) => moldura(
  cabecalho(host),
  h('div', { flexDirection: 'column', gap: 18 },
    h('div', { fontSize: 64, lineHeight: 1.1 }, 'QUANTO VOCÊ JÁ TORROU NA STEAM?'),
    h('div', { fontSize: 28, color: COR.apagado }, 'VALOR DA CONTA • JOGOS NUNCA ABERTOS • UMA IA SARCÁSTICA JULGANDO VOCÊ'),
  ),
  rodape('COLE SEU PERFIL E SEJA HUMILHADO →'),
);
