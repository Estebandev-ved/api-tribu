package com.tribu.api_tribu.websocket;

import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Emite eventos WebSocket al frontend React cuando el saldo cambia.
 *
 * React escucha en /user/queue/saldo y recibe un JSON con:
 *   { tipo, monto, descripcion, nuevoSaldo }
 *
 * Esto dispara la animación "efecto dopamina": monedas volando hacia la
 * Tribu Card sin que el usuario recargue la página.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SaldoWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final MovimientoSaldoRepository movimientoRepo;

    /**
     * Notifica a un usuario específico que su saldo cambió.
     *
     * @param usuarioId  El ID del usuario destinatario
     * @param monto      Cuánto se acreditó (para mostrar en la animación)
     * @param tipo       Tipo de movimiento: "CASHBACK", "RULETA", "REFERIDO", etc.
     * @param descripcion Texto a mostrar en el toast/animación
     */
    public void notificarSaldoActualizado(Long usuarioId, double monto, String tipo, String descripcion) {
        double nuevoSaldo = movimientoRepo.calcularSaldoReal(usuarioId);

        Map<String, Object> payload = Map.of(
                "tipo",        tipo,
                "monto",       monto,
                "descripcion", descripcion != null ? descripcion : "",
                "nuevoSaldo",  nuevoSaldo
        );

        // Spring enruta esto a /user/{usuarioId}/queue/saldo
        // En React: client.subscribe('/user/queue/saldo', callback)
        messagingTemplate.convertAndSendToUser(
                usuarioId.toString(),
                "/queue/saldo",
                payload
        );

        log.info("📡 WS → usuario {}: +{} pts ({})", usuarioId, monto, tipo);
    }

    /**
     * Broadcast general: notifica a todos los usuarios conectados.
     * Útil para eventos globales (ej: sorteo especial de la plataforma).
     */
    public void broadcast(String tipo, String mensaje) {
        messagingTemplate.convertAndSend("/topic/tribu",
                Map.of("tipo", tipo, "mensaje", mensaje));
    }
}