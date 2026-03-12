// src/components/NotificacionBell.jsx
import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell } from 'lucide-react'; // Cambiamos FaBell por Bell de lucide-react

const NotificacionBell = () => {
    const { notificaciones, noLeidas, marcarComoLeida } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Ícono de la campana */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}
            >
                <Bell color="#333" />
                {noLeidas > 0 && (
                    <span style={{
                        position: 'absolute', top: -5, right: -5, background: 'red',
                        color: 'white', borderRadius: '50%', padding: '2px 6px',
                        fontSize: '12px', fontWeight: 'bold'
                    }}>
                        {noLeidas}
                    </span>
                )}
            </button>

            {/* Dropdown flotante con la lista */}
            {isOpen && (
                <div style={{
                    position: 'absolute', right: 0, top: '40px', width: '300px',
                    background: 'white', border: '1px solid #ccc', borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)', zIndex: 1000,
                    maxHeight: '400px', overflowY: 'auto'
                }}>
                    <h4 style={{ padding: '10px', margin: 0, borderBottom: '1px solid #eee' }}>Notificaciones</h4>
                    {notificaciones.length === 0 ? (
                        <p style={{ padding: '10px', textAlign: 'center', color: '#888' }}>No tienes notificaciones</p>
                    ) : (
                        notificaciones.map(noti => (
                            <div
                                key={noti.id}
                                onClick={() => marcarComoLeida(noti.id)}
                                style={{
                                    padding: '10px', borderBottom: '1px solid #eee',
                                    background: noti.leida ? 'white' : '#f0f8ff',
                                    cursor: 'pointer'
                                }}
                            >
                                <p style={{ margin: 0, fontSize: '14px' }}>{noti.mensaje}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificacionBell;