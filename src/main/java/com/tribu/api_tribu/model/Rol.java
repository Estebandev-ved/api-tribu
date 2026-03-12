package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString
@Entity
@Table(name = "roles")
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ejemplo: "ADMIN", "CLIENTE", "VENDEDOR"
    @Column(unique = true, nullable = false)
    private String nombre;

    private String descripcion;
}
