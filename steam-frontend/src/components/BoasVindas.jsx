import { cartaoBrutal } from '../lib/estilos';

const RECURSOS = [
  { icone: '💸', titulo: 'VALOR DA CONTA', texto: 'O preço de cada jogo na loja brasileira, somado.', cor: 'text-cyan-400' },
  { icone: '💀', titulo: 'DINHEIRO JOGADO FORA', texto: 'Quanto custaram os jogos que você comprou e nunca abriu.', cor: 'text-red-400' },
  { icone: '🤖', titulo: 'A STEAM_BB TE JULGA', texto: 'Clique em qualquer jogo e aguente o deboche da IA.', cor: 'text-lime-400' },
  { icone: '⚔', titulo: 'DUELO COM AMIGOS', texto: 'Compare bibliotecas e descubra quem é o pior gamer.', cor: 'text-red-400' },
];

// Primeira tela: explica o que o site faz e ajuda a achar o próprio perfil
const BoasVindas = () => (
  <div className={`${cartaoBrutal} shadow-[8px_8px_0px_0px_#fbbf24] flex flex-col gap-8`}>
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl md:text-5xl font-black uppercase leading-tight">
        QUANTO VOCÊ JÁ <span className="bg-red-500 text-zinc-950 px-2">TORROU</span> NA STEAM?
      </h2>
      <p className="text-base md:text-lg text-zinc-300 font-bold max-w-3xl">
        Cole seu perfil e descubra quanto sua biblioteca vale, quanto dinheiro foi parar em jogos que você nunca
        abriu e deixe uma IA sem filtro julgar cada escolha.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
      {RECURSOS.map(r => (
        <div key={r.titulo} className="bg-zinc-950 border-4 border-zinc-200 p-4 flex flex-col gap-2">
          <span className="text-3xl" aria-hidden="true">{r.icone}</span>
          <span className={`font-black uppercase text-sm ${r.cor}`}>{r.titulo}</span>
          <span className="text-sm text-zinc-300">{r.texto}</span>
        </div>
      ))}
    </div>

    <div>
      <details className="group bg-zinc-950 border-4 border-zinc-700 open:border-zinc-200 p-4">
        <summary className="font-black uppercase text-sm cursor-pointer select-none list-none flex justify-between gap-4">
          ONDE ACHO MEU PERFIL?
          <span className="group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
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
  </div>
);

export default BoasVindas;
