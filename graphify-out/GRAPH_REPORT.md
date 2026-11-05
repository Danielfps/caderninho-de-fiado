# Graph Report - caderninho-dos-doces  (2026-11-04)

## Corpus Check
- 33 files · ~51,026 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .webmanifest 1, .toml 1)

## Summary
- 461 nodes · 979 edges · 22 communities (19 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- index.html
- toast
- assinatura/index.ts
- Como ligar os planos pagos
- sincronizar.e2e.mjs
- planilha.test.js
- ciclo
- pages.yml
- responder
- supabase-falso.mjs
- criarSupabaseFalso
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
1. `abrir()` - 34 edges
2. `acaoConta()` - 32 edges
3. `render()` - 25 edges
4. `toast()` - 18 edges
5. `trazerPlanilha()` - 16 edges
6. `criarSupabaseFalso()` - 16 edges
7. `verificarAcesso()` - 15 edges
8. `hoje()` - 14 edges
9. `saldo()` - 13 edges
10. `fechar()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `App (Claude)` --references--> `salvar()`  [INFERRED]
  docs/plano-2026-11-02.md → app/index.html
- `Como é feito` --references--> `parseMoney()`  [INFERRED]
  CLAUDE.md → app/index.html
- `Dados (não quebrar!)` --references--> `completar()`  [INFERRED]
  CLAUDE.md → app/index.html
- `Conta que não cai e guardar na conta (02/11/2026)` --references--> `salvar()`  [INFERRED]
  CLAUDE.md → app/index.html
- `Como funciona por dentro` --references--> `salvar()`  [INFERRED]
  docs/sincronizar.md → app/index.html

## Import Cycles
- None detected.

## Communities (22 total, 3 thin omitted)

### Community 0 - "index.html"
Cohesion: 0.07
Nodes (71): abrir(), abrirConta(), abrirReceita(), acaoConta(), atualizarPerfil(), atualizarSyncNaTela(), atualizarUsuario(), bannerAssinatura() (+63 more)

### Community 1 - "toast"
Cohesion: 0.06
Nodes (57): abasDoZip(), aplicarImportacao(), aplicarPlanilha(), baixarBlob(), baixarPlanilha(), calcProd(), contasMes(), crc32() (+49 more)

### Community 2 - "assinatura/index.ts"
Cohesion: 0.14
Nodes (37): compararConstante(), lerAssinaturaHeader(), validarAssinatura(), autorizada(), calcularLiberadoAte(), cobrancaAprovada(), criadaEm(), criarManifestoWebhook() (+29 more)

### Community 3 - "Como ligar os planos pagos"
Cohesion: 0.06
Nodes (31): desde(), haQuanto(), linhaCli(), listaClientesHTML(), vCliente(), vClientes(), 1. Aplicar as migrações, 2. Configurar os segredos (+23 more)

### Community 4 - "sincronizar.e2e.mjs"
Cohesion: 0.10
Nodes (19): abrirCliente(), aqui, conta1, conta2, conta3, criarConta(), deve(), entrar() (+11 more)

### Community 5 - "planilha.test.js"
Cohesion: 0.11
Nodes (17): {chromium,devices}, clientesApp(), COLUNA, comparar(), {execFileSync}, fs, horaApp(), irMes() (+9 more)

### Community 6 - "ciclo"
Cohesion: 0.17
Nodes (23): abrirIDB(), adotarGuardada(), aparelho(), aplicarRegistro(), canon(), carregar(), carregarMeta(), chamar() (+15 more)

### Community 7 - "pages.yml"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, name, url, jobs, publicar, name (+15 more)

### Community 8 - "responder"
Cohesion: 0.17
Nodes (19): agora(), aprovar(), cancelar(), conta(), dados(), gravar(), mes(), mudar() (+11 more)

### Community 9 - "supabase-falso.mjs"
Cohesion: 0.16
Nodes (5): como(), raiz, rpc(), usuarios, raiz

### Community 10 - "criarSupabaseFalso"
Cohesion: 0.24
Nodes (17): b64(), criarSupabaseFalso(), aprovarAnual(), aprovarMensal(), authDa(), comClaims(), corpo(), decodificar() (+9 more)

### Community 11 - "conta.test.mjs"
Cohesion: 0.19
Nodes (11): adicionarClientePeloApp(), aqui, clicarAcaoTeste(), conferirCliente(), errosPagina, fluxo(), iniciarServidor(), passo() (+3 more)

### Community 12 - "planilha_xlsx.py"
Cohesion: 0.24
Nodes (5): editar(), linha(), recalcular(), valores(), vazia()

### Community 13 - "Histórico do projeto"
Cohesion: 0.17
Nodes (11): Busca e correções (30/10/2026), Como começou (conversa no Claude), Conta obrigatória, 3 dias grátis e assinatura (31/10/2026), Conta que não cai, vários celulares e planos novos (02/11/2026), Falta fazer, Graphify e teste da planilha (31/10/2026), Histórico do projeto, O que foi feito na passagem para o Claude Code (29/10/2026) (+3 more)

### Community 14 - "planilha-modelo_65cae2ee.md"
Cohesion: 0.18
Nodes (10): Sheet: Acertos, Sheet: Clientes, Sheet: Início, Sheet: Materiais, Sheet: Meu Mês, Sheet: Produtos, Sheet: Recebi, Sheet: Receitas (+2 more)

### Community 15 - "package.json"
Cohesion: 0.22
Nodes (10): @electric-sql/pglite, @playwright/test, devDependencies, @electric-sql/pglite@^0.5.14, @playwright/test@^1.64.1, name, private, scripts (+2 more)

### Community 16 - "Caderninho — controle de fiado"
Cohesion: 0.25
Nodes (7): Arquivos, Caderninho — controle de fiado, Instalar no celular, Já usava a versão de teste (no Claude)?, Ligar a publicação (uma vez só), O que ele faz, Testar no computador

### Community 17 - "Termos de Uso e Política de Privacidade do Caderninho de Fiado"
Cohesion: 0.29
Nodes (6): 1. O que é o aplicativo, 2. Dados guardados e onde ficam, 3. Pagamento e segurança, 4. Valores e período de teste, 5. Cancelamento, Termos de Uso e Política de Privacidade do Caderninho de Fiado

### Community 18 - "Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026)"
Cohesion: 0.40
Nodes (4): Aviso: o computador foi desligado no fim do trabalho (noite de 02/11/2026), Falta (decisão ou conta do Daniel), O que ficou pronto, Testes que passaram antes de desligar (todos com 0 falha)

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Conta e assinatura (31/10/2026)` connect `index.html` to `toast`, `assinatura/index.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `acaoConta()` (e.g. with `sessao()` and `Conta e assinatura (31/10/2026)`) actually correct?**
  _`acaoConta()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `index.html` be split into smaller, more focused modules?**
  _Cohesion score 0.06550632911392405 - nodes in this community are weakly interconnected._
- **Why does `calcularLiberadoAte()` connect `assinatura/index.ts` to `index.html`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `render()` (e.g. with `Como é feito` and `Conta e assinatura (31/10/2026)`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.06370543541788427 - nodes in this community are weakly interconnected._
- **Why does `brl()` connect `toast` to `sincronizar.e2e.mjs`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._