import { useEffect, useState } from 'react'
import Skeleton from '../components/shared/Skeleton'
import Input from '../components/ui/Input'

const tabs = ['General', 'Detection', 'Notifications', 'API Keys']

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-all duration-200 ${
        checked ? 'bg-primary-900' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-200 ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('General')
  const [settings, setSettings] = useState({
    autoSync: true,
    saveDetections: true,
    emailAlert: true,
    thresholdAlert: false,
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <Skeleton className="h-[520px]" />
  }

  return (
    <div className="card p-5">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-primary-50 text-primary-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'General' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Organization Name" defaultValue="MOPAD Plantation Intelligence" />
          <Input label="Timezone" defaultValue="Asia/Jakarta" />
          <Input label="Default Site" defaultValue="Site 1" />
          <Input label="Language" defaultValue="Bahasa Indonesia" />
        </div>
      )}

      {activeTab === 'Detection' && (
        <div className="space-y-4">
          <Input label="Default Confidence Threshold" defaultValue="0.55" />
          <Input label="NMS IoU Threshold" defaultValue="0.45" />
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-800">Auto save detection result</p>
              <p className="text-sm text-slate-500">Simpan otomatis output deteksi ke storage.</p>
            </div>
            <ToggleSwitch
              checked={settings.saveDetections}
              onChange={(value) =>
                setSettings((prev) => ({ ...prev, saveDetections: value }))
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'Notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-800">Email Alert</p>
              <p className="text-sm text-slate-500">Kirim notifikasi email saat status critical terdeteksi.</p>
            </div>
            <ToggleSwitch
              checked={settings.emailAlert}
              onChange={(value) => setSettings((prev) => ({ ...prev, emailAlert: value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-800">Threshold Alert</p>
              <p className="text-sm text-slate-500">Notifikasi saat confidence rata-rata turun drastis.</p>
            </div>
            <ToggleSwitch
              checked={settings.thresholdAlert}
              onChange={(value) =>
                setSettings((prev) => ({ ...prev, thresholdAlert: value }))
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'API Keys' && (
        <div className="space-y-4">
          <Input label="Backend API URL" defaultValue="http://localhost:8080" />
          <Input label="Detection API Key" defaultValue="mopad_demo_key_2026" />
          <Input label="Analytics API Key" defaultValue="mopad_analytics_key_2026" />

          <div className="rounded-lg bg-primary-50/60 p-4 text-sm text-slate-600">
            Simpan endpoint backend Golang Anda di environment variable
            {' '}
            VITE_API_URL
            {' '}
            agar frontend otomatis terhubung ke server API.
          </div>
        </div>
      )}
    </div>
  )
}
