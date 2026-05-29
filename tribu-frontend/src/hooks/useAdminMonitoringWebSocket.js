import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

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

export function useAdminMonitoringWebSocket({
    enabled,
    token,
    onMovimiento,
    onTransferencia,
}) {
    const [connected, setConnected] = useState(false)
    const clientRef = useRef(null)

    useEffect(() => {
        if (!enabled || !token) return

        const client = new Client({
            webSocketFactory: () => new SockJS(getUrl()),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            onConnect: () => {
                setConnected(true)

                client.subscribe('/topic/admin/tribu-card', (message) => {
                    try {
                        const data = JSON.parse(message.body)
                        onMovimiento?.(data)
                    } catch {
                        // ignore
                    }
                })

                client.subscribe('/topic/admin/transferencias', (message) => {
                    try {
                        const data = JSON.parse(message.body)
                        onTransferencia?.(data)
                    } catch {
                        // ignore
                    }
                })
            },
            onDisconnect: () => {
                setConnected(false)
            },
            onStompError: () => {
                setConnected(false)
            },
        })

        client.activate()
        clientRef.current = client

        return () => {
            setConnected(false)
            try {
                client.deactivate()
            } catch {
                // ignore
            }
        }
    }, [enabled, token, onMovimiento, onTransferencia])

    return { connected }
}
