package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.ProductoRecomendadoDTO;
import com.tribu.api_tribu.model.Producto;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.ProductoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecomendacionService {

    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CashbackTierService cashbackTierService;

    public List<ProductoRecomendadoDTO> getRecomendaciones(Long usuarioId, int limite) {
        List<ProductoRecomendadoDTO> recomendaciones = new ArrayList<>();
        Set<Long> yaComprados = new HashSet<>(pedidoRepository.findProductosComprados(usuarioId));

        String tier = usuarioRepository.findById(usuarioId)
                .map(u -> {
                    if (u.getTierActual() != null) {
                        return u.getTierActual().getNombre();
                    }
                    return switch (u.getNivelVip()) {
                        case 3 -> "ORO";
                        case 2 -> "PLATA";
                        default -> "BRONCE";
                    };
                })
                .orElse("BRONCE");

        List<Long> categoriasCompradas = pedidoRepository.findCategoriasCompradas(usuarioId);
        if (!categoriasCompradas.isEmpty()) {
            List<Producto> porCategoria = productoRepository
                    .findByCategoriaIdInAndStockGreaterThanOrderByVentasTotalesDesc(
                            categoriasCompradas, PageRequest.of(0, 5));
            for (Producto p : porCategoria) {
                if (!yaComprados.contains(p.getId())) {
                    recomendaciones.add(toDTO(p, "Basado en tus compras"));
                    yaComprados.add(p.getId());
                }
            }
        }

        List<Producto> porTier = productoRepository.findProductosPopularesPorTier(tier, usuarioId, PageRequest.of(0, 5));
        for (Producto p : porTier) {
            if (!yaComprados.contains(p.getId())) {
                recomendaciones.add(toDTO(p, "Popular en usuarios " + tier));
                yaComprados.add(p.getId());
            }
        }

        List<Producto> tendencia = productoRepository.findProductosTendencia(PageRequest.of(0, 3));
        for (Producto p : tendencia) {
            if (!yaComprados.contains(p.getId())) {
                recomendaciones.add(toDTO(p, "Tendencia"));
                yaComprados.add(p.getId());
            }
        }

        return recomendaciones.stream()
                .limit(limite)
                .collect(Collectors.toList());
    }

    private ProductoRecomendadoDTO toDTO(Producto p, String razon) {
        double pctCashback = 0.01;
        return ProductoRecomendadoDTO.builder()
                .productoId(p.getId())
                .nombre(p.getNombre())
                .precio(p.getPrecio().doubleValue())
                .imagen(p.getImagenUrl())
                .razonRecomendacion(razon)
                .cashbackEsperado(p.getPrecio().doubleValue() * pctCashback)
                .build();
    }
}