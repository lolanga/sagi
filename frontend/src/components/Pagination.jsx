export default function Pagination({ page, lastPage, onPageChange }) {
  if (lastPage <= 1) return null

  return (
    <div className="pagination">
      <button
        className={page === 1 ? 'btn btn-secondary disabled' : 'btn btn-secondary'}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior">
        Anterior
      </button>
      <span>Página {page} de {lastPage}</span>
      <button
        className={page === lastPage ? 'btn btn-secondary disabled' : 'btn btn-secondary'}
        onClick={() => onPageChange(page + 1)}
        disabled={page === lastPage}
        aria-label="Página siguiente">
        Siguiente
      </button>
    </div>
  )
}
