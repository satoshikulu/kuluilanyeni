import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import HomePage from './pages/HomePage.tsx'
import ListingsPage from './pages/ListingsPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import SellPage from './pages/SellPage.tsx'
import RentPage from './pages/RentPage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import DebugSupabasePage from './pages/DebugSupabasePage.tsx'
import DebugStoragePage from './pages/DebugStoragePage.tsx'
import AdminDashboard from './pages/admin-dashboard.tsx'
import OpportunitiesPage from './pages/OpportunitiesPage.tsx'
import ListingDetailPage from './pages/ListingDetailPage.tsx'
import FavoritesPage from './pages/FavoritesPage.tsx'
import DebugAuthPage from './pages/DebugAuthPage.tsx'
import MyListingsPage from './pages/MyListingsPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'ilanlar', element: <ListingsPage /> },
      { path: 'ilanlarim', element: <MyListingsPage /> },
      { path: 'giris', element: <LoginPage /> },
      { path: 'uye-ol', element: <RegisterPage /> },
      { path: 'satmak', element: <SellPage /> },
      { path: 'kiralamak', element: <RentPage /> },
      { path: 'firsatlar', element: <OpportunitiesPage /> },
      { path: 'ilan/:id', element: <ListingDetailPage /> },
      { path: 'favoriler', element: <FavoritesPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'debug/supabase', element: <DebugSupabasePage /> },
      { path: 'debug/storage', element: <DebugStoragePage /> },
      { path: 'debug/auth', element: <DebugAuthPage /> },
      { path: 'admin-dashboard', element: <AdminDashboard /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
