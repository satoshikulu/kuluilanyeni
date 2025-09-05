import { useEffect, useState } from 'react'

type Props = { children: React.ReactNode }

function AdminGate({ children }: Props) {
  const adminPass = import.meta.env.VITE_ADMIN_PASS as string | undefined
  const [ok, setOk] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')

  useEffect(() => {
    const flag = sessionStorage.getItem('isAdmin') === 'true'
    if (flag) setOk(true)
  }, [])

  if (!adminPass) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Admin Girişi</h1>
        <p className="text-gray-600">Admin şifresi tanımlı değil. Lütfen proje kökünde .env dosyanıza şu anahtarı ekleyin ve dev sunucuyu yeniden başlatın:</p>
        <pre className="mt-3 rounded-lg bg-gray-100 p-3 text-sm">VITE_ADMIN_PASS=GUCLU_BIR_SIFRE</pre>
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold mb-4">Admin Girişi</h1>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (input === adminPass) {
              sessionStorage.setItem('isAdmin', 'true')
              setOk(true)
            }
          }}
        >
          <div>
            <label className="block text-sm mb-1">Şifre</label>
            <input
              type="password"
              className="w-full rounded-lg border px-3 py-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
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


