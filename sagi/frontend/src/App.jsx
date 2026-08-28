import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import './index.css'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inventario = lazy(() => import('./pages/Inventario'))
const Categorias = lazy(() => import('./pages/Categorias'))
const Movimientos = lazy(() => import('./pages/Movimientos'))
const Reportes = lazy(() => import('./pages/Reportes'))
const Alertas = lazy(() => import('./pages/Alertas'))
const Auditoria = lazy(() => import('./pages/Auditoria'))
const Unidades = lazy(() => import('./pages/Unidades'))

function PageLoader() {
  return (
    <Layout title="Cargando...">
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)' }}>
        Cargando...
      </div>
    </Layout>
  )
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.rol?.slug)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventario"
                element={
                  <ProtectedRoute>
                    <Inventario />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categorias"
                element={
                  <RoleRoute roles={['admin']}>
                    <Categorias />
                  </RoleRoute>
                }
              />
              <Route
                path="/unidades"
                element={
                  <RoleRoute roles={['admin']}>
                    <Unidades />
                  </RoleRoute>
                }
              />
              <Route
                path="/movimientos"
                element={
                  <ProtectedRoute>
                    <Movimientos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <Reportes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alertas"
                element={
                  <ProtectedRoute>
                    <Alertas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auditoria"
                element={
                  <ProtectedRoute>
                    <Auditoria />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
