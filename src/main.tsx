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
import AdminLoginPage from './pages/AdminLoginPage.tsx'
import DebugSupabasePage from './pages/DebugSupabasePage.tsx'
import DebugStoragePage from './pages/DebugStoragePage.tsx'
import AdminDashboard from './pages/admin-dashboard.tsx'
import OpportunitiesPage from './pages/OpportunitiesPage.tsx'
import ListingDetailPage from './pages/ListingDetailPage.tsx'
import FavoritesPage from './pages/FavoritesPage.tsx'
import DebugAuthPage from './pages/DebugAuthPage.tsx'
import MyListingsPage from './pages/MyListingsPage.tsx'
import OneSignalTestPage from './pages/OneSignalTestPage.tsx'

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
      { path: 'admin/login', element: <AdminLoginPage /> },
      { path: 'debug/supabase', element: <DebugSupabasePage /> },
      { path: 'debug/storage', element: <DebugStoragePage /> },
      { path: 'debug/auth', element: <DebugAuthPage /> },
      { path: 'admin-dashboard', element: <AdminDashboard /> },
      { path: 'onesignal-test', element: <OneSignalTestPage /> },
    ],
  },
])

// Web Push notifications are handled by OneSignal service worker
// PWA Service Worker DEVRE DIŞI - OneSignal çakışmasını önlemek için
// Manuel kayıt yapmıyoruz - sadece OneSignal SW aktif

// Global PWA Install Prompt Handler
let deferredPrompt: unknown = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("PWA install prompt hazır.");
});

// Global PWA install function for buttons
(window as { installPWA?: () => Promise<void> }).installPWA = async () => {
  if (!deferredPrompt) return;
  
  // Type assertion for deferredPrompt
  const promptEvent = deferredPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
  
  promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  
  console.log("User choice:", choice.outcome);
  
  deferredPrompt = null;
};

// WonderPush'ı lazy loading yap - sadece gerektiğinde yükle
// Login sayfası veya test sayfası açıldığında otomatik yüklenecek

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
