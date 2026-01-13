import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function DebugAuthPage() {
  const [phone, setPhone] = useState('5551234567')
  const [password, setPassword] = useState('test123')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function testRegister() {
    setLoading(true)
    setResult(null)
    try {
      const { data, error } = await supabase
        .rpc('register_user', {
          p_full_name: 'Test Kullanıcı',
          p_phone: phone,
          p_password: password
        })

      setResult({
        type: 'register',
        success: !error,
        data,
        error: error?.message
      })
    } catch (e: any) {
      setResult({
        type: 'register',
        success: false,
        error: e.message
      })
    } finally {
      setLoading(false)
    }
  }

  async function testLogin() {
    setLoading(true)
    setResult(null)
    try {
      const { data, error } = await supabase
        .rpc('login_user', {
          p_phone: phone,
          p_password: password
        })

      setResult({
        type: 'login',
        success: !error,
        data,
        error: error?.message
      })
    } catch (e: any) {
      setResult({
        type: 'login',
        success: false,
        error: e.message
      })
    } finally {
      setLoading(false)
    }
  }

  async function checkUsers() {
    setLoading(true)
    setResult(null)
    try {
      // Try simple_users first
      let data = null
      let error = null
      
      try {
        const result = await supabase
          .from('simple_users')
          .select('*')
          .order('created_at', { ascending: false })
        data = result.data
        error = result.error
      } catch (simpleError) {
        console.log('simple_users erişilemez, profiles deneniyor')
        const result = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        data = result.data
        error = result.error
      }

      setResult({
        type: 'users',
        success: !error,
        data,
        error: error?.message
      })
    } catch (e: any) {
      setResult({
        type: 'users',
        success: false,
        error: e.message
      })
    } finally {
      setLoading(false)
    }
  }

  async function checkFunctions() {
    setLoading(true)
    setResult(null)
    try {
      // Test if functions exist
      const { data: registerData, error: registerError } = await supabase
        .rpc('register_user', {
          p_full_name: 'Test',
          p_phone: '1111111111',
          p_password: 'test'
        })

      const { data: loginData, error: loginError } = await supabase
        .rpc('login_user', {
          p_phone: '1111111111',
          p_password: 'test'
        })

      setResult({
        type: 'functions',
        register: {
          exists: !registerError || registerError.code !== '42883',
          error: registerError?.message,
          data: registerData
        },
        login: {
          exists: !loginError || loginError.code !== '42883',
          error: loginError?.message,
          data: loginData
        }
      })
    } catch (e: any) {
      setResult({
        type: 'functions',
        error: e.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🔍 Auth Debug Sayfası</h1>
      
      <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-6">
        <p className="text-yellow-900 font-semibold">
          ⚠️ Bu sayfa sadece test amaçlıdır. Production'da silin!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Telefon</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border px-4 py-2"
            placeholder="5551234567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Şifre</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-2"
            placeholder="test123"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testRegister}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Test Kayıt
        </button>
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Test Giriş
        </button>
        <button
          onClick={checkUsers}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          Kullanıcıları Gör
        </button>
        <button
          onClick={checkFunctions}
          disabled={loading}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          Fonksiyonları Kontrol Et
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg border-2 p-6">
          <h2 className="text-xl font-bold mb-4">
            {result.type === 'register' && '📝 Kayıt Sonucu'}
            {result.type === 'login' && '🔐 Giriş Sonucu'}
            {result.type === 'users' && '👥 Kullanıcılar'}
            {result.type === 'functions' && '⚙️ Fonksiyon Kontrolü'}
          </h2>
          
          <div className={`p-4 rounded-lg mb-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? '✅ Başarılı' : '❌ Hata'}
            </p>
            {result.error && (
              <p className="text-red-600 mt-2 text-sm">{result.error}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
            <pre className="text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Kontrol Listesi:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. SQL script'leri çalıştırıldı mı?</li>
          <li>2. users tablosu var mı?</li>
          <li>3. register_user fonksiyonu var mı?</li>
          <li>4. login_user fonksiyonu var mı?</li>
          <li>5. Kullanıcı kaydı oluştu mu?</li>
          <li>6. Kullanıcı admin tarafından onaylandı mı?</li>
        </ul>
      </div>
    </div>
  )
}

export default DebugAuthPage
