import { useRef, useEffect, useCallback } from 'react'
import { List } from 'react-window'

const ROW_HEIGHT = 48

export default function VirtualTable({ items, columns, onRowClick, className, 'aria-label': ariaLabel }) {
  const listRef = useRef(null)

  const Row = useCallback(({ index, style }) => {
    const item = items[index]
    return (
      <div
        style={style}
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
    )
  }, [items, columns, onRowClick])

  useEffect(() => {
    listRef.current?.resetAfterIndex(0)
  }, [items])

  return (
    <div className={`virtual-table ${className || ''}`} role="table" aria-label={ariaLabel}>
      <div className="virtual-header" role="row">
        {columns.map((col) => (
          <div key={col.key} className="virtual-header-cell" role="columnheader">
            {col.label}
          </div>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="virtual-empty">Sin resultados</div>
      ) : (
        <List
          ref={listRef}
          height={Math.min(items.length * ROW_HEIGHT, 600)}
          itemCount={items.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      )}
    </div>
  )
}
