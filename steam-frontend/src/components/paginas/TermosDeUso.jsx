import PaginaLegal, { Contato, LinkExterno, Lista, Secao } from './PaginaLegal';
import { IDADE_MINIMA } from '../../lib/legal';

const TermosDeUso = ({ onVoltar, onAbrirPagina }) => (
  <PaginaLegal titulo="Termos de Uso" onVoltar={onVoltar}>
    <Secao titulo="1. Aceite">
      <p>
        Ao usar o SteamBB // Dash você concorda com estes Termos e com a{' '}
        <a href="/privacidade" onClick={(e) => { e.preventDefault(); onAbrirPagina('/privacidade'); }} className="underline decoration-2 underline-offset-2 text-lime-400 hover:text-lime-300">
          Política de Privacidade
        </a>
        . Se não concordar, não use o site.
      </p>
    </Secao>

    <Secao titulo="2. Idade mínima">
      <p>
        O site é destinado a maiores de {IDADE_MINIMA} anos. A IA usa humor ácido, sarcasmo e palavrões. Ao usar o site, você
        declara ter {IDADE_MINIMA} anos ou mais.
      </p>
    </Secao>

    <Secao titulo="3. O que é o serviço">
      <Lista>
        <li>Um projeto pessoal, gratuito, sem fins lucrativos e oferecido "no estado em que se encontra".</li>
        <li>
          Não é afiliado, patrocinado nem aprovado pela Valve Corporation. Steam e o logotipo da Steam são marcas da Valve
          Corporation. Os dados vêm da API pública da Steam, usada conforme os{' '}
          <LinkExterno href="https://steamcommunity.com/dev/apiterms">termos da Steam Web API</LinkExterno>.
        </li>
        <li>
          Pode ficar fora do ar, mudar ou ser encerrado a qualquer momento. Os servidores são de planos gratuitos e podem
          demorar para responder.
        </li>
      </Lista>
    </Secao>

    <Secao titulo="4. Valores são estimativas">
      <p>
        O "valor da conta" e o "dinheiro jogado fora" são estimativas pelo preço cheio atual dos jogos na loja brasileira da
        Steam. Não representam o que você pagou e não consideram promoções, presentes, pacotes, reembolsos ou jogos que saíram da
        loja. Não são conselho financeiro.
      </p>
    </Secao>

    <Secao titulo="5. Conteúdo gerado por IA">
      <Lista>
        <li>
          As respostas da SteamBB são geradas automaticamente por inteligência artificial, em tom de humor e zoeira. Elas não
          são fatos, não representam a opinião do mantenedor do site e podem conter erros.
        </li>
        <li>
          A IA é orientada a zoar só hábitos de jogo e nunca aparência, família, renda ou características pessoais, mas pode
          errar. Se uma resposta passar do limite, avise pelo canal de contato.
        </li>
        <li>Não envie à IA dados pessoais, senhas ou informações sensíveis.</li>
      </Lista>
    </Secao>

    <Secao titulo="6. O que você não pode fazer">
      <Lista>
        <li>
          Usar o site, o duelo ou as respostas da IA para humilhar, assediar, intimidar ou expor alguém que não topou a
          brincadeira.
        </li>
        <li>Pesquisar perfis de terceiros para perseguição ou qualquer finalidade ilegal.</li>
        <li>Tentar burlar os limites de uso, sobrecarregar os servidores ou automatizar consultas em massa.</li>
        <li>Tentar fazer a IA produzir conteúdo ilegal, discriminatório ou de ódio.</li>
      </Lista>
      <p>Quem descumprir estes Termos responde pelos próprios atos.</p>
    </Secao>

    <Secao titulo="7. Perfis de outras pessoas">
      <p>
        Você pode pesquisar perfis públicos da Steam, inclusive de amigos no duelo. Use esse recurso com quem topou a zoeira e
        respeite a privacidade alheia. Quem não quiser aparecer pode deixar o perfil privado na Steam (veja a Política de
        Privacidade).
      </p>
    </Secao>

    <Secao titulo="8. Propriedade intelectual">
      <Lista>
        <li>
          Nomes, capas e marcas dos jogos pertencem aos respectivos donos. Os avatares pertencem aos usuários da Steam. Essas
          imagens são exibidas a partir dos servidores da própria Steam, apenas para identificar jogos e perfis.
        </li>
        <li>
          O site usa componentes de código aberto, como elementos do Uiverse.io (licença MIT) e ícones Lucide (licença ISC),
          com os devidos créditos no repositório do projeto.
        </li>
        <li>
          Se você é dono de algum conteúdo exibido e quer que ele seja removido, fale com o canal de contato.
        </li>
      </Lista>
    </Secao>

    <Secao titulo="9. Doações">
      <p>
        O botão "Me pague um café" leva ao Ko-fi. Doações são voluntárias, não dão direito a nenhum benefício ou serviço extra e
        são processadas pelo Ko-fi, conforme os termos deles.
      </p>
    </Secao>

    <Secao titulo="10. Responsabilidade">
      <p>
        Na medida permitida pela lei, o mantenedor não se responsabiliza por decisões tomadas com base nas estimativas ou nas
        respostas da IA, por indisponibilidade do serviço ou por dados incorretos vindos da Steam. Nada nestes Termos limita
        direitos que a lei garante a você, inclusive os do Código de Defesa do Consumidor, quando aplicável.
      </p>
    </Secao>

    <Secao titulo="11. Contato, mudanças e lei aplicável">
      <p>Fale conosco pelo canal: <Contato />.</p>
      <p>
        Estes Termos podem ser atualizados; a data no topo mostra a versão em vigor. Eles seguem as leis brasileiras, e fica
        eleito o foro do domicílio do usuário para resolver eventuais conflitos.
      </p>
    </Secao>
  </PaginaLegal>
);

export default TermosDeUso;
