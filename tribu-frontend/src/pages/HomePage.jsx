import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import ProductoCard from '../components/ProductoCard'
import TrendingMarquee from '../components/TrendingMarquee'
import CategoriasBanner from '../components/CategoriasBanner'
import HowItWorks from '../components/HowItWorks'
import { getProductos, getCategorias, getVirales } from '../api'
import { Search, Flame } from 'lucide-react'

export default function HomePage({ viralMode = false }) {
    const [productos, setProductos] = useState([])
    const [virales, setVirales] = useState([])
    const [categorias, setCategorias] = useState([])
    const [filtro, setFiltro] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            getProductos().catch(() => ({ data: [] })),
            getVirales().catch(() => ({ data: [] })),
            getCategorias().catch(() => ({ data: [] }))
        ])
            .then(([p, v, c]) => {
                setProductos(p?.data || [])
                setVirales(v?.data || [])
                setCategorias(c?.data || [])
            })
            .finally(() => setLoading(false))
    }, [])

    const listaBase = viralMode ? (virales || []) : (productos || [])

    const filtrados = listaBase.filter(p => {
        const coincideCategoria = filtro === 'todos' || p.categoriaId?.toString() === filtro
        const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        return coincideCategoria && coincideBusqueda
    })

    return (
        <div>
            {/* 1. HERO con video/imagen de fondo y parallax */}
            {!viralMode && <Hero />}

            {/* 2. MARQUEE de tendencias (al hacer scroll) */}
            {!viralMode && <TrendingMarquee />}

            {/* 3. CATEGORÍAS VISUALES */}
            {!viralMode && (
                <CategoriasBanner onSelectCategoria={(id) => {
                    setFiltro(id)
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }} />
            )}

            {/* 4. VIRALES DESTACADOS */}
            {!viralMode && virales.length > 0 && (
                <section style={{ paddingBottom: '4rem' }}>
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.5 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}
                        >
                            <Flame size={22} color="var(--color-primary)" strokeWidth={1.5} />
                            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>
                                Tendencias del momento
                            </h2>
                        </motion.div>
                        <div className="productos-grid">
                            {(virales || []).slice(0, 4).map((p, i) => <ProductoCard key={p.id} producto={p} index={i} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* 5. CÓMO FUNCIONA */}
            {!viralMode && <HowItWorks />}

            {/* 6. CATÁLOGO COMPLETO */}
            <section id="catalogo" style={{ padding: '4rem 0 6rem' }}>
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}
                    >
                        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem' }}>
                            {viralMode
                                ? <><Flame size={24} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--color-primary)', marginRight: 8 }} />Lo más viral ahora</>
                                : 'Todo el catálogo'}
                        </h2>
                        {filtro !== 'todos' && (
                            <button onClick={() => setFiltro('todos')} className="btn btn-ghost" style={{ fontSize: '0.82rem' }}>
                                × Ver todos
                            </button>
                        )}
                    </motion.div>

                    {/* Barra de búsqueda + filtros por categoría */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
                            <input className="input" placeholder="Buscar producto..."
                                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }} />
                        </div>

                        {loading ? (
                            <div className="spinner" />
                        ) : filtrados.length === 0 ? (
                            <div className="empty-state">
                                <Search size={48} />
                                <p>No se encontraron productos</p>
                                {filtro !== 'todos' && (
                                    <button onClick={() => setFiltro('todos')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                        Ver todos los productos
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="productos-grid">
                                {(filtrados || []).map((p, i) => <ProductoCard key={p.id} producto={p} index={i} />)}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
