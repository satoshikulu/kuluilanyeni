import { useEffect, useState } from 'react'
import { supabase, SUPABASE_READY } from '../lib/supabaseClient'

function DebugSupabasePage() {
  const [envOk, setEnvOk] = useState<boolean>(SUPABASE_READY)
  const [status, setStatus] = useState<string>('Hazırlanıyor...')
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function run() {
      if (!SUPABASE_READY) {
        setStatus('ENV eksik: VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY tanımsız')
        return
      }
      setStatus('Bağlantı deneniyor...')
      try {
        const { count, error } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
        if (error) throw error
        setCount(count ?? 0)
        setStatus('OK: listings tablosuna SELECT erişimi var')
      } catch (e: any) {
        setError(e.message || 'Bilinmeyen hata')
        setStatus('HATA: listings tablosuna erişilemedi')
      }
    }
    void run()
  }, [])

  async function testInsert() {
    setError('')
    setStatus('Test insert deneniyor...')
    try {
      const { error } = await supabase.from('listings').insert({
        title: 'DEBUG TEST',
        owner_name: 'Debug User',
        owner_phone: '0000000000',
        status: 'pending',
      })
      if (error) throw error
      setStatus('OK: Insert başarılı (RLS izin veriyor)')
    } catch (e: any) {
      setError(e.message || 'Bilinmeyen hata')
      setStatus('HATA: Insert başarısız (RLS/politika?)')
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-2">Supabase Bağlantı Sağlığı</h1>
      <div className="text-sm text-gray-600 mb-4">
        ENV: {String(envOk)} — URL: {String(Boolean(import.meta.env.VITE_SUPABASE_URL))} — KEY: {String(Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY))}
      </div>
      <div className="rounded-lg border p-4 mb-4">
        <div className="font-medium">Durum: {status}</div>
        {typeof count === 'number' && (
          <div className="text-sm text-gray-600">listings sayısı: {count}</div>
        )}
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </div>
      <button onClick={() => void testInsert()} className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-orange-500">
        Test Insert Yap
      </button>
    </div>
  )
}

export default DebugSupabasePage


