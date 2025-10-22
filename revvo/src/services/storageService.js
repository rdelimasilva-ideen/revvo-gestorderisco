import { apiService } from './apiService';

// Upload de arquivo
export async function uploadFile(bucket, path, file) {
  try {
    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('path', path);
    formData.append('file', file);

    const response = await fetch(`${apiService.baseURL}/api/storage/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.detail || 'Erro no upload');
    }
    
    return result.data;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
}

// Obter URL pública de arquivo
export async function getPublicUrl(bucket, path) {
  try {
    const response = await apiService.get(`/api/storage/public-url/${bucket}/${encodeURIComponent(path)}`);
    return response.data?.publicUrl || null;
  } catch (error) {
    console.error('Erro ao obter URL pública:', error);
    throw error;
  }
}

// Remover arquivo
export async function removeFile(bucket, path) {
  try {
    await apiService.delete(`/api/storage/remove?bucket=${bucket}&path=${path}`);
    return true;
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    throw error;
  }
}

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// // Upload de arquivo
// export async function uploadFile(bucket, path, file) {
//   const { data, error } = await supabase.storage
//     .from(bucket)
//     .upload(path, file, {
//       cacheControl: '3600',
//       upsert: false
//     });
//   if (error) throw error;
//   return data;
// }

// // Obter URL pública de arquivo
// export function getPublicUrl(bucket, path) {
//   const { data } = supabase.storage.from(bucket).getPublicUrl(path);
//   return data?.publicUrl || null;
// }

// // Remover arquivo
// export async function removeFile(bucket, path) {
//   const { error } = await supabase.storage.from(bucket).remove([path]);
//   if (error) throw error;
//   return true;
// }
