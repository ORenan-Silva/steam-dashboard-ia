import { Banknote, Bot, Plus, Skull, Swords } from 'lucide-react';
import Icone from './Icone';
import { cartaoBrutal } from '../lib/estilos';

// Os textos dizem "estimativa" e "preço atual" de propósito: o site não sabe quanto a pessoa pagou de verdade
const RECURSOS = [
  { icone: Banknote, cor: 'ciano', titulo: 'VALOR DA CONTA', texto: 'Estimativa com o preço cheio atual de cada jogo na loja brasileira.' },
  { icone: Skull, cor: 'vermelho', titulo: 'DINHEIRO JOGADO FORA', texto: 'Quanto custariam hoje os jogos pagos que você nunca abriu.' },
  { icone: Bot, cor: 'lima', titulo: 'A STEAM_BB TE JULGA', texto: 'Clique em qualquer jogo e aguente o deboche da IA.' },
  { icone: Swords, cor: 'vermelho', titulo: 'DUELO COM AMIGOS', texto: 'Compare bibliotecas com quem topar a zoeira e veja quem é o pior gamer.' },
];

const FRASES_DA_FAIXA = [
  'QUANTO VOCÊ JÁ TORROU?',
  'QUANTOS JOGOS NUNCA ABRIU?',
  'QUAL É O SEU PIOR VÍCIO?',
  'QUEM É O PIOR GAMER DO GRUPO?',
  'QUASE PLATINOU E LARGOU?',
];

// Faixa passando: o conteúdo é duplicado para a volta não ter emenda (a cópia é escondida dos leitores de tela)
const Faixa = () => (
  <div className="marquee -mx-6 md:-mx-8 border-y-4 border-zinc-200 bg-lime-400 text-zinc-950 py-2">
    <div className="marquee-trilho">
      {[0, 1].map(copia => (
        <div key={copia} className="flex shrink-0" aria-hidden={copia === 1}>
          {FRASES_DA_FAIXA.map(frase => (
            <span key={frase} className="font-black text-sm md:text-base px-6 whitespace-nowrap">
              {frase} <span aria-hidden="true">✶</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Primeira tela: explica o que o site faz e ajuda a achar o próprio perfil
const BoasVindas = () => (
  <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col gap-8 overflow-hidden entrada`} style={{ '--atraso': '120ms' }}>
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl md:text-5xl font-black uppercase leading-tight">
        QUANTO VOCÊ JÁ{' '}
        <span className="carimbo inline-block bg-red-500 text-zinc-950 px-2" style={{ '--atraso': '500ms' }}>TORROU</span>{' '}
        NA STEAM?
      </h2>
      <p className="text-base md:text-lg text-zinc-300 font-bold max-w-3xl">
        Cole seu perfil e veja uma estimativa de quanto sua biblioteca valeria hoje, quanto está parado em jogos
        que você nunca abriu, e deixe uma IA sem filtro julgar cada escolha.
      </p>
    </div>

    <Faixa />

    <ul className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
      {RECURSOS.map((r, i) => (
        <li
          key={r.titulo}
          className="group entrada bg-zinc-950 border-4 border-zinc-200 p-4 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#e4e4e7]"
          style={{ '--atraso': `${250 + i * 90}ms` }}
        >
          <Icone icone={r.icone} cor={r.cor} tamanho={26} className="self-start tremer-no-hover" />
          <span className={`font-black uppercase text-sm ${r.cor === 'ciano' ? 'text-cyan-400' : r.cor === 'lima' ? 'text-lime-400' : 'text-red-400'}`}>
            {r.titulo}
          </span>
          <span className="text-sm text-zinc-300">{r.texto}</span>
        </li>
      ))}
    </ul>

    <details className="group bg-zinc-950 border-4 border-zinc-700 open:border-zinc-200 p-4">
      <summary className="font-black uppercase text-sm cursor-pointer select-none list-none flex justify-between items-center gap-4">
        ONDE ACHO MEU PERFIL?
        <Icone icone={Plus} caixa={false} cor="lima" className="group-open:rotate-45 transition-transform" />
      </summary>
      <ol className="mt-4 flex flex-col gap-3 text-sm text-zinc-300 list-decimal pl-5">
        <li>Na Steam, clique no seu nome (no topo) e depois em <strong className="text-zinc-100">Perfil</strong>.</li>
        <li>
          Copie o endereço da página, algo como <code className="text-lime-400">steamcommunity.com/id/seunome</code> ou{' '}
          <code className="text-lime-400">/profiles/7656...</code>, e cole no campo acima.
        </li>
        <li>
          O perfil e os <strong className="text-zinc-100">Detalhes do jogo</strong> precisam estar como Público em{' '}
          Editar perfil &gt; Configurações de privacidade.
        </li>
      </ol>
    </details>
  </div>
);

export default BoasVindas;
