// Página que os robôs de prévia (WhatsApp, Discord, Telegram...) recebem no lugar do site.
// Eles não rodam JavaScript, então as meta tags com nome e imagem do perfil vêm prontas daqui.
// O vercel.json manda só os robôs para cá; pessoas continuam recebendo o site normal.
import { buscarResumoDoPerfil } from './_perfil.js';

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origem = `${req.headers['x-forwarded-proto'] || 'https'}://${host}`;
  const url = new URL(req.url, origem);
  const id = url.searchParams.get('id') || '';
  const vs = url.searchParams.get('vs') || '';

  const resumo = await buscarResumoDoPerfil(id, { comJogos: false, timeoutMs: 5000 });
  const resumoRival = vs ? await buscarResumoDoPerfil(vs, { comJogos: false, timeoutMs: 5000 }) : null;

  let titulo = 'SteamBB // Dash: quanto você já torrou na Steam?';
  let descricao = 'Valor estimado da conta, jogos nunca abertos e uma IA sarcástica julgando sua biblioteca Steam.';
  if (resumo && resumoRival) {
    titulo = `⚔ DUELO: ${resumo.nome} VS ${resumoRival.nome} | SteamBB`;
    descricao = 'Quem é o pior gamer? A SteamBB comparou as duas bibliotecas e deu o veredito.';
  } else if (resumo) {
    titulo = `${resumo.nome} foi julgado pela SteamBB`;
    descricao = 'Veja a estimativa de quanto essa biblioteca valeria hoje, quantos jogos nunca foram abertos e o que a IA mais sarcástica da Steam achou disso.';
  }

  const params = new URLSearchParams();
  if (id) params.set('id', id);
  if (vs) params.set('vs', vs);
  const linkDoSite = `${origem}/${params.size ? `?${params}` : ''}`;
  const imagem = `${origem}/api/og${id ? `?id=${encodeURIComponent(id)}` : ''}`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descricao)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SteamBB // Dash">
<meta property="og:title" content="${escapar(titulo)}">
<meta property="og:description" content="${escapar(descricao)}">
<meta property="og:url" content="${escapar(linkDoSite)}">
<meta property="og:image" content="${escapar(imagem)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapar(titulo)}">
<meta name="twitter:description" content="${escapar(descricao)}">
<meta name="twitter:image" content="${escapar(imagem)}">
<meta http-equiv="refresh" content="0; url=${escapar(linkDoSite)}">
</head>
<body><a href="${escapar(linkDoSite)}">${escapar(titulo)}</a></body>
</html>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.end(html);
}
