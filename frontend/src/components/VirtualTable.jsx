import { useRef, useCallback } from 'react'

export default function VirtualTable({ items, columns, onRowClick, className, 'aria-label': ariaLabel }) {
  const listRef = useRef(null)

  return (
    <div className={`virtual-table ${className || ''}`} role="table" aria-label={ariaLabel}>
      <div className="virtual-header" role="row">
        {columns.map((col) => (
          <div key={col.key} className="virtual-header-cell" role="columnheader">
            {col.label}
          </div>
        ))}
      </div>
      <div className="virtual-body" ref={listRef}>
        {items.length === 0 ? (
          <div className="virtual-empty">Sin resultados</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`virtual-row ${item.estado === 'baja' ? 'fila-baja' : ''}`}
              onClick={() => onRowClick?.(item)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onRowClick?.(item)
              }}
              aria-label={`Ítem ${item.codigo_unico}`}
            >
              {columns.map((col) => (
                <div key={col.key} className="virtual-cell" data-label={col.label}>
                  {col.render ? col.render(item) : item[col.key] ?? '-'}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
