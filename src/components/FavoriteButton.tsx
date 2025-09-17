import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getDeviceId } from '../lib/device'

export default function FavoriteButton({ listingId, className = '' }: { listingId: string, className?: string }) {
  const [loading, setLoading] = useState(true)
  const [fav, setFav] = useState(false)
  const deviceId = getDeviceId()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('listing_id', listingId)
          .eq('device_id', deviceId)
          .limit(1)
        if (error) throw error
        if (!mounted) return
        setFav((data?.length ?? 0) > 0)
      } catch (e) {
        // noop
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [listingId, deviceId])

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      if (!fav) {
        const { error } = await supabase
          .from('favorites')
          .insert({ listing_id: listingId, device_id: deviceId })
        if (error) throw error
        setFav(true)
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('listing_id', listingId)
          .eq('device_id', deviceId)
        if (error) throw error
        setFav(false)
      }
    } catch (e) {
      // basit: hatayı sessiz geçiyoruz; istenirse toast eklenir
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => { void toggle() }}
      disabled={loading}
      className={[
        'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm',
        fav ? 'bg-red-600 text-white border-red-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
        className
      ].join(' ')}
      aria-pressed={fav}
      aria-label={fav ? 'Favoriden çıkar' : 'Favoriye ekle'}
      title={fav ? 'Favoriden çıkar' : 'Favoriye ekle'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        {fav ? (
          <path d="M11.645 20.91l-.007-.003-.022-.011a15.247 15.247 0 01-.383-.207 25.18 25.18 0 01-4.244-2.832C4.688 15.708 2.25 12.592 2.25 9.278 2.25 6.015 4.903 3.75 7.5 3.75c1.63 0 3.135.75 4.145 2.046A5.243 5.243 0 0115.75 3.75c2.597 0 5.25 2.265 5.25 5.528 0 3.314-2.438 6.43-4.739 8.58a25.175 25.175 0 01-4.244 2.832 15.247 15.247 0 01-.383.207l-.022.011-.007.003a.75.75 0 01-.66 0z" />
        ) : (
          <path fillRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.37 6.37 0 0116.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" clipRule="evenodd" />
        )}
      </svg>
      {fav ? 'Favoride' : 'Favori'}
    </button>
  )
}
