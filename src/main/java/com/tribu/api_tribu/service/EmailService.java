package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.FacturaElectronica;
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
   * Envía email para campaña de marketing.
   */
  @Async
  public void enviarCampanaMarketing(String toEmail, String nombre, String titulo, String cuerpo) {
    String subject = "📣 " + titulo;
    String html = buildEmailHtml(
        titulo,
        "Hola <strong>" + nombre + "</strong>",
        cuerpo,
        "Gracias por ser parte de Tribu.",
        "Ver más",
        "http://localhost:3000");
    sendEmail(toEmail, subject, html);
  }

  /**
   * Envía email de carrito abandonado - Primer recordatorio (suave).
   */
  @Async
  public void enviarCarritoAbandonado1(String toEmail, String nombre, String productosHtml, Double saldo) {
    String subject = "¡Olvidaste algo! 🛒";
    String html = """
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:12px 24px;">
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <div style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;margin-bottom:24px;">
              <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0 0 12px 0;">¡Hola <strong>%s</strong>!</h1>
              <p style="color:#94a3b8;font-size:15px;margin:0 0 20px 0;">Vimos que dejaste algunos productos en tu carrito. ¿Te gustaría completar tu compra?</p>
              <div style="background:#1a1a28;border-radius:12px;padding:20px;margin-bottom:20px;">
                %s
              </div>
              <p style="color:#f1f5f9;font-size:15px;margin:0 0 10px 0;">💰 Tu saldo disponible en Tribu Card: <strong>$%.0f</strong></p>
              <a href="http://localhost:3000/carrito" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9f67ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:700;font-size:15px;">Completar mi compra →</a>
            </div>
            <p style="text-align:center;color:#334155;font-size:12px;">
              © 2025 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#7c3aed;">tribu.com</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(nombre, productosHtml, saldo);
    sendEmail(toEmail, subject, html);
  }

  /**
   * Envía email de carrito abandonado - Segundo recordatorio (urgente).
   */
  @Async
  public void enviarCarritoAbandonado2(String toEmail, String nombre, String productosHtml, String tierNombre, Double descuento) {
    String subject = "⏰ Última oportunidad - Tu descuento expira";
    String html = """
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#ef4444,#f97316);border-radius:16px;padding:12px 24px;">
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <div style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;margin-bottom:24px;">
              <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0 0 12px 0;">Hola <strong>%s</strong>, última oportunidad</h1>
              <p style="color:#94a3b8;font-size:15px;margin:0 0 20px 0;">Como miembro <strong>%s</strong>, te damos <span style="color:#22c55e;font-weight:bold;">$%.0f de descuento extra</span> si completas tu compra hoy.</p>
              <div style="background:#1a1a28;border-radius:12px;padding:20px;margin-bottom:20px;">
                %s
              </div>
              <div style="background:#22c55e20;border:1px solid #22c55e;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
                <p style="color:#22c55e;font-size:18px;font-weight:bold;margin:0;">¡Usa el código TRIBU2024 para aplicar tu descuento!</p>
              </div>
              <a href="http://localhost:3000/carrito" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:700;font-size:15px;">Completar mi compra ahora →</a>
            </div>
            <p style="text-align:center;color:#334155;font-size:12px;">
              © 2025 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#7c3aed;">tribu.com</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(nombre, tierNombre, descuento, productosHtml);
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

  public void enviarFactura(String toEmail, FacturaElectronica factura, String pdfPath) {
    String subject = "📄 Tu factura electrónica - " + factura.getNumeroFactura();
    String html = """
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:12px 24px;">
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <div style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;margin-bottom:24px;">
              <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0 0 12px 0;">Tu factura está lista</h1>
              <p style="color:#94a3b8;font-size:15px;margin:0 0 20px 0;">Tu factura electrónica ha sido generada exitosamente.</p>
              <div style="background:#1a1a28;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="color:#f1f5f9;font-size:15px;margin:0;">📄 <strong>Factura:</strong> %s</p>
                <p style="color:#f1f5f9;font-size:15px;margin:10px 0 0 0;">💰 <strong>Total:</strong> $%.0f</p>
              </div>
              <p style="color:#64748b;font-size:14px;margin:0 0 28px 0;">El PDF de tu factura está adjunto a este correo.</p>
              <a href="http://localhost:3000/mis-facturas" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9f67ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:700;font-size:15px;">Ver mis facturas →</a>
            </div>
            <p style="text-align:center;color:#334155;font-size:12px;">
              © 2025 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#7c3aed;">tribu.com</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(factura.getNumeroFactura(), factura.getTotal());

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(fromEmail);
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setText(html, true);
      
      java.io.File file = new java.io.File(pdfPath);
      if (file.exists()) {
        helper.addAttachment("factura_" + factura.getNumeroFactura() + ".pdf", file);
      }
      
      mailSender.send(message);
      log.info("📧 Factura {} enviada a {}", factura.getNumeroFactura(), toEmail);
    } catch (Exception e) {
      log.error("❌ Error enviando factura a {}: {}", toEmail, e.getMessage());
    }
  }

  public void sendEmail(String to, String subject, String html) {
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

  /**
   * Envía email de restablecimiento de contraseña.
   * Seguridad: el enlace contiene un token UUID aleatorio que expira en 15 minutos.
   * El token solo es válido para el email especificado.
   */
  @Async
  public void enviarResetPassword(String toEmail, String nombreCliente, String resetLink) {
    String subject = "🔐 Restablece tu contraseña — Tribu";
    String html = """
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:12px 24px;">
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <div style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;margin-bottom:24px;">
              <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0 0 12px 0;">🔐 Restablecer Contraseña</h1>
              <p style="color:#94a3b8;font-size:15px;margin:0 0 20px 0;">Hola <strong>%s</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta Tribu.</p>
              <div style="background:#1a1a28;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="color:#f1f5f9;font-size:14px;margin:0;">⏱️ Este enlace es válido por <strong>15 minutos</strong> y solo puede usarse <strong>una vez</strong>.</p>
                <p style="color:#94a3b8;font-size:13px;margin:8px 0 0 0;">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.</p>
              </div>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9f67ff);color:#fff;text-decoration:none;padding:16px 40px;border-radius:9999px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
                  Restablecer mi contraseña →
                </a>
              </div>
              <p style="color:#475569;font-size:12px;margin:0;word-break:break-all;">O copia este enlace en tu navegador:<br><span style="color:#7c3aed;">%s</span></p>
            </div>
            <p style="text-align:center;color:#334155;font-size:12px;">
              © 2025 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#7c3aed;">tribu.com</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(nombreCliente, resetLink, resetLink);
    sendEmail(toEmail, subject, html);
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
