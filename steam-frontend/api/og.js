// Imagem da prévia do link (1200x630) no visual brutalista: /api/og?id=nome
// Usa satori (desenho -> SVG) + resvg (SVG -> PNG) numa função Node.js da Vercel.
// O @vercel/og faz o mesmo, mas a versão 1.0.3 quebra tanto no Node quanto no Edge desta configuração.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { buscarResumoDoPerfil } from './_perfil.js';
import { carregarFonte, cardDoPerfil, cardGenerico } from './_card.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  try {
    const [resumo, fonte] = await Promise.all([buscarResumoDoPerfil(url.searchParams.get('id')), carregarFonte()]);
    if (!fonte) throw new Error('sem fonte para desenhar o texto');

    const svg = await satori(resumo ? cardDoPerfil(resumo, host) : cardGenerico(host), {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Space Mono', data: fonte, weight: 700, style: 'normal' }],
    });
    const png = new Resvg(svg).render().asPng();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    // A Vercel guarda a imagem por 1h e serve a antiga enquanto gera a nova
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.end(png);
  } catch (err) {
    console.error('Erro ao gerar a imagem de prévia:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Erro ao gerar a imagem.');
  }
}
