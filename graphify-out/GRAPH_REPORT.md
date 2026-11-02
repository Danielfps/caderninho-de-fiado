# Graph Report - caderninho-dos-doces  (2026-11-02)

## Corpus Check
- 32 files · ~49,567 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .webmanifest 1)

## Summary
- 451 nodes · 964 edges · 20 communities (17 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- index.html
- conta.test.mjs
- assinatura/index.ts
- hoje
- Como ligar os planos pagos
- sincronizar.e2e.mjs
- ciclo
- planilha.test.js
- pages.yml
- trazerPlanilha
- responder
- planilha_xlsx.py
- Histórico do projeto
- planilha-modelo_65cae2ee.md
- package.json
- Caderninho — controle de fiado
- Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026)
- Roteiro de teste do Caderninho
- sw.js
- graphify.sh

## God Nodes (most connected - your core abstractions)
1. `abrir()` - 33 edges
2. `acaoConta()` - 32 edges
3. `render()` - 25 edges
4. `toast()` - 17 edges
5. `trazerPlanilha()` - 16 edges
6. `criarSupabaseFalso()` - 16 edges
7. `hoje()` - 14 edges
8. `saldo()` - 13 edges
9. `fechar()` - 13 edges
10. `verificarAcesso()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `App (Claude)` --references--> `salvar()`  [INFERRED]
  docs/plano-2026-11-02.md → app/index.html
- `Servidor (Esquadro): `supabase/migrations/202611020001_sincronizar.sql`` --references--> `desde()`  [INFERRED]
  docs/plano-2026-11-02.md → app/index.html
- `Como é feito` --references--> `parseMoney()`  [INFERRED]
  CLAUDE.md → app/index.html
- `Dados (não quebrar!)` --references--> `completar()`  [INFERRED]
  CLAUDE.md → app/index.html
- `Como funciona por dentro` --references--> `salvar()`  [INFERRED]
  docs/sincronizar.md → app/index.html

## Import Cycles
- None detected.

## Communities (20 total, 3 thin omitted)

### Community 0 - "index.html"
Cohesion: 0.07
Nodes (72): abrir(), abrirConta(), abrirReceita(), acaoConta(), aplicarPlanilha(), atualizarPerfil(), atualizarSyncNaTela(), atualizarUsuario() (+64 more)

### Community 1 - "conta.test.mjs"
Cohesion: 0.07
Nodes (33): adicionarClientePeloApp(), aqui, clicarAcaoTeste(), conferirCliente(), errosPagina, fluxo(), iniciarServidor(), passo() (+25 more)

### Community 2 - "assinatura/index.ts"
Cohesion: 0.14
Nodes (37): compararConstante(), lerAssinaturaHeader(), validarAssinatura(), autorizada(), calcularLiberadoAte(), cobrancaAprovada(), criadaEm(), criarManifestoWebhook() (+29 more)

### Community 3 - "hoje"
Cohesion: 0.08
Nodes (36): bannerAssinatura(), chipsCliHTML(), contasMes(), desde(), faltaTxt(), formEditPag(), formEditVenda(), formPagar() (+28 more)

### Community 4 - "Como ligar os planos pagos"
Cohesion: 0.07
Nodes (24): 1. Aplicar as migrações, 2. Configurar os segredos, 3. Publicar as funções, 4. Configurar os avisos do Mercado Pago, 5. Fazer um teste controlado, 6. Trocar os preços, 7. Conferências necessárias no primeiro teste, 8. Conferência diária da promoção (+16 more)

### Community 5 - "sincronizar.e2e.mjs"
Cohesion: 0.10
Nodes (19): abrirCliente(), aqui, conta1, conta2, conta3, criarConta(), deve(), entrar() (+11 more)

### Community 6 - "ciclo"
Cohesion: 0.16
Nodes (25): abrirIDB(), adotarGuardada(), aparelho(), aplicarRegistro(), canon(), carregar(), carregarMeta(), chamar() (+17 more)

### Community 7 - "planilha.test.js"
Cohesion: 0.11
Nodes (17): {chromium,devices}, clientesApp(), COLUNA, comparar(), {execFileSync}, fs, horaApp(), irMes() (+9 more)

### Community 8 - "pages.yml"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, name, url, jobs, publicar, name (+15 more)

### Community 9 - "trazerPlanilha"
Cohesion: 0.15
Nodes (22): abasDoZip(), aplicarImportacao(), baixarBlob(), baixarPlanilha(), crc32(), dataDe(), fazerZip(), folha() (+14 more)

### Community 10 - "responder"
Cohesion: 0.17
Nodes (19): agora(), aprovar(), cancelar(), conta(), dados(), gravar(), mes(), mudar() (+11 more)

### Community 11 - "planilha_xlsx.py"
Cohesion: 0.24
Nodes (5): editar(), linha(), recalcular(), valores(), vazia()

### Community 12 - "Histórico do projeto"
Cohesion: 0.17
Nodes (11): Busca e correções (30/10/2026), Como começou (conversa no Claude), Conta obrigatória, 3 dias grátis e assinatura (31/10/2026), Conta que não cai, vários celulares e planos novos (02/11/2026), Falta fazer, Graphify e teste da planilha (31/10/2026), Histórico do projeto, O que foi feito na passagem para o Claude Code (29/10/2026) (+3 more)

### Community 13 - "planilha-modelo_65cae2ee.md"
Cohesion: 0.18
Nodes (10): Sheet: Acertos, Sheet: Clientes, Sheet: Início, Sheet: Materiais, Sheet: Meu Mês, Sheet: Produtos, Sheet: Recebi, Sheet: Receitas (+2 more)

### Community 14 - "package.json"
Cohesion: 0.22
Nodes (10): @electric-sql/pglite, @playwright/test, devDependencies, @electric-sql/pglite@^0.5.14, @playwright/test@^1.64.1, name, private, scripts (+2 more)

### Community 15 - "Caderninho — controle de fiado"
Cohesion: 0.25
Nodes (7): Arquivos, Caderninho — controle de fiado, Instalar no celular, Já usava a versão de teste (no Claude)?, Ligar a publicação (uma vez só), O que ele faz, Testar no computador

### Community 16 - "Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026)"
Cohesion: 0.40
Nodes (4): Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026), Falta (decisão ou conta do Daniel), O que ficou pronto, Testes que passaram antes de desligar (todos com 0 falha)

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Conta e assinatura (31/10/2026)` connect `index.html` to `assinatura/index.ts`, `hoje`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `acaoConta()` (e.g. with `sessao()` and `Conta e assinatura (31/10/2026)`) actually correct?**
  _`acaoConta()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `index.html` be split into smaller, more focused modules?**
  _Cohesion score 0.06728395061728396 - nodes in this community are weakly interconnected._
- **Why does `calcularLiberadoAte()` connect `assinatura/index.ts` to `index.html`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `render()` (e.g. with `Como é feito` and `Conta e assinatura (31/10/2026)`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `conta.test.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Why does `brl()` connect `hoje` to `sincronizar.e2e.mjs`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._