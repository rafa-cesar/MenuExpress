# MenuExpress

MenuExpress é uma plataforma SaaS multiempresa para cardápios digitais, preparada para receber pedidos via WhatsApp e evoluir para recursos como autenticação, painel administrativo e persistência com Supabase.

## Objetivo desta base

Esta etapa cria uma fundação limpa, responsiva e escalável para o frontend, sem implementar autenticação, banco de dados ou integração com Supabase.

## Stack planejada

- React
- TypeScript
- Vite
- TanStack Router
- Tailwind CSS
- Supabase futuramente
- Layout responsivo para desktop e celular

## Estrutura do projeto

```txt
MenuExpress/
├── frontend/          # Aplicação web React
├── backend/           # Espaço reservado para APIs e serviços futuros
└── docs/              # Documentação técnica e decisões arquiteturais
```

## Frontend

A aplicação inicial contém:

- Layout público base
- Home pública em `/`
- Rota pública de cardápio em `/cardapio`
- Componentes reutilizáveis
- Dados mockados para demonstrar a experiência inicial

### Executando localmente

```bash
cd frontend
npm install
npm run dev
```

### Scripts principais

```bash
npm run dev       # Inicia o servidor de desenvolvimento
npm run build     # Gera build de produção
npm run preview   # Visualiza o build localmente
npm run lint      # Executa verificação estática
```

## Princípios de arquitetura

- Separação clara entre páginas, componentes, layouts, hooks, serviços, dados e tipos.
- Preparação para multi-tenancy sem acoplar a primeira versão a um provedor específico.
- Rotas públicas independentes de autenticação.
- UI responsiva desde a primeira entrega.
- Espaços reservados para backend e documentação técnica.

## Próximos passos sugeridos

1. Definir modelo de tenants, empresas, unidades e cardápios.
2. Adicionar autenticação e autorização por perfil.
3. Integrar Supabase para persistência e storage.
4. Criar painel administrativo para restaurantes.
5. Implementar geração de pedido e envio via WhatsApp.
