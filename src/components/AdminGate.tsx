import { useEffect, useState } from 'react'

type Props = { children: React.ReactNode }

function AdminGate({ children }: Props) {
  const adminPass = import.meta.env.VITE_ADMIN_PASS as string | undefined
  const [ok, setOk] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const flag = sessionStorage.getItem('isAdmin') === 'true'
    if (flag) setOk(true)
  }, [])

  if (!adminPass) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-semibold mb-2">Admin Girişi</h1>
        <p className="text-gray-600">Admin şifresi tanımlı değil. Lütfen proje kökünde .env dosyanıza şu anahtarı ekleyin ve dev sunucuyu yeniden başlatın:</p>
        <pre className="mt-3 rounded-lg bg-gray-100 p-3 text-sm">VITE_ADMIN_PASS=GUCLU_BIR_SIFRE</pre>
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-6">
        <h1 className="text-2xl font-semibold mb-4">🔐 Admin Girişi</h1>
        <p className="text-sm text-gray-600 mb-4">
          Bu sayfaya erişmek için admin şifresi gereklidir.
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (input === adminPass) {
              sessionStorage.setItem('isAdmin', 'true')
              setOk(true)
              setError('')
            } else {
              setError('❌ Yanlış şifre!')
              setTimeout(() => setError(''), 3000)
            }
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Admin Şifresi</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Şifreyi girin"
              autoFocus
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
            Giriş Yap
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminGate


