import { useEffect, useState } from 'react';
import { demoEmpresa } from '../data/menu';
import type { Empresa } from '../types/domain';

const storageKey = 'menuexpress:empresa-config';

function readStoredEmpresa() {
  if (typeof window === 'undefined') {
    return demoEmpresa;
  }

  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return demoEmpresa;
  }

  try {
    return { ...demoEmpresa, ...JSON.parse(stored) } as Empresa;
  } catch {
    return demoEmpresa;
  }
}

export function useEmpresaConfig() {
  const [empresa, setEmpresaState] = useState<Empresa>(readStoredEmpresa);

  function setEmpresa(nextEmpresa: Empresa) {
    setEmpresaState(nextEmpresa);
    window.localStorage.setItem(storageKey, JSON.stringify(nextEmpresa));
  }

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === storageKey) {
        setEmpresaState(readStoredEmpresa());
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { empresa, setEmpresa };
}
