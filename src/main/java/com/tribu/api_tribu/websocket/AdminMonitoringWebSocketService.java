package com.tribu.api_tribu.websocket;

import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.TransferenciaP2P;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AdminMonitoringWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public AdminMonitoringWebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void emitirMovimiento(MovimientoSaldo m) {
        if (m == null) return;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", m.getId());
        payload.put("fecha", m.getFecha());
        payload.put("monto", m.getMonto());
        payload.put("estado", m.getEstado());
        payload.put("tipo", m.getTipo());
        payload.put("descripcion", m.getDescripcion());
        payload.put("unlockDate", m.getUnlockDate());
        payload.put("pedidoId", m.getPedidoId());

        if (m.getUsuario() != null) {
            payload.put("usuarioId", m.getUsuario().getId());
            payload.put("usuarioNombre", m.getUsuario().getNombreCompleto());
            payload.put("usuarioEmail", m.getUsuario().getEmail());
            payload.put("usuarioTelefono", m.getUsuario().getTelefono());
            payload.put("usuarioCiudad", m.getUsuario().getCiudad());
        }

        messagingTemplate.convertAndSend("/topic/admin/tribu-card", payload);
    }

    public void emitirTransferencia(TransferenciaP2P t) {
        if (t == null) return;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", t.getId());
        payload.put("fechaCreacion", t.getFechaCreacion());
        payload.put("fechaCompletada", t.getFechaCompletada());
        payload.put("monto", t.getMonto());
        payload.put("mensaje", t.getMensaje());
        payload.put("estado", t.getEstado());
        payload.put("referenciaUnica", t.getReferenciaUnica());

        if (t.getEmisor() != null) {
            payload.put("emisorId", t.getEmisor().getId());
            payload.put("emisorNombre", t.getEmisor().getNombreCompleto());
            payload.put("emisorEmail", t.getEmisor().getEmail());
        }

        if (t.getReceptor() != null) {
            payload.put("receptorId", t.getReceptor().getId());
            payload.put("receptorNombre", t.getReceptor().getNombreCompleto());
            payload.put("receptorEmail", t.getReceptor().getEmail());
        }

        payload.put("movimientoEmisorId", t.getMovimientoEmisor() != null ? t.getMovimientoEmisor().getId() : null);
        payload.put("movimientoReceptorId", t.getMovimientoReceptor() != null ? t.getMovimientoReceptor().getId() : null);

        messagingTemplate.convertAndSend("/topic/admin/transferencias", payload);
    }
}
