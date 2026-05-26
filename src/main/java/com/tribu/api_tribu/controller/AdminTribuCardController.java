package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.response.MovimientoSaldoAdminDTO;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tribu-card")
@RequiredArgsConstructor
public class AdminTribuCardController {

    private final MovimientoSaldoRepository movimientoSaldoRepository;

    @GetMapping("/movimientos")
    public ResponseEntity<Map<String, Object>> listarMovimientos(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) MovimientoSaldo.EstadoMovimiento estado,
            @RequestParam(required = false) MovimientoSaldo.TipoMovimiento tipo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        String query = (q != null && !q.trim().isEmpty()) ? q.trim() : null;
        int safeSize = Math.min(Math.max(size, 5), 200);
        int safePage = Math.max(page, 0);

        PageRequest pr = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "fecha"));
        Page<MovimientoSaldoAdminDTO> result = movimientoSaldoRepository.buscarAdmin(query, estado, tipo, pr);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", result.getContent());
        body.put("page", result.getNumber());
        body.put("size", result.getSize());
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages", result.getTotalPages());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/resumen")
    public ResponseEntity<Map<String, Object>> resumen() {
        Map<String, Object> body = new LinkedHashMap<>();

        body.put("pendientesDeLiberar", movimientoSaldoRepository.countPendientesDeLiberar());
        body.put("clearedCashback", movimientoSaldoRepository.sumPorTipo(MovimientoSaldo.TipoMovimiento.CASHBACK));
        body.put("clearedRuleta", movimientoSaldoRepository.sumPorTipo(MovimientoSaldo.TipoMovimiento.ROULETTE_REWARD));
        body.put("clearedReferidos", movimientoSaldoRepository.sumPorTipo(MovimientoSaldo.TipoMovimiento.REFERRAL_BONUS));
        body.put("clearedBienvenida", movimientoSaldoRepository.sumPorTipo(MovimientoSaldo.TipoMovimiento.WELCOME_BONUS));
        body.put("clearedTransferEnviada", movimientoSaldoRepository.sumPorTipo(MovimientoSaldo.TipoMovimiento.TRANSFERENCIA_ENVIADA));
        body.put("clearedTransferRecibida", movimientoSaldoRepository.sumPorTipo(MovimientoSaldo.TipoMovimiento.TRANSFERENCIA_RECIBIDA));
        body.put("clearedCompra", movimientoSaldoRepository.sumPorTipo(MovimientoSaldo.TipoMovimiento.PURCHASE));

        // Señal rápida: conteo de movimientos en las últimas 24h
        LocalDateTime desde = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
        body.put("movimientos24h", movimientoSaldoRepository.countDesde(desde));

        return ResponseEntity.ok(body);
    }
}
