import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

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
