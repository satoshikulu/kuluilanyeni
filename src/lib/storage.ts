import { supabase } from './supabaseClient'

const BUCKET = 'listings.images' // Kullanıcının belirttiği bucket adı

export async function uploadListingImage(file: File, listingId: string) {
  try {
    if (!file) throw new Error('Dosya bulunamadı')
    if (!listingId) throw new Error('listingId zorunludur')

    const path = `listings/${listingId}/${file.name}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { path, publicUrl: data?.publicUrl || '' }
  } catch (e: any) {
    console.error('[uploadListingImage] Hata:', e?.message || e)
    throw e
  }
}

export function getListingImageUrl(path: string) {
  try {
    if (!path) throw new Error('path zorunludur')
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data?.publicUrl || ''
  } catch (e: any) {
    console.error('[getListingImageUrl] Hata:', e?.message || e)
    throw e
  }
}

export async function deleteListingImage(path: string) {
  try {
    if (!path) throw new Error('path zorunludur')
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    console.error('[deleteListingImage] Hata:', e?.message || e)
    throw e
  }
}
