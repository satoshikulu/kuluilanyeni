import { Outlet, Link, NavLink } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            Kulu İlan <span className="text-gray-500">·</span> <span className="text-gray-600">Kulu Emlak Pazarı</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/ilanlar"
              className={({ isActive }) => [
                'inline-flex items-center rounded-xl px-4 py-2 font-medium shadow-sm transition-colors',
                'bg-blue-600 text-white hover:bg-orange-500',
                isActive ? 'ring-2 ring-orange-300' : 'ring-1 ring-black/10'
              ].join(' ')}
            >
              İlanlara Bak
            </NavLink>
            <NavLink
              to="/giris"
              className={({ isActive }) => [
                'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-colors',
                'bg-white text-gray-900 shadow-sm hover:bg-orange-50 hover:text-orange-700',
                isActive ? 'ring-2 ring-orange-300' : 'ring-1 ring-black/10'
              ].join(' ')}
            >
              Giriş Yap
            </NavLink>
            <NavLink
              to="/uye-ol"
              className={({ isActive }) => [
                'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-colors',
                'border-2 border-gray-300 text-gray-800 hover:border-orange-400 hover:bg-orange-500/10 hover:text-orange-700',
                isActive ? 'ring-2 ring-orange-300' : 'ring-0'
              ].join(' ')}
            >
              Üye Ol
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t text-sm text-gray-500">
        <div className="mx-auto max-w-6xl px-4 py-6">
          © {new Date().getFullYear()} Kulu İlan · Kulu Emlak Pazarı
        </div>
      </footer>
    </div>
  )
}

export default App
