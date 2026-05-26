package com.tribu.api_tribu.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Patrón Ledger (Libro Mayor Inmutable).
 * NUNCA se actualiza un registro existente. Cada operación financiera
 * crea una nueva entrada. El saldo real = SUM(monto) WHERE estado = CLEARED.
 *
 * Estados del ciclo de vida:
 *   PENDING  → Registrado, pendiente de validación
 *   ON_HOLD  → Bloqueado (cashback diferido esperando unlock_date)
 *   CLEARED  → Disponible / acreditado en el saldo
 *   CANCELLED→ Anulado, no cuenta para el saldo
 */
@Entity
@Table(name = "movimientos_saldo", indexes = {
    @Index(name = "idx_mov_usuario_estado", columnList = "usuario_id, estado"),
    @Index(name = "idx_mov_unlock_date",   columnList = "unlock_date, estado")
})
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoSaldo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** Monto en COP. Positivo = ingreso, Negativo = gasto. */
    @Column(nullable = false)
    private Double monto;

    /**
     * Tipo de transacción.
     * Usa el enum TipoMovimiento para control estricto.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoMovimiento tipo;

    private String descripcion;

    /**
     * Estado del movimiento en la máquina de estados.
     * PENDING → ON_HOLD → CLEARED / CANCELLED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoMovimiento estado = EstadoMovimiento.CLEARED;

    /**
     * Solo para tipo CASHBACK: fecha en que pasa de ON_HOLD a CLEARED.
     * El CashbackScheduler evalúa este campo diariamente.
     */
    @Column(name = "unlock_date")
    private LocalDateTime unlockDate;

    /** Referencia al pedido origen (opcional, para trazabilidad). */
    @Column(name = "pedido_id")
    private Long pedidoId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    @PrePersist
    protected void onCreate() {
        fecha = LocalDateTime.now();
    }

    // ──────────────────────────────────────────────
    // Enums internos
    // ──────────────────────────────────────────────

    public enum TipoMovimiento {
        PURCHASE,           // Descuento al pagar con saldo
        CASHBACK,           // Reembolso por compra (diferido 7 días)
        ROULETTE_REWARD,    // Premio de la ruleta diaria
        REFERRAL_BONUS,     // Bono por referido
        WELCOME_BONUS,      // Regalo de bienvenida
        REEMBOLSO,          // Devolución aprobada por admin
        AJUSTE_ADMIN,       // Ajuste manual por administrador
        
        // --- Nombres antiguos para compatibilidad con datos existentes ---
        PREMIO_RULETA,
        REFERIDO_EXITOSO,
        REGALO_BIENVENIDA,
        CASHBACK_COMPRA,

        // --- Transferencias P2P ---
        TRANSFERENCIA_ENVIADA,
        TRANSFERENCIA_RECIBIDA,
        PAGO_QR,

        // --- Recompensas / canjes ---
        RECOMPENSA_CANJE,

        // --- Gamificación ---
        STREAK_BONUS,
        LEADERBOARD_REWARD,
        LOGRO_DESBLOQUEADO,

        // --- Tribu Pass ---
        TRIBU_PASS_PAGO
    }

    public enum EstadoMovimiento {
        PENDING,    // Registrado, en proceso
        ON_HOLD,    // Bloqueado temporalmente
        CLEARED,    // Disponible en saldo
        CANCELLED   // Anulado
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    public TipoMovimiento getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimiento tipo) {
        this.tipo = tipo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public EstadoMovimiento getEstado() {
        return estado;
    }

    public void setEstado(EstadoMovimiento estado) {
        this.estado = estado;
    }

    public LocalDateTime getUnlockDate() {
        return unlockDate;
    }

    public void setUnlockDate(LocalDateTime unlockDate) {
        this.unlockDate = unlockDate;
    }

    public Long getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(Long pedidoId) {
        this.pedidoId = pedidoId;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
