import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import Datasets from './pages/Datasets'
import Detection from './pages/Detection'
import Models from './pages/Models'
import Monitoring from './pages/Monitoring'
import Settings from './pages/Settings'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/detection" element={<Detection />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/models" element={<Models />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
