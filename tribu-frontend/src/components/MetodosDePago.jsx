// src/components/MetodosDePago.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { crearPedido } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MetodosDePago = ({ total, direccionEnvio, disabled }) => {
    const { items, clearCart } = useCart();
    const { agregarNuevaNotificacion } = useNotification();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handlePayment = async (method) => {
        if (!direccionEnvio) {
            toast.error('Por favor, ingresa una dirección de envío');
            return;
        }

        setLoading(true);
        try {
            // 1. Primero creamos el pedido en el backend para tener un ID
            const pedidoPayload = {
                direccionEnvio: direccionEnvio,
                items: items.map(i => ({ productoId: i.id, cantidad: i.cantidad }))
            };

            const { data: pedido } = await crearPedido(pedidoPayload);

            // 2. Simulamos la redirección o proceso de pago basado en el método
            toast.loading(`Conectando con ${method}...`, { duration: 2000 });

            setTimeout(() => {
                // Notificación interna
                agregarNuevaNotificacion({
                    id: Date.now(),
                    tipo: 'COMPRA',
                    mensaje: `¡Tu pago con ${method} por ${total} se procesó con éxito!`,
                    leida: false
                });

                clearCart();
                toast.success('¡Compra exitosa! 🎉');
                navigate('/mis-pedidos');
            }, 2000);

        } catch (error) {
            console.error('Error al procesar pedido/pago:', error);
            toast.error(error.response?.data?.mensaje || 'Error al procesar la transacción');
        } finally {
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
            </div>
        </div>
    );
};

export default MetodosDePago;
