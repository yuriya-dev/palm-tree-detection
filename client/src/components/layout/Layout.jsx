import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/useAppStore'
import Header from './Header'
import Sidebar from './Sidebar'

const pageMeta = {
  '/dashboard': {
    title: 'Overview Dashboard',
    subtitle: 'Ringkasan performa deteksi dan kondisi kebun secara real-time.',
  },
  '/detection': {
    title: 'Upload and Detection',
    subtitle: 'Unggah citra UAV, pilih model, dan jalankan deteksi pohon.',
  },
  '/monitoring': {
    title: 'Tree Monitoring',
    subtitle: 'Pantau status tiap pohon dengan peta interaktif dan tabel detail.',
  },
  '/datasets': {
    title: 'Dataset Management',
    subtitle: 'Kelola dataset pelatihan dan validasi antar site secara terpusat.',
  },
  '/models': {
    title: 'Model Management',
    subtitle: 'Bandingkan performa model dan atur model aktif untuk inferensi.',
  },
  '/analytics': {
    title: 'Analytics and Reports',
    subtitle: 'Lihat tren periodik dan ekspor insight operasional.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Konfigurasi sistem, notifikasi, dan integrasi API backend.',
  },
}

export default function Layout() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore()

  const currentMeta =
    pageMeta[location.pathname] ||
    pageMeta['/dashboard']

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-[240px]">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onOpenSidebar={toggleSidebar}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
