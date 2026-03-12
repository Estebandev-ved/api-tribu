import { motion } from 'framer-motion'
import { Flame, Star, Shield, Users } from 'lucide-react'

export default function QuienesSomosPage() {
    return (
        <div style={{ paddingTop: '6rem', paddingBottom: '4rem', minHeight: '100vh', color: 'var(--color-text)' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>

                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(255,87,34,0.2)' }}>
                        <Flame size={48} color="var(--color-primary)" />
                    </div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '1rem' }}>
                        Nuestra <span style={{ color: 'var(--color-primary)' }}>Tribu</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                        Descubriendo los productos más virales del mundo, desde Mocoa para toda Colombia.
                    </p>
                </div>

                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '3rem', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-text)' }}>¿Quiénes somos?</h2>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                        En <strong>Tribu E-commerce</strong> no somos una tienda online tradicional. Somos un equipo apasionado por buscar, probar y seleccionar los productos más virales, innovadores y útiles que están rompiéndola en internet.
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                        Nacimos en Mocoa, Putumayo, con una visión clara: acortar la distancia entre las tendencias mundiales y el consumidor colombiano. Queremos que tengas acceso temprano a lo que todo el mundo de lo que estará hablando mañana.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                        <Star size={32} color="#FFD700" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Calidad Probada</h3>
                        <p style={{ color: 'var(--color-text-faint)', fontSize: '0.9rem' }}>Filtramos rigurosamente cada producto antes de ponerlo en tus manos.</p>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                        <Shield size={32} color="#00C896" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Compra Segura</h3>
                        <p style={{ color: 'var(--color-text-faint)', fontSize: '0.9rem' }}>Tu dinero y tus datos están protegidos en cada paso del proceso.</p>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                        <Users size={32} color="#4facfe" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Comunidad</h3>
                        <p style={{ color: 'var(--color-text-faint)', fontSize: '0.9rem' }}>Más que clientes, construimos una red de compradores inteligentes.</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
