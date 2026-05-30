import { useState, useEffect } from 'react'

export default function OptimizedImage({ src, alt, style, className, fallback }) {
    const [loaded, setLoaded] = useState(false)
    const [errored, setErrored] = useState(false)

    useEffect(() => {
        setLoaded(false)
        setErrored(false)
    }, [src])

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
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setErrored(true)}
                style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            />
        </div>
    )
}
