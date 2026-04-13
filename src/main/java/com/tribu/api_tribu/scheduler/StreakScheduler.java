package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.StreakService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StreakScheduler {

    private final UsuarioRepository usuarioRepository;
    private final SaldoWebSocketService wsService;

    @Scheduled(cron = "0 1 0 * * *", zone = "America/Bogota")
    @Transactional
    public void resetearRachasRotas() {
        LocalDate hoy = LocalDate.now();
        LocalDate ayer = hoy.minusDays(1);

        List<Usuario> usuariosRotos = usuarioRepository.findByRachaActualGreaterThanAndUltimaActividadFechaBefore(0, ayer);

        if (usuariosRotos.isEmpty()) {
            log.info("🕐 [StreakScheduler] No hay rachas por resetear.");
            return;
        }

        log.info("🔄 [StreakScheduler] Reseteando {} rachas...", usuariosRotos.size());

        for (Usuario usuario : usuariosRotos) {
            try {
                int rachaAnterior = usuario.getRachaActual();
                usuario.setRachaActual(0);
                usuarioRepository.save(usuario);

                wsService.notificarSaldoActualizado(
                    usuario.getId(), 0, "STREAK_ROTO",
                    "Tu racha de " + rachaAnterior + " días se ha roto. ¡Vuelve a empezar!"
                );

                log.info("❌ Usuario {}: racha {} reseteada", usuario.getId(), rachaAnterior);
            } catch (Exception e) {
                log.error("❌ Error reseteando racha del usuario {}: {}", usuario.getId(), e.getMessage());
            }
        }

        log.info("✅ [StreakScheduler] Rachas reseteadas: {}", usuariosRotos.size());
    }
}
