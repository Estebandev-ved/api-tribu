package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Endpoint público para alimentar el SocialProofToast con datos reales.
 * No expone información sensible — solo primer nombre, ciudad y nombre del
 * producto.
 */
@RestController
@RequestMapping("/api/social-proof")
@RequiredArgsConstructor
public class SocialProofController {

    private final PedidoRepository pedidoRepository;

    @GetMapping("/recientes")
    public ResponseEntity<List<Map<String, String>>> getComprasRecientes(
            @RequestParam(defaultValue = "10") int limit) {

        List<Map<String, String>> resultado = pedidoRepository
                .findAllByOrderByFechaPedidoDesc()
                .stream()
                .limit(limit)
                .flatMap(pedido -> pedido.getDetalles().stream()
                        .limit(1) // Un producto por pedido para variedad
                        .map(detalle -> {
                            Map<String, String> item = new HashMap<>();
                            // Solo el primer nombre (privacidad)
                            String nombreCompleto = pedido.getUsuario().getNombreCompleto();
                            String primerNombre = nombreCompleto.split(" ")[0];
                            item.put("nombre", primerNombre);
                            item.put("ciudad", pedido.getUsuario().getCiudad() != null
                                    ? pedido.getUsuario().getCiudad()
                                    : "Colombia");
                            item.put("producto", detalle.getProducto().getNombre());
                            item.put("imagenUrl", detalle.getProducto().getImagenUrl() != null
                                    ? detalle.getProducto().getImagenUrl()
                                    : "");
                            return item;
                        }))
                .collect(Collectors.toList());

        return ResponseEntity.ok(resultado);
    }
}
