import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getMisPedidos } from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Package } from 'lucide-react'
import PedidoCard from '../components/PedidoCard'
import toast from 'react-hot-toast'

export default function MisPedidosPage() {
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return }
        getMisPedidos()
            .then(r => setPedidos(r.data))
            .finally(() => setLoading(false))
    }, [isAuthenticated])

    useEffect(() => {
        const efipayStatus = searchParams.get('efipay')
        if (efipayStatus === 'approved') {
            toast.success('Pago aprobado. Tu pedido está en proceso.')
        } else if (efipayStatus === 'rejected') {
            toast.error('El pago fue rechazado. Intenta con otro método.')
        } else if (efipayStatus === 'pending') {
            toast('El pago está pendiente. Te notificaremos cuando se confirme.', { icon: '⏳' })
        }
    }, [searchParams])

    return (
        <div className="container" style={{ padding: '2rem 1.5rem' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Mis Pedidos</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Seguimiento de todos tus pedidos en Tribu</p>
            </motion.div>

            {loading ? (
                <div className="spinner" />
            ) : pedidos.length === 0 ? (
                <div className="empty-state">
                    <Package size={64} />
                    <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Aún no tienes pedidos</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', marginTop: '0.5rem' }}>Explora la tienda y haz tu primer pedido</p>
                    <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/')}>
                        Ir a la tienda
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pedidos.map((p, i) => <PedidoCard key={p.id} pedido={p} index={i} />)}
                </div>
            )}
        </div>
    )
}
