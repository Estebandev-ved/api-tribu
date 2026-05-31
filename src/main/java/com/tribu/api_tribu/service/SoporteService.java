package com.tribu.api_tribu.service;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.*;
import com.tribu.api_tribu.telegram.TelegramNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SoporteService {

    private final SoporteConversacionRepository conversacionRepository;
    private final SoporteMensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final DevolucionRepository devolucionRepository;
    private final TelegramNotificationService telegramService;
    private final EmailService emailService;

    @Transactional
    public SoporteConversacion iniciarConversacion(String emailUsuario, Long pedidoId) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

        // Buscar si ya tiene una conversación activa (no resuelta)
        List<SoporteConversacion> activas = conversacionRepository
                .findByUsuarioIdAndEstadoNotOrderByFechaActualizacionDesc(usuario.getId(), EstadoSoporte.RESUELTA);

        if (!activas.isEmpty()) {
            SoporteConversacion existente = activas.get(0);
            if (pedidoId != null && (existente.getPedido() == null || !existente.getPedido().getId().equals(pedidoId))) {
                pedidoRepository.findById(pedidoId).ifPresent(existente::setPedido);
                existente = conversacionRepository.save(existente);
            }
            return existente;
        }

        Pedido pedido = null;
        if (pedidoId != null) {
            pedido = pedidoRepository.findById(pedidoId).orElse(null);
        }

        SoporteConversacion nueva = SoporteConversacion.builder()
                .usuario(usuario)
                .pedido(pedido)
                .estado(EstadoSoporte.ACTIVA_IA)
                .build();

        nueva = conversacionRepository.save(nueva);

        // Mensaje inicial de la IA
        SoporteMensaje saludo = SoporteMensaje.builder()
                .conversacion(nueva)
                .remitente(RemitenteSoporte.IA)
                .contenido("¡Saludos, viajero! 🌿✨ Te doy la bienvenida al altar de la Tribu. " +
                        "Soy tu Guía de la Tribu en este viaje. " +
                        "Aquí cuidamos cada detalle de tu experiencia, desde tus ingredientes selectos hasta el ritual de entrega de tus pedidos.\n\n" +
                        "Dime, hermano, ¿en qué te puedo colaborar hoy con tus pedidos, puntos o devoluciones?")
                .confidence(1.0)
                .sentiment("NEUTRAL")
                .build();

        mensajeRepository.save(saludo);
        return nueva;
    }

    @Transactional
    public SoporteMensaje enviarMensajeUsuario(Long conversacionId, String contenido) {
        SoporteConversacion conversacion = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResourceNotFoundException("ConversacionSoporte", "id", conversacionId));

        if (conversacion.getEstado() == EstadoSoporte.RESUELTA) {
            conversacion.setEstado(EstadoSoporte.ACTIVA_IA);
            conversacion = conversacionRepository.save(conversacion);
        }

        // 1. Guardar mensaje del usuario
        String sentiment = analizarSentimiento(contenido);
        SoporteMensaje mensajeUsuario = SoporteMensaje.builder()
                .conversacion(conversacion)
                .remitente(RemitenteSoporte.USUARIO)
                .contenido(contenido)
                .sentiment(sentiment)
                .build();

        mensajeUsuario = mensajeRepository.save(mensajeUsuario);

        // 2. Analizar si requiere escalado humano
        boolean requiereEscalado = verificarTriggersEscalado(contenido, sentiment, conversacion);

        if (requiereEscalado) {
            escalarAHumano(conversacion, contenido, sentiment);
            
            SoporteMensaje mensajeSistema = SoporteMensaje.builder()
                    .conversacion(conversacion)
                    .remitente(RemitenteSoporte.IA)
                    .contenido("He transferido esta conversación a un agente de soporte humano. 🚨\n\n" +
                            "He notificado a los administradores. Un asesor revisará tu caso y te responderá muy pronto. " +
                            "También te llegará una notificación a tu correo electrónico cuando respondamos.")
                    .sentiment("NEUTRAL")
                    .confidence(1.0)
                    .build();
            
            return mensajeRepository.save(mensajeSistema);
        }

        // 3. Si no requiere escalado y está en ACTIVA_IA, responder con IA
        if (conversacion.getEstado() == EstadoSoporte.ACTIVA_IA) {
            String respuestaIa = generarRespuestaIA(conversacion, contenido);
            
            SoporteMensaje mensajeIa = SoporteMensaje.builder()
                    .conversacion(conversacion)
                    .remitente(RemitenteSoporte.IA)
                    .contenido(respuestaIa)
                    .sentiment("NEUTRAL")
                    .confidence(0.9)
                    .build();
            
            return mensajeRepository.save(mensajeIa);
        }

        return mensajeUsuario;
    }

    @Transactional
    public SoporteMensaje enviarMensajeAdmin(Long conversacionId, String contenido, String emailAdmin) {
        SoporteConversacion conversacion = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResourceNotFoundException("ConversacionSoporte", "id", conversacionId));

        Usuario admin = usuarioRepository.findByEmail(emailAdmin)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailAdmin));

        // Guardar respuesta del administrador
        SoporteMensaje mensajeAdmin = SoporteMensaje.builder()
                .conversacion(conversacion)
                .remitente(RemitenteSoporte.ADMIN)
                .contenido(contenido)
                .sentiment("PROFESSIONAL")
                .build();

        mensajeAdmin = mensajeRepository.save(mensajeAdmin);

        // Si estaba en IA, cambiar a ESCALADA_HUMANO ya que un humano intervino
        if (conversacion.getEstado() == EstadoSoporte.ACTIVA_IA) {
            conversacion.setEstado(EstadoSoporte.ESCALADA_HUMANO);
            conversacion.setMotivoEscalado("Intervención directa del administrador");
            conversacionRepository.save(conversacion);
        }

        // Notificar al usuario por correo que tiene una respuesta de soporte
        emailService.sendEmail(
                conversacion.getUsuario().getEmail(),
                "💬 Nueva respuesta a tu ticket de soporte #" + conversacionId,
                String.format("<!DOCTYPE html>\n<html><body style=\"font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px;\">" +
                        "<div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);\">" +
                        "<h2 style=\"color: #7c3aed;\">¡Tienes una nueva respuesta de soporte!</h2>" +
                        "<p>Hola <strong>%s</strong>,</p>" +
                        "<p>Un asesor de soporte humano ha respondido a tu consulta en Tribu:</p>" +
                        "<div style=\"background-color: #f3f4f6; padding: 15px; border-left: 4px solid #7c3aed; border-radius: 4px; font-style: italic; margin: 20px 0;\">" +
                        "\"%s\"" +
                        "</div>" +
                        "<p>Puedes ver toda la conversación e interactuar directamente desde tu perfil de usuario en el Centro de Ayuda.</p>" +
                        "<a href=\"http://localhost:3000/perfil\" style=\"display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;\">Ir a mi Perfil</a>" +
                        "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;\" />" +
                        "<p style=\"font-size: 12px; color: #9ca3af;\">Tribu E-commerce · Colombia</p>" +
                        "</div></body></html>", 
                        conversacion.getUsuario().getNombreCompleto(), 
                        contenido)
        );

        return mensajeAdmin;
    }

    @Transactional
    public SoporteConversacion resolverConversacion(Long conversacionId) {
        SoporteConversacion conversacion = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResourceNotFoundException("ConversacionSoporte", "id", conversacionId));

        conversacion.setEstado(EstadoSoporte.RESUELTA);
        conversacion = conversacionRepository.save(conversacion);

        SoporteMensaje mensajeSistema = SoporteMensaje.builder()
                .conversacion(conversacion)
                .remitente(RemitenteSoporte.IA)
                .contenido("Esta conversación ha sido marcada como resuelta por soporte. ✔️\n\n" +
                        "Si tienes alguna otra duda o inconveniente en el futuro, no dudes en iniciar un nuevo chat aquí. ¡Gracias por confiar en Tribu!")
                .sentiment("HAPPY")
                .confidence(1.0)
                .build();

        mensajeRepository.save(mensajeSistema);
        return conversacion;
    }

    public List<SoporteConversacion> getMisConversaciones(String emailUsuario) {
        return conversacionRepository.findByUsuarioEmailOrderByFechaActualizacionDesc(emailUsuario);
    }

    public List<SoporteConversacion> getConversacionesAdmin(EstadoSoporte estado) {
        if (estado != null) {
            return conversacionRepository.findByEstadoOrderByFechaActualizacionDesc(estado);
        }
        return conversacionRepository.findAllByOrderByFechaActualizacionDesc();
    }

    public List<SoporteMensaje> getMensajesConversacion(Long conversacionId, String emailSolicitante) {
        SoporteConversacion conversacion = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResourceNotFoundException("ConversacionSoporte", "id", conversacionId));

        Usuario solicitante = usuarioRepository.findByEmail(emailSolicitante)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailSolicitante));

        // Seguridad: Un cliente normal solo puede ver sus propias conversaciones. Los ADMIN y SOPORTE pueden ver todas.
        boolean isAdmin = solicitante.getRol() != null && 
                ("ADMIN".equalsIgnoreCase(solicitante.getRol().getNombre()) || "SOPORTE".equalsIgnoreCase(solicitante.getRol().getNombre()));
        
        if (!isAdmin && !conversacion.getUsuario().getId().equals(solicitante.getId())) {
            throw new IllegalArgumentException("No tienes permisos para ver esta conversación de soporte.");
        }

        return mensajeRepository.findByConversacionIdOrderByFechaCreacionAsc(conversacionId);
    }

    // ── Métodos Auxiliares de Inteligencia Artificial ────────────────────────────────

    private String analizarSentimiento(String contenido) {
        String texto = contenido.toLowerCase();
        if (texto.contains("enojado") || texto.contains("molesto") || texto.contains("mierda") ||
                texto.contains("puta") || texto.contains("puto") || texto.contains("estafa") ||
                texto.contains("robo") || texto.contains("fraude") || texto.contains("terrible") ||
                texto.contains("pesimo") || texto.contains("malo") || texto.contains("desastre") ||
                texto.contains("frustrado") || texto.contains("decepcionado") || texto.contains("lamentable")) {
            return "FRUSTRADO";
        }
        if (texto.contains("gracias") || texto.contains("excelente") || texto.contains("bueno") ||
                texto.contains("feliz") || texto.contains("perfecto") || texto.contains("super")) {
            return "POSITIVO";
        }
        return "NEUTRAL";
    }

    private boolean verificarTriggersEscalado(String contenido, String sentiment, SoporteConversacion conversacion) {
        String texto = contenido.toLowerCase();

        // Trigger 1: Solicitud explícita de agente humano
        if (texto.contains("humano") || texto.contains("agente") || texto.contains("persona") ||
                texto.contains("asesor") || texto.contains("admin") || texto.contains("soporte real") ||
                texto.contains("hablar con alguien") || texto.contains("llamada") || texto.contains("telefono")) {
            return true;
        }

        // Trigger 2: Sentimiento negativo/frustración detectado
        if ("FRUSTRADO".equals(sentiment)) {
            return true;
        }

        // Trigger 3: Conversación muy larga sin resolver (ej. más de 6 mensajes del usuario)
        long mensajesUsuario = conversacion.getMensajes().stream()
                .filter(m -> m.getRemitente() == RemitenteSoporte.USUARIO)
                .count();
        if (mensajesUsuario >= 6) {
            return true;
        }

        return false;
    }

    private void escalarAHumano(SoporteConversacion conversacion, String ultimoMensaje, String sentiment) {
        String motivo = "FRUSTRADO".equals(sentiment) ? "Detección de Frustración o Sentimiento Negativo" : "Solicitud explícita de Asesor Humano";
        
        conversacion.setEstado(EstadoSoporte.ESCALADA_HUMANO);
        conversacion.setMotivoEscalado(motivo);
        conversacionRepository.save(conversacion);

        Usuario usuario = conversacion.getUsuario();
        String pedidoContexto = conversacion.getPedido() != null ? "#" + conversacion.getPedido().getId() : "Ninguno";

        // 1. Alerta a Telegram
        telegramService.alertaSoporteEscalado(
                conversacion.getId(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                motivo,
                ultimoMensaje
        );

        // 2. Alerta a Correo de Soporte
        String emailHtml = String.format("<!DOCTYPE html>\n<html><body style=\"font-family: Arial, sans-serif; background-color: #0a0a0f; color: #f1f5f9; padding: 20px;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; background-color: #12121a; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 30px;\">" +
                "<h1 style=\"color: #ef4444; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;\">🚨 ALERTA: Ticket de Soporte Escalado</h1>" +
                "<p style=\"color: #94a3b8;\">La conversación de soporte de un cliente ha sido escalada automáticamente y requiere atención humana inmediata.</p>" +
                "<div style=\"background-color: #1a1a28; border-radius: 8px; padding: 20px; margin: 20px 0;\">" +
                "<p style=\"margin: 5px 0;\"><strong>Ticket ID:</strong> #%d</p>" +
                "<p style=\"margin: 5px 0;\"><strong>Cliente:</strong> %s (%s)</p>" +
                "<p style=\"margin: 5px 0;\"><strong>Pedido Relacionado:</strong> %s</p>" +
                "<p style=\"margin: 5px 0;\"><strong>Motivo del Escalado:</strong> %s</p>" +
                "</div>" +
                "<div style=\"background-color: #2e1010; border-left: 4px solid #ef4444; border-radius: 4px; padding: 15px; font-style: italic; margin-bottom: 20px;\">" +
                "\"%s\"" +
                "</div>" +
                "<a href=\"http://localhost:3000/admin/soporte\" style=\"display: inline-block; background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: 700;\">Atender en Panel Admin →</a>" +
                "</div></body></html>",
                conversacion.getId(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                pedidoContexto,
                motivo,
                ultimoMensaje
        );

        emailService.sendEmail("soporte@tribucard.com", "🚨 TICKET ESCALADO #" + conversacion.getId() + " - " + usuario.getNombreCompleto(), emailHtml);
        log.info("📢 Conversación #{} escalada a humano. Notificado por Telegram y Email.", conversacion.getId());
    }

    private String generarRespuestaIA(SoporteConversacion conversacion, String mensajeUsuario) {
        String texto = mensajeUsuario.toLowerCase();
        Usuario usuario = conversacion.getUsuario();
        String nombre = usuario.getNombreCompleto() != null ? usuario.getNombreCompleto() : "hermano";

        // --- CONTEXTO 1: PEDIDOS ---
        if (texto.contains("pedido") || texto.contains("compra") || texto.contains("orden") || 
                texto.contains("dónde está") || texto.contains("envio") || texto.contains("rastrear") || 
                texto.contains("guia") || texto.contains("seguimiento") || texto.contains("lleg")) {
            
            List<Pedido> pedidos = pedidoRepository.findByUsuarioOrderByFechaPedidoDesc(usuario);
            if (pedidos.isEmpty()) {
                return String.format("Saludos, %s. 🌿 He consultado los anales de la Tribu y veo que aún no has iniciado tu primer ritual de compra. " +
                        "No te preocupes, el viaje apenas comienza. Si necesitas ayuda para asegurar tus primeros ingredientes selectos, dímelo y prepararemos tu lugar en la mesa.", 
                        nombre);
            }

            Pedido ultimoPedido = pedidos.get(0);
            String estado = ultimoPedido.getEstado();
            String guia = ultimoPedido.getGuiaRastreo();

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Hermano %s, 📦 aquí tengo el estado de tu ritual de pedido más reciente en la comunidad:\n\n", nombre));
            sb.append(String.format("• **ID del Pedido:** #%d\n", ultimoPedido.getId()));
            sb.append(String.format("• **Fecha de inicio:** %s\n", ultimoPedido.getFechaPedido().toLocalDate()));
            sb.append(String.format("• **Valor del ritual:** %s pts\n", ultimoPedido.getTotal().toPlainString()));
            sb.append(String.format("• **Estado del Ritual:** %s\n", estado));

            if ("PAGADO".equalsIgnoreCase(estado)) {
                sb.append("• **Detalle:** Tus puntos ya han sido validados. Nuestro equipo está preparando tus productos. Debido a la alta demanda, el despacho tardará entre 4 a 6 días hábiles en llegar a tu destino.");
            } else if ("PENDIENTE".equalsIgnoreCase(estado)) {
                sb.append("• **Detalle:** Tu pedido está registrado en el altar, pero tus puntos aún no se han transferido. Recuerda subir tu comprobante de transferencia para asegurar tus productos antes de que expire la reserva de lote.");
            } else if ("ENVIADO".equalsIgnoreCase(estado)) {
                sb.append("• **Detalle:** ¡Tu paquete ha sido liberado e inició su viaje a tu destino!\n");
                if (guia != null && !guia.trim().isEmpty()) {
                    sb.append(String.format("• **Guía de Rastreo:** `%s` (Servientrega/Coordinadora)\n", guia));
                } else {
                    sb.append("• **Guía de Rastreo:** Tu guía está siendo sellada por el transportador. Te llegará una notificación en breve.\n");
                }
            } else if ("ENTREGADO".equalsIgnoreCase(estado)) {
                sb.append("• **Detalle:** El viaje ha finalizado con éxito y el paquete fue entregado. ¡Esperamos de corazón que disfrutes este ritual de sabor!");
            }

            if (pedidos.size() > 1) {
                sb.append(String.format("\n\nTienes otros %d rituales anteriores registrados en tu historial. Puedes contemplarlos todos en la sección 'Mis Pedidos' de tu perfil.", pedidos.size() - 1));
            }

            return sb.toString();
        }

        // --- CONTEXTO 2: DEVOLUCIONES ---
        if (texto.contains("devolucion") || texto.contains("devolver") || texto.contains("garantia") || 
                texto.contains("falla") || texto.contains("daño") || texto.contains("defectuoso") || 
                texto.contains("reembolso") || texto.contains("retorno")) {
            
            List<Devolucion> devoluciones = devolucionRepository.findByEmailOrderByFechaSolicitudDesc(usuario.getEmail());
            if (devoluciones.isEmpty()) {
                return String.format("Querido %s. ♻️ No encuentro ningún proceso de devolución activo para tu cuenta.\n\n" +
                        "Si alguno de tus selectos productos no llegó en el estado perfecto que mereces:\n" +
                        "1. Ve a la sección de **Devoluciones** en tu perfil.\n" +
                        "2. Selecciona el pedido correspondiente.\n" +
                        "3. Sube la evidencia física (foto o video).\n" +
                        "4. Nuestro consejo de la Tribu responderá en menos de 24 horas.\n\n" +
                        "Si el problema persiste, dímelo escribiendo 'Quiero hablar con soporte' para transferirte de inmediato.", 
                        nombre);
            }

            Devolucion ultima = devoluciones.get(0);
            return String.format("Querido %s. ♻️ He ubicado tu solicitud de devolución en curso:\n\n" +
                    "• **ID de Devolución:** #%d\n" +
                    "• **Ritual Original:** #%s\n" +
                    "• **Fecha de solicitud:** %s\n" +
                    "• **Estado actual:** **%s**\n" +
                    "• **Causa reportada:** %s\n\n" +
                    "**Siguientes pasos:** Nuestro equipo de artesanos está evaluando las pruebas de tu producto. Cuando sea aprobada, reintegraremos tus puntos automáticamente a tu billetera Tribu Card para que no pierdas ningún beneficio en tu experiencia.", 
                    nombre, 
                    ultima.getId(), 
                    ultima.getOrderNumber(), 
                    ultima.getFechaSolicitud().toLocalDate(), 
                    ultima.getEstado(), 
                    ultima.getReason());
        }

        // --- CONTEXTO 3: CASHBACK / TRIBU CARD / SALDO / PUNTOS ---
        if (texto.contains("cashback") || texto.contains("saldo") || texto.contains("billetera") || 
                texto.contains("tribu card") || texto.contains("tarjeta") || texto.contains("dinero") || 
                texto.contains("plata") || texto.contains("tier") || texto.contains("vip") || texto.contains("racha")) {
            
            String tierNombre = usuario.getTierActual() != null ? usuario.getTierActual().getNombre() : "Bronce";
            
            return String.format("Hermano %s. 💳 Permíteme mostrarte tu estatus actual y los puntos que posees en la comunidad:\n\n" +
                    "• **Tu Saldo de Puntos:** %,.0f pts\n" +
                    "• **Nivel de Estatus VIP:** **%s**\n" +
                    "• **Racha Activa:** %d días seguidos en comunidad\n\n" +
                    "**Tus dudas sobre los Puntos y Cashback:**\n" +
                    "• **¿Cómo los adquieres?** Al comprar ingredientes selectos, un porcentaje del total se acumula en puntos diferidos. Se liberan a tu cuenta **7 días después** de la entrega exitosa del paquete.\n" +
                    "• **¿Cómo los utilizas?** Son tuyos. En el checkout, selecciona 'Tribu Card' como método de pago para canjearlos al instante.\n" +
                    "• **¿Cómo escalas tu Estatus?** Mantén tu racha activa y participa de la comunidad. A mayor estatus, mayor será tu cashback de puntos en cada ritual.", 
                    nombre, 
                    usuario.getSaldoFavor(), 
                    tierNombre, 
                    usuario.getRachaActual());
        }

        // --- CONTEXTO 4: POLÍTICAS DE LA TIENDA ---
        if (texto.contains("politica") || texto.contains("envio") || texto.contains("costo") || 
                texto.contains("metodo de pago") || texto.contains("tiempo") || texto.contains("mocoa") || 
                texto.contains("putumayo") || texto.contains("cobertura")) {
            
            return "🌿 **Leyes y Leyendas de la Tribu:**\n\n" +
                    "• **Despachos:** Todos nuestros productos selectos se despachan directamente desde nuestra bodega central.\n" +
                    "• **Tiempos del viaje:** Debido a la altísima demanda de nuestros productos, los envíos a nivel nacional tienen un tiempo de entrega estimado de 4 a 6 días hábiles vía Servientrega o Coordinadora.\n" +
                    "• **Ritual de pago:** Aceptamos transferencias (Nequi, Bancolombia, Daviplata), contra entrega o tus puntos acumulados en la billetera Tribu Card.\n" +
                    "• **Devoluciones:** Si el ritual no cumplió tus expectativas, tienes hasta 5 días hábiles desde la entrega para reportarlo con tu evidencia fotográfica en tu perfil de usuario.";
        }

        // --- RESPUESTA DE CONFIANZA MEDIA/BAJA (Mantiene conversación viva o da pistas) ---
        return String.format("Hermano %s. Escucho tus palabras, pero me gustaría guiarte con absoluta precisión. 🌿✨\n\n" +
                "¿Tu consulta en este momento está vinculada con:\n" +
                "1. El transcurso de un **pedido** o envío de lote.\n" +
                "2. Una inconformidad o proceso de **devolución**.\n" +
                "3. Tu saldo de **puntos** acumulados o estatus VIP en Tribu Card.\n\n" +
                "Dime con libertad, o escribe 'Quiero hablar con soporte' para que un hermano humano de nuestro equipo guíe tu camino de inmediato.",
                nombre);
    }
}
