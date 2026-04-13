// src/context/NotificationContext.jsx
import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useSaldoWebSocket } from '../hooks/useSaldoWebSocket';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const token = localStorage.getItem('tribu_token');
    
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [saldoRealtime, setSaldoRealtime] = useState(null);

    // Conectamos al WebSocket usando nuestro hook
    const { ultimoEvento, conectado } = useSaldoWebSocket(user?.id, token);

    // Escuchamos cambios en ultimoEvento para disparar notificaciones
    useEffect(() => {
        if (ultimoEvento) {
            agregarNuevaNotificacion({
                id: Date.now(),
                tipo: ultimoEvento.tipo,
                mensaje: ultimoEvento.descripcion,
                monto: ultimoEvento.monto,
                fecha: new Date().toISOString(),
                leida: false
            });

            // Actualizamos el saldo en "vivo" para que la BilleteraPage lo vea sin recargar
            if (ultimoEvento.nuevoSaldo !== undefined) {
                setSaldoRealtime(ultimoEvento.nuevoSaldo);
            }
        }
    }, [ultimoEvento]);

    const agregarNuevaNotificacion = (noti) => {
        setNotificaciones(prev => [noti, ...prev]);
        setNoLeidas(prev => prev + 1);

        // Toast personalizado según tipo
        const config = { duration: 6000, position: 'top-right' };
        
        switch (noti.tipo) {
            case 'CASHBACK':
                toast.success(`💸 Cashback recibido: +$${noti.monto.toLocaleString()}`, config);
                break;
            case 'ROULETTE_REWARD':
            case 'PREMIO_RULETA':
                toast(`🎰 ¡Premio Ganado! +$${noti.monto.toLocaleString()}`, { ...config, icon: '🔥' });
                break;
            case 'REFERRAL_BONUS':
            case 'REFERIDO_EXITOSO':
                toast.success(`🤝 Bono referido: +$${noti.monto.toLocaleString()}`, config);
                break;
            case 'REEMBOLSO':
                toast(`↩️ Reembolso aprobado: +$${noti.monto.toLocaleString()}`, { ...config, icon: '✅' });
                break;
            case 'PURCHASE':
                toast(`🛒 Compra con Tribu: -$${Math.abs(noti.monto).toLocaleString()}`, { ...config, icon: '💳' });
                break;
            default:
                toast(noti.mensaje, { ...config, icon: '🔔' });
        }
    };

    const marcarComoLeida = (id) => {
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        setNoLeidas(prev => Math.max(0, prev - 1));
    };

    const marcarTodasComoLeidas = () => {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        setNoLeidas(0);
    };

    return (
        <NotificationContext.Provider value={{ 
            notificaciones, 
            noLeidas, 
            saldoRealtime,
            conectado,
            agregarNuevaNotificacion,
            marcarComoLeida, 
            marcarTodasComoLeidas 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);