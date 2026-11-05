# Graph Report - caderninho-dos-doces  (2026-11-04)

## Corpus Check
- 34 files · ~48,350 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .webmanifest 1, .toml 1)

## Summary
- 440 nodes · 920 edges · 23 communities (20 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- index.html
- acaoConta
- servidor.ts
- sincronizar.e2e.mjs
- trazerPlanilha
- planilha.test.js
- pages.yml
- Vários celulares na mesma conta (e a conta que não cai sem internet)
- ciclo
- supabase-falso.mjs
- criarSupabaseFalso
- responder
- conta.test.mjs
- planilha_xlsx.py
- Histórico do projeto
- planilha-modelo_65cae2ee.md
- package.json
- Caderninho — controle de fiado
- Termos de Uso e Política de Privacidade do Caderninho de Fiado
- Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026)
- Roteiro de teste do Caderninho
- sw.js
- graphify.sh

## God Nodes (most connected - your core abstractions)
1. `abrir()` - 33 edges
2. `acaoConta()` - 32 edges
3. `render()` - 25 edges
4. `toast()` - 18 edges
5. `criarSupabaseFalso()` - 18 edges
6. `trazerPlanilha()` - 16 edges
7. `verificarAcesso()` - 15 edges
8. `hoje()` - 14 edges
9. `saldo()` - 13 edges
10. `fechar()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `App (Claude)` --references--> `salvar()`  [INFERRED]
  docs/plano-2026-11-02.md → app/index.html
- `Servidor (Esquadro): `supabase/migrations/202611020001_sincronizar.sql`` --references--> `desde()`  [INFERRED]
  docs/plano-2026-11-02.md → app/index.html
- `Como é feito` --references--> `parseMoney()`  [INFERRED]
  CLAUDE.md → app/index.html
- `Como funciona por dentro` --references--> `salvar()`  [INFERRED]
  docs/sincronizar.md → app/index.html
- `Antes de tudo: consulte o Graphify (mapa do código)` --references--> `saldo()`  [INFERRED]
  CLAUDE.md → app/index.html

## Import Cycles
- None detected.

## Communities (23 total, 3 thin omitted)

### Community 0 - "index.html"
Cohesion: 0.06
Nodes (70): abrir(), abrirReceita(), aplicarPlanilha(), atualizarSyncNaTela(), bannerAssinatura(), blocoInstalar(), blocoOutroCelular(), calcProd() (+62 more)

### Community 1 - "acaoConta"
Cohesion: 0.11
Nodes (42): abrirConta(), acaoConta(), atualizarPerfil(), atualizarUsuario(), carregarPreco(), cartoesPlanos(), chamar(), codigoErro() (+34 more)

### Community 2 - "servidor.ts"
Cohesion: 0.19
Nodes (22): isUuid(), lerNotificacaoPagamento(), lerReferencia(), pagamentoValido(), referenciaDaConta(), buscarPagamento(), consultarPagamentos(), estadosDeEstorno (+14 more)

### Community 3 - "sincronizar.e2e.mjs"
Cohesion: 0.10
Nodes (19): abrirCliente(), aqui, conta1, conta2, conta3, criarConta(), deve(), entrar() (+11 more)

### Community 4 - "trazerPlanilha"
Cohesion: 0.12
Nodes (24): abasDoZip(), aplicarImportacao(), baixarBlob(), baixarPlanilha(), crc32(), dataDe(), fazerZip(), folha() (+16 more)

### Community 5 - "planilha.test.js"
Cohesion: 0.11
Nodes (17): {chromium,devices}, clientesApp(), COLUNA, comparar(), {execFileSync}, fs, horaApp(), irMes() (+9 more)

### Community 6 - "pages.yml"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, name, url, jobs, publicar, name (+15 more)

### Community 7 - "Vários celulares na mesma conta (e a conta que não cai sem internet)"
Cohesion: 0.09
Nodes (19): Configuração, Falta confirmar em produção, Pagamentos do Caderninho, Testes automatizados, App (Claude), Decisão: por que a ponte é o servidor da conta, e não a planilha do Google, Parte A: conta que não cai (app), Parte B: vários celulares (sincronização) (+11 more)

### Community 8 - "ciclo"
Cohesion: 0.19
Nodes (20): abrirIDB(), adotarGuardada(), aparelho(), aplicarRegistro(), canon(), carregar(), carregarMeta(), ciclo() (+12 more)

### Community 9 - "supabase-falso.mjs"
Cohesion: 0.15
Nodes (6): como(), raiz, rpc(), usuarios, erro(), raiz

### Community 10 - "criarSupabaseFalso"
Cohesion: 0.24
Nodes (18): b64(), criarSupabaseFalso(), aprovarAnual(), aprovarMensal(), authDa(), comClaims(), corpo(), decodificar() (+10 more)

### Community 11 - "responder"
Cohesion: 0.19
Nodes (17): agora(), aprovar(), conta(), dados(), gravar(), mudar(), mudou(), responder() (+9 more)

### Community 12 - "conta.test.mjs"
Cohesion: 0.19
Nodes (11): adicionarClientePeloApp(), aqui, clicarAcaoTeste(), conferirCliente(), errosPagina, fluxo(), iniciarServidor(), passo() (+3 more)

### Community 13 - "planilha_xlsx.py"
Cohesion: 0.24
Nodes (5): editar(), linha(), recalcular(), valores(), vazia()

### Community 14 - "Histórico do projeto"
Cohesion: 0.17
Nodes (11): Busca e correções (30/10/2026), Como começou (conversa no Claude), Conta obrigatória, 3 dias grátis e assinatura (31/10/2026), Conta que não cai, vários celulares e planos novos (02/11/2026), Falta fazer, Graphify e teste da planilha (31/10/2026), Histórico do projeto, O que foi feito na passagem para o Claude Code (29/10/2026) (+3 more)

### Community 15 - "planilha-modelo_65cae2ee.md"
Cohesion: 0.18
Nodes (10): Sheet: Acertos, Sheet: Clientes, Sheet: Início, Sheet: Materiais, Sheet: Meu Mês, Sheet: Produtos, Sheet: Recebi, Sheet: Receitas (+2 more)

### Community 16 - "package.json"
Cohesion: 0.22
Nodes (10): @electric-sql/pglite, @playwright/test, devDependencies, @electric-sql/pglite@^0.5.14, @playwright/test@^1.64.1, name, private, scripts (+2 more)

### Community 17 - "Caderninho — controle de fiado"
Cohesion: 0.25
Nodes (7): Arquivos, Caderninho — controle de fiado, Instalar no celular, Já usava a versão de teste (no Claude)?, Ligar a publicação (uma vez só), O que ele faz, Testar no computador

### Community 18 - "Termos de Uso e Política de Privacidade do Caderninho de Fiado"
Cohesion: 0.29
Nodes (6): 1. O que é o aplicativo, 2. Dados guardados e onde ficam, 3. Pagamento e segurança, 4. Valores e período de teste, 5. Cancelamento, Termos de Uso e Política de Privacidade do Caderninho de Fiado

### Community 19 - "Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026)"
Cohesion: 0.40
Nodes (4): Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026), Falta (decisão ou conta do Daniel), O que ficou pronto, Testes que passaram antes de desligar (todos com 0 falha)

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `brl()` connect `trazerPlanilha` to `sincronizar.e2e.mjs`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `acaoConta()` (e.g. with `sessao()` and `Conta e assinatura (31/10/2026)`) actually correct?**
  _`acaoConta()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `index.html` be split into smaller, more focused modules?**
  _Cohesion score 0.05647517039922103 - nodes in this community are weakly interconnected._
- **Why does `Como é feito` connect `trazerPlanilha` to `index.html`, `acaoConta`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `render()` (e.g. with `Como é feito` and `Conta e assinatura (31/10/2026)`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `acaoConta` be split into smaller, more focused modules?**
  _Cohesion score 0.11184939091915837 - nodes in this community are weakly interconnected._
- **Why does `Dados (não quebrar!)` connect `index.html` to `trazerPlanilha`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._