import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Props = { children: React.ReactNode }

function AdminGate({ children }: Props) {
  const adminPass = import.meta.env.VITE_ADMIN_PASS as string | undefined
  const [ok, setOk] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    setLoading(true)
    setError('')
    
    try {
      // Session'dan admin flag'ini kontrol et
      const sessionFlag = sessionStorage.getItem('isAdmin') === 'true'
      
      if (sessionFlag) {
        // Kullanıcının gerçekten admin olup olmadığını veritabanından kontrol et
        const phone = localStorage.getItem('userPhone')
        
        if (phone) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('role, status')
            .eq('phone', phone)
            .single()
          
          if (userError) {
            console.error('Admin check error:', userError)
            sessionStorage.removeItem('isAdmin')
            setOk(false)
          } else if (user && user.role === 'admin' && user.status === 'approved') {
            setOk(true)
          } else {
            // Admin değil veya onaylı değil
            sessionStorage.removeItem('isAdmin')
            setError('Bu sayfaya erişim yetkiniz yok. Sadece admin kullanıcılar erişebilir.')
            setOk(false)
          }
        } else {
          sessionStorage.removeItem('isAdmin')
          setOk(false)
        }
      }
    } catch (e: any) {
      console.error('Admin gate error:', e)
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-lg">Yetki kontrol ediliyor...</span>
        </div>
      </div>
    )
  }

  if (!adminPass) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-semibold mb-2">Admin Girişi</h1>
        <p className="text-gray-600">Admin şifresi tanımlı değil. Lütfen proje kökünde .env dosyanıza şu anahtarı ekleyin ve dev sunucuyu yeniden başlatın:</p>
        <pre className="mt-3 rounded-lg bg-gray-100 p-3 text-sm">VITE_ADMIN_PASS=GUCLU_BIR_SIFRE</pre>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">⛔ Erişim Engellendi</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 w-full rounded-lg bg-red-600 text-white py-2 font-medium hover:bg-red-700"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-6">
        <h1 className="text-2xl font-semibold mb-4">Admin Girişi</h1>
        <p className="text-sm text-gray-600 mb-4">
          Bu sayfaya erişmek için admin şifresi gereklidir.
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (input === adminPass) {
              sessionStorage.setItem('isAdmin', 'true')
              checkAdminAccess()
            } else {
              setError('Yanlış şifre!')
              setTimeout(() => setError(''), 3000)
            }
          }}
        >
          <div>
            <label className="block text-sm mb-1">Admin Şifresi</label>
            <input
              type="password"
              className="w-full rounded-lg border px-3 py-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin şifresini girin"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700">
            Giriş Yap
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminGate


