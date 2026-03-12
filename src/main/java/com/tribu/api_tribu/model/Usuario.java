package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// @Data se evita en entidades JPA: genera equals/hashCode sobre todas las relaciones,
// lo que puede causar StackOverflowError con colecciones lazy.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    @Column(length = 500)
    private String direccion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id")
    private Rol rol;

    @Column(name = "saldo_favor", nullable = false)
    private Double saldoFavor = 0.0;

    @Column(name = "nivel_vip", nullable = false)
    private Integer nivelVip = 1; // 1: Bronce, 2: Plata, 3: Oro

    @Column(name = "codigo_referido", unique = true)
    private String codigoReferido;

    @Column(name = "fecha_ultimo_giro_ruleta")
    private LocalDateTime fechaUltimoGiroRuleta;

    // Se usa @PrePersist para asignar la fecha correctamente al momento de
    // persistir
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }

    // Relación para el CRM: Notas escritas por este administrador
    // FetchType.LAZY es el default para @OneToMany, pero se especifica
    // explícitamente para claridad
    @OneToMany(mappedBy = "creadoPor", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CrmNota> notasCreadas = new ArrayList<>();
}