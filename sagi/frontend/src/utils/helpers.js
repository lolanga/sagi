export function extractApiError(err, fallback = 'Error inesperado') {
  const msg = err.response?.data?.message
  const errors = err.response?.data?.errors
  const first = errors ? Object.values(errors)[0]?.[0] : null
  return first || msg || fallback
}
