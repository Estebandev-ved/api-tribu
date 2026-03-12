package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "pedido")
@Entity
@Table(name = "detalle_pedidos")
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Pedido al que pertenece este detalle
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    // Producto comprado en este detalle
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    // Precio unitario al momento de la compra (puede diferir del precio actual)
    @Column(name = "precio_unitario", nullable = false)
    private BigDecimal precioUnitario;

    // Subtotal = cantidad * precioUnitario
    @Column(nullable = false)
    private BigDecimal subtotal;
}
