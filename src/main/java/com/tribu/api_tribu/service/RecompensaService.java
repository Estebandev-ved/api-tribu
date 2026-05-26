package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.RecompensaRequest;
import com.tribu.api_tribu.dto.response.RecompensaDTO;
import com.tribu.api_tribu.model.Recompensa;
import com.tribu.api_tribu.repository.RecompensaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecompensaService {

    private final RecompensaRepository recompensaRepository;

    public RecompensaService(RecompensaRepository recompensaRepository) {
        this.recompensaRepository = recompensaRepository;
    }

    public List<RecompensaDTO> listarActivas() {
        List<Recompensa> recompensas = recompensaRepository.findByActivoTrueOrderByCostoPuntosAsc();
        if (recompensas.isEmpty()) {
            recompensas = seedDefaultRecompensas();
        }
        List<RecompensaDTO> resultado = new ArrayList<>();
        for (Recompensa recompensa : recompensas) {
            resultado.add(toDto(recompensa));
        }
        return resultado;
    }

    @Transactional
    public List<Recompensa> seedDefaultRecompensas() {
        List<Recompensa> defaults = new ArrayList<>();
        defaults.add(crearMockRecompensa("Spotify Premium 1 Mes", "Disfruta de música ilimitada sin anuncios durante 30 días.", 5000.0, 50));
        defaults.add(crearMockRecompensa("Descuento Tribu del 25%", "Cupón de descuento del 25% aplicable en tu próxima compra.", 3000.0, 100));
        defaults.add(crearMockRecompensa("Netflix Regalo $20.000", "Tarjeta de regalo digital aplicable a cualquier plan de Netflix.", 10000.0, 30));
        defaults.add(crearMockRecompensa("Combo Hamburguesa Tribu", "Voucher canjeable por un combo completo en restaurantes aliados.", 7000.0, 15));
        defaults.add(crearMockRecompensa("Pase Tribu Pass VIP 1 Mes", "Desbloquea envíos gratis y cashback del 5% durante un mes completo.", 15000.0, 20));
        return recompensaRepository.saveAll(defaults);
    }

    private Recompensa crearMockRecompensa(String titulo, String descripcion, Double costoPuntos, Integer stock) {
        Recompensa r = new Recompensa();
        r.setTitulo(titulo);
        r.setDescripcion(descripcion);
        r.setCostoPuntos(costoPuntos);
        r.setImagenUrl(null);
        r.setActivo(true);
        r.setStock(stock);
        return r;
    }

    public List<RecompensaDTO> listarTodas() {
        List<Recompensa> recompensas = recompensaRepository.findAll();
        List<RecompensaDTO> resultado = new ArrayList<>();
        for (Recompensa recompensa : recompensas) {
            resultado.add(toDto(recompensa));
        }
        return resultado;
    }

    @Transactional
    public RecompensaDTO crear(RecompensaRequest request) {
        Recompensa recompensa = new Recompensa();
        recompensa.setTitulo(request.getTitulo());
        recompensa.setDescripcion(request.getDescripcion());
        recompensa.setCostoPuntos(request.getCostoPuntos());
        recompensa.setImagenUrl(request.getImagenUrl());
        recompensa.setActivo(request.getActivo() != null ? request.getActivo() : Boolean.TRUE);
        recompensa.setStock(request.getStock());
        return toDto(recompensaRepository.save(recompensa));
    }

    @Transactional
    public RecompensaDTO actualizar(Long id, RecompensaRequest request) {
        Recompensa recompensa = recompensaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recompensa no encontrada"));

        if (request.getTitulo() != null) recompensa.setTitulo(request.getTitulo());
        if (request.getDescripcion() != null) recompensa.setDescripcion(request.getDescripcion());
        if (request.getCostoPuntos() != null) recompensa.setCostoPuntos(request.getCostoPuntos());
        if (request.getImagenUrl() != null) recompensa.setImagenUrl(request.getImagenUrl());
        if (request.getActivo() != null) recompensa.setActivo(request.getActivo());
        if (request.getStock() != null) recompensa.setStock(request.getStock());

        return toDto(recompensaRepository.save(recompensa));
    }

    @Transactional
    public void eliminar(Long id) {
        recompensaRepository.deleteById(id);
    }

    private RecompensaDTO toDto(Recompensa r) {
        RecompensaDTO dto = new RecompensaDTO();
        dto.setId(r.getId());
        dto.setTitulo(r.getTitulo());
        dto.setDescripcion(r.getDescripcion());
        dto.setCostoPuntos(r.getCostoPuntos());
        dto.setImagenUrl(r.getImagenUrl());
        dto.setActivo(r.getActivo());
        dto.setStock(r.getStock());
        return dto;
    }
}
