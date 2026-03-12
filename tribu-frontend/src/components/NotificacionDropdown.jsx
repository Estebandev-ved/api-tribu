import { useState, useRef, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
// Usamos Bell de lucide-react que ya está instalado en el proyecto
import { Bell } from 'lucide-react';

const NotificacionDropdown = () => {
    const { notificaciones, noLeidas, marcarComoLeida } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Color naranja de tu marca (aproximado basado en tu imagen)
    const brandOrange = "#ff5a1f";

    // Cerrar el menú si se hace clic afuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

            {/* BOTÓN DE LA CAMPANA */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    position: 'relative'
                }}
            >
                <Bell size={22} color={isOpen ? brandOrange : "#d1d5db"} style={{ transition: 'color 0.2s' }} />

                {/* GLOBITO NARANJA DE NO LEÍDAS */}
                {noLeidas > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 2,
                        right: 4,
                        background: brandOrange,
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        {noLeidas}
                    </span>
                )}
            </button>

            {/* MENÚ DESPLEGABLE (Estilo Dark Mode) */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    right: '-10px',
                    width: 'calc(100vw - 32px)',
                    maxWidth: '320px',
                    background: '#18181b', // Color oscuro de tu fondo
                    border: '1px solid #27272a', // Borde sutil
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    color: '#fff'
                }}>
                    {/* Header del Dropdown */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #27272a',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notificaciones</h4>
                        <span style={{ fontSize: '12px', color: brandOrange, cursor: 'pointer' }}>
                            Marcar todas leídas
                        </span>
                    </div>

                    {/* Lista de Notificaciones */}
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {notificaciones.length === 0 ? (
                            <div style={{ padding: '30px 16px', textAlign: 'center', color: '#a1a1aa' }}>
                                <Bell size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>No tienes notificaciones nuevas</p>
                            </div>
                        ) : (
                            notificaciones.map(noti => (
                                <div
                                    key={noti.id}
                                    onClick={() => marcarComoLeida(noti.id)}
                                    style={{
                                        padding: '14px 16px',
                                        borderBottom: '1px solid #27272a',
                                        background: noti.leida ? 'transparent' : '#27272a', // Resalta si no está leída
                                        cursor: 'pointer',
                                        display: 'flex',
                                        gap: '12px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = noti.leida ? 'transparent' : '#27272a'}
                                >
                                    {/* Puntito indicador si no está leída */}
                                    <div style={{ paddingTop: '6px' }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: noti.leida ? 'transparent' : brandOrange
                                        }}></div>
                                    </div>

                                    <div>
                                        <p style={{ margin: 0, fontSize: '14px', color: noti.leida ? '#d1d5db' : '#fff', lineHeight: '1.4' }}>
                                            {noti.mensaje}
                                        </p>
                                        <span style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', display: 'block' }}>
                                            Hace un momento {/* Aquí luego pones la fecha real */}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificacionDropdown;