import { useState } from 'react'
import { RotateCcw, Truck, Clock, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { crearDevolucion } from '../api'

export default function DevolucionesPage() {
    const [formData, setFormData] = useState({
        orderNumber: '',
        email: '',
        reason: '',
        evidencia: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToSubmit = new FormData();
            const jsonPart = new Blob([JSON.stringify({
                orderNumber: formData.orderNumber,
                email: formData.email,
                reason: formData.reason
            })], { type: 'application/json' });

            dataToSubmit.append('data', jsonPart);
            if (formData.evidencia) {
                dataToSubmit.append('evidencia', formData.evidencia);
            }

            await crearDevolucion(dataToSubmit);
            setIsSuccess(true);
            toast.success('¡Solicitud de devolución recibida con éxito!');
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'Hubo un error al procesar tu solicitud. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div style={{ paddingTop: '6rem', paddingBottom: '4rem', minHeight: '100vh', color: 'var(--color-text)' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
                        Políticas de <span style={{ color: 'var(--color-primary)' }}>Devolución</span>
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>
                        Tu tranquilidad es nuestra prioridad. Conoce cómo funcionan nuestras garantías.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <Clock size={32} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                        <div>
                            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>30 Días de Garantía</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>Tienes 30 días calendario desde que recibes el producto para solicitar un cambio o devolución por defectos de fábrica.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <RotateCcw size={32} color="#00C896" style={{ flexShrink: 0 }} />
                        <div>
                            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Devolución Simplificada</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>Nosotros nos encargamos de guiarte paso a paso. Solo contáctanos por WhatsApp con tu número de pedido.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <Truck size={32} color="#4facfe" style={{ flexShrink: 0 }} />
                        <div>
                            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Cobertura de Envíos</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>Si el error fue nuestro o el producto llegó dañado, asumimos el 100% de los costos de envío para el cambio.</p>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>Condiciones para devoluciones</h2>

                    <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, paddingLeft: '1.5rem', marginBottom: '2rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>El producto debe estar en sus condiciones originales, sin signos de uso extremo o maltrato.</li>
                        <li style={{ marginBottom: '0.5rem' }}>Debe conservar sus empaques originales, manuales y accesorios completos.</li>
                        <li style={{ marginBottom: '0.5rem' }}>Productos de uso personal Íntimo (ej. ropa interior, audífonos intrauditivos destapados) no tienen cambio por razones de higiene, salvo defecto de fábrica comprobado.</li>
                        <li style={{ marginBottom: '0.5rem' }}>Es obligatorio presentar el comprobante de compra o número de pedido.</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={24} color="var(--color-primary)" />
                        Solicitar Devolución Rápida
                    </h2>

                    {isSuccess ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 200, 150, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                <RotateCcw size={48} color="#00C896" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00C896', marginBottom: '1rem' }}>¡Solicitud en Proceso!</h3>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Hemos recibido tu solicitud para el pedido #{formData.orderNumber}.
                                Nuestro equipo la revisará y te enviaremos las instrucciones de envío a {formData.email} en menos de 24 horas.
                            </p>
                            <button
                                onClick={() => { setIsSuccess(false); setFormData({ orderNumber: '', email: '', reason: '' }) }}
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 2rem', fontWeight: 'bold', borderRadius: 'var(--radius-md)' }}
                            >
                                Enviar otra solicitud
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                                Olvídate de procesos largos o correos interminables. Solo dinos qué pasó y nosotros nos encargamos del resto.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Número de Pedido</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: PED-10294"
                                        value={formData.orderNumber}
                                        onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="tu@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>¿Por qué deseas devolver el producto?</label>
                                <select
                                    required
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                >
                                    <option value="" disabled>Selecciona un motivo...</option>
                                    <option value="defecto">El producto llegó defectuoso o roto</option>
                                    <option value="equivocado">Recibí un producto diferente al que pedí</option>
                                    <option value="no_gusta">El producto no cumplió mis expectativas</option>
                                    <option value="otro">Otro motivo</option>
                                </select>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Evidencia Fotográfica (Opcional)</label>
                                <div style={{
                                    padding: '1rem',
                                    border: '1px dashed var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-surface)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={(e) => setFormData({ ...formData, evidencia: e.target.files[0] })}
                                        style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', width: '100%' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                                    Adjunta una foto si el producto llegó roto o defectuoso. Máx 5MB.
                                </p>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? (
                                        <div style={{ width: '20px', height: '20px', border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    ) : (
                                        'Iniciar Proceso de Devolución'
                                    )}
                                </button>
                                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        </form>
                    )}
                </div>

            </div>
        </div>
    )
}
