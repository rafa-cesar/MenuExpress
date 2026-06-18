import { useCallback, useEffect, useMemo, useState } from 'react';
import { demoCategorias, demoEmpresa, demoMenuItems } from '../data/menu';
import type { Categoria, Empresa, Produto } from '../types/domain';

const storageKeys = {
  empresa: 'menuexpress:empresa-config',
  produtos: 'menuexpress:produtos',
  categorias: 'menuexpress:categorias',
};

const storeUpdatedEvent = 'menuexpress:store-updated';

function parseStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);

  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function readEmpresa() {
  return { ...demoEmpresa, ...parseStoredValue<Partial<Empresa>>(storageKeys.empresa, {}) } as Empresa;
}

function readProdutos() {
  return parseStoredValue<Produto[]>(storageKeys.produtos, demoMenuItems);
}

function readCategorias() {
  return parseStoredValue<Categoria[]>(storageKeys.categorias, demoCategorias);
}

function readStore() {
  return {
    empresa: readEmpresa(),
    produtos: readProdutos(),
    categorias: readCategorias(),
  };
}

function persistValue<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(storeUpdatedEvent));
}

export function useMenuExpressStore() {
  const [store, setStore] = useState(readStore);

  const refreshStore = useCallback(() => {
    setStore(readStore());
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (Object.values(storageKeys).includes(event.key ?? '')) {
        refreshStore();
      }
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener(storeUpdatedEvent, refreshStore);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(storeUpdatedEvent, refreshStore);
    };
  }, [refreshStore]);

  const sortedCategorias = useMemo(
    () => [...store.categorias].sort((a, b) => a.ordem - b.ordem),
    [store.categorias],
  );

  const activeCategorias = useMemo(
    () => sortedCategorias.filter((category) => category.ativa),
    [sortedCategorias],
  );

  const publicProdutos = useMemo(() => {
    const activeCategoryIds = new Set(activeCategorias.map((category) => category.id));

    return store.produtos.filter((product) => product.disponivel && activeCategoryIds.has(product.categoriaId));
  }, [activeCategorias, store.produtos]);

  function setEmpresa(empresa: Empresa) {
    persistValue(storageKeys.empresa, empresa);
    setStore((currentStore) => ({ ...currentStore, empresa }));
  }

  function setProdutos(produtos: Produto[]) {
    persistValue(storageKeys.produtos, produtos);
    setStore((currentStore) => ({ ...currentStore, produtos }));
  }

  function setCategorias(categorias: Categoria[]) {
    const nextCategorias = [...categorias].sort((a, b) => a.ordem - b.ordem);

    persistValue(storageKeys.categorias, nextCategorias);
    setStore((currentStore) => ({ ...currentStore, categorias: nextCategorias }));
  }

  function upsertProduto(produto: Produto) {
    const productExists = store.produtos.some((currentProduct) => currentProduct.id === produto.id);
    const nextProdutos = productExists
      ? store.produtos.map((currentProduct) => (currentProduct.id === produto.id ? produto : currentProduct))
      : [produto, ...store.produtos];

    setProdutos(nextProdutos);
  }

  function removeProduto(produtoId: string) {
    setProdutos(store.produtos.filter((product) => product.id !== produtoId));
  }

  function upsertCategoria(categoria: Categoria) {
    const categoryExists = store.categorias.some((currentCategory) => currentCategory.id === categoria.id);
    const nextCategorias = categoryExists
      ? store.categorias.map((currentCategory) => (currentCategory.id === categoria.id ? categoria : currentCategory))
      : [...store.categorias, categoria];

    setCategorias(nextCategorias);
  }

  function removeCategoria(categoriaId: string) {
    setCategorias(store.categorias.filter((category) => category.id !== categoriaId));
  }

  return {
    empresa: store.empresa,
    produtos: store.produtos,
    categorias: sortedCategorias,
    activeCategorias,
    publicProdutos,
    setEmpresa,
    setProdutos,
    setCategorias,
    upsertProduto,
    removeProduto,
    upsertCategoria,
    removeCategoria,
  };
}
