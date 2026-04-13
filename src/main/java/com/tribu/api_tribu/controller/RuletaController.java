package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.SaldoService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * CAMBIOS:
 * ❌ ANTES: usuario.setSaldoFavor(+premio) + movimientoSaldoRepository.save(...)
 * ✅ AHORA: saldoService.registrarPremioRuleta(...) → CLEARED inmediato + WS
 */
@RestController
@RequestMapping("/api/usuarios/ruleta")
@RequiredArgsConstructor
public class RuletaController {

    private final UsuarioRepository usuarioRepository;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final Random random = new Random();

    @PostMapping("/girar")
    @Transactional
    public ResponseEntity<Map<String, Object>> girarRuleta() {
        Usuario usuario = obtenerUsuarioAutenticado();

        LocalDateTime ultimoGiro = usuario.getFechaUltimoGiroRuleta();
        if (ultimoGiro != null && ultimoGiro.toLocalDate().isEqual(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "mensaje", "Ya has girado la ruleta hoy. Vuelve mañana."));
        }

        double premio = calcularPremioAleatorio();
        usuario.setFechaUltimoGiroRuleta(LocalDateTime.now());
        usuarioRepository.save(usuario);

        if (premio > 0) {
            // Ledger: crea movimiento CLEARED + sincroniza saldoFavor
            saldoService.registrarPremioRuleta(usuario, premio);

            // WebSocket: React anima monedas hacia la Tribu Card
            wsService.notificarSaldoActualizado(
                    usuario.getId(), premio, "RULETA",
                    "¡Ganaste $" + String.format("%.0f", premio) + " en la Ruleta Tribu!");
        }

        double nuevoSaldo = saldoService.consultarSaldoReal(usuario.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("premio", premio);
        result.put("nuevoSaldo", nuevoSaldo);
        return ResponseEntity.ok(result);
    }

    private double calcularPremioAleatorio() {
        int r = random.nextInt(100);
        if (r < 40) return 0.0;        // 40% → sin premio
        if (r < 70) return 1_000.0;    // 30% → $1.000
        if (r < 85) return 2_000.0;    // 15% → $2.000
        if (r < 95) return 5_000.0;    // 10% → $5.000
        return 10_000.0;               //  5% → $10.000
    }

    private Usuario obtenerUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }
}
