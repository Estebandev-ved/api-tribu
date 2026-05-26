package com.tribu.api_tribu.dto.response;

import com.tribu.api_tribu.model.MovimientoSaldo;

import java.time.LocalDateTime;

public record MovimientoSaldoAdminDTO(
        Long id,
        LocalDateTime fecha,
        Double monto,
        MovimientoSaldo.EstadoMovimiento estado,
        MovimientoSaldo.TipoMovimiento tipo,
        String descripcion,
        LocalDateTime unlockDate,
        Long pedidoId,
        Long usuarioId,
        String usuarioNombre,
        String usuarioEmail,
        String usuarioTelefono,
        String usuarioCiudad
) {}
