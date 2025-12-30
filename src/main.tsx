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

// OneSignal Service Worker korunuyor - PWA Service Worker devre dışı
// Sadece install prompt kullanıyoruz

// Global PWA Install Prompt Handler
let deferredPrompt: any = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("PWA install prompt hazır.");
});

// Global PWA install function for buttons
(window as any).installPWA = async () => {
  if (!deferredPrompt) {
    console.log("Install prompt not available");
    return;
  }
  
  try {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    
    console.log("User choice:", choice.outcome);
    
    if (choice.outcome === 'accepted') {
      console.log('PWA installed successfully');
    } else {
      console.log('PWA installation dismissed');
    }
    
    deferredPrompt = null;
  } catch (error) {
    console.error('PWA installation error:', error);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
