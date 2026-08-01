import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { coverImageService } from '../../services/coverImageService';

interface CoverImageUploaderProps {
  empresaId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}

export function CoverImageUploader({ empresaId, currentUrl, onUploaded }: CoverImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setPreview(currentUrl), [currentUrl]);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use uma imagem PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2 MB.');
      return;
    }

    setError('');
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const publicUrl = await coverImageService.upload(empresaId, file);
      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (uploadError) {
      setPreview(currentUrl);
      setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível enviar a capa.');
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeCover() {
    setPreview('');
    onUploaded('');
  }

  return (
    <div>
      <p className="text-sm font-bold text-slate-700">Imagem de capa do cardápio</p>
      <p className="mt-1 text-xs text-slate-400">Use uma foto horizontal que represente o seu negócio, como pizza, hambúrguer ou bolo.</p>
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        className="group relative mt-3 flex aspect-[16/7] w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-slate-400"
        aria-label={preview ? 'Trocar imagem de capa' : 'Enviar imagem de capa'}
      >
        {preview ? (
          <img src={preview} alt="Prévia da imagem de capa" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-slate-400">
            <svg className="mx-auto h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16l5-5 4 4 3-3 6 6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="mt-2 block text-xs font-bold">Escolher foto de capa</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          </div>
        )}
        {preview && !uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-black text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">Trocar imagem</span>
        )}
      </button>
      <div className="mt-2 flex items-center gap-4">
        <span className="text-xs text-slate-400">PNG, JPEG ou WebP · máximo 2 MB</span>
        {preview && !uploading && (
          <button type="button" onClick={removeCover} className="text-xs font-bold text-red-500 hover:text-red-700">Remover capa</button>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleChange} disabled={uploading} />
    </div>
  );
}
