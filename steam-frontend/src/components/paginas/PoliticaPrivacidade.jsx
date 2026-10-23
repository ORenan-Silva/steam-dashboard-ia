import PaginaLegal, { Contato, LinkExterno, Lista, Secao } from './PaginaLegal';
import { IDADE_MINIMA } from '../../lib/legal';

// Texto escrito a partir do que o código faz de verdade (caches, provedores, armazenamento local).
// Se o funcionamento mudar, atualize este texto e VERSAO_PRIVACIDADE em lib/legal.js.
const PoliticaPrivacidade = ({ onVoltar, onAbrirPagina }) => (
  <PaginaLegal titulo="Política de Privacidade" onVoltar={onVoltar}>
    <Secao titulo="1. Quem cuida dos seus dados">
      <p>
        O SteamBB // Dash é um projeto pessoal, gratuito e sem fins lucrativos, mantido por uma pessoa física, que atua como
        controladora dos dados pessoais tratados aqui, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018, a
        "LGPD"). O projeto não tem relação com a Valve Corporation nem com a Steam.
      </p>
      <p>Canal de privacidade (dúvidas, pedidos e reclamações): <Contato />.</p>
    </Secao>

    <Secao titulo="2. Quais dados tratamos">
      <p>Tratamos apenas o necessário para o painel funcionar:</p>
      <Lista>
        <li>
          <strong>Dados públicos de perfis da Steam</strong> que você pesquisar (seu ou de outra pessoa, como no duelo): SteamID,
          apelido, avatar, link e status do perfil, lista de jogos, tempo de jogo, jogos das últimas 2 semanas e conquistas.
          Eles vêm da API oficial da Steam e só existem se o próprio perfil estiver público.
        </li>
        <li>
          <strong>Mensagens enviadas à IA</strong> (SteamBB) e um resumo da biblioteca do perfil carregado (nomes de jogos e
          horas), necessários para gerar a resposta.
        </li>
        <li>
          <strong>Endereço IP</strong>, usado por 1 minuto, só na memória do servidor, para limitar o número de mensagens e
          evitar abuso. Os provedores de hospedagem também registram dados técnicos de acesso nos registros (logs) deles.
        </li>
        <li>
          <strong>Dados guardados no seu navegador</strong> (armazenamento local, não são cookies): a conversa com a IA (até 50
          mensagens) e sua escolha de privacidade. Esses dados não são enviados para nós.
        </li>
        <li>
          <strong>Estatísticas de visita</strong>, somente se você permitir: páginas visitadas (sem o perfil pesquisado),
          país, navegador e tipo de dispositivo, de forma agregada pelo Vercel Analytics.
        </li>
      </Lista>
      <p>
        <strong>Não coletamos</strong> nome real, e-mail, senha, login da Steam, dados de pagamento nem documentos. Não há
        cadastro, não vendemos dados e não exibimos publicidade.
      </p>
    </Secao>

    <Secao titulo="3. Para que usamos e com qual base legal">
      <Lista>
        <li>
          <strong>Mostrar o painel e gerar as respostas que você pediu:</strong> execução do serviço solicitado por você (art.
          7º, V, da LGPD).
        </li>
        <li>
          <strong>Consultar perfis de outras pessoas (por exemplo, no duelo):</strong> legítimo interesse (art. 7º, IX),
          considerando que são dados tornados públicos pelo próprio titular na Steam (art. 7º, § 4º), usados só para a
          finalidade do painel e sem armazenamento permanente.
        </li>
        <li>
          <strong>Segurança e limite de uso pelo IP:</strong> legítimo interesse (art. 7º, IX), para manter o serviço no ar.
        </li>
        <li>
          <strong>Estatísticas de visita:</strong> consentimento (art. 7º, I), que você pode retirar a qualquer momento.
        </li>
      </Lista>
    </Secao>

    <Secao titulo="4. Por quanto tempo">
      <p>Não temos banco de dados. Os dados ficam apenas em memória temporária (cache), que se apaga sozinha:</p>
      <Lista>
        <li>Biblioteca e jogos recentes de um perfil: até 10 minutos.</li>
        <li>Resultado da varredura de conquistas ("quase platinados"): até 30 minutos.</li>
        <li>Endereço IP para o limite de uso: 1 minuto.</li>
        <li>
          Prévia de links compartilhados (imagem e título com nome, avatar e números do perfil): guardada pela Vercel por até
          cerca de 25 horas.
        </li>
        <li>Conversa e escolha de privacidade no seu navegador: até você apagar (veja a página Seus dados).</li>
        <li>Registros técnicos dos provedores: conforme as políticas de cada um.</li>
      </Lista>
      <p>Os preços dos jogos ficam em cache por até 12 horas, mas não são dados pessoais.</p>
    </Secao>

    <Secao titulo="5. Com quem compartilhamos">
      <p>Usamos estes provedores, cada um com sua própria política:</p>
      <Lista>
        <li>
          <strong>Valve / Steam:</strong> fonte dos dados dos perfis, jogos e preços. As capas dos jogos e os avatares são
          carregados pelo seu navegador direto dos servidores da Steam, que recebem seu IP. {' '}
          <LinkExterno href="https://store.steampowered.com/privacy_agreement/">Política da Valve</LinkExterno>.
        </li>
        <li>
          <strong>Groq:</strong> processa as mensagens enviadas à IA e o resumo da biblioteca para gerar as respostas. {' '}
          <LinkExterno href="https://groq.com/privacy-policy/">Política do Groq</LinkExterno>.
        </li>
        <li>
          <strong>Render:</strong> hospeda o servidor (backend). {' '}
          <LinkExterno href="https://render.com/privacy">Política do Render</LinkExterno>.
        </li>
        <li>
          <strong>Vercel:</strong> hospeda o site e, se você permitir, as estatísticas. Segundo a Vercel, o Vercel Analytics não
          usa cookies e identifica a visita por um código (hash) descartado em 24 horas. {' '}
          <LinkExterno href="https://vercel.com/docs/analytics/privacy-policy">Privacidade do Vercel Analytics</LinkExterno>.
        </li>
        <li>
          <strong>Ko-fi:</strong> só se você clicar em "Me pague um café"; a doação acontece no site deles. {' '}
          <LinkExterno href="https://more.ko-fi.com/privacy">Política do Ko-fi</LinkExterno>.
        </li>
      </Lista>
    </Secao>

    <Secao titulo="6. Transferência internacional">
      <p>
        Groq, Render, Vercel e Valve ficam fora do Brasil (principalmente nos Estados Unidos). Por isso, os dados descritos
        acima são transferidos para outro país, nos termos do art. 33 da LGPD. Escolhemos provedores que publicam políticas de
        proteção de dados e enviamos a eles apenas o necessário.
      </p>
    </Secao>

    <Secao titulo="7. Se pesquisaram o seu perfil">
      <p>
        Qualquer pessoa pode pesquisar um perfil público da Steam aqui, como em outros sites de estatísticas da Steam. Nada fica
        guardado de forma permanente. Para não aparecer, deixe seu perfil ou os "Detalhes do jogo" como privados na Steam
        (Editar perfil &gt; Configurações de privacidade). Em até 30 minutos os caches expiram. Você também pode falar com o
        canal de privacidade.
      </p>
    </Secao>

    <Secao titulo="8. Seus direitos">
      <p>
        Pelo art. 18 da LGPD, você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização, bloqueio
        ou eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos, informação sobre a
        possibilidade de não consentir e revogação do consentimento. Também pode se opor a tratamentos baseados em legítimo
        interesse.
      </p>
      <p>
        Como não guardamos dados de forma permanente, muitos pedidos são atendidos na hora pela página{' '}
        <a href="/seus-dados" onClick={(e) => { e.preventDefault(); onAbrirPagina('/seus-dados'); }} className="underline decoration-2 underline-offset-2 text-lime-400 hover:text-lime-300">
          Seus dados
        </a>
        , que apaga o que está no seu navegador. Os demais pedidos são respondidos em até 15 dias pelo canal de privacidade.
        Você também pode reclamar à Autoridade Nacional de Proteção de Dados ({' '}
        <LinkExterno href="https://www.gov.br/anpd/pt-br">ANPD</LinkExterno>).
      </p>
    </Secao>

    <Secao titulo="9. Cookies e armazenamento local">
      <p>
        Este site não usa cookies. Usamos o armazenamento local do navegador só para guardar a conversa com a IA e sua escolha
        de privacidade. As estatísticas são opcionais e começam desligadas; você pode mudar de ideia em "Preferências de
        privacidade", no rodapé.
      </p>
    </Secao>

    <Secao titulo="10. Crianças e adolescentes">
      <p>
        O site é destinado a maiores de {IDADE_MINIMA} anos, porque a IA usa humor ácido e palavrões. Não tratamos
        intencionalmente dados de crianças e adolescentes. Se você é responsável por um menor que usou o site, fale com o canal de
        privacidade.
      </p>
    </Secao>

    <Secao titulo="11. Segurança">
      <p>
        As chaves de acesso à Steam e ao Groq ficam só no servidor, a comunicação é criptografada (HTTPS), há limite de uso por IP
        e os dados não são gravados em banco de dados. Se houver um incidente de segurança que possa causar risco relevante,
        avisaremos a ANPD e as pessoas afetadas, como manda o art. 48 da LGPD.
      </p>
    </Secao>

    <Secao titulo="12. Mudanças nesta política">
      <p>
        Podemos atualizar esta política. Quando a mudança for relevante, a data acima muda e o aviso de privacidade aparece de
        novo para você confirmar sua escolha.
      </p>
    </Secao>
  </PaginaLegal>
);

export default PoliticaPrivacidade;
