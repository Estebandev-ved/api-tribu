import { useState, useRef, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell, CheckCheck, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';

const NotificacionDropdown = () => {
    const { notificaciones, noLeidas, conectado, marcarComoLeida, marcarTodasComoLeidas } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const brandOrange = "#ff5a1f";

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
                
                {/* Indicador de conexión (puntero verde/rojo) */}
                <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '6px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: conectado ? '#10b981' : '#ef4444',
                    border: '1px solid #000'
                }} title={conectado ? 'Conectado' : 'Desconectado'}></div>

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
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(255,90,31,0.5)'
                    }}>
                        {noLeidas}
                    </span>
                )}
            </button>

            {/* MENÚ DESPLEGABLE */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '-10px',
                    width: 'calc(100vw - 32px)',
                    maxWidth: '350px',
                    background: '#121214',
                    border: '1px solid #27272a',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    color: '#fff',
                    marginTop: '10px'
                }}>
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #27272a',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Notificaciones</h4>
                            {conectado ? <Wifi size={14} color="#10b981" /> : <WifiOff size={14} color="#ef4444" />}
                        </div>
                        {noLeidas > 0 && (
                            <button 
                                onClick={marcarTodasComoLeidas}
                                style={{ 
                                    background: 'none', border: 'none', color: brandOrange, 
                                    fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                <CheckCheck size={14} /> Marcar todas leídas
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#121214' }}>
                        {notificaciones.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#52525b' }}>
                                <Bell size={40} style={{ marginBottom: '12px', opacity: 0.2 }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>No hay nada nuevo por aquí</p>
                            </div>
                        ) : (
                            notificaciones.map(noti => (
                                <div
                                    key={noti.id}
                                    onClick={() => marcarComoLeida(noti.id)}
                                    style={{
                                        padding: '16px',
                                        borderBottom: '1px solid #1f1f23',
                                        background: noti.leida ? 'transparent' : 'rgba(255, 90, 31, 0.03)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        gap: '14px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1e'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = noti.leida ? 'transparent' : 'rgba(255, 90, 31, 0.03)'}
                                >
                                    <div style={{
                                        minWidth: '10px', height: '10px', borderRadius: '50%',
                                        background: noti.leida ? 'transparent' : brandOrange,
                                        marginTop: '6px'
                                    }}></div>

                                    <div style={{ flex: 1 }}>
                                        <p style={{ 
                                            margin: 0, fontSize: '14px', 
                                            color: noti.leida ? '#9ca3af' : '#f3f4f6', 
                                            lineHeight: '1.5',
                                            fontWeight: noti.leida ? '400' : '500'
                                        }}>
                                            {noti.mensaje}
                                        </p>
                                        <span style={{ fontSize: '11px', color: '#52525b', marginTop: '6px', display: 'block' }}>
                                            {formatDistanceToNow(new Date(noti.fecha), { addSuffix: true, locale: es })}
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