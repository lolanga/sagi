import { useState, useRef, useEffect } from 'react'
import '../styles/image.css'

export default function Image({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  fallback,
  ...props
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const handleLoad = () => setLoaded(true)
    const handleError = () => setError(true)

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)

    return () => {
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }
  }, [src])

  if (error && fallback) {
    return (
      <div className={`image-fallback ${className || ''}`} style={{ width, height }}>
        {fallback}
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`image ${loaded ? 'image--loaded' : 'image--loading'} ${className || ''}`}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      {...props}
    />
  )
}
