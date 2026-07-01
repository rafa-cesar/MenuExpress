import { ChangeEvent, useRef, useState } from 'react';
import { logoService } from '../../services/logoService';

interface LogoUploaderProps {
  empresaId: string;
  currentLogoUrl: string;
  onUploaded: (newUrl: string) => void;
}

/**
 * Componente de upload de logomarca.
 * - Exibe a logo atual (ou placeholder com ícone) como área clicável.
 * - Ao selecionar um arquivo PNG/JPEG/WebP, faz upload para o Supabase Storage
 *   e chama onUploaded com a URL pública resultante.
 * - Aceita apenas imagens; limita a 2 MB.
 */
export function LogoUploader({ empresaId, currentLogoUrl, onUploaded }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação client-side
    if (!file.type.startsWith('image/')) {
      setError('Selecione apenas imagens (PNG, JPEG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2 MB.');
      return;
    }

    setError('');
    // Preview local imediato
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const publicUrl = await logoService.upload(empresaId, file);
      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.');
      setPreview(currentLogoUrl); // reverte preview
    } finally {
      setUploading(false);
      // Limpa o input para permitir re-upload do mesmo arquivo
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove() {
    setPreview('');
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-slate-700">Logomarca</p>

      {/* Área de preview / clique */}
      <div
        className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-slate-400"
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        aria-label="Clique para enviar a logomarca"
      >
        {preview ? (
          <img
            src={preview}
            alt="Logo atual"
            className="h-full w-full object-cover"
          />
        ) : (
          <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        )}

        {/* Overlay de loading */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          </div>
        )}

        {/* Overlay de hover */}
        {!uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs font-bold">{preview ? 'Trocar' : 'Enviar'}</span>
          </div>
        )}
      </div>

      {/* Botão remover */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="self-start text-xs font-bold text-red-500 hover:text-red-700"
        >
          Remover logo
        </button>
      )}

      {/* Mensagem de erro */}
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}

      {/* Estado de upload */}
      {uploading && <p className="text-xs font-bold text-slate-500">Enviando imagem...</p>}

      <p className="text-xs text-slate-400">PNG, JPEG ou WebP · máx. 2 MB</p>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleChange}
        disabled={uploading}
      />
    </div>
  );
}
