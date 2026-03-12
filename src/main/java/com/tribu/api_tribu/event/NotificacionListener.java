package com.tribu.api_tribu.event;

import com.tribu.api_tribu.model.NotificacionEvent;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.NotificacionRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificacionListener {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    @Async
    @EventListener
    public void manejarNotificacion(NotificacionEvent event) {
        log.info("🔔 Procesando notificación: {}", event.getTitulo());

        // 1. Guardar en Base de Datos
        // Si el evento ya viene con los datos, lo guardamos directamente
        notificacionRepository.save(event);

        // 2. Lógica de envío por Email (si aplica)
        try {
            Long usuarioId = Long.parseLong(event.getUsuarioId());
            Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);

            if (usuario != null) {
                switch (event.getTipo()) {
                    case "PEDIDO":
                        log.info("📧 Email de pedido ya enviado por PedidoService");
                        break;
                    case "DEVOLUCION":
                        // Si es aprobación, el email ya se envía en DevolucionService,
                        // pero podríamos enviar uno genérico aquí si es otro estado.
                        break;
                    default:
                        // Podríamos implementar un envío genérico aquí
                        log.info("📱 Notificación In-App registrada para usuario: {}", usuario.getEmail());
                        break;
                }
            }
        } catch (NumberFormatException e) {
            log.error("❌ Error al procesar ID de usuario: {}", event.getUsuarioId());
        }
    }
}
