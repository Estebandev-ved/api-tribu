package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.CampanaRequest;
import com.tribu.api_tribu.dto.response.CampanaStatsDTO;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaCashbackRepository campanaRepository;
    private final CampanaUsoRepository campanaUsoRepository;
    private final TierRepository tierRepository;
    private final CashbackTierService cashbackTierService;

    public double getPorcentajeEfectivo(Usuario usuario) {
        double pctBase = cashbackTierService.getPorcentajeCashback(usuario);
        CampanaCashback campana = getCampanaActivaParaUsuario(usuario);
        if (campana == null) {
            return pctBase;
        }
        return pctBase * campana.getMultiplicador();
    }

    public CampanaCashback getCampanaActivaParaUsuario(Usuario usuario) {
        LocalDateTime ahora = LocalDateTime.now();
        Tier tier = usuario.getTierActual();

        if (tier != null) {
            return campanaRepository.findCampanaActivaParaTierId(ahora, tier.getId()).orElse(null);
        }

        return campanaRepository.findCampanaActiva(ahora).orElse(null);
    }

    public CampanaCashback getCampanaActivaPublica() {
        LocalDateTime ahora = LocalDateTime.now();
        return campanaRepository.findCampanaActiva(ahora).orElse(null);
    }

    @Transactional
    public CampanaCashback crearCampana(CampanaRequest request, String adminEmail) {
        CampanaCashback campana = CampanaCashback.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .multiplicador(request.getMultiplicador() != null ? request.getMultiplicador() : 2.0)
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .activa(false)
                .limiteUsoTotal(request.getLimiteUsoTotal())
                .limiteUsoPorUsuario(request.getLimiteUsoPorUsuario() != null ? request.getLimiteUsoPorUsuario() : 1)
                .usosActuales(0)
                .createdBy(adminEmail)
                .tiersAplicables(new HashSet<>())
                .build();

        if (request.getTiersAplicablesIds() != null && !request.getTiersAplicablesIds().isEmpty()) {
            for (Long tierId : request.getTiersAplicablesIds()) {
                Tier tier = tierRepository.findById(tierId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tier", "id", tierId));
                campana.getTiersAplicables().add(tier);
            }
        }

        return campanaRepository.save(campana);
    }

    @Transactional
    public void activarCampana(Long id) {
        CampanaCashback campana = campanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campana", "id", id));
        campana.setActiva(true);
        campanaRepository.save(campana);
        log.info("Campana {} activada", campana.getNombre());
    }

    @Transactional
    public void desactivarCampana(Long id) {
        CampanaCashback campana = campanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campana", "id", id));
        campana.setActiva(false);
        campanaRepository.save(campana);
        log.info("Campana {} desactivada", campana.getNombre());
    }

    @Transactional
    public void eliminarCampana(Long id) {
        CampanaCashback campana = campanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campana", "id", id));
        if (campana.getActiva()) {
            throw new IllegalStateException("No se puede eliminar una campana activa");
        }
        campanaRepository.delete(campana);
        log.info("Campana {} eliminada", campana.getNombre());
    }

    public List<CampanaCashback> listarCampanas() {
        return campanaRepository.findAll();
    }

    public CampanaCashback getCampana(Long id) {
        return campanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campana", "id", id));
    }

    public CampanaStatsDTO getStats(Long id) {
        CampanaCashback campana = getCampana(id);
        long usosTotales = campanaUsoRepository.countByCampanaId(id);

        double impactoFinanciero = 0;
        if (campana.getMultiplicador() > 1) {
            double incremento = campana.getMultiplicador() - 1.0;
            impactoFinanciero = incremento * 100;
        }

        return CampanaStatsDTO.builder()
                .id(campana.getId())
                .nombre(campana.getNombre())
                .multiplicador(campana.getMultiplicador())
                .usosActuales((int) usosTotales)
                .limiteUsoTotal(campana.getLimiteUsoTotal())
                .impactoFinancieroPorcentaje(impactoFinanciero)
                .build();
    }

    @Transactional
    public void registrarUso(Long campanaId, Long usuarioId, Long pedidoId) {
        CampanaCashback campana = getCampana(campanaId);
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);

        Pedido pedido = new Pedido();
        pedido.setId(pedidoId);

        if (campana.getLimiteUsoTotal() != null && campana.getUsosActuales() >= campana.getLimiteUsoTotal()) {
            throw new IllegalStateException("Límite de usos totales alcanzado");
        }

        if (campana.getLimiteUsoPorUsuario() != null) {
            long usosUsuario = campana.getUsos().stream()
                    .filter(u -> u.getUsuario().getId().equals(usuarioId))
                    .count();
            if (usosUsuario >= campana.getLimiteUsoPorUsuario()) {
                throw new IllegalStateException("Límite de usos por usuario alcanzado");
            }
        }

        CampanaUso uso = CampanaUso.builder()
                .campana(campana)
                .usuario(usuario)
                .pedido(pedido)
                .build();

        campanaUsoRepository.save(uso);

        campana.setUsosActuales(campana.getUsosActuales() + 1);
        campanaRepository.save(campana);
    }

    public boolean puedeUsarCampana(Long campanaId, Long usuarioId) {
        CampanaCashback campana = getCampana(campanaId);

        if (campana.getLimiteUsoTotal() != null && campana.getUsosActuales() >= campana.getLimiteUsoTotal()) {
            return false;
        }

        if (campana.getLimiteUsoPorUsuario() != null) {
            long usosUsuario = campana.getUsos().stream()
                    .filter(u -> u.getUsuario().getId().equals(usuarioId))
                    .count();
            return usosUsuario < campana.getLimiteUsoPorUsuario();
        }

        return true;
    }
}