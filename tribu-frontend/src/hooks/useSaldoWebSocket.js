import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useSaldoWebSocket(usuarioId, token) {
  const [ultimoEvento, setUltimoEvento] = useState(null);
  const [conectado, setConectado] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    console.log('[WebSocket] useEffect triggered with usuarioId:', usuarioId, 'token exists:', !!token);
    if (!usuarioId || !token) {
      console.log('[WebSocket] Missing usuarioId or token, skipping connection.');
      return;
    }

    const getUrl = () => {
      let url = import.meta.env.VITE_WS_URL;
      if (url) {
        if (url.startsWith('wss://')) {
          url = url.replace('wss://', 'https://');
        } else if (url.startsWith('ws://')) {
          url = url.replace('ws://', 'http://');
        }
        console.log('[WebSocket] Using configured VITE_WS_URL:', url);
        return url;
      }
      // Check ports, including common dev ports
      const port = window.location.port;
      if (port === '3000' || port === '5173' || port === '5174' || port === '5175' || window.location.hostname === 'localhost') {
        const localUrl = `http://${window.location.hostname}:8080/ws`;
        console.log('[WebSocket] Local environment detected. Connecting to:', localUrl);
        return localUrl;
      }
      // Production fallback
      const prodUrl = 'https://api-tribu.onrender.com/ws';
      console.log('[WebSocket] Production environment detected. Connecting to:', prodUrl);
      return prodUrl;
    };

    const targetUrl = getUrl();
    console.log('[WebSocket] Instantiating STOMP client targeting:', targetUrl);

    const client = new Client({
      webSocketFactory: () => {
        console.log('[WebSocket] Creating new SockJS connection to:', targetUrl);
        return new SockJS(targetUrl);
      },

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,

      onConnect: () => {
        console.log('[WebSocket] Connected successfully!');
        setConectado(true);

        const subscriptionPath = '/user/queue/saldo';
        console.log('[WebSocket] Subscribing to:', subscriptionPath);
        client.subscribe(subscriptionPath, (message) => {
          try {
            console.log('[WebSocket] Message received:', message.body);
            const evento = JSON.parse(message.body);
            setUltimoEvento(evento);
          } catch (e) {
            console.error('[WebSocket] Error parsing WS event:', e);
          }
        });
      },

      onDisconnect: () => {
        console.log('[WebSocket] Disconnected.');
        setConectado(false);
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP Error:', frame.headers['message'], frame.body);
      },

      onWebSocketClose: (event) => {
        console.warn('[WebSocket] Connection closed:', event);
        setConectado(false);
      },

      onWebSocketError: (error) => {
        console.error('[WebSocket] Error occurred:', error);
      }
    });

    console.log('[WebSocket] Activating STOMP client...');
    client.activate();
    clientRef.current = client;

    return () => {
      console.log('[WebSocket] Deactivating STOMP client on cleanup...');
      client.deactivate();
    };
  }, [usuarioId, token]);

  return { ultimoEvento, conectado };
}
