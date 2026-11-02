# Vários celulares na mesma conta (e a conta que não cai sem internet)

Feito em 02/11/2026. Plano e decisões em [docs/plano-2026-11-02.md](plano-2026-11-02.md).

## O que a pessoa vê

- **Entrou na conta, os dados ficam guardados nela.** Vendas, pagamentos, acertos, clientes, produtos (com foto),
  o nome do negócio e a planilha de custos (contas do mês, materiais, receitas) sobem para a conta sozinhos.
- **Outro celular:** abre o Caderninho e entra com o mesmo e-mail e senha. Tudo aparece lá. O que um anota aparece
  no outro em poucos segundos (o app confere a cada 20 s com ele aberto, logo depois de cada mudança, ao voltar
  para o app e quando a internet volta).
- **Perdeu ou trocou de celular:** entra na conta no celular novo e tudo volta.
- **Sem internet (modo avião):** continua usando normalmente e continua na conta. O que anotar fica esperando e
  sobe quando a internet voltar. Em "Minha conta" (e em Ajustes) aparece o quadro "Guardado na sua conta" com
  "Guardado", "Esperando internet" ou "Tentando de novo".
- **Outra conta no mesmo celular:** as contas de cada conta ficam separadas. Quem entra com outra conta vê o
  caderninho dela; as da conta anterior ficam guardadas no celular e voltam quando ela entrar de novo.

## A planilha (a ideia original do Daniel)

A planilha continua sendo a cópia que a pessoa entende e guarda onde quiser:

- **"Mandar a planilha (Drive, WhatsApp, e-mail)"** na tela Planilha: abre o "compartilhar" do celular; escolhendo
  o Google Drive, a planilha fica guardada lá. (Sem esse recurso no celular, a planilha é baixada.)
- **Celular novo e vazio + "Trazer planilha":** traz o **histórico inteiro** de volta (vendas com vários produtos,
  vendas pagas na hora, pagamentos, acertos, clientes, produtos e a planilha de custos). Com o caderninho em uso,
  "Trazer planilha" continua trazendo só o que é novo na planilha, como antes.

Por que a ponte entre os celulares é a conta e não a planilha do Google: dois celulares escrevendo ao mesmo tempo
numa planilha estragam fórmulas e perdem linhas, a API do Google tem limite de uso e pede um login do Google com
aviso de "app não verificado", e nada disso funciona sem internet. A conta já existe para o login e a assinatura.

## Como funciona por dentro

- O caderninho vira uma lista de registros `{c, id, d}` (coleção, código, dados): `produtos`, `clientes`, `lanc`,
  `contas`, `materiais`, `receitas` e `config` (`ajustes` e `planilha`, as contas fixas da planilha).
- O celular guarda à parte (IndexedDB `caderninho` → `kv` → `caderninho-sync`) `{conta, rev, base}`: de qual conta
  são os dados, até onde já recebeu (`rev`) e a "impressão" (hash do JSON com as chaves em ordem) de cada registro na
  última conversa com a conta (`base`). Impressão diferente da base = mudou neste celular e sobe.
- `salvar()` continua sendo o único lugar que grava; ele chama `sync.mudou()`, que espera 1,5 s e sobe tudo o que
  mudou em lotes (até 500 registros / ~900 KB), recebendo junto o que os outros celulares mudaram.
- Servidor: `public.sincronizar(desde, mudancas, aparelho)` (`supabase/migrations/202611020001_sincronizar.sql`).
  Trava por conta, dá um número (`rev`) a cada pedido com mudanças e devolve tudo o que mudou depois de `desde`, em
  páginas que nunca cortam um `rev` no meio.
- Conflito (o mesmo registro mexido em dois celulares antes de conversarem): vale o que chegou por último ao
  servidor. Registro mexido aqui e ainda não subido não é trocado pelo que desce.
- Apagar vira lápide (`x: true`). Venda ou pagamento de um cliente apagado em outro celular sai também.
- Primeira vez de um celular numa conta: traz tudo e junta com o que já tem (nada se perde). As contas do mês
  padrão de um celular vazio não duplicam as da conta.
- Outra conta no mesmo celular: `caderninho-v1@<id da conta>` e `caderninho-sync@<id da conta>` guardam as contas da
  anterior.

## Conta que não cai

- Sem internet, servidor fora do ar (5xx), muitas tentativas (429) ou demora (15 s; 60 s para sincronizar): a
  pessoa **continua na conta**. Só sai quando o servidor diz com certeza que a entrada acabou
  (`refresh_token_not_found`, `session_not_found`, `user_not_found`...).
- Duas janelas do app (o app instalado e o navegador, por exemplo): antes de renovar a entrada, o app lê a entrada
  guardada; se outra janela já renovou, usa a dela (assim o "já usado" do Supabase não derruba ninguém). As janelas
  também se avisam pelo evento `storage`.
- Relógio do celular errado: o vencimento do token é contado pelo relógio do servidor (`dif`). Se o servidor recusar
  o token como vencido, o app renova uma vez e repete o pedido.
- Assinatura mensal ativa que venceu enquanto o celular estava sem internet: mais 7 dias de folga até conseguir
  conferir.
- No Supabase, **não ligue** "Single session per user" (Authentication → Sessions): é ele que deixa a mesma conta
  em vários celulares.

## Testes

- `node testes/sincronizar.e2e.mjs`: dois celulares (Playwright) contra um Supabase de mentira
  (`testes/supabase-falso.mjs`, com as migrações de verdade no PGlite): subir e descer, modo avião, servidor fora do
  ar, relógio atrasado, outra conta no mesmo celular, planilha que traz o histórico num celular novo e os planos.
- `node --test testes/sincronizar.test.mjs testes/supabase-falso.test.mjs`: o SQL de verdade no PGlite e o servidor
  de mentira.
