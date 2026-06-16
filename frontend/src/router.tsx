import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { HomePage } from './pages/HomePage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { MenuPage } from './pages/MenuPage';

const rootRoute = createRootRoute({
  component: PublicLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cardapio',
  component: MenuPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: AdminDashboardPage,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/produtos',
  component: AdminProductsPage,
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/categorias',
  component: AdminCategoriesPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/configuracoes',
  component: AdminSettingsPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  menuRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminProductsRoute,
    adminCategoriesRoute,
    adminSettingsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
