# Arquitetura inicial

## Contexto

O MenuExpress será um SaaS multi-tenant para restaurantes, lanchonetes e negócios locais que precisam publicar cardápios digitais e receber pedidos via WhatsApp.

## Decisões desta etapa

- O frontend é a primeira aplicação executável do monorepo.
- O backend permanece como diretório reservado para APIs futuras.
- Supabase ainda não foi configurado para evitar acoplamento prematuro.
- As rotas públicas não dependem de autenticação.

## Organização do frontend

- `components/`: componentes reutilizáveis e sem regra de rota.
- `pages/`: telas associadas às rotas.
- `layouts/`: estruturas visuais compartilhadas.
- `hooks/`: hooks de UI e domínio.
- `types/`: contratos TypeScript compartilhados.
- `services/`: clientes e integrações futuras.
- `data/`: dados temporários para desenvolvimento.

## Preparação multi-tenant

A arquitetura do frontend passa a diferenciar contratos de domínio e dados de demonstração para facilitar uma futura integração com Supabase.

### Interfaces de domínio

As interfaces `Empresa`, `Categoria`, `Produto`, `Pedido` e `Cliente` vivem em `frontend/src/types/domain.ts` e representam os contratos principais do SaaS multiempresa.

### Camada de serviços

A pasta `frontend/src/services` concentra a camada de acesso a dados e integrações. Nesta fase ela usa dados mockados, mas a assinatura foi pensada para trocar a fonte por Supabase futuramente sem alterar as páginas.

### Rotas futuras por empresa

A estrutura está preparada para evoluir de `/cardapio` para rotas públicas por slug de empresa, como:

- `/burger-house/cardapio`
- `/acai-central/cardapio`
- `/pizzaria-italia/cardapio`

Essa rota ainda não foi habilitada para manter compatibilidade com o MVP atual.

## Separação entre área pública e administração

A área pública permanece nas rotas `/` e `/cardapio`, com layout voltado ao cliente final. A área administrativa usa um layout próprio e rotas sob `/admin`, preparando o produto para o dono da lanchonete gerenciar catálogo, categorias e configurações sem misturar componentes públicos desnecessariamente.

As telas administrativas ainda usam estado local e dados mockados, mantendo a aplicação sem backend, sem banco e sem autenticação nesta etapa.

## Navegação interna

A navegação pública e administrativa foi conectada para evitar acesso manual por URL. A Home aponta para `/cardapio` e `/admin`; o topo público permite alternar entre Home, Admin e Cardápio; e o layout administrativo mantém links fixos para todas as telas do painel e para o cardápio público.

## Controle de funcionamento

O modelo `Empresa` agora contém `horarioFuncionamento`, `statusManual` e `mensagemCliente`. A função `getStoreOpenStatus` calcula se a loja está aberta considerando abertura manual, fechamento manual, agenda semanal e horários que cruzam a meia-noite.

Nesta etapa, o painel `/admin/configuracoes` salva as preferências localmente no navegador para simular a futura persistência multiempresa sem backend ou Supabase.
