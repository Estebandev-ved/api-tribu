import { useState, useEffect, useRef } from 'react'

/**
 * Componente de imagen optimizado con skeleton shimmer.
 * Corrige el bug clásico de caché en React donde las imágenes ya cargadas
 * no disparan el evento onLoad.
 */
export default function OptimizedImage({ src, alt, style, className, fallback, eager = false }) {
    const [loaded, setLoaded] = useState(false)
    const [errored, setErrored] = useState(false)
    const imgRef = useRef(null)

    useEffect(() => {
        // Al cambiar de src, si ya tenemos la ref y ya se completó la carga por caché, la activamos de una
        if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth !== 0) {
            setLoaded(true)
        } else {
            setLoaded(false)
            setErrored(false)
        }
    }, [src])

    const handleRefCallback = (el) => {
        if (el) {
            imgRef.current = el
            // Si la imagen ya se cargó desde la caché antes de que React monte el onLoad listener:
            if (el.complete && el.naturalWidth !== 0) {
                if (!loaded) {
                    setLoaded(true)
                }
            }
        }
    }

    if (!src || errored) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%', fontSize: '2rem', ...style
            }} className={className}>
                {fallback || '🛍️'}
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }} className={className}>
            {!loaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    animation: 'shimmer 1.5s infinite linear',
                    background: 'linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 50%, var(--color-surface-2) 75%)',
                    backgroundSize: '200% 100%',
                }} />
            )}
            <img
                ref={handleRefCallback}
                src={src}
                alt={alt}
                loading={eager ? 'eager' : 'lazy'}
                fetchpriority={eager ? 'high' : 'auto'}
                decoding={eager ? 'sync' : 'async'}
                onLoad={() => setLoaded(true)}
                onError={() => setErrored(true)}
                style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.2s ease'
                }}
            />
        </div>
    )
}
