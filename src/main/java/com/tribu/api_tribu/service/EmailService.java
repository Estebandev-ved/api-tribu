package com.tribu.api_tribu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  /**
   * Envía email de confirmación al crear un pedido.
   */
  @Async
  public void enviarConfirmacionPedido(String toEmail, String nombreCliente,
      Long pedidoId, String total) {
    String subject = "✅ Pedido #" + pedidoId + " confirmado — Tribu";
    String html = buildEmailHtml(
        "¡Pedido confirmado, " + nombreCliente + "!",
        "Tu pedido <strong>#" + pedidoId + "</strong> fue recibido exitosamente.",
        "💰 Total: <strong>" + total + "</strong>",
        "Estamos preparando tu pedido desde Mocoa, Putumayo. Te avisaremos cuando sea despachado.",
        "Ver mis pedidos",
        "http://localhost:3000/mis-pedidos");
    sendEmail(toEmail, subject, html);
  }

  /**
   * Envía email cuando el estado de un pedido cambia.
   */
  @Async
  public void enviarCambioEstado(String toEmail, String nombreCliente,
      Long pedidoId, String nuevoEstado, String guiaRastreo) {
    String emoji = switch (nuevoEstado) {
      case "PAGADO" -> "💳";
      case "ENVIADO" -> "🚚";
      case "ENTREGADO" -> "📦";
      default -> "📋";
    };
    String subject = emoji + " Tu pedido #" + pedidoId + " está " + nuevoEstado;
    String detalle = nuevoEstado.equals("ENVIADO") && guiaRastreo != null
        ? "Esta en camino. Guía de rastreo: <strong>" + guiaRastreo + "</strong>"
        : "El estado de tu pedido fue actualizado a <strong>" + nuevoEstado + "</strong>.";

    String html = buildEmailHtml(
        emoji + " Pedido #" + pedidoId + " — " + nuevoEstado,
        "Hola <strong>" + nombreCliente + "</strong>, tu pedido cambió de estado.",
        detalle,
        nuevoEstado.equals("ENTREGADO")
            ? "¡Gracias por comprar en Tribu! Esperamos que disfrutes tu producto. 🎉"
            : "Te notificaremos en cada paso del camino.",
        "Ver mi pedido",
        "http://localhost:3000/mis-pedidos");
    sendEmail(toEmail, subject, html);
  }

  /**
   * Envía email de confirmación al crear una solicitud de devolución.
   */
  @Async
  public void enviarConfirmacionDevolucion(String toEmail, Long devolucionId, String orderNumber) {
    String subject = "♻️ Solicitud de Devolución Recibida — Pedido #" + orderNumber;
    String html = buildEmailHtml(
        "¡Solicitud Recibida!",
        "Hemos recibido tu solicitud de devolución para el pedido <strong>#" + orderNumber + "</strong>.",
        "👨‍💻 Nuestro equipo revisará tu caso a la brevedad posible. Te notificaremos cuando haya una actualización sobre el estado de tu devolución.",
        "Tiempo estimado de respuesta: 24-48 horas hábiles.",
        "Ir a la tienda",
        "http://localhost:3000");
    sendEmail(toEmail, subject, html);
  }

  /**
   * Envía email cuando el estado de una devolución cambia.
   */
  @Async
  public void enviarCambioEstadoDevolucion(String toEmail, Long devolucionId, String orderNumber, String nuevoEstado) {
    String emoji = switch (nuevoEstado) {
      case "APROBADA" -> "✅";
      case "RECHAZADA" -> "❌";
      case "COMPLETADA" -> "🎉";
      default -> "📋";
    };

    String subject = emoji + " Actualización sobre tu Devolución — Pedido #" + orderNumber;

    String instruccion = switch (nuevoEstado) {
      case "APROBADA" ->
        "Por favor, empaca el producto en su caja original y envíalo a nuestra bodega principal en Mocoa. Los costos de envío serán reembolsados si aplica la garantía.";
      case "RECHAZADA" ->
        "Lamentablemente tu solicitud no cumple con nuestras políticas de garantía (ej. daño por mal uso). Revisa los detalles en nuestras políticas web.";
      case "COMPLETADA" ->
        "Hemos finalizado el proceso de tu devolución exitosamente. ¡Gracias por confiar en nosotros!";
      default -> "El estado de tu solicitud ha sido actualizado a: " + nuevoEstado;
    };

    String html = buildEmailHtml(
        emoji + " Devolución " + nuevoEstado,
        "Actualización de tu solicitud para el pedido <strong>#" + orderNumber + "</strong>.",
        instruccion,
        "Si tienes dudas, puedes responder a este correo.",
        "Ver políticas",
        "http://localhost:3000/politicas");
    sendEmail(toEmail, subject, html);
  }

  private void sendEmail(String to, String subject, String html) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(fromEmail);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(html, true);
      mailSender.send(message);
      log.info("📧 Email enviado a {}: {}", to, subject);
    } catch (Exception e) {
      // No fallar la operación principal si el email falla
      log.error("❌ Error enviando email a {}: {}", to, e.getMessage());
    }
  }

  private String buildEmailHtml(String titulo, String subtitulo, String cuerpo,
      String nota, String btnTexto, String btnUrl) {
    return """
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:12px 24px;">
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <!-- Card -->
            <div style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;margin-bottom:24px;">
              <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0 0 12px 0;">%s</h1>
              <p style="color:#94a3b8;font-size:15px;margin:0 0 20px 0;">%s</p>
              <div style="background:#1a1a28;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="color:#f1f5f9;font-size:15px;margin:0;">%s</p>
              </div>
              <p style="color:#64748b;font-size:14px;margin:0 0 28px 0;">%s</p>
              <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9f67ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:700;font-size:15px;">%s →</a>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#334155;font-size:12px;">
              © 2025 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#7c3aed;">tribu.com</a>
            </p>
          </div>
        </body>
        </html>
        """
        .formatted(titulo, subtitulo, cuerpo, nota, btnUrl, btnTexto);
  }
}
