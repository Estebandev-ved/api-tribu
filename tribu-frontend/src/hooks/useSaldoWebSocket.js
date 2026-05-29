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
      let url = import.meta.env.VITE_WS_URL
      if (url) {
        if (url.startsWith('wss://')) {
          url = url.replace('wss://', 'https://')
        } else if (url.startsWith('ws://')) {
          url = url.replace('ws://', 'http://')
        }
        return url
      }
      if (window.location.port === '3000' || window.location.port === '5173') {
        return 'http://localhost:8080/ws'
      }
      // En producción, conectar directamente con el backend en Render (Vercel no soporta WebSockets)
      return 'https://api-tribu.onrender.com/ws'
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
