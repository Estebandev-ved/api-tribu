import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCategorias } from '../api'
import {
    Cpu, Home, ChefHat, Sparkles, Shirt, Dumbbell,
    PawPrint, Gamepad2, Plane, Music, Lamp, Monitor,
    Backpack, ShoppingBag, Zap, Flame,
} from 'lucide-react'

// Mapeo nombre de categoría → ícono SVG
const CATEGORIA_ICONOS = {
    'gadget': Cpu,
    'tecnolog': Cpu,
    'electro': Zap,
    'hogar': Home,
    'cocina': ChefHat,
    'belleza': Sparkles,
    'moda': Shirt,
    'ropa': Shirt,
    'deporte': Dumbbell,
    'fitness': Dumbbell,
    'mascota': PawPrint,
    'juguete': Gamepad2,
    'gaming': Gamepad2,
    'viaje': Plane,
    'música': Music,
    'musica': Music,
    'iluminaci': Lamp,
    'luz': Lamp,
    'oficina': Monitor,
    'accesorio': Backpack,
}

const GRAD_COLORS = [
    'rgba(255,87,34,0.1)', 'rgba(254,231,21,0.08)', 'rgba(0,200,150,0.08)',
    'rgba(99,102,241,0.1)', 'rgba(236,72,153,0.08)', 'rgba(59,130,246,0.08)',
]

function getCategoryIcon(nombre) {
    const lower = nombre.toLowerCase()
    for (const [key, Icon] of Object.entries(CATEGORIA_ICONOS)) {
        if (lower.includes(key)) return Icon
    }
    return ShoppingBag
}

export default function CategoriasBanner({ onSelectCategoria }) {
    const [categorias, setCategorias] = useState([])

    useEffect(() => {
        getCategorias().then(r => setCategorias(r?.data || [])).catch(() => setCategorias([]))
    }, [])

    if (!categorias || !categorias.length) return null

    return (
        <section style={{ padding: '4rem 0' }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ marginBottom: '2rem' }}
                >
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem' }}>
                        Compra por categoría
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                        ¿Qué está buscando la tribu hoy?
                    </p>
                </motion.div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Botón "Todos" */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.85 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.06, y: -4 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onSelectCategoria && onSelectCategoria('todos')}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                            background: 'rgba(255,87,34,0.08)', border: '1px solid rgba(255,87,34,0.3)',
                            borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.75rem',
                            cursor: 'pointer', minWidth: 110, transition: 'all 0.25s',
                        }}
                    >
                        <Flame size={28} color="var(--color-primary)" strokeWidth={1.5} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>Todo</span>
                    </motion.button>

                    {categorias.map((cat, i) => {
                        const Icon = getCategoryIcon(cat.nombre)
                        return (
                            <motion.button
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.85 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                whileHover={{ scale: 1.06, y: -4 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => onSelectCategoria && onSelectCategoria(cat.id.toString())}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                                    background: GRAD_COLORS[i % GRAD_COLORS.length],
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.75rem',
                                    cursor: 'pointer', minWidth: 110, transition: 'all 0.25s',
                                }}
                            >
                                <Icon size={28} color="var(--color-text)" strokeWidth={1.5} />
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)' }}>{cat.nombre}</span>
                                {cat.descripcion && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3, maxWidth: 90 }}>
                                        {cat.descripcion.slice(0, 30)}{cat.descripcion.length > 30 ? '…' : ''}
                                    </span>
                                )}
                            </motion.button>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
