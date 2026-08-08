import { supabase } from '../lib/supabase';

const BUCKET = 'logos';
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const coverImageService = {
  async upload(empresaId: string, file: File): Promise<string> {
    const ext = IMAGE_EXTENSIONS[file.type];
    if (!ext) throw new Error('Formato inválido. Envie PNG, JPG ou WEBP.');
    if (file.size > 2 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 2 MB.');
    const path = `${empresaId}/covers/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },
};
