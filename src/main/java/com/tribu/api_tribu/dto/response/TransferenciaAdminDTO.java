package com.tribu.api_tribu.dto.response;

import com.tribu.api_tribu.model.TransferenciaP2P;

import java.time.LocalDateTime;

public record TransferenciaAdminDTO(
        Long id,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaCompletada,
        Double monto,
        String mensaje,
        TransferenciaP2P.EstadoTransferencia estado,
        String referenciaUnica,

        Long emisorId,
        String emisorNombre,
        String emisorEmail,

        Long receptorId,
        String receptorNombre,
        String receptorEmail,

        Long movimientoEmisorId,
        Long movimientoReceptorId
) {}
