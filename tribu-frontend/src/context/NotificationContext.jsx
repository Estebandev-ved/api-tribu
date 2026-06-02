// src/context/NotificationContext.jsx
import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useSaldoWebSocket } from '../hooks/useSaldoWebSocket';
import { dbOfflineQueue } from '../services/dbOfflineQueue';
import { transferenciaService } from '../services/services';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const token = localStorage.getItem('tribu_token');
    
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [saldoRealtime, setSaldoRealtime] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Conectamos al WebSocket usando nuestro hook
    const { ultimoEvento, conectado } = useSaldoWebSocket(user?.id, token);

    // Sincronizador de transacciones guardadas fuera de línea (IndexedDB)
    const syncOfflineTransfers = async () => {
        if (isSyncing || !navigator.onLine || !user) return;
        setIsSyncing(true);
        
        try {
            const pending = await dbOfflineQueue.getPendingTransfers();
            if (pending.length === 0) {
                setIsSyncing(false);
                return;
            }

            toast.loading(`🔄 Sincronizando ${pending.length} transferencia(s) offline...`, { id: 'offline-sync-toast' });

            for (const tx of pending) {
                try {
                    // Actualizar el estado de IndexedDB a 'syncing' para evitar doble envío en ráfaga
                    await dbOfflineQueue.updateTransferStatus(tx.id, 'syncing');
                    
                    const res = await transferenciaService.enviar(
                        tx.destinatario,
                        tx.monto,
                        tx.mensaje,
                        tx.pin
                    );

                    // Eliminar de IndexedDB en caso de éxito
                    await dbOfflineQueue.deleteTransfer(tx.id);
                    
                    toast.success(`✅ Transferencia de ${tx.monto.toLocaleString()} pts enviada con éxito.`, { duration: 5000 });
                    
                    // Actualizar el saldo real si está disponible en la respuesta
                    if (res.data.nuevoSaldo !== undefined) {
                        setSaldoRealtime(res.data.nuevoSaldo);
                    }
                } catch (err) {
                    if (!err.response) {
                        // Error de red continuo, revertir estado a 'pending' para reintentar después
                        await dbOfflineQueue.updateTransferStatus(tx.id, 'pending');
                        throw new Error('Servidor inalcanzable'); // Detiene el bucle temporalmente
                    } else {
                        // Error de negocio (ej. PIN incorrecto, saldo insuficiente).
                        // Marcar como fallido en IndexedDB para no bloquear el resto de la cola
                        const errorMsg = err.response?.data?.message || 'Error de negocio';
                        await dbOfflineQueue.updateTransferStatus(tx.id, 'failed', errorMsg);
                        toast.error(`❌ Falló la transacción de ${tx.monto.toLocaleString()} pts: ${errorMsg}`, { duration: 6000 });
                    }
                }
            }
        } catch (error) {
            console.warn('Sincronización en segundo plano detenida temporalmente:', error.message);
        } finally {
            toast.dismiss('offline-sync-toast');
            setIsSyncing(false);
        }
    };

    // Escuchar eventos de red y disparar sincronización al montar o recuperar conexión
    useEffect(() => {
        if (!user) return;
        
        // Ejecutar al montar
        syncOfflineTransfers();

        const handleOnline = () => {
            toast.success('🌐 ¡Conexión recuperada! Sincronizando transacciones en la cola de seguridad...', { icon: '⚡' });
            syncOfflineTransfers();
        };

        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [user]);

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
                toast.success(`💸 Cashback recibido: +${noti.monto.toLocaleString()} pts`, config);
                break;
            case 'ROULETTE_REWARD':
            case 'PREMIO_RULETA':
                toast(`🎰 ¡Premio Ganado! +${noti.monto.toLocaleString()} pts`, { ...config, icon: '🔥' });
                break;
            case 'REFERRAL_BONUS':
            case 'REFERIDO_EXITOSO':
                toast.success(`🤝 Bono referido: +${noti.monto.toLocaleString()} pts`, config);
                break;
            case 'REEMBOLSO':
                toast(`↩️ Reembolso aprobado: +${noti.monto.toLocaleString()} pts`, { ...config, icon: '✅' });
                break;
            case 'PURCHASE':
                toast(`🛒 Compra con Tribu: -${Math.abs(noti.monto).toLocaleString()} pts`, { ...config, icon: '💳' });
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
            isSyncing,
            agregarNuevaNotificacion,
            marcarComoLeida, 
            marcarTodasComoLeidas,
            syncOfflineTransfers
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);