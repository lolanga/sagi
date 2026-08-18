import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Categorias from './pages/Categorias'
import Movimientos from './pages/Movimientos'
import Reportes from './pages/Reportes'
import Alertas from './pages/Alertas'
import Auditoria from './pages/Auditoria'
import Unidades from './pages/Unidades'
import './index.css'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
              <ProtectedRoute>
                <Categorias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unidades"
            element={
              <ProtectedRoute>
                <Unidades />
              </ProtectedRoute>
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
      </BrowserRouter>
    </AuthProvider>
  )
}