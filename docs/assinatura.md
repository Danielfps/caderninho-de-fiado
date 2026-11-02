# Como ligar os planos pagos

Este guia configura a conta, a assinatura mensal e a compra anual do Caderninho. O caderno continua guardado no aparelho e a sincronização usa a conta do Supabase.

| Plano | Preço | Como funciona |
|---|---:|---|
| Teste grátis | Grátis por 3 dias | Começa quando a conta é criada. |
| Mensal promocional | R$ 14,90 | Só na primeira mensalidade da conta. |
| Mensal | R$ 19,90 por mês | Cobrança recorrente no cartão. |
| Anual | R$ 149,90 | Pagamento único no Checkout Pro; libera 365 dias. |

## 1. Aplicar as migrações

No terminal, entre na pasta do projeto e aplique as migrações do Supabase:

```sh
supabase login
supabase link --project-ref ID_DO_PROJETO
supabase db push
```

As migrações criam os planos, as assinaturas, as compras anuais e a função que informa se a conta está liberada. O preço exibido vem da tabela `public.planos`.

## 2. Configurar os segredos

No painel do Mercado Pago, abra a aplicação do Caderninho e copie o Access Token. Em **Webhooks**, copie também o segredo de assinatura. Guarde os dois como segredos do Supabase:

```sh
supabase secrets set MP_ACCESS_TOKEN="TOKEN_DO_MERCADO_PAGO"
supabase secrets set MP_WEBHOOK_SECRET="SEGREDO_DO_WEBHOOK"
supabase secrets set APP_URLS="https://danielfps.github.io/caderninho-dos-doces/,http://localhost:8000/"
```

O Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` às funções. Nunca coloque o token do Mercado Pago nem a chave `service_role` no app.

`APP_URLS` é a lista de endereços permitidos para voltar do pagamento e para chamadas do navegador. O endereço precisa coincidir com um item da lista.

## 3. Publicar as funções

```sh
supabase functions deploy assinatura
supabase functions deploy mp-webhook --no-verify-jwt
```

A função `assinatura` exige a sessão da pessoa. `mp-webhook` é chamada pelo Mercado Pago e confere o HMAC do cabeçalho `x-signature` antes de processar um aviso.

## 4. Configurar os avisos do Mercado Pago

No painel, abra **Suas integrações → Webhooks** e cadastre:

```text
https://ID_DO_PROJETO.supabase.co/functions/v1/mp-webhook
```

Ative os eventos:

- Em **Planos e assinaturas**: `subscription_preapproval` e `subscription_authorized_payment`.
- Em **Pagamentos**: `payment`.

O aviso de assinatura atualiza a situação mensal. Quando há prova de que a primeira cobrança promocional foi aprovada, o servidor marca a promoção como usada e tenta mudar a cobrança seguinte para R$ 19,90. O aviso `payment` atualiza ou estorna as compras anuais. O botão **Já paguei, conferir** faz buscas adicionais caso um aviso demore.

## 5. Fazer um teste controlado

1. Use o Access Token de teste e o segredo de Webhook da mesma aplicação de teste. Não misture credenciais de teste e de produção.
2. Crie um usuário vendedor de teste e um usuário comprador de teste no Mercado Pago.
3. Crie uma conta de teste no Caderninho e escolha o plano mensal ou anual.
4. Para testar o pagamento, use um cartão de teste:

   | Cartão | Número | CVV | Validade |
   |---|---|---|---|
   | Mastercard | `5031 4332 1540 6351` | `123` | `11/30` |
   | Visa | `4235 6477 2802 5682` | `123` | `11/30` |

   Use `APRO` como nome do titular para aprovar e `OTHE` para simular uma recusa.
5. Volte ao app, toque em **Já paguei, conferir** e confirme que o plano e a data de liberação mudaram.
6. Confira as entregas do Webhook no painel do Mercado Pago e os logs das funções no Supabase. Repita a conferência para verificar que um aviso repetido não duplica a compra.

Depois dos testes, configure credenciais e Webhooks de produção e faça um teste controlado. Não use cartão real para testar.

## 6. Trocar os preços

Os preços são lidos de `public.planos`; para trocar o preço anunciado, use o SQL Editor do Supabase:

```sql
update public.planos set valor = 19.90 where id = 'mensal';
update public.planos set valor = 14.90 where id = 'mensal_promo';
update public.planos set valor = 149.90 where id = 'anual';
```

Troque os valores pelos preços aprovados. Isso altera novas compras. Uma assinatura mensal já criada no Mercado Pago conserva o preço que foi enviado para ela, até que o servidor confirme a primeira cobrança promocional e peça a mudança para o preço mensal cheio. Não altere à mão uma assinatura ativa no painel sem planejar o que o app vai mostrar.

Para desligar um plano sem apagar o histórico, use `update public.planos set ativo = false where id = 'mensal_promo';`. A função só oferece planos ativos.

## 7. Conferências necessárias no primeiro teste

O desenho recebido tem alguns detalhes que precisam ser confirmados com uma cobrança de teste e os logs do Mercado Pago:

- **Resumo da assinatura:** confirmar se `preapproval.summary.charged_quantity` aparece na resposta da consulta e passa a `1` depois do primeiro pagamento.
- **Aviso da cobrança mensal:** confirmar se `subscription_authorized_payment` retorna o `authorized_payment` com `status: processed` e `payment.status: approved` como esperado.
- **Mudança da próxima mensalidade:** confirmar se `PUT /preapproval/{id}` aceita `auto_recurring.transaction_amount` e `reason` e se a resposta (ou um `GET` seguinte) informa R$ 19,90.
- **Checkout anual:** confirmar se o Mercado Pago aceita `payment_methods.installments`, `default_installments`, `expires`, `expiration_date_to` e `statement_descriptor` juntos, e se `init_point` é o endereço de produção esperado.
- **Volta automática:** confirmar se `auto_return: approved` funciona com a URL HTTPS cadastrada. O servidor só envia esse campo para retorno HTTPS.
- **Aviso de compra e estorno:** confirmar que o evento `payment` contém `data.id` e que a consulta do pagamento retorna `external_reference`, `currency_id`, `transaction_amount` e o status final (`approved`, `refunded` ou `charged_back`).

Se algum campo não vier no formato esperado, o servidor não consome a promoção sem prova de pagamento e não libera uma compra anual sem conferir moeda, valor e referência da conta.

## 8. Conferência diária da promoção

Como precaução, uma rotina diária pode buscar as assinaturas ainda com `valor < 19,90`, consultar o Mercado Pago e repetir a atualização de preço quando já houver prova da primeira cobrança. Faça essa rotina por uma Edge Function agendada e protegida, que percorra apenas essas assinaturas e reutilize a mesma regra de `conferir`; `pg_cron` com `pg_net` pode chamar essa função uma vez por dia. Guarde a chave de chamada no Vault do Supabase, nunca no SQL público. Essa rotina é uma proteção extra: a pessoa também pode tocar em **Já paguei, conferir** e o Webhook tenta atualizar a assinatura.

## 9. Ligar o app

Em `app/index.html`, preencha `CONTA_URL` e `CONTA_CHAVE` com a URL do projeto e a chave pública (anon). Não use `service_role`. Depois, publique o app e confira a conta e os dois planos em um aparelho de teste.

O prazo liberado é calculado pelo servidor. A mensal ativa tem três dias de tolerância após a validade; assinatura pausada ou cancelada mantém o período já pago. Uma compra anual aprovada acrescenta 365 dias, e outra compra anual começa quando a validade anterior terminar.
