import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { crearPedido } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { ShieldCheck, Zap, Wallet, Truck, Package, Check, Banknote, User, Phone, MessageSquare, CheckCircle2, Clock, Home, AlertCircle } from 'lucide-react';

const carriers = [
    { id: 'coordinadora', name: 'Coordinadora', eta: '2-4 días hábiles', color: '#E30613' },
    { id: 'interrapidisimo', name: 'Interrapidisimo', eta: '1-3 días hábiles', color: '#003D7A' },
    { id: 'servientrega', name: 'Servientrega', eta: '3-5 días hábiles', color: '#F47920' },
    { id: 'envia', name: 'Envia', eta: '2-4 días hábiles', color: '#00A3E0' },
];

function calcShipping(total, carrierId, region = 'nacional') {
    const baseRates = {
        coordinadora:    { local: 8500, regional: 10500, principal: 13500, nacional: 16500, especial: 24500 },
        interrapidisimo: { local: 8900, regional: 11000, principal: 13900, nacional: 17200, especial: 25900 },
        servientrega:    { local: 7900, regional: 9900,  principal: 12900, nacional: 15900, especial: 23500 },
        envia:           { local: 8200, regional: 10200, principal: 13200, nacional: 16200, especial: 23900 },
    };
    
    const carrierRates = baseRates[carrierId];
    if (!carrierRates) return 0;
    
    const base = carrierRates[region] || carrierRates['nacional'];
    const insurance = Math.round(total * 0.015);
    
    return base + insurance;
}

const MetodosDePago = ({ total, totalNumber, direccionEnvio, cuponCodigo, shippingRegion = 'nacional', isDireccionValida = true }) => {
    const { items, clearCart } = useCart();
    const { user } = useAuth();
    const { agregarNuevaNotificacion, saldoRealtime } = useNotification();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saldoBackend, setSaldoBackend] = useState(null);
    const [selectedCarrier, setSelectedCarrier] = useState(null);
    const [showContraentregaForm, setShowContraentregaForm] = useState(false);
    const [instruccionesEntrega, setInstruccionesEntrega] = useState('');
    const [nombreReceptor, setNombreReceptor] = useState('');
    const [telefonoContacto, setTelefonoContacto] = useState('');
    const [contraentregaStep, setContraentregaStep] = useState(1);

    useEffect(() => {
        api.get('/usuarios/perfil')
            .then(res => setSaldoBackend(res.data.saldoFavor || 0))
            .catch(() => {})
    }, []);

    const saldoDisponible = saldoRealtime !== null ? saldoRealtime : (saldoBackend !== null ? saldoBackend : (user?.saldoFavor || 0));
    const puedePagarConTribu = saldoDisponible >= totalNumber;

    const hasTribuPass = user?.tribuPassActiva === true;

    const costoEnvio = useMemo(() => {
        if (hasTribuPass) return 0;
        return selectedCarrier ? calcShipping(totalNumber, selectedCarrier, shippingRegion) : 0;
    }, [hasTribuPass, totalNumber, selectedCarrier, shippingRegion]);

    const carrierName = selectedCarrier ? carriers.find(c => c.id === selectedCarrier)?.name : '';

    const handlePayment = async (method) => {
        if (!direccionEnvio || !isDireccionValida) {
            toast.error('Por favor, completa todos los campos requeridos de la dirección de envío');
            return;
        }
        if (!selectedCarrier) {
            toast.error('Selecciona una transportadora para el envío');
            return;
        }
        if (method === 'TRIBU_CARD' && !puedePagarConTribu) {
            toast.error('Puntos insuficientes en tu Billetera Tribu');
            return;
        }

        if (method === 'CONTRAENTREGA' && !showContraentregaForm) {
            setShowContraentregaForm(true);
            setContraentregaStep(1);
            return;
        }
        if (method === 'CONTRAENTREGA' && (!nombreReceptor.trim() || !telefonoContacto.trim())) {
            toast.error('Por favor completa el nombre y teléfono del receptor');
            return;
        }

        setLoading(true);
        try {
            const pedidoPayload = {
                direccionEnvio,
                metodoPago: method,
                transportadora: selectedCarrier,
                costoEnvio,
                items: items.map(i => ({ productoId: i.id, cantidad: i.cantidad })),
                cuponCodigo
            };

            if (method === 'CONTRAENTREGA') {
                pedidoPayload.instruccionesEntrega = `Receptor: ${nombreReceptor} | Tel: ${telefonoContacto}${instruccionesEntrega ? ' | ' + instruccionesEntrega : ''}`;
            }

            const { data: pedido } = await crearPedido(pedidoPayload);

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

            clearCart();
            toast.loading('Procesando pedido...', { duration: 1200 });

            setTimeout(() => {
                const msg = method === 'CONTRAENTREGA'
                    ? '¡Pedido creado! Pagas contraentrega al recibir'
                    : '¡Pago exitoso!';
                agregarNuevaNotificacion({
                    id: Date.now(), tipo: 'COMPRA',
                    mensaje: msg, leida: false
                });
                toast.success('¡Compra confirmada!');
                navigate('/mis-pedidos');
                setLoading(false);
            }, 1400);

        } catch (error) {
            console.error('Error al procesar pedido/pago:', error);
            const msg = error.response?.data?.message || error.response?.data?.mensaje || 'Error al procesar la transacción';
            toast.error(msg);
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginTop: '2.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Truck size={16} style={{ color: '#6243FF' }} />
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)', margin: 0 }}>
                    Envío y pago
                </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem 0' }}>
                Selecciona tu transportadora y cómo quieres pagar.
            </p>

            {/* Carrier Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Package size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        Transportadora
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                    {carriers.map(c => {
                        const isSelected = selectedCarrier === c.id;
                        return (
                            <motion.button
                                key={c.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedCarrier(c.id)}
                                disabled={loading}
                                style={{
                                    padding: '0.85rem',
                                    borderRadius: '14px',
                                    border: isSelected ? `2px solid ${c.color}` : '1px solid rgba(255,255,255,0.06)',
                                    background: isSelected ? `${c.color}15` : 'var(--color-surface-2)',
                                    color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    gap: '0.4rem', transition: 'all 0.25s ease',
                                    position: 'relative', opacity: loading ? 0.5 : 1
                                }}
                            >
                                {isSelected && (
                                    <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                )}
                                <div style={{
                                    width: 40, height: 40, borderRadius: '10px',
                                    background: isSelected ? c.color : 'rgba(255,255,255,0.06)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 900,
                                    color: isSelected ? '#fff' : 'var(--color-text-muted)'
                                }}>
                                    {c.name.charAt(0)}
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{c.name}</span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{c.eta}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Shipping cost result */}
            {selectedCarrier && (
                <div style={{
                    background: 'rgba(98, 67, 255, 0.06)',
                    border: '1px solid rgba(98, 67, 255, 0.15)',
                    borderRadius: '12px', padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        Envío por <strong style={{ color: 'var(--color-text)' }}>{carrierName}</strong>
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#00C896', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {hasTribuPass ? (
                            <>
                                GRATIS <span style={{ fontSize: '0.85rem' }}>💎</span>
                            </>
                        ) : (
                            `$${costoEnvio.toLocaleString('es-CO')}`
                        )}
                    </span>
                </div>
            )}

            {/* Pay in full with Efipay */}
            <div style={{ marginBottom: '0.75rem' }}>
                <motion.button
                    whileHover={selectedCarrier ? { scale: 1.02, boxShadow: '0 6px 28px rgba(98, 67, 255, 0.35)' } : {}}
                    whileTap={selectedCarrier ? { scale: 0.97 } : {}}
                    onClick={() => handlePayment('EFIPAY')}
                    disabled={loading || !selectedCarrier}
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #6243FF, #7B5FFF)',
                        border: '1px solid rgba(98, 67, 255, 0.3)',
                        boxShadow: selectedCarrier ? '0 4px 20px rgba(98, 67, 255, 0.3)' : 'none',
                        borderRadius: '16px', padding: '1rem 1.5rem',
                        color: '#fff', cursor: !selectedCarrier || loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        opacity: !selectedCarrier || loading ? 0.4 : 1,
                        position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease'
                    }}
                >
                    <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={18} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Pagar todo ahora</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '1px' }}>Efipay — Tarjetas · PSE · Nequi · Bancos</div>
                        </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        ${(totalNumber + costoEnvio).toLocaleString('es-CO')}
                    </div>
                </motion.button>
            </div>

            {/* CONTRAENTREGA — $0 hoy */}
            <div style={{ marginBottom: showContraentregaForm ? '0.75rem' : '1.5rem' }}>
                <motion.button
                    whileHover={selectedCarrier && !showContraentregaForm ? { scale: 1.02, boxShadow: '0 8px 32px rgba(0, 200, 150, 0.4)' } : {}}
                    whileTap={selectedCarrier && !showContraentregaForm ? { scale: 0.97 } : {}}
                    onClick={() => !showContraentregaForm && handlePayment('CONTRAENTREGA')}
                    disabled={loading || !selectedCarrier || showContraentregaForm}
                    style={{
                        width: '100%',
                        background: showContraentregaForm
                            ? 'rgba(0,168,107,0.08)'
                            : 'linear-gradient(135deg, #00C896, #00A86B)',
                        border: showContraentregaForm
                            ? '2px solid rgba(0,168,107,0.4)'
                            : '1px solid rgba(0, 200, 150, 0.3)',
                        boxShadow: selectedCarrier && !showContraentregaForm ? '0 4px 24px rgba(0, 200, 150, 0.3)' : 'none',
                        borderRadius: '16px', padding: '1rem 1.5rem',
                        color: '#fff', cursor: !selectedCarrier || loading || showContraentregaForm ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        opacity: !selectedCarrier || loading ? 0.4 : 1,
                        position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease'
                    }}
                >
                    <div style={{ position: 'absolute', top: '-40%', right: '-15%', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '12px',
                            background: showContraentregaForm ? 'rgba(0,200,150,0.2)' : 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Home size={20} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Contraentrega</span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.25)', borderRadius: '6px',
                                    padding: '1px 7px', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.04em'
                                }}>RECOMENDADO</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '2px' }}>
                                Pagas al recibir en tu casa · Envío incluido en el precio
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: showContraentregaForm ? '#00C896' : '#fff' }}>$0</div>
                        <div style={{ fontSize: '0.62rem', opacity: 0.75 }}>hoy</div>
                    </div>
                </motion.button>
            </div>

            {/* CONTRAENTREGA — Formulario expandido */}
            <AnimatePresence>
            {showContraentregaForm && (
                <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{ overflow: 'hidden', marginBottom: '1.25rem' }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0,200,150,0.07), rgba(0,168,107,0.04))',
                        border: '1.5px solid rgba(0,200,150,0.2)',
                        borderRadius: '18px',
                        padding: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decoración fondo */}
                        <div style={{
                            position: 'absolute', top: -30, right: -30,
                            width: 120, height: 120,
                            background: 'radial-gradient(circle, rgba(0,200,150,0.08) 0%, transparent 70%)',
                            borderRadius: '50%', pointerEvents: 'none'
                        }} />

                        {/* Header informativo */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                                background: 'linear-gradient(135deg, #00C896, #00A86B)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 16px rgba(0,200,150,0.3)'
                            }}>
                                <Home size={22} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#00C896', marginBottom: '0.2rem' }}>
                                    Paga cuando llegue a tu puerta
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
                                    No te cobraremos nada ahora. Pagas el total al recibir tu pedido.
                                </div>
                            </div>
                        </div>

                        {/* Cómo funciona — steps timeline */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative'
                        }}>
                            {/* Línea conectora de la línea de tiempo */}
                            <div style={{
                                position: 'absolute',
                                left: '23px',
                                top: '2.25rem',
                                bottom: '2.25rem',
                                width: '2px',
                                background: 'linear-gradient(to bottom, #00C896, #6243FF, #FF8A50, #00C896)',
                                opacity: 0.3,
                                zIndex: 1
                            }} />

                            {[
                                { 
                                    icon: <CheckCircle2 size={14} color="#00C896" />, 
                                    title: '1. Creación', 
                                    desc: 'Confirmas tu pedido hoy sin pagar un solo peso' 
                                },
                                { 
                                    icon: <Clock size={14} color="#6243FF" />, 
                                    title: '2. Preparación', 
                                    desc: 'Despachamos tu pedido desde bodega en 24-48 horas' 
                                },
                                { 
                                    icon: <Truck size={14} color="#FF8A50" />, 
                                    title: '3. Envío', 
                                    desc: 'La transportadora aliada viaja hasta tu dirección' 
                                },
                                { 
                                    icon: <Banknote size={14} color="#00C896" />, 
                                    title: '4. Entrega y Pago', 
                                    desc: 'Pagas al recibir (Efectivo, Nequi o Daviplata)' 
                                },
                            ].map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.85rem', zIndex: 2, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%', 
                                        background: 'var(--color-surface-2)',
                                        border: '2px solid rgba(255,255,255,0.08)',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {step.icon}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text)' }}>
                                            {step.title}
                                        </span>
                                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                                            {step.desc}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Alerta suave — sin pagar el pedido no llega */}
                        <div style={{
                            background: 'rgba(255, 138, 80, 0.06)',
                            border: '1px solid rgba(255, 138, 80, 0.2)',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'rgba(255, 138, 80, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <AlertCircle size={15} color="#FF8A50" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FF8A50' }}>
                                    Compromiso de recepción
                                </span>
                                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                                    Al ordenar bajo la modalidad de Contraentrega, asumimos los costos de empaque y envío. 
                                    Te pedimos tener el dinero listo al momento de la entrega para evitar la cancelación definitiva del pedido.
                                </p>
                            </div>
                        </div>

                        {/* Formulario receptor */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                    <User size={13} /> Nombre de quien recibe <span style={{ color: '#ff4444' }}>*</span>
                                </label>
                                <input
                                    value={nombreReceptor}
                                    onChange={(e) => setNombreReceptor(e.target.value)}
                                    placeholder="Ej: María González"
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem 0.9rem',
                                        borderRadius: '10px',
                                        border: nombreReceptor ? '1.5px solid rgba(0,200,150,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                        background: 'var(--color-surface-2)',
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border 0.2s'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                    <Phone size={13} /> Teléfono de contacto <span style={{ color: '#ff4444' }}>*</span>
                                </label>
                                <input
                                    value={telefonoContacto}
                                    onChange={(e) => setTelefonoContacto(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Ej: 3001234567"
                                    type="tel"
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem 0.9rem',
                                        borderRadius: '10px',
                                        border: telefonoContacto.length === 10 ? '1.5px solid rgba(0,200,150,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                        background: 'var(--color-surface-2)',
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border 0.2s'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                    <MessageSquare size={13} /> Instrucciones de entrega <span style={{ fontSize: '0.68rem', fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <textarea
                                    value={instruccionesEntrega}
                                    onChange={(e) => setInstruccionesEntrega(e.target.value)}
                                    placeholder="Ej: Llamar antes de llegar, dejar en portería, horario disponible..."
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem 0.9rem',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'var(--color-surface-2)',
                                        color: '#fff',
                                        fontSize: '0.82rem',
                                        resize: 'none',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Total a pagar al recibir */}
                        <div style={{
                            background: 'rgba(0,200,150,0.06)',
                            border: '1px solid rgba(0,200,150,0.15)',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pagas al recibir</div>
                                <div style={{ fontSize: '0.68rem', color: '#777', marginTop: '1px' }}>Productos + envío incluido</div>
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#00C896' }}>
                                ${(totalNumber + costoEnvio).toLocaleString('es-CO')}
                            </div>
                        </div>

                        {/* Botones */}
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button
                                onClick={() => { setShowContraentregaForm(false); setContraentregaStep(1); }}
                                style={{
                                    flex: '0 0 auto',
                                    padding: '0.75rem 1.1rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.82rem'
                                }}
                            >
                                Cancelar
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handlePayment('CONTRAENTREGA')}
                                disabled={loading || !nombreReceptor.trim() || telefonoContacto.length < 7}
                                style={{
                                    flex: 1,
                                    padding: '0.85rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: (!nombreReceptor.trim() || telefonoContacto.length < 7)
                                        ? 'rgba(0,168,107,0.3)'
                                        : 'linear-gradient(135deg, #00C896, #00A86B)',
                                    color: '#fff',
                                    cursor: loading || !nombreReceptor.trim() || telefonoContacto.length < 7 ? 'not-allowed' : 'pointer',
                                    fontWeight: 800,
                                    fontSize: '0.88rem',
                                    opacity: loading ? 0.6 : 1,
                                    boxShadow: (!nombreReceptor.trim() || telefonoContacto.length < 7) ? 'none' : '0 4px 16px rgba(0,200,150,0.3)',
                                    transition: 'all 0.25s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span style={{
                                            width: '14px',
                                            height: '14px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%',
                                            display: 'inline-block',
                                            animation: 'spin 0.8s linear infinite'
                                        }} />
                                        Creando pedido...
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Confirmar pedido — $0 hoy
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Tribu Card */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.03em' }}>O USA TUS PUNTOS TRIBU</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                </div>

                <motion.button
                    whileHover={puedePagarConTribu && selectedCarrier ? { scale: 1.01, y: -2 } : {}}
                    whileTap={puedePagarConTribu && selectedCarrier ? { scale: 0.99 } : {}}
                    onClick={() => handlePayment('TRIBU_CARD')}
                    disabled={loading || !puedePagarConTribu || !selectedCarrier}
                    style={{
                        width: '100%', padding: '1.1rem 1.5rem', borderRadius: '16px',
                        background: puedePagarConTribu && selectedCarrier ? 'linear-gradient(135deg, #FF5722, #FF8A50)' : 'rgba(255,255,255,0.03)',
                        border: puedePagarConTribu && selectedCarrier ? '1px solid rgba(255, 87, 34, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: puedePagarConTribu && selectedCarrier ? '#fff' : '#555',
                        cursor: puedePagarConTribu && selectedCarrier && !loading ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        boxShadow: puedePagarConTribu && selectedCarrier ? '0 8px 32px rgba(255,87,34,0.25)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative', overflow: 'hidden',
                        opacity: loading ? 0.5 : 1
                    }}
                >
                    {puedePagarConTribu && selectedCarrier && (
                        <div style={{ position: 'absolute', top: '-60%', right: '-10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 36, height: 24,
                            background: puedePagarConTribu && selectedCarrier ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Wallet size={14} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                {puedePagarConTribu ? 'Pagar con Puntos Tribu' : 'Puntos insuficientes'}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '1px' }}>
                                {puedePagarConTribu
                                    ? `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(saldoDisponible)} pts disponibles`
                                    : `Necesitas $${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(totalNumber)} pts — tienes ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(saldoDisponible)} pts`
                                }
                            </div>
                        </div>
                    </div>
                    {puedePagarConTribu && selectedCarrier && (
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            ${(totalNumber + costoEnvio).toLocaleString('es-CO')}
                        </div>
                    )}
                </motion.button>
            </div>

            {/* Secure badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
                <ShieldCheck size={14} style={{ color: '#00C896' }} />
                Pago 100% seguro · Datos encriptados
            </div>
        </motion.div>
    );
};

export default MetodosDePago;
