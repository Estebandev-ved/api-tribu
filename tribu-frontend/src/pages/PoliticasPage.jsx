import { FileText, ShieldAlert, BookOpen } from 'lucide-react'

export default function PoliticasPage() {
    return (
        <div style={{ paddingTop: '6rem', paddingBottom: '4rem', minHeight: '100vh', color: 'var(--color-text)' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(79, 172, 254, 0.2)' }}>
                        <FileText size={48} color="#4facfe" />
                    </div>
                    <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
                        Políticas de <span style={{ color: '#4facfe' }}>Privacidad y Términos</span>
                    </h1>
                </div>

                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                        <ShieldAlert size={28} color="var(--color-primary)" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Protección de Datos Personales</h2>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                        En cumplimiento de la Ley 1581 de 2012 (Ley de Protección de Datos Personales en Colombia), <strong>Tribu E-commerce</strong> se compromete a proteger la privacidad de la información personal de nuestros clientes.
                    </p>
                    <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>Los datos recopilados (nombre, dirección, teléfono, correo) se utilizan exclusivamente para propósitos de envío de pedidos, facturación y soporte.</li>
                        <li style={{ marginBottom: '0.5rem' }}>No compartimos, vendemos, ni alquilamos tu información a terceros bajo ninguna circunstancia sin tu consentimiento expreso y por escrito.</li>
                        <li style={{ marginBottom: '0.5rem' }}>Puedes solicitar la actualización, corrección o eliminación total de tus datos de nuestra base contactándonos a través de nuestros canales oficiales.</li>
                    </ul>
                </div>

                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                        <BookOpen size={28} color="#00C896" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Términos del Servicio</h2>
                    </div>

                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>1. Aceptación de los Términos</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>Al visitar, navegar o comprar en nuestro sitio web, aceptas estar sujeto a estos términos y condiciones.</p>

                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>2. Precios e Inventario</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>Los precios están sujetos a cambios sin previo aviso. Nos reservamos el derecho de limitar las cantidades de cualquier producto o cancelar órdenes debido a errores de inventario, informando oportunamente al cliente y procesando la devolución de su dinero si corresponde.</p>

                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>3. Responsabilidad de Tiempos de Entrega</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>Los tiempos de entrega proporcionados (generalmente de 2 a 5 días hábiles dependiendo de la zona) son estimados. No nos hacemos legalmente responsables por retrasos logísticos imputables exclusivamente a las transportadoras nacionales, pero brindaremos todo el acompañamiento necesario para rastrear y resolver el caso.</p>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--color-text-faint)', fontSize: '0.85rem', marginTop: '3rem' }}>
                    Última actualización: Marzo 2026
                </p>

            </div>
        </div>
    )
}
