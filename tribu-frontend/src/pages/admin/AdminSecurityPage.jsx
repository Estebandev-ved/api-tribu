import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    adminGetSecuritySessions,
    adminGetSecurityThreats,
    adminGetSecurityAudit,
    adminExecuteSecurityAction,
    adminVerifySecurityIntegrity,
    adminGetSecurityPolicies,
    adminSaveSecurityPolicies
} from '../../api'
import toast from 'react-hot-toast'
import {
    Shield, Activity, Globe, Monitor, Smartphone, Fingerprint, MapPin, AlertOctagon, RefreshCw, Terminal, BellRing, Lock, ShieldOff, Zap, CheckCircle, Cpu, Radar, Flame, ShieldCheck
} from 'lucide-react'

// --- Skeleton Component ---
const SkeletonRow = ({ width = '100%', height = '20px' }) => (
    <div style={{ width, height, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }} className="skeleton-box"></div>
)


const RiskGauge = ({ value = 0, color = '#10b981' }) => {
    const radius = 18
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference
    return (
        <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
            <motion.circle
                cx="24"
                cy="24"
                r={radius}
                stroke={color}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <text x="24" y="27" textAnchor="middle" fontSize="10" fill={color} fontWeight="700" fontFamily="monospace">
                {value}%
            </text>
        </svg>
    )
}

const sliderTrackStyle = (value, min, max, color) => {
    const pct = ((value - min) / (max - min)) * 100
    return {
        background: `linear-gradient(90deg, ${color} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`
    }
}

const ThreatPulse = ({ x, y, color }) => (
    <motion.div
        style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        <motion.div
            style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 18px ${color}`
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
        />
        <motion.div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: `1px solid ${color}`,
                transform: 'translate(-50%, -50%)',
                opacity: 0.8
            }}
            animate={{ scale: [0.6, 1.6], opacity: [0.7, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
        />
    </motion.div>
)

export default function AdminSecurityPage() {
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState([])
    const [threats, setThreats] = useState([])
    const [audits, setAudits] = useState([])
    const [actionLoading, setActionLoading] = useState(null)
    const [verifyingIntegrity, setVerifyingIntegrity] = useState(false)
    const [integrityResult, setIntegrityResult] = useState(null)
    const [scanIndex, setScanIndex] = useState(-1)
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const threatLayerRef = useRef(null)
    const [panicProgress, setPanicProgress] = useState(0)
    const [panicHolding, setPanicHolding] = useState(false)
    const panicFrame = useRef(null)
    const panicStart = useRef(null)
    const [policies, setPolicies] = useState({
        pinAttemptsLimit: 3,
        pinLockoutTime: 15,
        emergencyRateLimit: false
    })
    const [savingPolicies, setSavingPolicies] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [sRes, tRes, aRes, pRes] = await Promise.all([
                adminGetSecuritySessions(),
                adminGetSecurityThreats(),
                adminGetSecurityAudit(),
                adminGetSecurityPolicies()
            ])
            setSessions(sRes.data)
            setThreats(tRes.data)
            setAudits(aRes.data)
            setPolicies(pRes.data)
        } catch (e) {
            toast.error('Error al cargar datos de ciberseguridad')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return
        if (!window.L) return

        const bounds = window.L.latLngBounds(
            window.L.latLng(-4.5, -79.2),
            window.L.latLng(13.6, -66.8)
        )

        const map = window.L.map(mapRef.current, {
            center: [4.7, -74.1],
            zoom: 5,
            minZoom: 5,
            maxZoom: 9,
            zoomControl: false,
            attributionControl: false
        })

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)

        map.setMaxBounds(bounds)
        map.on('drag', () => {
            map.panInsideBounds(bounds, { animate: false })
        })

        threatLayerRef.current = window.L.layerGroup().addTo(map)
        mapInstanceRef.current = map
    }, [])

    useEffect(() => {
        if (!mapInstanceRef.current || !window.L || !threatLayerRef.current) return
        threatLayerRef.current.clearLayers()
        threats.forEach((t) => {
            if (typeof t.lat !== 'number' || typeof t.lng !== 'number') return
            const color = getSeverityColor(t.severity)
            const lat = t.lat
            const lng = t.lng
            const marker = window.L.circleMarker([lat, lng], {
                radius: 8,
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.6
            })
            const userLabel = t.user ? (t.user.name || t.user.email || 'N/D') : null
            marker.bindPopup(`
                <div style="font-size:12px;">
                    <div style="font-weight:800;color:${color};">${t.type} (${t.severity})</div>
                    <div style="font-family:monospace;">${t.ip}</div>
                    <div>${t.location} • ${lat}, ${lng}</div>
                    ${userLabel ? `<div style=\"margin-top:6px;color:#7c3aed;\">Usuario: ${userLabel}</div>` : ''}
                </div>
            `)
            marker.addTo(threatLayerRef.current)
        })
    }, [threats])

    const handleVerifyIntegrity = async () => {
        setVerifyingIntegrity(true)
        setIntegrityResult(null)
        setScanIndex(0)
        try {
            const res = await adminVerifySecurityIntegrity()
            setIntegrityResult(res.data)
            if (res.data.status === 'success') {
                toast.success('🛡️ ¡Cadena de logs 100% íntegra! Sin alteraciones.', { duration: 4000 })
            } else {
                toast.error('🚨 ¡FALLO DE INTEGRIDAD! Base de datos manipulada.', { duration: 6000 })
            }
            fetchData() // refresh audit list
        } catch (e) {
            toast.error('Error al realizar la auditoría criptográfica')
        } finally {
            setVerifyingIntegrity(false)
            setTimeout(() => setScanIndex(-1), 600)
        }
    }

    const handleAction = async (type, target) => {
        if (!window.confirm(`¿Ejecutar ${type} sobre ${target}?`)) return
        setActionLoading(target)
        try {
            const res = await adminExecuteSecurityAction(type, { target })
            toast.success(res.data.message)
            fetchData() // Refresh audit logs
        } catch (e) {
            toast.error('Fallo al ejecutar acción de mitigación')
        } finally {
            setActionLoading(null)
        }
    }

    const handleSavePolicies = async (updatedPolicies) => {
        setSavingPolicies(true)
        try {
            await adminSaveSecurityPolicies(updatedPolicies)
            setPolicies(updatedPolicies)
            toast.success('🛡️ Políticas WAF y PIN actualizadas con éxito')
        } catch (e) {
            toast.error('Error al actualizar las políticas')
        } finally {
            setSavingPolicies(false)
        }
    }

    const exportAuditTrail = () => {
        try {
            const headers = ['Timestamp', 'Event Type', 'Severity', 'Description', 'Actor']
            const rows = audits.map(a => [
                new Date(a.timestamp).toLocaleString(),
                a.eventType,
                a.severity,
                a.description,
                a.userEmail || a.ipAddress || 'SYSTEM'
            ])
            const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", `tribu_security_audit_${new Date().toISOString().substring(0,10)}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('📊 Reporte de auditoría forense CSV descargado')
        } catch (e) {
            toast.error('Fallo al exportar reporte de logs')
        }
    }

    const getSeverityColor = (sev) => {
        switch ((sev || '').toUpperCase()) {
            case 'CRITICAL': return '#ef4444' // Red
            case 'HIGH': return '#f97316' // Orange
            case 'MEDIUM': return '#eab308' // Yellow
            case 'LOW': return '#10b981' // Green
            default: return '#8b8b8b'
        }
    }

    const getRiskBand = (score) => {
        if (score >= 76) return { label: 'CRITICO', color: '#ef4444' }
        if (score >= 51) return { label: 'ALTO', color: '#f97316' }
        if (score >= 26) return { label: 'ATENCION', color: '#eab308' }
        return { label: 'SEGURO', color: '#10b981' }
    }

    const ledgerBlocks = useMemo(() => audits.slice(0, 8).map((entry, index) => ({
        id: entry.id || `${entry.timestamp}-${index}`,
        eventType: entry.eventType,
        timestamp: entry.timestamp,
        severity: entry.severity,
        hash: entry.hash || entry.currentHash || 'SHA256_' + (entry.id || index).toString().padStart(8, '0'),
        previousHash: entry.previousHash || entry.prevHash || '00000000000000000000000000000000'
    })), [audits])

    useEffect(() => {
        if (!verifyingIntegrity) return undefined
        if (!ledgerBlocks.length) return undefined
        const interval = setInterval(() => {
            setScanIndex(prev => (prev + 1) % ledgerBlocks.length)
        }, 420)
        return () => clearInterval(interval)
    }, [verifyingIntegrity, ledgerBlocks.length])

    const startPanicHold = () => {
        if (panicHolding) return
        setPanicHolding(true)
        setPanicProgress(0)
        panicStart.current = performance.now()
        const tick = (now) => {
            const elapsed = now - panicStart.current
            const progress = Math.min(100, (elapsed / 3000) * 100)
            setPanicProgress(progress)
            if (progress >= 100) {
                setPanicHolding(false)
                setPanicProgress(100)
                handleAction('GLOBAL_REVOKE', 'ALL_USERS')
                return
            }
            panicFrame.current = requestAnimationFrame(tick)
        }
        panicFrame.current = requestAnimationFrame(tick)
    }

    const cancelPanicHold = () => {
        setPanicHolding(false)
        setPanicProgress(0)
        if (panicFrame.current) cancelAnimationFrame(panicFrame.current)
    }

    return (
        <div style={{
            padding: '2.5rem 2rem',
            maxWidth: '1480px',
            margin: '0 auto',
            color: 'var(--color-text)',
            background: 'radial-gradient(circle at 20% 10%, rgba(16,185,129,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(239,68,68,0.08), transparent 35%), linear-gradient(180deg, rgba(4,6,12,0.95), rgba(2,3,7,0.98))',
            borderRadius: '24px'
        }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.35rem' }}>
                        <Shield color="#14f0a6" size={34} />
                        <span style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8ab0ff' }}>SOC ADMIN CENTER</span>
                    </div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        CISO Tactical Security Console
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', maxWidth: '640px' }}>Monitoreo en tiempo real, threat intelligence y operaciones de mitigacion con trazabilidad criptografica.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="btn btn-ghost" onClick={fetchData}>
                        <RefreshCw size={18} /> Actualizar
                    </motion.button>
                    <div style={{
                        minWidth: '260px',
                        padding: '0.6rem',
                        borderRadius: '999px',
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onMouseDown={startPanicHold}
                            onMouseUp={cancelPanicHold}
                            onMouseLeave={cancelPanicHold}
                            onTouchStart={startPanicHold}
                            onTouchEnd={cancelPanicHold}
                            className="btn btn-danger"
                            style={{
                                background: 'transparent',
                                color: '#ef4444',
                                border: 'none',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <Zap size={18} /> Panic Hold
                        </motion.button>
                        <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${panicProgress}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)', transition: panicHolding ? 'none' : 'width 0.2s ease' }} />
                        </div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* UBA & Active Sessions */}
                <section className="card" style={{ padding: '1.5rem', backdropFilter: 'blur(20px)', background: 'rgba(13, 16, 22, 0.75)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="#3b82f6" /> User Behavior Analytics
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '0.75rem 0', color: 'var(--color-text-muted)' }}>Entidad / IP</th>
                                    <th style={{ padding: '0.75rem 0', color: 'var(--color-text-muted)' }}>Contexto Device</th>
                                    <th style={{ padding: '0.75rem 0', color: 'var(--color-text-muted)' }}>Risk Score</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--color-text-muted)' }}>Acciones Rápidas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '0.75rem 0' }}><SkeletonRow height="30px" /></td>
                                        <td style={{ padding: '0.75rem 0' }}><SkeletonRow height="30px" /></td>
                                        <td style={{ padding: '0.75rem 0' }}><SkeletonRow height="30px" /></td>
                                        <td style={{ padding: '0.75rem 0' }}><SkeletonRow height="30px" /></td>
                                    </tr>
                                )) : sessions.map((s, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            <div style={{ fontWeight: 700 }}>{s.email}</div>
                                            <div style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Globe size={10} /> {s.ip} • {s.location}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                                {s.device.includes('iPhone') || s.device.includes('Android') ? <Smartphone size={14} /> : <Monitor size={14} />}
                                                {s.device}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <RiskGauge value={s.riskScore} color={getRiskBand(s.riskScore).color} />
                                                <div>
                                                    <div style={{ fontWeight: 800, color: getRiskBand(s.riskScore).color }}>{s.riskScore}%</div>
                                                    <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--color-text-faint)' }}>{getRiskBand(s.riskScore).label}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleAction('FORCE_RESET', s.email)} className="btn btn-ghost" style={{ padding: '0.35rem', color: '#3b82f6' }} title="Force Password Reset"><Lock size={15} /></button>
                                                <button onClick={() => handleAction('QUARANTINE', s.email)} className="btn btn-ghost" style={{ padding: '0.35rem', color: '#eab308' }} title="Quarantine Account"><ShieldOff size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Threat Intelligence */}
                <section className="card" style={{ padding: '1.5rem', backdropFilter: 'blur(20px)', background: 'rgba(13, 16, 22, 0.75)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Radar size={20} color="#8ab0ff" /> Threat Intelligence & Heatmap
                    </h2>

                    <div style={{
                        width: '100%',
                        height: '260px',
                        background: 'rgba(6,8,14,0.9)',
                        borderRadius: '12px',
                        position: 'relative',
                        marginBottom: '1rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {loading ? <SkeletonRow height="80px" /> : threats.map((t, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', borderLeft: `3px solid ${getSeverityColor(t.severity)}` }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.ip}</div>
                                    <div style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Fingerprint size={10} /> {t.type} • {t.location}
                                    </div>
                                </div>
                                <button onClick={() => handleAction('BAN_IP', t.ip)} className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem', color: '#ef4444', fontSize: '0.75rem' }}>
                                    <AlertOctagon size={14} style={{ marginRight: '0.3rem' }}/> Ban IP
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Cryptographic Integrity & Log-Chaining Card */}
                <section className="card" style={{ padding: '1.5rem', backdropFilter: 'blur(20px)', background: 'rgba(13, 16, 22, 0.75)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={20} color="#10b981" /> Criptografía & Ledger
                        </h2>
                        
                        {/* Security features list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Algoritmo Bitácora:</span>
                                <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>SHA-256 Chaining</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Bloqueos de Concurrencia:</span>
                                <span style={{ color: '#3b82f6', fontWeight: 700 }}>Redis (Redisson)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Control de Tráfico:</span>
                                <span style={{ color: '#a855f7', fontWeight: 700 }}>Bucket4j (Token Bucket)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Firmas QR P2P:</span>
                                <span style={{ color: '#f97316', fontWeight: 700 }}>HMAC-SHA256</span>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gap: '0.75rem',
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                <Cpu size={14} /> Ledger Hash Chain
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                                {ledgerBlocks.map((block, index) => {
                                    const isActive = verifyingIntegrity && scanIndex === index
                                    const isSuccess = integrityResult?.status === 'success'
                                    const isError = integrityResult?.status === 'error'
                                    return (
                                        <motion.div
                                            key={block.id}
                                            animate={{
                                                borderColor: isActive ? '#22c55e' : 'rgba(255,255,255,0.08)',
                                                boxShadow: isActive ? '0 0 14px rgba(34,197,94,0.45)' : 'none'
                                            }}
                                            style={{
                                                minWidth: '180px',
                                                padding: '0.6rem',
                                                borderRadius: '10px',
                                                background: 'rgba(10,12,18,0.8)',
                                                border: '1px solid rgba(255,255,255,0.08)'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.7rem', color: getSeverityColor(block.severity), fontWeight: 700 }}>{block.eventType}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', fontFamily: 'monospace', marginTop: '0.35rem' }}>{block.hash}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: '0.2rem' }}>prev: {block.previousHash}</div>
                                            <div style={{ marginTop: '0.4rem', fontSize: '0.6rem', color: isSuccess ? '#10b981' : isError ? '#ef4444' : 'var(--color-text-faint)' }}>
                                                {isActive ? 'VERIFYING...' : isSuccess ? 'VALID' : isError ? 'TAMPERED' : 'PENDING'}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Audit Verification Result Panel */}
                        <AnimatePresence mode="wait">
                            {integrityResult ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: integrityResult.status === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                        border: `1px solid ${integrityResult.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                        marginBottom: '1rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: integrityResult.status === 'success' ? '#10b981' : '#ef4444', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                        {integrityResult.status === 'success' ? <CheckCircle size={18} /> : <AlertOctagon size={18} />}
                                        {integrityResult.status === 'success' ? 'INTEGRIDAD VERIFICADA' : 'LOG ALTERADO / EXPUESTO'}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>
                                        {integrityResult.message}
                                    </p>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', marginTop: '0.5rem', textAlign: 'right' }}>
                                        Verificado: {new Date(integrityResult.timestamp).toLocaleTimeString()}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                                        textAlign: 'center',
                                        color: 'var(--color-text-faint)',
                                        fontSize: '0.8rem',
                                        marginBottom: '1rem'
                                    }}
                                >
                                    Auditoría criptográfica lista. Presiona el botón para escanear y validar el encadenamiento de logs SHA-256.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={verifyingIntegrity}
                            onClick={handleVerifyIntegrity}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                borderRadius: '8px',
                                background: verifyingIntegrity ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981, #059669)',
                                color: verifyingIntegrity ? 'var(--color-text-muted)' : '#000',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                cursor: verifyingIntegrity ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: verifyingIntegrity ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)'
                            }}
                        >
                        {verifyingIntegrity ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Auditando Ledger...
                            </>
                        ) : (
                            <>
                                <Shield size={16} />
                                Ejecutar Auditoría Forense
                            </>
                        )}
                    </motion.button>
                </section>
            </div>

            {/* WAF & PIN Security Policy Configuration */}
            <section className="card" style={{ padding: '2rem', backdropFilter: 'blur(20px)', background: 'rgba(13, 16, 22, 0.75)', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={20} color="#22d3ee" /> Centro de Control de Políticas WAF y Billetera
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    
                    {/* Column 1: PIN Brute Force Settings */}
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3b82f6', margin: '0 0 1rem 0' }}>
                            <Fingerprint size={16} /> Límite de Fuerza Bruta de PIN
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', lineHeight: '1.4', margin: '0 0 1.25rem 0' }}>
                            Configura el máximo número de intentos de PIN permitidos antes de congelar las transferencias en Redis.
                        </p>
                        
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Intentos Máximos:</label>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>2</span>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '999px',
                                            border: '1px solid rgba(96,165,250,0.45)',
                                            background: 'rgba(96,165,250,0.12)',
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                            color: '#7dd3fc'
                                        }}>
                                            {policies.pinAttemptsLimit} intentos
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>10</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="2"
                                        max="10"
                                        step="1"
                                        value={policies.pinAttemptsLimit}
                                        onChange={(e) => handleSavePolicies({ ...policies, pinAttemptsLimit: parseInt(e.target.value) })}
                                        style={{
                                            flex: 1,
                                            height: '6px',
                                            borderRadius: '999px',
                                            appearance: 'none',
                                            outline: 'none',
                                            boxShadow: '0 0 12px rgba(96,165,250,0.25)',
                                            ...sliderTrackStyle(policies.pinAttemptsLimit, 2, 10, '#60a5fa')
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Duración del Congelamiento:</label>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>5m</span>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '999px',
                                            border: '1px solid rgba(16,185,129,0.45)',
                                            background: 'rgba(16,185,129,0.12)',
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                            color: '#34d399'
                                        }}>
                                            {policies.pinLockoutTime}m
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>1440m</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="1440"
                                        step="5"
                                        value={policies.pinLockoutTime}
                                        onChange={(e) => handleSavePolicies({ ...policies, pinLockoutTime: parseInt(e.target.value) })}
                                        style={{
                                            flex: 1,
                                            height: '6px',
                                            borderRadius: '999px',
                                            appearance: 'none',
                                            outline: 'none',
                                            boxShadow: '0 0 12px rgba(16,185,129,0.25)',
                                            ...sliderTrackStyle(policies.pinLockoutTime, 5, 1440, '#10b981')
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Emergency WAF DDoS Shield */}
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: policies.emergencyRateLimit ? '#ef4444' : '#10b981', margin: '0 0 1rem 0' }}>
                                <Shield size={16} /> Blindaje DDoS de Emergencia (WAF)
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', lineHeight: '1.4', margin: '0 0 1rem 0' }}>
                                Activa un limitador de frecuencia extremo en caliente (Token Bucket a 5 req/min) para mitigar ráfagas DDoS de capa 7 o ataques volumétricos.
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', background: policies.emergencyRateLimit ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${policies.emergencyRateLimit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: policies.emergencyRateLimit ? '#ef4444' : '#10b981' }}>
                                    {policies.emergencyRateLimit ? '🛡️ BLINDAJE ACTIVO' : '🟢 WAF NORMAL'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    {policies.emergencyRateLimit ? 'Límite: 5 req/min por IP' : 'Límite regular seguro'}
                                </span>
                            </div>
                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={policies.emergencyRateLimit}
                                    onChange={(e) => handleSavePolicies({ ...policies, emergencyRateLimit: e.target.checked })}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: policies.emergencyRateLimit ? '#ef4444' : '#333',
                                    transition: '.3s', borderRadius: '24px',
                                    boxShadow: policies.emergencyRateLimit ? '0 0 10px rgba(239,68,68,0.5)' : 'none'
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '""', height: '18px', width: '18px', left: policies.emergencyRateLimit ? '24px' : '3px', bottom: '3px',
                                        backgroundColor: '#fff', transition: '.3s', borderRadius: '50%'
                                    }} />
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Column 3: Forensic & Log Exports */}
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a855f7', margin: '0 0 1rem 0' }}>
                                <Terminal size={16} /> Auditoría Forense & Ledger
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', lineHeight: '1.4', margin: '0 0 1.25rem 0' }}>
                                Descarga los registros de la bitácora inmutable encriptada por SHA-256 en formato estructurado CSV para auditorías de cumplimiento.
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={exportAuditTrail}
                            style={{
                                width: '100%', padding: '0.65rem', borderRadius: '6px',
                                background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc',
                                border: '1px solid rgba(168, 85, 247, 0.4)', fontWeight: 700,
                                fontSize: '0.8rem', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            <Terminal size={14} /> Exportar Historial (CSV)
                        </motion.button>
                        {verifyingIntegrity && (
                            <div style={{
                                marginTop: '0.8rem',
                                height: '6px',
                                borderRadius: '999px',
                                background: 'rgba(16,185,129,0.15)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        height: '100%',
                                        width: '40%',
                                        background: 'linear-gradient(90deg, rgba(16,185,129,0), rgba(34,197,94,0.9), rgba(16,185,129,0))'
                                    }}
                                    animate={{ x: ['-40%', '140%'] }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>
                        )}
                    </div>

                </div>
            </section>

            {/* System Integrity & Audit Log */}
            <section className="card" style={{ padding: '1.5rem', backdropFilter: 'blur(20px)', background: 'rgba(13, 16, 22, 0.75)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={20} color="#10b981" /> Immutable Audit Log
                    </h2>
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}><BellRing size={14} style={{ marginRight: '0.4rem' }}/> Configure Webhooks</button>
                </div>
                
                <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ position: 'sticky', top: 0, background: 'rgba(25, 25, 25, 0.95)' }}>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Timestamp</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Event Type</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Severity</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Description</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Actor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="5"><SkeletonRow height="100px" /></td></tr> : audits.map((a, i) => (
                                <tr key={a.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-faint)' }}>{new Date(a.timestamp).toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{a.eventType}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, background: `${getSeverityColor(a.severity)}20`, color: getSeverityColor(a.severity) }}>
                                            {a.severity}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{a.description}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{a.userEmail || a.ipAddress || 'SYSTEM'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
