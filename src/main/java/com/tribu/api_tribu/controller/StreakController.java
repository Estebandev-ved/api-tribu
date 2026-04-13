package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.service.StreakService;
import com.tribu.api_tribu.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;
    private final AchievementService achievementService;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final PedidoRepository pedidoRepository;

    @GetMapping("/mi-racha")
    public ResponseEntity<Map<String, Object>> getMiRacha(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        Map<String, Object> racha = streakService.getMiRacha(usuario);
        return ResponseEntity.ok(racha);
    }

    /**
     * Retorna la lista de logros con el progreso actual del usuario.
     * Seguridad: Cada logro se calcula contra los datos reales del usuario autenticado.
     */
    @GetMapping("/logros")
    public ResponseEntity<List<Map<String, Object>>> getLogros(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        // Procesar y entregar recompensas pendientes
        achievementService.procesarLogros(usuario);
        
        Map<String, Object> rachaData = streakService.getMiRacha(usuario);
        int rachaActual = rachaData.get("rachaActual") != null ? ((Number) rachaData.get("rachaActual")).intValue() : 0;
        
        Double saldoReal = movimientoSaldoRepository.calcularSaldoReal(usuario.getId());
        double saldo = saldoReal != null ? saldoReal : 0.0;

        // Nombre del tier dinámico
        String tier = usuario.getTierActual() != null ? usuario.getTierActual().getNombre() : 
                     (usuario.getNivelVip() >= 3 ? "ORO" : usuario.getNivelVip() == 2 ? "PLATA" : "BRONCE");
        
        // Datos reales para logros
        Long totalPedidos = pedidoRepository.countGlobalPedidosValidos(usuario.getId());
        Double gastoTotal = pedidoRepository.calculateTotalGlobalValido(usuario.getId());
        Long totalReferidos = usuarioRepository.countReferidosPorCodigo(usuario.getCodigoReferido());
        
        List<Map<String, Object>> logros = new ArrayList<>();
        
        logros.add(crearLogro("primera_compra", "🎯", "Primera compra", "Realiza tu primera compra en Tribu Card", 1, totalPedidos.intValue(), "$5.000"));
        logros.add(crearLogro("racha_7_dias", "🔥", "Racha de 7 días", "Mantén una racha de 7 días consecutivos", 7, rachaActual, "$10.000"));
        logros.add(crearLogro("saldo_10k", "💰", "Ahorrador", "Alcanza $10.000 en saldo", 10000, (int) saldo, "$3.000"));
        logros.add(crearLogro("tier_plata", "👑", "Tier Plata", "Alcanza el nivel Plata en Tribu Card", 1, (tier.equalsIgnoreCase("PLATA") || tier.equalsIgnoreCase("ORO")) ? 1 : 0, "Acceso a beneficios"));
        logros.add(crearLogro("compra_100k", "💎", "Comprador 100K", "Realiza compras por $100.000 en total", 100000, gastoTotal != null ? gastoTotal.intValue() : 0, "$15.000"));
        logros.add(crearLogro("racha_30_dias", "⚡", "Racha Maestra", "Mantén una racha de 30 días consecutivos", 30, rachaActual, "$25.000"));
        logros.add(crearLogro("tier_oro", "🏆", "Tier Oro", "Alcanza el nivel Oro en Tribu Card", 1, tier.equalsIgnoreCase("ORO") ? 1 : 0, "5% cashback"));
        logros.add(crearLogro("referido_activo", "🤝", "Embajador", "Consigue 3 referidos activos", 3, totalReferidos.intValue(), "$30.000"));
        
        return ResponseEntity.ok(logros);
    }

    private Map<String, Object> crearLogro(String id, String emoji, String titulo, String descripcion, int requerido, int actual, String recompensa) {
        Map<String, Object> logro = new HashMap<>();
        logro.put("id", id);
        logro.put("emoji", emoji);
        logro.put("titulo", titulo);
        logro.put("descripcion", descripcion);
        logro.put("requerido", requerido);
        logro.put("actual", actual);
        logro.put("recompensa", recompensa);
        return logro;
    }
}

