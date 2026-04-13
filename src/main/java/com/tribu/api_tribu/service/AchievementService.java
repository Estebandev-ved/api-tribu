package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.LogroUsuario;
import com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.LogroUsuarioRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final LogroUsuarioRepository logroUsuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final StreakService streakService;

    /**
     * Procesa y otorga recompensas por logros desbloqueados.
     * Este método identifica qué logros ha alcanzado el usuario y, si no han sido recompensados,
     * registra el desbloqueo y acredita el saldo correspondiente.
     */
    @Transactional
    public List<Map<String, Object>> procesarLogros(Usuario usuario) {
        // Datos base para cálculos
        Long totalPedidos = pedidoRepository.countGlobalPedidosValidos(usuario.getId());
        Double gastoTotal = pedidoRepository.calculateTotalGlobalValido(usuario.getId());
        if (gastoTotal == null) gastoTotal = 0.0;
        
        Long totalReferidos = usuarioRepository.countReferidosPorCodigo(usuario.getCodigoReferido());
        
        Map<String, Object> rachaData = streakService.getMiRacha(usuario);
        int rachaActual = rachaData.get("rachaActual") != null ? ((Number) rachaData.get("rachaActual")).intValue() : 0;
        
        String tier = usuario.getTierActual() != null ? usuario.getTierActual().getNombre() : 
                     (usuario.getNivelVip() >= 3 ? "ORO" : usuario.getNivelVip() == 2 ? "PLATA" : "BRONCE");

        List<Map<String, Object>> resultados = new ArrayList<>();

        // 1. Primera Compra ($5.000)
        verificarYPremiar(usuario, "primera_compra", totalPedidos >= 1, 5000.0, "🎯 ¡Logro desbloqueado! Primera compra.");

        // 2. Racha 7 días ($10.000)
        verificarYPremiar(usuario, "racha_7_dias", rachaActual >= 7, 10000.0, "🔥 ¡Racha de 7 días alcanzada!");

        // 3. Ahorrador ($10k saldo - $3.000 reward)
        // Nota: El saldo se consulta en el momento, pero el logro se marca como desbloqueado permanentemente
        double saldoActual = saldoService.consultarSaldoReal(usuario.getId());
        verificarYPremiar(usuario, "saldo_10k", saldoActual >= 10000.0, 3000.0, "💰 ¡Ahorrador! Mantener $10.000 en saldo.");

        // 4. Tier Plata (Sin premio monetario directo en el diseño actual, pero se marca como desbloqueado)
        verificarYPremiar(usuario, "tier_plata", tier.equalsIgnoreCase("PLATA") || tier.equalsIgnoreCase("ORO"), 0.0, "👑 ¡Bienvenido al nivel Plata!");

        // 5. Comprador 100K ($15.000)
        verificarYPremiar(usuario, "compra_100k", gastoTotal >= 100000.0, 15000.0, "💎 ¡Comprador 100K! Gracias por tu confianza.");

        // 6. Racha Maestra ($25.000)
        verificarYPremiar(usuario, "racha_30_dias", rachaActual >= 30, 25000.0, "⚡ ¡Racha Maestra de 30 días!");

        // 7. Tier Oro (Beneficio 5% cashback, marcamos logro)
        verificarYPremiar(usuario, "tier_oro", tier.equalsIgnoreCase("ORO"), 0.0, "🏆 ¡Máximo nivel alcanzado: Tier ORO!");

        // 8. Embajador ($30.000)
        verificarYPremiar(usuario, "referido_activo", totalReferidos >= 3, 30000.0, "🤝 ¡Embajador Tribu! 3 referidos activos.");

        return resultados;
    }

    private void verificarYPremiar(Usuario usuario, String logroId, boolean condicion, double premio, String mensaje) {
        if (condicion && !logroUsuarioRepository.existsByUsuarioAndLogroId(usuario, logroId)) {
            // Guardar desbloqueo
            LogroUsuario lu = LogroUsuario.builder()
                .usuario(usuario)
                .logroId(logroId)
                .recompensaEntregada(premio > 0)
                .build();
            logroUsuarioRepository.save(lu);

            // Acreditar premio si existe
            if (premio > 0) {
                saldoService.crearYAcreditar(usuario, premio, TipoMovimiento.LOGRO_DESBLOQUEADO, null, mensaje);
                wsService.notificarSaldoActualizado(usuario.getId(), premio, "ACHIEVEMENT_UNLOCKED", mensaje);
                log.info("🏆 Logro rewarded: {} para usuario {} (+${})", logroId, usuario.getId(), premio);
            } else {
                // Notificar desbloqueo aunque no tenga premio monetario
                wsService.notificarSaldoActualizado(usuario.getId(), 0, "ACHIEVEMENT_UNLOCKED", mensaje);
                log.info("🏆 Logro desbloqueado: {} para usuario {}", logroId, usuario.getId());
            }
        }
    }
}
