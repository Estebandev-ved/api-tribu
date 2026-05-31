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

    @Column(name = "costo_proveedor", precision = 10, scale = 2, nullable = false)
    private BigDecimal costoProveedor = BigDecimal.ZERO;

    @Column(name = "costo_empaque_envio", precision = 10, scale = 2, nullable = false)
    private BigDecimal costoEmpaqueEnvio = BigDecimal.ZERO;

    @Column(name = "comision_pasarela_fija", precision = 10, scale = 2, nullable = false)
    private BigDecimal comisionPasarelaFija = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "stock_minimo")
    private Integer stockMinimo = 5;

    @Column(name = "stock_critico")
    private Integer stockCritico = 3;

    @Column(name = "alerta_enviada_en")
    private LocalDateTime alertaEnviadaEn;

    @Column(name = "imagen_url")
    private String imagenUrl;

    @Column(name = "imagenes_adicionales", length = 3000)
    private String imagenesAdicionales;

    @Column(name = "es_viral")
    private Boolean esViral = false;

    private Boolean activo = true;
    
    @Column(name = "ventas_totales")
    private Integer ventasTotales = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("productos")
    private Categoria categoria;

    // Relación inversa: detalles de pedidos donde aparece este producto
    @OneToMany(mappedBy = "producto", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<DetallePedido> detalles = new ArrayList<>();
}
