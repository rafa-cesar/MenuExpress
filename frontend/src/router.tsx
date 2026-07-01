import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AssinarPage } from './pages/AssinarPage';
import { CadastroPage } from './pages/CadastroPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ClienteAuthPage } from './pages/ClienteAuthPage';
import { MinhaAreaPage } from './pages/MinhaAreaPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { MenuPage } from './pages/MenuPage';

const rootRoute    = createRootRoute({ component: PublicLayout });

const homeRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/',                 component: HomePage });
const menuRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/cardapio',         component: MenuPage });
const loginRoute       = createRoute({ getParentRoute: () => rootRoute, path: '/login',            component: LoginPage });
const assinarRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/assinar',          component: AssinarPage });
const cadastroRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/cadastro',         component: CadastroPage });
const cartRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/checkout/carrinho', component: CartPage });
const checkoutRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/checkout/resumo',  component: CheckoutPage });
const clienteAuthRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout/auth',   component: ClienteAuthPage });
const minhaAreaRoute   = createRoute({ getParentRoute: () => rootRoute, path: '/minha-area',      component: MinhaAreaPage });
const adminLoginRoute  = createRoute({ getParentRoute: () => rootRoute, path: '/admin/login',      component: AdminLoginPage });

const adminRoute            = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminLayout });
const adminDashboardRoute   = createRoute({ getParentRoute: () => adminRoute, path: '/',              component: AdminDashboardPage });
const adminOrdersRoute      = createRoute({ getParentRoute: () => adminRoute, path: '/pedidos',       component: AdminOrdersPage });
const adminProductsRoute    = createRoute({ getParentRoute: () => adminRoute, path: '/produtos',      component: AdminProductsPage });
const adminCategoriesRoute  = createRoute({ getParentRoute: () => adminRoute, path: '/categorias',   component: AdminCategoriesPage });
const adminSettingsRoute    = createRoute({ getParentRoute: () => adminRoute, path: '/configuracoes', component: AdminSettingsPage });

const routeTree = rootRoute.addChildren([
  homeRoute,
  menuRoute,
  loginRoute,
  assinarRoute,
  cadastroRoute,
  cartRoute,
  checkoutRoute,
  clienteAuthRoute,
  minhaAreaRoute,
  adminLoginRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminOrdersRoute,
    adminProductsRoute,
    adminCategoriesRoute,
    adminSettingsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
