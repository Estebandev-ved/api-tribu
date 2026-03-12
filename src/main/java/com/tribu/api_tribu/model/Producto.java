package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "detalles")
@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(length = 5000)
    private String descripcion;

    @Column(nullable = false)
    private BigDecimal precio;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "imagen_url")
    private String imagenUrl;

    @Column(name = "es_viral")
    private Boolean esViral = false;

    private Boolean activo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("productos")
    private Categoria categoria;

    // Relación inversa: detalles de pedidos donde aparece este producto
    @OneToMany(mappedBy = "producto", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<DetallePedido> detalles = new ArrayList<>();
}
