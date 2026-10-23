// Classes repetidas do visual brutalista.
// O botão sobe no hover com um brilho atravessando (botao-brilho, em animacoes.css) e afunda ao clicar.
export const botaoBrutal =
  'botao-brilho font-black uppercase border-4 border-zinc-200 shadow-[4px_4px_0px_0px_#e4e4e7] transition-all duration-150 cursor-pointer ' +
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_#e4e4e7] ' +
  'active:translate-x-1 active:translate-y-1 active:shadow-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_#e4e4e7]';

export const campoBrutal =
  'bg-zinc-950 text-zinc-100 font-bold border-4 border-zinc-200 focus:outline-none focus:bg-zinc-900 ' +
  'placeholder:text-zinc-400 transition-colors';

export const cartaoBrutal = 'bg-zinc-900 border-4 border-zinc-200 p-6 md:p-8 w-full';
