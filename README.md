# MenuExpress

MenuExpress é uma plataforma SaaS multiempresa para cardápios digitais, pedidos online e atendimento via WhatsApp. A aplicação possui autenticação, painel administrativo e persistência com Supabase.

## Stack

- React 19 e TypeScript
- Vite e TanStack Router
- Tailwind CSS
- Supabase Auth, Database, Realtime e Storage
- Vercel

## Estrutura

```text
MenuExpress/
├── frontend/          # Aplicação React
├── backend/           # Espaço reservado para serviços futuros
├── docs/              # Documentação técnica
└── supabase/          # Migrações do banco, RLS e Storage
```

## Executando localmente

Use Node.js 22 ou superior e pnpm:

```bash
cd frontend
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Variáveis necessárias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEFAULT_EMPRESA_SLUG`: slug da loja exibida no cardápio público

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
```

## Segurança e multi-tenancy

- Cada empresa é vinculada ao proprietário por `empresas.user_id`.
- O painel administrativo exige uma sessão que seja proprietária de uma empresa.
- As tabelas de catálogo, clientes e pedidos usam Row Level Security.
- O checkout chama `criar_pedido_seguro`; preços, taxa e total são recalculados no PostgreSQL.
- Logos são gravados sob `{empresa_id}/arquivo` e somente o proprietário pode alterá-los.

## Preparação do Supabase

1. Faça backup antes de alterar um ambiente existente.
2. Aplique as migrações de `supabase/migrations` na ordem.
3. Associe dados legados ao proprietário preenchendo `empresas.user_id`.
4. Confirme que produtos, categorias, clientes e pedidos possuem `empresa_id`.
5. Valide cadastro, compra, painel e upload em homologação antes da produção.

As chaves `VITE_*` são públicas no navegador. Nunca coloque uma `service_role` no frontend.
