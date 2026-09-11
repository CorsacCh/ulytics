import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardAdmin from '../features/dashboards/admin/DashboardAdmin'
import DashboardAutoridad from '../features/dashboards/autoridad/DashboardAutoridad'
import DashboardDecano from '../features/dashboards/decano/DashboardDecano'
import DashboardDirector from '../features/dashboards/director/DashboardDirector'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/decanatura" replace />} />
      <Route path="/admin" element={<DashboardAdmin />} />
      <Route path="/director" element={<DashboardDirector />} />
      <Route path="/decanatura" element={<DashboardDecano />} />
      <Route path="/decanatura/*" element={<DashboardDecano />} />
      <Route path="/autoridad-central" element={<DashboardAutoridad />} />
      <Route path="*" element={<Navigate to="/decanatura" replace />} />
    </Routes>
  )
}
