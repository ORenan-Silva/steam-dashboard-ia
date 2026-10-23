// Imagem da prévia do link (1200x630) no visual brutalista: /api/og?id=nome
import { ImageResponse } from '@vercel/og';
import { buscarResumoDoPerfil } from './_perfil.js';
import { carregarFonte, cardDoPerfil, cardGenerico } from './_card.js';

// Edge runtime: é onde o @vercel/og roda oficialmente (a versão Node quebra em módulos ESM)
export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url = new URL(request.url);
  const host = url.host;
  const [resumo, fonte] = await Promise.all([buscarResumoDoPerfil(url.searchParams.get('id')), carregarFonte()]);

  return new ImageResponse(resumo ? cardDoPerfil(resumo, host) : cardGenerico(host), {
    width: 1200,
    height: 630,
    fonts: fonte ? [{ name: 'Space Mono', data: fonte, weight: 700, style: 'normal' }] : undefined,
    headers: {
      // A Vercel guarda a imagem por 1h e serve a antiga enquanto gera a nova
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
