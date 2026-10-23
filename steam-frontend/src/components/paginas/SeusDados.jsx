import { useState } from 'react';
import { Mail, ShieldCheck, Trash2 } from 'lucide-react';
import Icone from '../Icone';
import PaginaLegal, { Contato, Lista, Secao } from './PaginaLegal';
import { botaoBrutal, campoBrutal } from '../../lib/estilos';
import { CHAVE_CONVERSA, CHAVE_PRIVACIDADE, CONTATO_PRIVACIDADE, montarMailto } from '../../lib/legal';

// Direitos do art. 18 da LGPD, na ordem da lei
const PEDIDOS = [
  'Confirmar se vocês tratam meus dados',
  'Acessar meus dados',
  'Corrigir dados incompletos ou errados',
  'Anonimizar, bloquear ou eliminar dados desnecessários',
  'Portabilidade dos meus dados',
  'Eliminar dados tratados com meu consentimento',
  'Saber com quem meus dados são compartilhados',
  'Revogar meu consentimento',
  'Me opor a um tratamento',
  'Outro assunto de privacidade',
];

const lerArmazenado = () => {
  try {
    const conversa = JSON.parse(localStorage.getItem(CHAVE_CONVERSA));
    const privacidade = JSON.parse(localStorage.getItem(CHAVE_PRIVACIDADE));
    return {
      mensagens: Array.isArray(conversa) ? conversa.length : 0,
      estatisticas: privacidade ? (privacidade.estatisticas ? 'permitidas' : 'recusadas') : 'ainda não escolhidas',
    };
  } catch {
    return { mensagens: 0, estatisticas: 'indisponível (armazenamento bloqueado)' };
  }
};

const SeusDados = ({ onVoltar, onAbrirPreferencias, onApagarConversa }) => {
  const [armazenado, setArmazenado] = useState(lerArmazenado);
  const [aviso, setAviso] = useState('');
  const [pedido, setPedido] = useState(PEDIDOS[0]);
  const [perfil, setPerfil] = useState('');
  const [mensagem, setMensagem] = useState('');

  // Também limpa a conversa que está na tela, senão ela seria salva de novo na próxima mensagem
  const apagar = (chaves, texto) => {
    onApagarConversa();
    try {
      chaves.forEach(chave => localStorage.removeItem(chave));
    } catch {
      // Nada a apagar se o armazenamento estiver bloqueado
    }
    setArmazenado(lerArmazenado());
    setAviso(texto);
  };

  // Monta o e-mail no aplicativo da própria pessoa: nada passa pelos servidores do site
  const abrirEmail = (e) => {
    e.preventDefault();
    window.location.href = montarMailto(CONTATO_PRIVACIDADE, { pedido, perfil, mensagem });
  };

  return (
    <PaginaLegal titulo="Seus dados (LGPD)" onVoltar={onVoltar}>
      <Secao titulo="O que existe sobre você">
        <p>
          O site não tem banco de dados nem cadastro. No servidor, os dados de perfis ficam só em memória temporária e somem
          sozinhos em até 30 minutos. Neste navegador existe:
        </p>
        <Lista>
          <li>Conversa com a SteamBB: <strong>{armazenado.mensagens} mensagens salvas</strong>.</li>
          <li>Estatísticas de visita: <strong>{armazenado.estatisticas}</strong>.</li>
        </Lista>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
          <button
            onClick={() => apagar([CHAVE_CONVERSA], 'Conversa apagada deste navegador.')}
            className={`${botaoBrutal} bg-red-500 hover:bg-red-400 text-zinc-950 px-4 py-2 text-xs flex items-center justify-center gap-2`}
          >
            <Icone icone={Trash2} caixa={false} cor="escuro" tamanho={16} /> Apagar conversa salva
          </button>
          <button
            onClick={onAbrirPreferencias}
            className={`${botaoBrutal} bg-zinc-200 hover:bg-white text-zinc-950 px-4 py-2 text-xs flex items-center justify-center gap-2`}
          >
            <Icone icone={ShieldCheck} caixa={false} cor="escuro" tamanho={16} /> Mudar escolha de estatísticas
          </button>
          <button
            onClick={() => apagar([CHAVE_CONVERSA, CHAVE_PRIVACIDADE], 'Tudo apagado deste navegador. O aviso de privacidade vai aparecer de novo ao recarregar.')}
            className={`${botaoBrutal} bg-zinc-950 hover:bg-zinc-800 text-zinc-100 px-4 py-2 text-xs flex items-center justify-center gap-2`}
          >
            <Icone icone={Trash2} caixa={false} cor="claro" tamanho={16} /> Apagar tudo deste navegador
          </button>
        </div>
        {aviso && <p role="status" className="surgir font-bold text-lime-400">{aviso}</p>}
      </Secao>

      <Secao titulo="Não quer que seu perfil apareça?">
        <p>
          Na Steam, vá em Editar perfil &gt; Configurações de privacidade e deixe o perfil ou os "Detalhes do jogo" como
          privados. A partir daí ele não pode mais ser consultado aqui, e o que estava em cache some em até 30 minutos (prévias
          de links compartilhados, em até cerca de 25 horas).
        </p>
      </Secao>

      <Secao titulo="Fazer um pedido ao canal de privacidade">
        <p>
          Para qualquer pedido da LGPD (art. 18), preencha abaixo. O botão só abre o seu aplicativo de e-mail com a mensagem
          pronta: <strong>nada é enviado para os nossos servidores</strong>. Respondemos em até 15 dias. Canal: <Contato />.
        </p>
        {CONTATO_PRIVACIDADE ? (
          <form onSubmit={abrirEmail} className="flex flex-col gap-4 bg-zinc-950 border-4 border-zinc-700 p-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="lgpd-pedido" className="text-xs font-black uppercase text-zinc-300">Tipo de pedido</label>
              <select
                id="lgpd-pedido"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                className={`${campoBrutal} px-3 py-2 text-sm cursor-pointer`}
              >
                {PEDIDOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lgpd-perfil" className="text-xs font-black uppercase text-zinc-300">
                Perfil Steam relacionado <span className="normal-case font-bold text-zinc-400">(opcional)</span>
              </label>
              <input
                id="lgpd-perfil"
                type="text"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                placeholder="Link do perfil ou SteamID64"
                className={`${campoBrutal} px-3 py-2 text-sm`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lgpd-mensagem" className="text-xs font-black uppercase text-zinc-300">Detalhes</label>
              <textarea
                id="lgpd-mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Conte o que você precisa. Não inclua senhas nem documentos."
                className={`${campoBrutal} px-3 py-2 text-sm resize-y`}
              />
            </div>
            <button
              type="submit"
              className={`${botaoBrutal} self-start bg-lime-400 hover:bg-lime-300 text-zinc-950 px-5 py-3 text-sm flex items-center gap-2`}
            >
              <Icone icone={Mail} caixa={false} cor="escuro" tamanho={18} /> Abrir meu e-mail com o pedido
            </button>
          </form>
        ) : (
          <p role="status" className="font-bold text-amber-300 bg-zinc-950 border-4 border-amber-400 p-3">
            O formulário fica disponível assim que o e-mail do canal de privacidade for publicado.
          </p>
        )}
      </Secao>
    </PaginaLegal>
  );
};

export default SeusDados;
