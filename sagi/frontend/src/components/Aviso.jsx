import { useEffect, useRef } from 'react'
import '../styles/aviso.css'

export default function Aviso({ mensaje, onCerrar }) {
  const cerrarRef = useRef(onCerrar)
  cerrarRef.current = onCerrar

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => cerrarRef.current?.(), 5000)
    return () => clearTimeout(t)
  }, [mensaje])

  if (!mensaje) return null

  return (
    <div className="aviso" role="alert">
      <span className="aviso-texto">{mensaje}</span>
      <button type="button" className="aviso-cerrar" onClick={() => cerrarRef.current?.()} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  )
}
