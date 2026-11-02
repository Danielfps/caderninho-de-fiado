# Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026)

O Daniel pediu para o Claude trabalhar sozinho à noite e desligar o computador no fim. Antes disso, tudo foi enviado
ao GitHub no ramo **`claude/fiado-sincronizar-planos`** (saiu do `claude/fiado-conta-assinatura`). Não foi para o ramo
principal, então o endereço do GitHub Pages continua com a versão antiga.

## O que ficou pronto

1. **Conta que não cai.** Sem internet (modo avião), servidor fora do ar, internet ruim, relógio errado do celular ou
   duas janelas do app abertas: a pessoa continua na conta. Só sai quando o servidor diz com certeza que a entrada
   acabou. Assinatura mensal que vence com o celular sem internet ganha 7 dias de folga.
2. **Vários celulares na mesma conta.** Vendas, pagamentos, clientes, produtos (com foto) e a planilha de custos
   ficam guardados na conta. Entrou no outro celular com o mesmo e-mail e senha, tudo aparece; o que um anota aparece
   no outro em segundos. Funciona sem internet (manda quando volta). Perdeu o celular: entra no novo e tudo volta.
   Outra conta no mesmo celular não mistura nada. Detalhes: `docs/sincronizar.md`.
3. **A planilha (ideia do Daniel).** Botão "Mandar a planilha" (Google Drive, WhatsApp, e-mail) e, num celular vazio,
   "Trazer planilha" traz o histórico inteiro de volta.
4. **Planos novos.** 3 dias grátis; **mensal** no cartão: R$ 14,90 no 1º mês (uma vez por conta) e depois R$ 19,90
   sozinho; **anual** R$ 149,90 no Pix ou no cartão (pagamento único, não renova sozinho; o app avisa na última
   semana). Detalhes e passo a passo: `docs/assinatura.md`.

Por que a ponte entre os celulares é a conta e não a planilha do Google: com dois celulares escrevendo na mesma
planilha, fórmulas e linhas se perdem; a API do Google tem limite e pede login do Google com aviso de "app não
verificado"; e nada disso funciona sem internet. A planilha virou a cópia que a pessoa entende e guarda.

## Testes que passaram antes de desligar (todos com 0 falha)

- `node testes/sincronizar.e2e.mjs`: dois celulares de mentira contra um Supabase de mentira com as migrações de
  verdade (14 passos: subir e descer, modo avião, servidor fora do ar, relógio atrasado, troca de conta, planilha que
  traz o histórico, planos mensal e anual).
- `node --test testes/assinatura.test.mjs testes/sincronizar.test.mjs testes/supabase-falso.test.mjs`: regras do
  servidor, SQL de verdade no PGlite e o Supabase de mentira.
- `node testes/conta.test.mjs`: o teste antigo da conta no modo de teste.
- O teste da planilha com LibreOffice (`testes/planilha.test.js`) não rodou: o LibreOffice não está instalado neste
  computador. As contas da planilha não foram mexidas; só o "trazer" ganhou o modo recuperar (testado no ponta a ponta).

## Falta (decisão ou conta do Daniel)

1. Criar o projeto no Supabase, aplicar as 3 migrações (`supabase/migrations/`) e publicar as funções.
2. Mandar as chaves do Mercado Pago (vão nos segredos do servidor, nunca no app) e cadastrar o webhook com os eventos
   "Planos e assinaturas" e "Pagamentos".
3. Primeiro teste real com usuários de teste do Mercado Pago, seguindo a lista "conferir no primeiro teste" de
   `docs/assinatura.md` (alguns campos do Mercado Pago não puderam ser confirmados na documentação).
4. Só então juntar o ramo no principal para publicar.
