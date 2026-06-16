# Frontend MenuExpress

Aplicação React com TypeScript, Vite, TanStack Router e Tailwind CSS.

## Pastas principais

- `src/components`: componentes reutilizáveis.
- `src/pages`: páginas públicas.
- `src/layouts`: layouts compartilhados.
- `src/hooks`: hooks reutilizáveis.
- `src/types`: tipos de domínio.
- `src/services`: serviços e integrações futuras.
- `src/data`: dados temporários de desenvolvimento.

## Rotas iniciais

- `/`: home pública.
- `/cardapio`: cardápio público demonstrativo.


## MVP do cardápio

A rota `/cardapio` contém uma experiência mobile-first com categorias navegáveis, produtos mockados com imagem e destaque, carrinho local, alteração de quantidade, remoção de itens, subtotal e total geral.

A finalização valida carrinho vazio, aceita observações do pedido e monta uma mensagem formatada para abrir o WhatsApp via `https://wa.me/SEUNUMERO?text=MENSAGEM`.

## Preparação SaaS multi-tenant

Os contratos `Empresa`, `Categoria`, `Produto`, `Pedido` e `Cliente` ficam centralizados em `src/types/domain.ts`.

A camada `src/services` isola o catálogo mockado e já expõe helpers para futura rota pública no formato `/:empresaSlug/cardapio`, mantendo a rota atual `/cardapio` compatível com o MVP.
