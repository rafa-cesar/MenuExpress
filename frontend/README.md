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

## Área administrativa

Rotas mockadas disponíveis para o dono da lanchonete:

- `/admin`: dashboard com indicadores do catálogo.
- `/admin/produtos`: listagem, remoção e cadastro local de produtos.
- `/admin/categorias`: listagem, remoção e cadastro local de categorias.
- `/admin/configuracoes`: formulário visual de dados da empresa, WhatsApp, cor, taxa e pedido mínimo.

A área administrativa usa layout próprio em `src/layouts/AdminLayout.tsx`, separado da navegação pública do cliente.

## Rodando no Codespaces

A aplicação está configurada para expor o Vite em `0.0.0.0`, facilitando a abertura pela aba **Ports** do GitHub Codespaces.

```bash
cd frontend
npm install
npm run dev
```

Depois abra a porta `5173` na aba **Ports** e acesse as rotas `/`, `/cardapio` e `/admin`.

## Navegação interna

A Home conecta o cliente ao cardápio demo e ao painel administrativo. O layout público expõe links para Home, Admin e Cardápio. O layout administrativo mantém navegação fixa para Dashboard, Produtos, Categorias, Configurações e Ver cardápio, com destaque visual da rota atual.

## Controle de funcionamento

O cardápio público mostra um banner de loja aberta/fechada, horário do dia e mensagem da empresa. Quando a loja está fechada, os botões de adicionar e finalizar pedido ficam desabilitados.

No painel `/admin/configuracoes`, a seção **Funcionamento** permite alternar entre automático, forçar aberto, forçar fechado, editar horários por dia e ajustar a mensagem exibida ao cliente. Nesta fase, tudo é salvo localmente no navegador.
