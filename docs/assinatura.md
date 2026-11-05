# Pagamentos do Caderninho

O acesso começa com 3 dias grátis. Depois, a pessoa escolhe um plano e paga uma vez pelo Checkout Pro do Mercado Pago, por Pix ou cartão. O plano mensal libera 30 dias e o anual libera 365 dias. Não há cobrança recorrente.

O primeiro pagamento mensal aprovado pode usar o preço promocional ativo. Depois de uma compra mensal aprovada, novas compras mensais usam o preço mensal normal. Um estorno remove os dias daquela compra; se não restar outra compra mensal aprovada, a promoção volta a aparecer.

## Configuração

1. Aplique as migrações do Supabase, incluindo `202611050001_pagamento_unico.sql`.
2. Configure os segredos `MP_ACCESS_TOKEN` e `APP_URLS` nas Edge Functions. O Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Não coloque o Access Token nem a chave `service_role` no app.
3. Publique as funções `assinatura` e `mp-webhook`.

A função de criação envia `notification_url` em cada preferência do Checkout Pro. O webhook recebe somente um aviso e consulta `GET /v1/payments/{id}` com o Access Token antes de registrar qualquer compra. A situação da conta vem de `minha_situacao()` e das compras aprovadas no banco.

## Testes automatizados

Na pasta `testes`, rode:

```sh
node --test assinatura.test.mjs sincronizar.test.mjs supabase-falso.test.mjs
```

Pagamentos feitos com credenciais de teste não enviam notificações do Mercado Pago, então os testes automatizados usam o servidor falso e as migrações locais.

## Falta confirmar em produção

- Se o Checkout Pro oferece Pix para as preferências criadas.
- Se a opção de pagar como usuário convidado aparece e conclui o pagamento.
- Se o Mercado Pago envia a notificação usando a `notification_url` definida na preferência.
- Se um estorno real é recebido e remove a validade da compra correta.
