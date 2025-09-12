import { useEffect, useState } from 'react'
import { supabase, SUPABASE_READY } from '../lib/supabaseClient'

interface ObjItem {
  name: string
  id?: string
  created_at?: string
  updated_at?: string
  metadata?: any
}

function DebugStoragePage() {
  const [bucket] = useState('listings.images')
  const [items, setItems] = useState<ObjItem[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Hazır')
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    setStatus('Liste yükleniyor...')
    try {
      if (!SUPABASE_READY) {
        setStatus('ENV eksik: VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY tanımsız')
        return
      }
      const { data, error } = await supabase.storage.from(bucket).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error) throw error
      setItems((data || []) as ObjItem[])
      setStatus('OK: Bucket listelendi')
    } catch (e: any) {
      setError(e.message || 'Liste alınamadı')
      setStatus('HATA: Bucket listelenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function handleUpload() {
    setError('')
    if (!file) {
      setError('Lütfen bir dosya seçin')
      return
    }
    try {
      setStatus('Yükleniyor...')
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const safe = file.name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)
      const path = `${safe}_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })
      if (error) throw error
      setStatus('Yükleme başarılı')
      setFile(null)
      await load()
    } catch (e: any) {
      setError(e.message || 'Yükleme başarısız')
      setStatus('HATA: Yükleme başarısız')
    }
  }

  function publicUrl(name: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(name)
    return data?.publicUrl || ''
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Storage Debug</h1>
      <div className="text-sm text-gray-600 mb-4">Bucket: <span className="font-mono">{bucket}</span></div>

      <div className="rounded-lg border p-4 mb-6">
        <div className="font-medium">Durum: {status}</div>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
            accept="image/*"
          />
          <button
            onClick={() => void handleUpload()}
            className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm hover:bg-orange-500 disabled:opacity-60"
            disabled={loading}
          >
            Test Yükle
          </button>
          <button
            onClick={() => void load()}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-3 border-b font-medium">Objeler ({items.length})</div>
        {loading ? (
          <div className="p-4 text-gray-600">Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-600">Bucket boş.</div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.name} className="p-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-sm truncate">{it.name}</div>
                  <a
                    className="text-xs text-blue-600 hover:underline break-all"
                    href={publicUrl(it.name)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {publicUrl(it.name)}
                  </a>
                </div>
                <img
                  src={publicUrl(it.name)}
                  alt={it.name}
                  className="w-16 h-16 object-cover rounded-md border"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default DebugStoragePage
