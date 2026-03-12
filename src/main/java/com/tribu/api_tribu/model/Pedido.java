package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = { "usuario", "detalles" })
@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Se asigna automáticamente al momento de persistir
    @Column(name = "fecha_pedido", updatable = false)
    private LocalDateTime fechaPedido;

    @PrePersist
    protected void onCreate() {
        this.fechaPedido = LocalDateTime.now();
    }

    // Valores posibles: PENDIENTE, PAGADO, ENVIADO, ENTREGADO
    @Column(nullable = false)
    private String estado;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(name = "direccion_envio", nullable = false)
    private String direccionEnvio;

    @Column(name = "guia_rastreo")
    private String guiaRastreo;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DetallePedido> detalles = new ArrayList<>();
}
