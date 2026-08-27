import { useRef, useCallback } from 'react'
import { List, useListRef } from 'react-window'

const ROW_HEIGHT = 48

function RowComponent({ index, style, data }) {
  const { items, columns, onRowClick } = data
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
}

export default function VirtualTable({ items, columns, onRowClick, className, 'aria-label': ariaLabel }) {
  const listRef = useListRef()

  const rowData = useCallback(() => ({ items, columns, onRowClick }), [items, columns, onRowClick])

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
          rowComponent={RowComponent}
          rowCount={items.length}
          rowHeight={ROW_HEIGHT}
          rowProps={rowData()}
          overscanCount={5}
          style={{ maxHeight: Math.min(items.length * ROW_HEIGHT, 600) }}
        />
      )}
    </div>
  )
}
