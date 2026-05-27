import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useSaldoWebSocket(usuarioId, token) {
  const [ultimoEvento, setUltimoEvento] = useState(null);
  const [conectado, setConectado] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!usuarioId || !token) return;

    const getUrl = () => {
      if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL
      }
      if (window.location.port === '3000' || window.location.port === '5173') {
        return 'http://localhost:8080/ws'
      }
      const proto = window.location.protocol === 'https:' ? 'https' : 'http'
      return `${proto}://${window.location.host}/ws`
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(getUrl()),

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,

      onConnect: () => {
        setConectado(true);

        client.subscribe('/user/queue/saldo', (message) => {
          try {
            const evento = JSON.parse(message.body);
            setUltimoEvento(evento);
          } catch (e) {
            console.error('Error parseando evento WS:', e);
          }
        });
      },

      onDisconnect: () => {
        setConectado(false);
      },

      onStompError: (frame) => {
        console.error('Error STOMP:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [usuarioId, token]);

  return { ultimoEvento, conectado };
}
