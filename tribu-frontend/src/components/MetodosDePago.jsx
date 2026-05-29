// src/components/MetodosDePago.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { crearPedido } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

const MetodosDePago = ({ total, totalNumber, direccionEnvio, cuponCodigo, disabled }) => {
    const { items, clearCart } = useCart();
    const { user } = useAuth();
    const { agregarNuevaNotificacion, saldoRealtime } = useNotification();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saldoBackend, setSaldoBackend] = useState(null);

    // Cargar saldo real desde el backend al montar
    useEffect(() => {
        api.get('/usuarios/perfil')
            .then(res => setSaldoBackend(res.data.saldoFavor || 0))
            .catch(() => {})
    }, []);

    // Priorizar: WS realtime > backend fetch > user context
    const saldoDisponible = saldoRealtime !== null ? saldoRealtime : (saldoBackend !== null ? saldoBackend : (user?.saldoFavor || 0));
    const puedePagarConTribu = saldoDisponible >= totalNumber;

    const handlePayment = async (method) => {
        if (!direccionEnvio) {
            toast.error('Por favor, ingresa una dirección de envío');
            return;
        }

        if (method === 'TRIBU_CARD' && !puedePagarConTribu) {
            toast.error('Puntos insuficientes en tu Billetera Tribu');
            return;
        }

        setLoading(true);
        try {
            // 1. Enviamos el pedido al backend con el método de pago
            const pedidoPayload = {
                direccionEnvio: direccionEnvio,
                metodoPago: method,
                items: items.map(i => ({ productoId: i.id, cantidad: i.cantidad })),
                cuponCodigo: cuponCodigo
            };

            const { data: pedido } = await crearPedido(pedidoPayload);

            // 2. EFIPAY: Redirigir al checkout de la pasarela
            if (method === 'EFIPAY') {
                if (pedido.efipayCheckoutUrl) {
                    clearCart();
                    window.location.href = pedido.efipayCheckoutUrl;
                    return;
                }
                toast.error('Error al generar el pago con Efipay. Intenta de nuevo.');
                setLoading(false);
                return;
            }

            // 3. Clear cart for non-EFIPAY methods
            clearCart();

            // 4. Simulated payment process for other methods
            toast.loading(`Procesando pago con ${method}...`, { duration: 1500 });

            setTimeout(() => {
                const mensajeExtra = method === 'TRIBU_CARD' 
                    ? 'Saldo descontado de tu tarjeta.' 
                    : `Espera confirmación de ${method}.`;

                agregarNuevaNotificacion({
                    id: Date.now(),
                    tipo: 'COMPRA',
                    mensaje: `¡Pago con ${method} exitoso! ${mensajeExtra}`,
                    leida: false
                });

                toast.success('¡Compra confirmada! 🎉');
                navigate('/mis-pedidos');
                setLoading(false);
            }, 1600);

        } catch (error) {
            console.error('Error al procesar pedido/pago:', error);
            const msg = error.response?.data?.message || error.response?.data?.mensaje || 'Error al procesar la transacción';
            toast.error(msg);
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>Métodos de pago</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePayment('YAPE')}
                    disabled={loading}
                    style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #27272a',
                        background: '#18181b',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    <img src="/yape.png" alt="Yape" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                    <span>Yape</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePayment('PLIN')}
                    disabled={loading}
                    style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #27272a',
                        background: '#18181b',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    <img src="/plin.png" alt="Plin" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                    <span>Plin</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePayment('MERCADO_PAGO')}
                    disabled={loading}
                    style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #27272a',
                        background: '#18181b',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mercado_Pago.svg/1280px-Mercado_Pago.svg.png" alt="Mercado Pago" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                    <span>Mercado Pago</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePayment('EFIPAY')}
                    disabled={loading}
                    style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #27272a',
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Efipay</span>
                </motion.button>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>O usa tu saldo acumulado:</p>
                <motion.button
                    whileHover={puedePagarConTribu ? { scale: 1.02 } : {}}
                    whileTap={puedePagarConTribu ? { scale: 0.98 } : {}}
                    onClick={() => handlePayment('TRIBU_CARD')}
                    disabled={loading || !puedePagarConTribu}
                    style={{
                        width: '100%',
                        padding: '1.2rem',
                        borderRadius: '16px',
                        background: puedePagarConTribu 
                            ? 'linear-gradient(45deg, #FF5722, #FF9800)' 
                            : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: puedePagarConTribu ? '#fff' : '#666',
                        cursor: puedePagarConTribu ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: puedePagarConTribu ? '0 10px 20px rgba(255,87,34,0.3)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ 
                            width: '32px', 
                            height: '20px', 
                            background: 'rgba(255,255,255,0.2)', 
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            fontWeight: 900
                        }}>TRIBU</div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 800 }}>Pagar con Puntos Tribu</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                Puntos disponibles: {new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(saldoDisponible)} pts
                            </div>
                        </div>
                    </div>
                    {!puedePagarConTribu && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            PUNTOS INSUFICIENTES
                        </span>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

export default MetodosDePago;
