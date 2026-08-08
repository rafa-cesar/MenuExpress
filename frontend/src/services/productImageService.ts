import { supabase } from '../lib/supabase';

const extensions: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

export const productImageService = {
  async upload(empresaId: string, file: File): Promise<string> {
    const ext = extensions[file.type];
    if (!ext) throw new Error('Use uma imagem PNG, JPEG ou WebP.');
    if (file.size > 2 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 2 MB.');
    const path = `${empresaId}/products/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
  },
};
