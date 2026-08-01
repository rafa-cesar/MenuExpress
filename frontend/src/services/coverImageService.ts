import { supabase } from '../lib/supabase';

const BUCKET = 'logos';

export const coverImageService = {
  async upload(empresaId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${empresaId}/covers/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });
    if (error) throw new Error(error.message);

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },
};
