package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.Tier;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Slf4j
@Service
@RequiredArgsConstructor
public class TierService {

    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final VipRulesEngine vipRulesEngine;
    private final SaldoWebSocketService wsService;

    @Transactional
    public void reevaluarTierUsuario(Usuario usuario) {
        // Rango del mes actual
        YearMonth mesActual = YearMonth.now();
        LocalDateTime inicio = mesActual.atDay(1).atStartOfDay();
        LocalDateTime fin = mesActual.atEndOfMonth().atTime(23, 59, 59);

        // Calcular total de compras VÁLIDAS (PAGADO, ENTREGADO, etc.) para feedback inmediato
        Double comprasMes = pedidoRepository.calculateTotalValidoTierEnPeriodo(usuario.getId(), inicio, fin);
        if (comprasMes == null) comprasMes = 0.0;

        Tier tierNuevo = vipRulesEngine.evaluarTier(comprasMes);
        Tier tierAnterior = usuario.getTierActual();

        // Comparar si cambió
        boolean cambio = tierAnterior == null
                || !tierNuevo.getId().equals(tierAnterior.getId());

        if (cambio) {
            usuario.setTierActual(tierNuevo);
            usuario.setNivelVip(tierNuevo.getOrden());
            usuarioRepository.save(usuario);

            String mensaje = vipRulesEngine.describeCambio(tierAnterior, tierNuevo);

            if (tierAnterior == null || tierNuevo.getOrden() > tierAnterior.getOrden()) {
                log.info("⬆️ Promoción Real-time: {} → {} | Compras: ${}", 
                    tierAnterior != null ? tierAnterior.getNombre() : "SIN_TIER", 
                    tierNuevo.getNombre(), comprasMes);
                wsService.notificarSaldoActualizado(usuario.getId(), 0, "TIER_PROMOCION", mensaje);
            } else {
                log.info("⬇️ Ajuste Real-time: {} → {} | Compras: ${}", 
                    tierAnterior.getNombre(), tierNuevo.getNombre(), comprasMes);
                wsService.notificarSaldoActualizado(usuario.getId(), 0, "TIER_AJUSTE", mensaje);
            }
        }
    }
}
