import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Modal from './Modal'
import Aviso from './Aviso'
import '../index.css'

const navGroups = [
  {
    id: 'operaciones',
    label: 'Operaciones',
    items: [
      { to: '/', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'jefe', 'carga', 'consulta'], bottom: true },
      { to: '/alertas', label: 'Alertas', icon: 'alertas', roles: ['admin', 'jefe', 'carga'], bottom: true, badge: true },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    items: [
      { to: '/inventario', label: 'Inventario', icon: 'inventario', roles: ['admin', 'jefe', 'carga', 'consulta'], bottom: true },
      { to: '/movimientos', label: 'Movimientos', icon: 'movimientos', roles: ['admin', 'jefe', 'carga'], bottom: true },
    ],
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    items: [
      { to: '/categorias', label: 'Categorías', icon: 'categorias', roles: ['admin'] },
      { to: '/unidades', label: 'Sedes y Unidades', icon: 'unidades', roles: ['admin'] },
    ],
  },
  {
    id: 'control',
    label: 'Control',
    items: [
      { to: '/reportes', label: 'Reportes', icon: 'reportes', roles: ['admin', 'jefe'] },
      { to: '/auditoria', label: 'Auditoría', icon: 'auditoria', roles: ['admin', 'jefe'] },
    ],
  },
]

const icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  alertas: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  inventario: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  movimientos: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  categorias: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  unidades: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  reportes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  auditoria: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
}

const bottomItems = navGroups
  .flatMap((g) => g.items)
  .filter((i) => i.bottom)

function hasAccess(user, roles) {
  return roles.includes(user?.rol?.slug)
}

export default function Layout({ title, actions, children, back }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sagi_sidebar_collapsed') === 'true')
  const [openGroups, setOpenGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sagi_open_groups')) || navGroups.map((g) => g.id) } catch { return navGroups.map((g) => g.id) }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('sagi_theme') || 'dark')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sagi_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('sagi_sidebar_collapsed', collapsed)
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem('sagi_open_groups', JSON.stringify(openGroups))
  }, [openGroups])

  useEffect(() => {
    if (hasAccess(user, ['admin', 'jefe', 'carga'])) {
      api.get('/alerts?status=abierta')
        .then((res) => setAlertCount(res.data?.length ?? 0))
        .catch(() => {})
    }
  }, [user, location.pathname])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const closeMenu = () => setMenuOpen(false)

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    )
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    const form = e.target
    const current_password = form.current_password.value
    const password = form.password.value
    const password_confirmation = form.password_confirmation.value

    if (password !== password_confirmation) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    try {
      await api.post('/change-password', { current_password, password, password_confirmation })
      setPasswordSuccess('Contraseña actualizada correctamente')
      form.reset()
      setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess('') }, 2000)
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error al cambiar la contraseña')
    }
  }

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAccess(user, item.roles)),
    }))
    .filter((group) => group.items.length > 0)

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  return (
    <div className="layout">
      <div className={`sidebar-overlay ${menuOpen ? 'visible' : ''}`} onClick={closeMenu} />

      <aside className={`sidebar ${menuOpen ? 'open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#6fb2e8" />
                <stop offset="100%" stopColor="#ffa94d" />
              </linearGradient>
            </defs>
            <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M3 7.5 12 12l9-4.5M12 12v9" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M7.5 5.25 16.5 9.75" stroke="#ffa94d" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {!collapsed && <span className="logo-text">SAGI</span>}
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <nav className="sidebar-nav">
          {visibleGroups.map((group) => {
            const isOpen = openGroups.includes(group.id)
            return (
              <div key={group.id} className="nav-group">
                {!collapsed && (
                  <button
                    className="nav-group-header"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="nav-group-label">{group.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`nav-group-chevron ${isOpen ? 'nav-group-chevron--open' : ''}`}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
                <div className={`nav-group-items ${collapsed ? 'nav-group-items--collapsed' : isOpen ? 'nav-group-items--open' : 'nav-group-items--closed'}`}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive: active }) => `nav-item ${active ? 'nav-item--active' : ''}`}
                      onClick={closeMenu}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="nav-item-icon">{icons[item.icon]}</span>
                      {!collapsed && (
                        <>
                          <span className="nav-item-label">{item.label}</span>
                          {item.badge && alertCount > 0 && (
                            <span className="nav-item-badge">{alertCount > 99 ? '99+' : alertCount}</span>
                          )}
                        </>
                      )}
                      {collapsed && item.badge && alertCount > 0 && (
                        <span className="nav-item-dot" />
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && 'Departamento Tecnología, Desarrollo e Innovación'}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menú">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              {back && (
                <Link to={back} className="btn-back">← Volver</Link>
              )}
              <h1>{title}</h1>
              <p className="topbar-user">
                {user?.name} · {user?.rol?.nombre} · {user?.sede?.nombre}
              </p>
            </div>
          </div>
          <div className="topbar-actions">
            {actions}
            <button className="btn btn-secondary" onClick={toggleTheme} title="Cambiar tema">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)} title="Cambiar contraseña">
              🔑
            </button>
            <button className="btn btn-secondary" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="content">{children}</section>
      </main>

      <nav className="bottom-nav">
        {bottomItems
          .filter((item) => hasAccess(user, item.roles))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: active }) => `bottom-nav-item ${active ? 'bottom-nav-item--active' : ''}`}
            >
              <span className="bottom-nav-icon">
                {icons[item.icon]}
                {item.badge && alertCount > 0 && (
                  <span className="bottom-nav-badge">{alertCount > 99 ? '99+' : alertCount}</span>
                )}
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <Modal open={showPasswordModal} title="Cambiar contraseña" onClose={() => setShowPasswordModal(false)}>
        <form onSubmit={handleChangePassword}>
          <Aviso mensaje={passwordError} onCerrar={() => setPasswordError('')} />
          {passwordSuccess && <div className="aviso aviso-success">{passwordSuccess}</div>}
          <div className="field">
            <label htmlFor="current_password">Contraseña actual</label>
            <input type="password" id="current_password" name="current_password" required />
          </div>
          <div className="field">
            <label htmlFor="password">Nueva contraseña</label>
            <input type="password" id="password" name="password" required minLength={6} />
          </div>
          <div className="field">
            <label htmlFor="password_confirmation">Confirmar contraseña</label>
            <input type="password" id="password_confirmation" name="password_confirmation" required minLength={6} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
