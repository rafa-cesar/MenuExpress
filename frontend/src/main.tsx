import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './styles.css';
import { MenuStoreProvider } from './context/MenuStoreContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MenuStoreProvider>
      <RouterProvider router={router} />
    </MenuStoreProvider>
  </StrictMode>,
);
