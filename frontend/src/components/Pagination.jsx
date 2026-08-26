export default function Pagination({ page, lastPage, onPageChange }) {
  if (lastPage <= 1) return null

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        className="btn btn-secondary"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior">
        Anterior
      </button>
      <span aria-live="polite">Página {page} de {lastPage}</span>
      <button
        className="btn btn-secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={page === lastPage}
        aria-label="Página siguiente">
        Siguiente
      </button>
    </nav>
  )
}
