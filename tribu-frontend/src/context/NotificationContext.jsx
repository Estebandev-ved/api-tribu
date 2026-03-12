// src/context/NotificationContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);

    // Función para cargar el historial cuando el usuario entra a la app
    const cargarNotificaciones = async () => {
        try {
            // Aquí llamarías a tu API de Spring Boot: GET /api/notificaciones
            // const response = await fetch('http://localhost:8080/api/notificaciones');
            // const data = await response.json();

            // Simulación de datos por ahora:
            const data = [
                { id: 1, mensaje: "¡Bienvenido a Tribu!", leida: false },
            ];

            setNotificaciones(data);
            setNoLeidas(data.filter(n => !n.leida).length);
        } catch (error) {
            console.error("Error al cargar notificaciones", error);
        }
    };

    // FUNCIÓN ESTRELLA: Llama a esta función cuando llegue un evento en tiempo real
    const agregarNuevaNotificacion = (nuevaNotificacion) => {
        // 1. Agrega a la lista
        setNotificaciones(prev => [nuevaNotificacion, ...prev]);
        setNoLeidas(prev => prev + 1);

        // 2. Muestra el POP-UP bonito
        if (nuevaNotificacion.tipo === 'COMPRA') {
            toast.success(nuevaNotificacion.mensaje, { duration: 5000 });
        } else if (nuevaNotificacion.tipo === 'DEVOLUCION') {
            toast.error(nuevaNotificacion.mensaje, { duration: 5000 });
        } else {
            toast(nuevaNotificacion.mensaje, { icon: '🔔' }); // Por defecto
        }
    };

    const marcarComoLeida = (id) => {
        // Aquí llamarías a tu API: PUT /api/notificaciones/{id}/leer
        setNotificaciones(prev =>
            prev.map(n => n.id === id ? { ...n, leida: true } : n)
        );
        setNoLeidas(prev => Math.max(0, prev - 1));
    };

    useEffect(() => {
        cargarNotificaciones();

        // =========================================================
        // AQUÍ VA LA CONEXIÓN WEBSOCKET (STOMP) EN EL FUTURO
        // Para que Spring Boot mande la alerta en tiempo real.
        // =========================================================
    }, []);

    return (
        <NotificationContext.Provider value={{ notificaciones, noLeidas, agregarNuevaNotificacion, marcarComoLeida }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);