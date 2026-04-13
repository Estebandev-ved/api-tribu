import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    FileText, Download, Plus, 
    Search, AlertCircle, CheckCircle2, 
    X, FilePlus, ExternalLink, Info 
} from 'lucide-react'
import { 
    getMisFacturas, 
    solicitarFactura, 
    descargarFacturaPdf, 
    getMisPedidos 
} from '../api'
import { toast } from 'react-hot-toast'

const formatCurrency = (monto) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto || 0);

export default function FacturasPage() {
    const [facturas, setFacturas] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        pedidoId: '',
        nit: '',
        razonSocial: ''
    });

    useEffect(() => {
        cargarFacturas();
        cargarPedidos();
    }, []);

    const cargarFacturas = async () => {
        try {
            const res = await getMisFacturas();
            setFacturas(res.data);
        } catch (error) {
            toast.error('No se pudieron cargar las facturas');
        } finally {
            setLoading(false);
        }
    };

    const cargarPedidos = async () => {
        try {
            // Filtrar pedidos que no tienen factura aún (esto debería idealmente filtrarse en el backend o aquí)
            const res = await getMisPedidos();
            // Asumimos que los pedidos pueden filtrarse por un campo que indique si tiene factura
            // Por ahora mostramos los completados
            setPedidos(res.data.filter(p => p.estado === 'ENTREGADO' || p.estado === 'PAGADO'));
        } catch (error) {
            console.error('Error cargando pedidos:', error);
        }
    };

    const handleDownload = async (facturaId, numero) => {
        try {
            const response = await descargarFacturaPdf(facturaId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Factura_${numero}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Error al descargar el PDF');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.pedidoId || !formData.nit || !formData.razonSocial) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        setSubmitting(true);
        try {
            await solicitarFactura(formData);
            toast.success('Solicitud enviada con éxito. Recibirás tu factura por email.');
            setIsModalOpen(false);
            setFormData({ pedidoId: '', nit: '', razonSocial: '' });
            cargarFacturas();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al solicitar la factura');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingTop: '3rem', paddingBottom: '6rem' }}>
            <div className="container" style={{ maxWidth: 1100 }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>Facturación Electrónica</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Gestiona tus facturas de forma rápida y legal</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        style={{ background: 'var(--color-primary)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '14px', color: '#000', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)' }}
                    >
                        <Plus size={20} /> Solicitar Factura
                    </motion.button>
                </div>

                {loading ? (
                    <div className="spinner" style={{ margin: '5rem auto' }} />
                ) : facturas.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}
                    >
                        <FileText size={64} color="#333" style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>No tienes facturas aún</h3>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Tus facturas electrónicas aparecerán aquí después de solicitarlas.</p>
                        <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary" style={{ borderRadius: '12px' }}>Empieza ahora</button>
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {facturas.map((f, i) => (
                            <motion.div
                                key={f.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{ 
                                    background: 'rgba(20,20,25,0.6)', border: '1px solid rgba(255,255,255,0.05)', 
                                    borderRadius: '20px', padding: '1.5rem', display: 'flex', 
                                    justifyContent: 'space-between', alignItems: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={24} color="var(--color-primary)" />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <h4 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>{f.numeroFactura}</h4>
                                            <span style={{ 
                                                fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                background: f.estado === 'GENERADA' ? 'rgba(0, 200, 150, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: f.estado === 'GENERADA' ? '#00c896' : '#f59e0b'
                                            }}>
                                                {f.estado}
                                            </span>
                                        </div>
                                        <p style={{ color: '#666', margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>
                                            Pedido #{f.pedidoId} • {new Date(f.fechaEmision).toLocaleDateString('es-CO')}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>TOTAL</p>
                                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{formatCurrency(f.total)}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDownload(f.id, f.numeroFactura)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#fff' }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <div style={{ marginTop: '4rem', background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: '24px', padding: '1.5rem', display: 'flex', gap: '1.2rem' }}>
                    <div style={{ background: '#7c3aed15', padding: '0.8rem', borderRadius: '14px', alignSelf: 'flex-start' }}>
                        <Info size={24} color="#7c3aed" />
                    </div>
                    <div>
                        <h5 style={{ color: '#7c3aed', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Información importante</h5>
                        <p style={{ color: '#8b5cf6', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                            Las facturas se generan automáticamente en un plazo de 24 horas después de la solicitud. Recibirás una copia en tu correo electrónico registrado y también podrás descargarla desde esta sección. Si necesitas realizar algún cambio en los datos después de emitida, por favor contacta a soporte.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de Solicitud */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', width: '100%', maxWidth: '500px', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <FilePlus size={24} color="var(--color-primary)" />
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Solicitar Factura</h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '2.5rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.6rem', fontWeight: 600 }}>SELECCIONA EL PEDIDO</label>
                                    <select 
                                        value={formData.pedidoId}
                                        onChange={(e) => setFormData({...formData, pedidoId: e.target.value})}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                                    >
                                        <option value="">Selecciona un pedido...</option>
                                        {pedidos.map(p => (
                                            <option key={p.id} value={p.id}>Pedido #{p.id} - {formatCurrency(p.total)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.6rem', fontWeight: 600 }}>NIT O DOCUMENTO</label>
                                    <input 
                                        type="text"
                                        value={formData.nit}
                                        placeholder="Ej: 123456789-0"
                                        onChange={(e) => setFormData({...formData, nit: e.target.value})}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.6rem', fontWeight: 600 }}>RAZÓN SOCIAL / NOMBRE COMPLETO</label>
                                    <input 
                                        type="text"
                                        value={formData.razonSocial}
                                        placeholder="Ej: Inversiones Tribu S.A.S"
                                        onChange={(e) => setFormData({...formData, razonSocial: e.target.value})}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '1.2rem', borderRadius: '18px', background: 'var(--color-primary)', border: 'none', color: '#000', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                                >
                                    {submitting ? <div className="spinner" style={{ width: 22, height: 22, borderWidth: 3, borderTopColor: '#000' }} /> : 'Confirmar Solicitud'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
