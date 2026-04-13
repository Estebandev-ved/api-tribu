package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios/perfil")
@RequiredArgsConstructor
public class UsuarioPerfilController {

    private final UsuarioRepository usuarioRepository;
    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final PedidoRepository pedidoRepository;

    private Usuario obtenerUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }

    // Obtener Perfil del Usuario Autenticado
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMiPerfil() {
        Usuario u = obtenerUsuarioAutenticado();

        // Generación "Just-in-time" para usuarios antiguos que no tienen código
        if (u.getCodigoReferido() == null || u.getCodigoReferido().isBlank()) {
            String newCode = "TRIBU-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
            u.setCodigoReferido(newCode);
            usuarioRepository.save(u);
        }

        // Calcular gasto del mes actual para el frontend
        java.time.YearMonth mesActual = java.time.YearMonth.now();
        java.time.LocalDateTime inicio = mesActual.atDay(1).atStartOfDay();
        java.time.LocalDateTime fin = mesActual.atEndOfMonth().atTime(23, 59, 59);
        Double gastadoMes = pedidoRepository.calculateTotalValidoTierEnPeriodo(u.getId(), inicio, fin);

        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("nombreCompleto", u.getNombreCompleto());
        m.put("email", u.getEmail());
        m.put("telefono", u.getTelefono() != null ? u.getTelefono() : "");
        m.put("direccion", u.getDireccion() != null ? u.getDireccion() : "");
        
        Double saldoReal = movimientoSaldoRepository.calcularSaldoReal(u.getId());
        m.put("saldoFavor", saldoReal != null ? saldoReal : 0.0);
        m.put("fechaUltimoGiroRuleta", u.getFechaUltimoGiroRuleta());
        m.put("nivelVip", u.getNivelVip() != null ? u.getNivelVip() : 1);
        m.put("gastadoMes", gastadoMes != null ? gastadoMes : 0.0);
        
        // Resolver nombre del tier
        String tierName = u.getTierActual() != null ? u.getTierActual().getNombre() : 
                        (u.getNivelVip() == 3 ? "ORO" : u.getNivelVip() == 2 ? "PLATA" : "BRONCE");
        m.put("tier", tierName);
        m.put("codigoReferido", u.getCodigoReferido());

        return ResponseEntity.ok(m);
    }

    // Actualizar Perfil del Usuario Autenticado
    @PutMapping
    public ResponseEntity<Map<String, Object>> actualizarMiPerfil(@RequestBody Map<String, String> payload) {
        Usuario u = obtenerUsuarioAutenticado();

        if (payload.containsKey("nombreCompleto")) {
            u.setNombreCompleto(payload.get("nombreCompleto"));
        }
        if (payload.containsKey("telefono")) {
            u.setTelefono(payload.get("telefono"));
        }
        if (payload.containsKey("direccion")) {
            u.setDireccion(payload.get("direccion"));
        }

        usuarioRepository.save(u);

        Map<String, Object> m = new HashMap<>();
        m.put("mensaje", "Perfil actualizado correctamente");
        m.put("nombreCompleto", u.getNombreCompleto());
        m.put("telefono", u.getTelefono() != null ? u.getTelefono() : "");
        m.put("direccion", u.getDireccion() != null ? u.getDireccion() : "");

        return ResponseEntity.ok(m);
    }

    // Historial de Movimientos del Usuario Autenticado
    @GetMapping("/movimientos")
    public ResponseEntity<List<MovimientoSaldo>> getMisMovimientos() {
        Usuario u = obtenerUsuarioAutenticado();
        List<MovimientoSaldo> movimientos = movimientoSaldoRepository.findByUsuarioIdOrderByFechaDesc(u.getId());
        return ResponseEntity.ok(movimientos);
    }
}
