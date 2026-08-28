import '../styles/empty-state.css'

const icons = {
  search: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="52" r="30" stroke="currentColor" strokeWidth="5" opacity="0.25" />
      <line x1="74" y1="74" x2="100" y2="100" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.25" />
      <circle cx="52" cy="52" r="18" stroke="currentColor" strokeWidth="4" strokeDasharray="6 4" opacity="0.4" />
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="80" height="70" rx="8" stroke="currentColor" strokeWidth="4" opacity="0.2" />
      <rect x="32" y="40" width="56" height="8" rx="3" fill="currentColor" opacity="0.12" />
      <rect x="32" y="56" width="40" height="8" rx="3" fill="currentColor" opacity="0.12" />
      <rect x="32" y="72" width="48" height="8" rx="3" fill="currentColor" opacity="0.12" />
      <circle cx="88" cy="88" r="16" stroke="currentColor" strokeWidth="4" opacity="0.3" />
      <line x1="88" y1="80" x2="88" y2="96" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="80" y1="88" x2="96" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 20L100 95H20L60 20Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" opacity="0.2" />
      <line x1="60" y1="50" x2="60" y2="70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      <circle cx="60" cy="82" r="3" fill="currentColor" opacity="0.35" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 15L100 40V80L60 105L20 80V40L60 15Z" stroke="currentColor" strokeWidth="4" opacity="0.18" />
      <line x1="60" y1="15" x2="60" y2="105" stroke="currentColor" strokeWidth="3" opacity="0.12" />
      <line x1="20" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="3" opacity="0.12" />
    </svg>
  ),
}

export default function EmptyState({ icon = 'inventory', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icons[icon] || icons.box}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
