package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.CampanaMarketingRequest;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampanaMarketingService {

    private final CampanaMarketingRepository campanaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final PushNotificationService pushService;

    @Transactional
    public CampanaMarketing crearCampana(CampanaMarketingRequest request) {
        CampanaMarketing campana = CampanaMarketing.builder()
                .titulo(request.getTitulo())
                .cuerpo(request.getCuerpo())
                .tipo(request.getTipo())
                .segmento(request.getSegmento())
                .fechaProgramada(request.getFechaProgramada())
                .estado(EstadoCampana.BORRADOR)
                .totalEnviados(0)
                .totalAbiertos(0)
                .build();

        return campanaRepository.save(campana);
    }

    public List<CampanaMarketing> listarCampanas() {
        return campanaRepository.findAll();
    }

    public CampanaMarketing getCampana(Long id) {
        return campanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campana", "id", id));
    }

    @Transactional
    public void programarCampana(Long id, LocalDateTime fechaProgramada) {
        CampanaMarketing campana = getCampana(id);
        campana.setFechaProgramada(fechaProgramada);
        campana.setEstado(EstadoCampana.PROGRAMADA);
        campanaRepository.save(campana);
    }

    @Transactional
    public void ejecutarCampana(Long id) {
        CampanaMarketing campana = getCampana(id);
        List<Usuario> destinatarios = obtenerSegmento(campana.getSegmento());
        campana.setEstado(EstadoCampana.ENVIANDO);
        campanaRepository.save(campana);

        log.info("Ejecutando campana {} para {} destinatarios", campana.getId(), destinatarios.size());

        for (Usuario usuario : destinatarios) {
            try {
                if (campana.getTipo() == TipoCampana.EMAIL || campana.getTipo() == TipoCampana.AMBOS) {
                    emailService.enviarCampanaMarketing(
                            usuario.getEmail(),
                            usuario.getNombreCompleto(),
                            campana.getTitulo(),
                            campana.getCuerpo());
                }
                if (campana.getTipo() == TipoCampana.PUSH || campana.getTipo() == TipoCampana.AMBOS) {
                    pushService.enviarAUsuario(
                            usuario.getId(),
                            campana.getTitulo(),
                            campana.getCuerpo(),
                            "/");
                }
                campana.setTotalEnviados(campana.getTotalEnviados() + 1);
            } catch (Exception e) {
                log.warn("Error enviando campana a {}: {}", usuario.getEmail(), e.getMessage());
            }
        }

        campana.setEstado(EstadoCampana.COMPLETADA);
        campanaRepository.save(campana);
        log.info("Campana {} completada. Enviados: {}", campana.getId(), campana.getTotalEnviados());
    }

    private List<Usuario> obtenerSegmento(SegmentoCampana segmento) {
        return switch (segmento) {
            case TODOS -> usuarioRepository.findAll();
            case TIER_ORO -> usuarioRepository.findByTierActualNombre("ORO");
            case TIER_PLATA -> usuarioRepository.findByTierActualNombre("PLATA");
            case TIER_BRONCE -> usuarioRepository.findByTierActualNombre("BRONCE");
            case SIN_COMPRA_30_DIAS -> usuarioRepository.findInactivos(LocalDateTime.now().minusDays(30));
            case NUEVOS_USUARIOS -> usuarioRepository.findNuevosUltimos7Dias(LocalDateTime.now().minusDays(7));
            case TOP_REFERIDORES -> usuarioRepository.findTopReferidores();
        };
    }

    public Map<String, Long> getConteoSegmentos() {
        Map<String, Long> conteo = new HashMap<>();
        conteo.put("TODOS", usuarioRepository.count());
        conteo.put("TIER_ORO", (long) usuarioRepository.findByTierActualNombre("ORO").size());
        conteo.put("TIER_PLATA", (long) usuarioRepository.findByTierActualNombre("PLATA").size());
        conteo.put("TIER_BRONCE", (long) usuarioRepository.findByTierActualNombre("BRONCE").size());
        conteo.put("SIN_COMPRA_30_DIAS", (long) usuarioRepository.findInactivos(LocalDateTime.now().minusDays(30)).size());
        conteo.put("NUEVOS_USUARIOS", (long) usuarioRepository.findNuevosUltimos7Dias(LocalDateTime.now().minusDays(7)).size());
        conteo.put("TOP_REFERIDORES", (long) usuarioRepository.findTopReferidores().size());
        return conteo;
    }

    public CampanaMarketing getPreview(Long id) {
        return getCampana(id);
    }
}