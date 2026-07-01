import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { MenuStoreProvider } from './context/MenuStoreContext';
import { CartProvider } from './context/CartContext';
import { ClienteAuthProvider } from './context/ClienteAuthContext';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MenuStoreProvider>
      <CartProvider>
        <ClienteAuthProvider>
          <RouterProvider router={router} />
        </ClienteAuthProvider>
      </CartProvider>
    </MenuStoreProvider>
  </StrictMode>
);
