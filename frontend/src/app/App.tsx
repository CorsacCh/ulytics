import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ChangePasswordPage } from '../features/auth/ChangePasswordPage'
import { useAuth } from '../features/auth/AuthContext'
import { roleHomePath, type RoleCode } from '../features/auth/types'

// Carga perezosa (Lazy loading) de las vistas para mejor rendimiento
const DashboardAdmin = lazy(() => import('../features/dashboards/admin/DashboardAdmin'))
const DashboardAutoridad = lazy(() => import('../features/dashboards/autoridad/DashboardAutoridad'))
const DashboardDecano = lazy(() => import('../features/dashboards/decano/DashboardDecano'))
const DashboardDirector = lazy(() => import('../features/dashboards/director/DashboardDirector'))
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6">
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-[#D9E5F0] border-t-[#003366]" />
        <p className="mt-4 text-sm font-semibold text-[#556B7B]">Comprobando sesión…</p>
      </div>
    </main>
  )
}

function EntryRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.debeCambiarPassword) return <Navigate to="/cambiar-contrasena" replace />
  return <Navigate to={roleHomePath(user.rol.codigo)} replace />
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return children
  if (user.debeCambiarPassword) return <Navigate to="/cambiar-contrasena" replace />
  return <Navigate to={roleHomePath(user.rol.codigo)} replace />
}

function ProtectedRoute({
  children,
  roles,
  passwordChangePage = false,
}: {
  children: ReactNode
  roles?: RoleCode[]
  passwordChangePage?: boolean
}) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.debeCambiarPassword && !passwordChangePage) {
    return <Navigate to="/cambiar-contrasena" replace />
  }
  if (!user.debeCambiarPassword && passwordChangePage) {
    return <Navigate to={roleHomePath(user.rol.codigo)} replace />
  }
  if (roles && !roles.includes(user.rol.codigo)) {
    return <Navigate to={roleHomePath(user.rol.codigo)} replace />
  }

  return children
}

function DashboardLoading() {
  return <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-sm font-semibold text-[#556B7B]">Cargando dashboard...</div>
}

export default function App() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Routes>
        <Route path="/" element={<EntryRedirect />} />
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/cambiar-contrasena" element={
          <ProtectedRoute passwordChangePage>
            <ChangePasswordPage />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><DashboardAdmin /></ProtectedRoute>} />
        <Route path="/director" element={<ProtectedRoute roles={['DIRECTOR']}><DashboardDirector /></ProtectedRoute>} />
        <Route path="/decano" element={<ProtectedRoute roles={['DECANO']}><DashboardDecano /></ProtectedRoute>} />
        <Route path="/decanatura/*" element={<ProtectedRoute roles={['DECANO']}><DashboardDecano /></ProtectedRoute>} />
        <Route path="/autoridad" element={<ProtectedRoute roles={['AUTORIDAD_CENTRAL']}><DashboardAutoridad /></ProtectedRoute>} />

        <Route path="*" element={<EntryRedirect />} />
      </Routes>
    </Suspense>
  )
}
