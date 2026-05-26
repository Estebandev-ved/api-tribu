// useSaldoWebSocket.js
// Coloca este archivo en: src/hooks/useSaldoWebSocket.js
//
// Instalar dependencia: npm install @stomp/stompjs sockjs-client
//
// Uso en cualquier componente React:
//   const { ultimoEvento, conectado } = useSaldoWebSocket(usuario.id, token);
//   useEffect(() => {
//     if (ultimoEvento?.tipo === 'CASHBACK') { /* disparar animación */ }
//   }, [ultimoEvento]);

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Hook para recibir eventos de saldo en tiempo real via WebSocket.
 *
 * @param {number} usuarioId - ID del usuario autenticado
 * @param {string} token - JWT token para autenticación en el WS
 * @returns {{ ultimoEvento, conectado }}
 *
 * ultimoEvento tiene la forma:
 *   { tipo: 'CASHBACK' | 'RULETA' | 'REFERIDO' | 'REEMBOLSO',
 *     monto: number, descripcion: string, nuevoSaldo: number }
 */
export function useSaldoWebSocket(usuarioId, token) {
  const [ultimoEvento, setUltimoEvento] = useState(null);
  const [conectado, setConectado] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!usuarioId || !token) return;

    const client = new Client({
      // Usar native WebSocket (ws://) es lo estándar hoy y evita el warning de 'unload' de SockJS
      brokerURL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',

      // Autenticación: el JwtFilter del backend lo valida
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000, // Reconectar cada 5s si se cae

      onConnect: () => {
        setConectado(true);
        console.log('🔌 WebSocket Tribu conectado');

        // Suscribirse al canal personal de saldo
        // El backend emite a /user/{usuarioId}/queue/saldo
        client.subscribe('/user/queue/saldo', (message) => {
          try {
            const evento = JSON.parse(message.body);
            console.log('💰 Evento saldo recibido:', evento);
            setUltimoEvento(evento);
          } catch (e) {
            console.error('Error parseando evento WS:', e);
          }
        });
      },

      onDisconnect: () => {
        setConectado(false);
        console.log('🔌 WebSocket Tribu desconectado');
      },

      onStompError: (frame) => {
        console.error('Error STOMP:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    // Cleanup al desmontar
    return () => {
      client.deactivate();
    };
  }, [usuarioId, token]);

  return { ultimoEvento, conectado };
}
