# Conformidade: LGPD, acessibilidade e riscos jurídicos

Revisão técnica feita em 23/10/2026. **Isto não é parecer jurídico.** Os textos da Política de Privacidade e dos Termos
de Uso foram redigidos a partir do que o código realmente faz, mas devem ser revisados por um advogado antes de servirem
como proteção legal.

## 1. Dados pessoais: o que o sistema trata

| Dado | Onde | Por quanto tempo | Base legal indicada |
|---|---|---|---|
| Dados públicos de perfis Steam (SteamID, apelido, avatar, jogos, horas, conquistas) | Memória do servidor (Render) | 10 min (biblioteca, recentes), 30 min (conquistas) | Art. 7º, V (serviço pedido) e IX + §4º (perfis de terceiros, dados tornados públicos) |
| Mensagens à IA + resumo da biblioteca | Enviados ao Groq | Conforme a política do Groq | Art. 7º, V |
| IP do visitante | Memória do servidor (limite de uso) | 1 min | Art. 7º, IX |
| Conversa e escolha de privacidade | `localStorage` do navegador | Até a pessoa apagar | Funcionalidade pedida / consentimento |
| Estatísticas de visita | Vercel Analytics | Hash descartado em 24 h (segundo a Vercel) | Art. 7º, I (consentimento, opt-in) |
| Prévia de links (nome, avatar, números) | Cache da Vercel | Até ~25 h | Art. 7º, IX |

Não há banco de dados, cadastro, cookies, publicidade nem venda de dados.

## 2. O que foi feito

### Minimização de dados
- `/api/status` deixou de devolver o IP do visitante.
- Os logs do servidor não gravam SteamID, mensagens nem IP (só mensagens de erro curtas).
- A capa reserva dos jogos deixou de vir do `placehold.co` (um terceiro a menos recebendo o IP do visitante).
- O Vercel Analytics só carrega após consentimento e recebe a URL **sem** `?id=`/`?vs=`, que identificam perfis.
- A conversa salva no navegador é limitada a 50 mensagens e pode ser apagada em `/seus-dados`.

### Transparência e direitos do titular
- **Política de Privacidade** (`/privacidade`): controlador, dados, finalidades, bases legais, prazos, provedores,
  transferência internacional, direitos do art. 18, incidentes (art. 48), crianças e adolescentes.
- **Termos de Uso** (`/termos`): idade mínima de 18 anos, natureza humorística da IA, valores como estimativas, usos
  proibidos (assédio, perseguição), propriedade intelectual, doações, lei e foro.
- **Seus dados** (`/seus-dados`): mostra o que está guardado no navegador, apaga a conversa ou tudo, muda a escolha de
  estatísticas e tem um formulário de pedidos LGPD que só monta um e-mail no aplicativo da pessoa (nada passa pelos
  servidores do site).
- **Aviso de privacidade** no primeiro acesso: aviso de 18+, explica o armazenamento local e pede consentimento para
  estatísticas, com "Permitir" e "Só o essencial" com o mesmo destaque. Reabre pelo rodapé.

### Propriedade intelectual
- Componentes do Uiverse.io (MIT) e ícones Lucide (ISC/MIT) com créditos e textos de licença em
  `THIRD_PARTY_NOTICES.md`, publicado também em `/licencas.txt` e linkado no rodapé.
- O carregador antigo (`Loader.jsx`), de origem desconhecida, foi reescrito do zero.
- Rodapé e Termos informam que Steam é marca da Valve, que o site não é afiliado e que capas, nomes e avatares pertencem
  aos donos.

### Promessas e textos enganosos corrigidos
- "Quanto custaram os jogos" → "quanto custariam hoje" (o site não sabe o que a pessoa pagou).
- "Calcular quanto você já torrou" → "Estimar"; aviso de que não considera promoções, presentes, pacotes nem reembolsos.
- Descrições de SEO e prévia de links passaram a falar em "estimativa" e "valeria hoje".
- O terminal avisa que as respostas são geradas por IA, em tom de humor, podem errar e são enviadas ao Groq.

## 3. Acessibilidade (auditoria)

Ferramenta: axe-core 4.14, regras WCAG 2.0/2.1/2.2 níveis A e AA + boas práticas, em 11 telas (início com e sem o aviso,
abas Perfil, Valor, Jogos e Duelo, as três páginas legais, celular e terminal no celular).

Resultado final: **0 problemas**. Corrigidos durante a auditoria:
- Nome acessível diferente do texto visível em botões (cards de jogo, recentes, quase platinados e botão "IA").
- Hierarquia de títulos pulando de h1 para h3.
- `role="dialog"` em elemento que não permite esse papel.
- Seletor de ordenação sem rótulo no celular; título dentro de botão (HTML inválido).

Também verificado manualmente:
- Link "Pular para o conteúdo" é a primeira parada do Tab.
- Foco visível (contorno verde) em todos os elementos interativos.
- Abas com o padrão WAI-ARIA (setas, Home, End).
- Terminal no celular abre como diálogo, foca o campo e fecha com Esc.
- Páginas legais levam o foco ao título.
- Animações desligadas para quem ativa "reduzir movimento" no sistema; números animados são lidos com o valor final.
- Textos de apoio com contraste maior (cinza 300/400 sobre fundo escuro) e placeholders mais legíveis.
- Imagens: avatares com texto alternativo; capas e avatares repetidos (nome ao lado) marcados como decorativos.

Ferramentas automáticas pegam só parte dos problemas. Vale um teste com leitor de tela real (NVDA no Windows, TalkBack no
Android).

## 4. Riscos jurídicos identificados

| Risco | Gravidade | O que já foi feito | O que ainda depende de você |
|---|---|---|---|
| **Canal de privacidade sem e-mail** (LGPD art. 9º e 41) | Alta | Campo configurável e aviso "em configuração" | Criar o e-mail e definir `VITE_CONTATO_PRIVACIDADE` na Vercel |
| **IA zoando terceiros** (duelo, qualquer perfil público): possível ofensa à honra (injúria) | Média | Prompt proíbe ataques pessoais; aviso de humor/IA; Termos proíbem assédio; aviso no duelo | Monitorar reclamações; considerar exigir confirmação do rival |
| **Menores de idade** (Steam permite 13+; IA com palavrões) | Média | Termos e aviso exigem 18+ | Não há verificação de idade real; avaliar com advogado |
| **Marca "Steam" no nome do site** | Média | Aviso de não afiliação | Avaliar com advogado; considerar nome sem "Steam" |
| **Termos da Steam Web API** (uso da marca, limites de chamadas) | Média | Chave só no servidor, cache e limites de uso | Ler os termos (`steamcommunity.com/dev/apiterms`); não foi possível acessá-los daqui por bloqueio de rede |
| **Transferência internacional** (Groq, Render, Vercel nos EUA) | Média | Informada na política (art. 33) | Confirmar o mecanismo do art. 33 aplicável a cada provedor |
| **Imagens de jogos e avatares** (direitos autorais de terceiros) | Baixa | Carregadas da própria Steam, com atribuição e canal de remoção | — |
| **Registros de acesso (Marco Civil, art. 15)** | Baixa | Logs ficam com os provedores | Confirmar se a obrigação se aplica a pessoa física sem fins econômicos |
| **Doações (Ko-fi)** | Baixa | Termos dizem que são voluntárias e não dão benefícios | Tributação das doações, se houver valores relevantes |
| **Licença do próprio código** | Baixa | — | O repositório não tem `LICENSE`; sem ela, todos os direitos ficam reservados. Escolher uma licença se quiser liberar o código |

## 5. Manutenção

- Mudou algo no tratamento de dados (novo provedor, novo dado, novo prazo)? Atualize a Política e troque
  `VERSAO_PRIVACIDADE` em `steam-frontend/src/lib/legal.js`: o aviso reaparece para todos.
- Os prazos citados na Política vêm de `steam-backend/server.js` (`criarCache`, `rateLimit`) e de
  `steam-frontend/api/og.js` e `compartilhar.js` (`Cache-Control`). Se mudar um, mude o outro.
