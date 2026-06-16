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
