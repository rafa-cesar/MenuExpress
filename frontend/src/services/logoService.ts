import { supabase } from '../lib/supabase';

const BUCKET = 'logos';

export const logoService = {
  /**
   * Faz upload de um arquivo de imagem para o bucket 'logos'.
   * O arquivo é salvo em logos/{empresaId}/{timestamp}.{ext}
   * e retorna a URL pública permanente.
   */
  async upload(empresaId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${empresaId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Remove arquivo antigo do bucket (best-effort — não lança erro).
   * Extrai o path relativo a partir de qualquer URL pública do Supabase.
   */
  async remove(publicUrl: string): Promise<void> {
    try {
      // URL format: .../storage/v1/object/public/{bucket}/{path}
      const marker = `/object/public/${BUCKET}/`;
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return;
      const path = publicUrl.slice(idx + marker.length);
      await supabase.storage.from(BUCKET).remove([path]);
    } catch {
      // best-effort
    }
  },
};
