import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    adminGetSecuritySessions,
    adminGetSecurityThreats,
    adminGetSecurityAudit,
    adminExecuteSecurityAction
} from '../../api'
import toast from 'react-hot-toast'
import {
    Shield, Activity, Globe, Monitor, Smartphone, Fingerprint, MapPin, AlertOctagon, RefreshCw, LogOut, Terminal, BellRing, Lock, ShieldOff, Zap
} from 'lucide-react'

// --- Skeleton Component ---
const SkeletonRow = ({ width = '100%', height = '20px' }) => (
    <div style={{ width, height, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }} className="skeleton-box"></div>
)

export default function AdminSecurityPage() {
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState([])
    const [threats, setThreats] = useState([])
    const [audits, setAudits] = useState([])
    const [actionLoading, setActionLoading] = useState(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [sRes, tRes, aRes] = await Promise.all([
                adminGetSecuritySessions(),
                adminGetSecurityThreats(),
                adminGetSecurityAudit()
            ])
            setSessions(sRes.data)
            setThreats(tRes.data)
            setAudits(aRes.data)
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

    const getSeverityColor = (sev) => {
        switch ((sev || '').toUpperCase()) {
            case 'CRITICAL': return '#ef4444' // Red
            case 'HIGH': return '#f97316' // Orange
            case 'MEDIUM': return '#eab308' // Yellow
            case 'LOW': return '#10b981' // Green
            default: return '#8b8b8b'
        }
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text)' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Shield color="var(--color-primary)" size={32} /> 
                        Cybersecurity Control Center
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Monitoreo avanzado, inteligencia de amenazas y mitigación proactiva.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="btn btn-ghost" onClick={fetchData}>
                        <RefreshCw size={18} /> Actualizar
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="btn btn-danger" onClick={() => handleAction('GLOBAL_REVOKE', 'ALL_USERS')}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                        <Zap size={18} /> Panic Button (Revoke All)
                    </motion.button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* UBA & Active Sessions */}
                <section className="card" style={{ padding: '1.5rem', backdropFilter: 'blur(16px)', background: 'rgba(25, 25, 25, 0.65)' }}>
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '40px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${s.riskScore}%`, height: '100%', background: getSeverityColor(s.severity) }}></div>
                                                </div>
                                                <span style={{ fontWeight: 800, color: getSeverityColor(s.severity) }}>{s.riskScore}%</span>
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
                <section className="card" style={{ padding: '1.5rem', backdropFilter: 'blur(16px)', background: 'rgba(25, 25, 25, 0.65)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={20} color="#a855f7" /> Threat Intelligence & Heatmap
                    </h2>
                    
                    <div style={{ width: '100%', height: '180px', background: 'url(https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg) center/cover no-repeat', opacity: 0.8, borderRadius: '8px', position: 'relative', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {/* Interactive dots based on Threats lat/lng (Simulated) */}
                        {!loading && threats.map((t, i) => (
                            <div key={i} title={`${t.type} from ${t.location}`} style={{
                                position: 'absolute',
                                top: `${50 - (t.lat / 1.5)}%`, // Basic mock mapping
                                left: `${50 + (t.lng / 2.5)}%`,
                                width: 12, height: 12, borderRadius: '50%',
                                background: getSeverityColor(t.severity),
                                boxShadow: `0 0 10px ${getSeverityColor(t.severity)}`,
                                transform: 'translate(-50%, -50%)'
                            }}></div>
                        ))}
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
            </div>

            {/* System Integrity & Audit Log */}
            <section className="card" style={{ padding: '1.5rem', backdropFilter: 'blur(16px)', background: 'rgba(25, 25, 25, 0.65)' }}>
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
