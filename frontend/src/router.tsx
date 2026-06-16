import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { PublicLayout } from './layouts/PublicLayout';
import { HomePage } from './pages/HomePage';
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

const routeTree = rootRoute.addChildren([homeRoute, menuRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
