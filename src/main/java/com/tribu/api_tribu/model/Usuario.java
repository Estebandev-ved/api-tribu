package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// @Data se evita en entidades JPA: genera equals/hashCode sobre todas las relaciones,
// lo que puede causar StackOverflowError con colecciones lazy.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "notasCreadas") // Excluir colecciones del toString para evitar lazy init
@EqualsAndHashCode(of = "id") // Solo comparar por ID, no por relaciones
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(unique = true, nullable = false)
    private String email;

    // Nota: este campo debe guardarse hasheado (BCrypt, etc.), nunca en texto plano
    @Column(nullable = false)
    private String password;

    private String telefono;

    private String ciudad;

    @Column(name = "tipo_documento", length = 20)
    private String tipoDocumento;

    @Column(length = 50)
    private String documento;

    @Column(name = "fecha_nacimiento")
    private java.time.LocalDate fechaNacimiento;

    @Column(length = 500)
    private String direccion;

    @Column(name = "nit_fiscal", length = 20)
    private String nitFiscal;

    @Column(name = "razon_social_fiscal", length = 200)
    private String razonSocialFiscal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id")
    private Rol rol;

    @Column(name = "saldo_favor", nullable = false)
    @Builder.Default
    private Double saldoFavor = 0.0;

    @Column(name = "nivel_vip", nullable = false)
    @Builder.Default
    private Integer nivelVip = 1; // 1: Bronce, 2: Plata, 3: Oro

    /** Tier VIP actual del usuario (Fase 2). Se mantiene nivelVip por compatibilidad. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tier_actual_id")
    private Tier tierActual;

    @Column(name = "codigo_referido", unique = true)
    private String codigoReferido;

    @Column(name = "codigo_referido_usado")
    private String codigoReferidoUsado;

    @Column(name = "racha_actual")
    @Builder.Default
    private Integer rachaActual = 0;

    @Column(name = "racha_maxima")
    @Builder.Default
    private Integer rachaMaxima = 0;

    @Column(name = "ultima_actividad_fecha")
    private LocalDate ultimaActividadFecha;

    @Column(name = "tribu_pass_activa")
    @Builder.Default
    private Boolean tribuPassActiva = false;

    @Column(name = "fecha_ultimo_giro_ruleta")
    private LocalDateTime fechaUltimoGiroRuleta;

    // ─── Seguridad: Autenticación de Doble Factor (2FA/TOTP) ───────────────────
    /** Secreto TOTP único por usuario, cifrado en la columna. */
    @Column(name = "secret_2fa", length = 64)
    private String secret2fa;

    /** true cuando el usuario ha verificado y activado el 2FA. */
    @Column(name = "is_2fa_habilitado", nullable = false)
    @Builder.Default
    private Boolean is2faHabilitado = false;

    // ─── Seguridad: Reset de Contraseña ────────────────────────────────────────
    /** Token UUID aleatorio enviado por correo para restablecer contraseña. */
    @Column(name = "reset_password_token", length = 128)
    private String resetPasswordToken;

    /** Fecha/hora de expiración del token (15 minutos). */
    @Column(name = "reset_password_expires")
    private LocalDateTime resetPasswordExpires;

    // Se usa @PrePersist para asignar la fecha correctamente al momento de persistir
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }

    @Column(name = "pin_seguridad_hash", length = 128)
    private String pinSeguridadHash;

    @Column(name = "bloqueado", nullable = false)
    @Builder.Default
    private Boolean bloqueado = false;

    @Column(name = "tarjeta_creada", nullable = false)
    @Builder.Default
    private Boolean tarjetaCreada = false;

    // Relación para el CRM: Notas escritas por este administrador
    // FetchType.LAZY es el default para @OneToMany, pero se especifica
    // explícitamente para claridad
    @OneToMany(mappedBy = "creadoPor", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CrmNota> notasCreadas = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setSaldoFavor(Double saldoFavor) {
        this.saldoFavor = saldoFavor;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Rol getRol() {
        return rol;
    }

    public String getEmail() {
        return email;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public Integer getNivelVip() {
        return nivelVip;
    }

    public String getCiudad() {
        return ciudad;
    }

    public String getPinSeguridadHash() {
        return pinSeguridadHash;
    }

    public void setPinSeguridadHash(String pinSeguridadHash) {
        this.pinSeguridadHash = pinSeguridadHash;
    }

    public String getCodigoReferido() {
        return codigoReferido;
    }

    public String getTelefono() {
        return telefono;
    }

    public LocalDateTime getFechaUltimoGiroRuleta() {
        return fechaUltimoGiroRuleta;
    }

    public void setFechaUltimoGiroRuleta(LocalDateTime fechaUltimoGiroRuleta) {
        this.fechaUltimoGiroRuleta = fechaUltimoGiroRuleta;
    }

    public String getDireccion() {
        return direccion;
    }
}
