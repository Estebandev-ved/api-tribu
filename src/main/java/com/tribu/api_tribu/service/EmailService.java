package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.FacturaElectronica;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  @Value("${resend.api.key}")
  private String resendApiKey;

  @Value("${resend.from.seguridad}")
  private String resendFromSeguridad;

  @Value("${resend.from.pedidos}")
  private String resendFromPedidos;

  @Value("${resend.from.facturas}")
  private String resendFromFacturas;

  @Value("${resend.from.marketing}")
  private String resendFromMarketing;


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
    sendEmail(resendFromPedidos, toEmail, subject, html);
  }

  /**
   * Envía email cuando el estado de un pedido cambia.
   */
  @Async
  public void enviarCambioEstado(String toEmail, String nombreCliente,
      Long pedidoId, String nuevoEstado, String guiaRastreo) {
    String emoji = switch (nuevoEstado) {
      case "PAGADO" -> "💳";
      case "PENDIENTE_ENTREGA" -> "🏠";
      case "ENVIADO" -> "🚚";
      case "ENTREGADO" -> "📦";
      default -> "📋";
    };
    String subject = emoji + " Tu pedido #" + pedidoId + " está " + nuevoEstado;
    String detalle = switch (nuevoEstado) {
      case "ENVIADO" -> guiaRastreo != null
          ? "Está en camino. Guía de rastreo: <strong>" + guiaRastreo + "</strong>"
          : "Tu pedido ya fue despachado y está en camino.";
      case "PENDIENTE_ENTREGA" ->
          "Tu pedido fue recibido y está siendo preparado. <strong>Recuerda tener el dinero listo</strong> para cuando llegue el domiciliario — puedes pagar en efectivo, Nequi o Daviplata.";
      default -> "El estado de tu pedido fue actualizado a <strong>" + nuevoEstado + "</strong>.";
    };

    String html = buildEmailHtml(
        emoji + " Pedido #" + pedidoId + " — " + nuevoEstado,
        "Hola <strong>" + nombreCliente + "</strong>, tu pedido cambió de estado.",
        detalle,
        nuevoEstado.equals("ENTREGADO")
            ? "¡Gracias por comprar en Tribu! Esperamos que disfrutes tu producto. 🎉"
            : "Te notificaremos en cada paso del camino.",
        "Ver mi pedido",
        "http://localhost:3000/mis-pedidos");
    sendEmail(resendFromPedidos, toEmail, subject, html);
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
    sendEmail(resendFromPedidos, toEmail, subject, html);
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
    sendEmail(resendFromMarketing, toEmail, subject, html);
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
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#111111;font-family:'Sora','Inter',Arial,sans-serif;color:#F5F5F5;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FEE715);border-radius:12px;padding:12px 28px;box-shadow:0 4px 20px rgba(255, 87, 34, 0.25);">
                <span style="color:#111111;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <!-- Card -->
            <div style="background:#1A1A1A;border:1px solid rgba(255, 87, 34, 0.15);border-radius:20px;padding:36px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <h1 style="color:#F5F5F5;font-size:24px;font-weight:800;margin:0 0 12px 0;">¡Hola <strong>%s</strong>!</h1>
              <p style="color:#999999;font-size:15px;margin:0 0 24px 0;line-height:1.6;">Vimos que dejaste algunos productos en tu carrito de Tribu. ¡Te los guardamos para que no te los pierdas!</p>
              
              <div style="background:#222222;border:1px solid rgba(255, 255, 255, 0.04);border-radius:12px;padding:20px;margin-bottom:24px;">
                %s
              </div>
              
              <p style="color:#00C896;font-size:16px;font-weight:800;margin:0 0 24px 0;text-align:center;">💰 Saldo en tu Billetera Tribu: <strong>$%.0f</strong></p>
              
              <div style="text-align:center;">
                <a href="http://localhost:3000/carrito" style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FF8A50);color:#FFFFFF;text-decoration:none;padding:15px 36px;border-radius:9999px;font-weight:800;font-size:15px;box-shadow:0 4px 15px rgba(255,87,34,0.3);transition:all 0.2s ease;">
                  Completar mi compra →
                </a>
              </div>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#555555;font-size:12px;line-height:1.5;">
              © 2026 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#FF5722;text-decoration:none;font-weight:600;">tribucol.shop</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(nombre, productosHtml, saldo);
    sendEmail(resendFromMarketing, toEmail, subject, html);
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
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#111111;font-family:'Sora','Inter',Arial,sans-serif;color:#F5F5F5;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FEE715);border-radius:12px;padding:12px 28px;box-shadow:0 4px 20px rgba(255, 87, 34, 0.25);">
                <span style="color:#111111;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <!-- Card -->
            <div style="background:#1A1A1A;border:1px solid rgba(254, 231, 21, 0.25);border-radius:20px;padding:36px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <h1 style="color:#FEE715;font-size:24px;font-weight:800;margin:0 0 12px 0;">¡Última oportunidad, %s! ⏰</h1>
              <p style="color:#999999;font-size:15px;margin:0 0 20px 0;line-height:1.6;">Como miembro distinguido del tier <strong>%s</strong>, te otorgamos <span style="color:#00C896;font-weight:800;">$%.0f de descuento adicional</span> si completas tu compra en las próximas horas.</p>
              
              <div style="background:#222222;border:1px solid rgba(255, 255, 255, 0.04);border-radius:12px;padding:20px;margin-bottom:20px;">
                %s
              </div>
              
              <div style="background:rgba(0, 200, 150, 0.12);border:1px solid #00C896;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
                <p style="color:#00C896;font-size:16px;font-weight:900;margin:0;letter-spacing:0.5px;">💎 Código de Descuento Especial: <br><span style="font-size:20px;color:#FFFFFF;background:#1A1A1A;padding:4px 12px;border-radius:6px;display:inline-block;margin-top:8px;border:1px dashed #00C896;">TRIBU2024</span></p>
              </div>
              
              <div style="text-align:center;">
                <a href="http://localhost:3000/carrito" style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FF8A50);color:#FFFFFF;text-decoration:none;padding:15px 36px;border-radius:9999px;font-weight:800;font-size:15px;box-shadow:0 4px 15px rgba(255,87,34,0.3);transition:all 0.2s ease;">
                  Completar mi compra ahora →
                </a>
              </div>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#555555;font-size:12px;line-height:1.5;">
              © 2026 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#FF5722;text-decoration:none;font-weight:600;">tribucol.shop</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(nombre, tierNombre, descuento, productosHtml);
    sendEmail(resendFromMarketing, toEmail, subject, html);
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
    sendEmail(resendFromPedidos, toEmail, subject, html);
  }

  public void enviarFactura(String toEmail, FacturaElectronica factura, String pdfPath) {
    String subject = "📄 Tu factura electrónica - " + factura.getNumeroFactura();
    String html = """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#111111;font-family:'Sora','Inter',Arial,sans-serif;color:#F5F5F5;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FEE715);border-radius:12px;padding:12px 28px;box-shadow:0 4px 20px rgba(255, 87, 34, 0.25);">
                <span style="color:#111111;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <!-- Card -->
            <div style="background:#1A1A1A;border:1px solid rgba(255, 87, 34, 0.15);border-radius:20px;padding:36px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <h1 style="color:#F5F5F5;font-size:24px;font-weight:800;margin:0 0 12px 0;">Tu factura está listo 📄</h1>
              <p style="color:#999999;font-size:15px;margin:0 0 20px 0;line-height:1.6;">Tu factura electrónica ha sido generada exitosamente por Tribu E-commerce.</p>
              
              <div style="background:#222222;border:1px solid rgba(255, 255, 255, 0.04);border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="color:#F5F5F5;font-size:15px;margin:0;line-height:1.5;">📄 <strong>Factura:</strong> <span style="color:#FF5722;font-weight:700;">%s</span></p>
                <p style="color:#F5F5F5;font-size:15px;margin:10px 0 0 0;line-height:1.5;">💰 <strong>Total:</strong> <span style="color:#00C896;font-weight:800;">$%.0f</span></p>
              </div>
              
              <p style="color:#555555;font-size:13px;margin:0 0 28px 0;line-height:1.5;">El documento PDF de tu factura electrónica ha sido adjuntado a este correo electrónico.</p>
              
              <div style="text-align:center;">
                <a href="http://localhost:3000/mis-facturas" style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FF8A50);color:#FFFFFF;text-decoration:none;padding:15px 36px;border-radius:9999px;font-weight:800;font-size:15px;box-shadow:0 4px 15px rgba(255,87,34,0.3);transition:all 0.2s ease;">
                  Ver mis facturas →
                </a>
              </div>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#555555;font-size:12px;line-height:1.5;">
              © 2026 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#FF5722;text-decoration:none;font-weight:600;">tribucol.shop</a>
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
    sendEmail(resendFromPedidos, to, subject, html);
  }

  public void sendEmail(String from, String to, String subject, String html) {
    if (resendApiKey != null && !resendApiKey.isEmpty() && !resendApiKey.equals("re_default")) {
      try {
        log.info("📤 Enviando email vía Resend API a {}: {}", to, subject);
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> body = Map.of(
            "from", from != null ? from : resendFromPedidos,
            "to", List.of(to),
            "subject", subject,
            "html", html
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity("https://api.resend.com/emails", entity, String.class);
        
        if (response.getStatusCode().is2xxSuccessful()) {
          log.info("📧 Email enviado exitosamente vía Resend API a {}", to);
          return;
        } else {
          log.error("❌ Falló el envío vía Resend API (código: {}): {}. Intentando fallback SMTP...", 
              response.getStatusCode(), response.getBody());
        }
      } catch (Exception e) {
        log.error("❌ Error en Resend API: {}. Intentando fallback SMTP...", e.getMessage());
      }
    }

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(fromEmail);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(html, true);
      mailSender.send(message);
      log.info("📧 Email enviado a {} vía SMTP: {}", to, subject);
    } catch (Exception e) {
      // No fallar la operación principal si el email falla
      log.error("❌ Error definitivo enviando email a {}: {}", to, e.getMessage());
    }
  }

  /**
   * Envía una alerta de inicio de sesión de seguridad.
   */
  @Async
  public void enviarAlertaInicioSesion(String toEmail, String nombreCliente, String ipAddress, String userAgent) {
    String deviceSummary = parseUserAgent(userAgent);
    String dateStr = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
        .format(java.time.LocalDateTime.now());
    
    String subject = "🔐 Nuevo inicio de sesión detectado — Tribu";
    String html = """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#111111;font-family:'Sora','Inter',Arial,sans-serif;color:#F5F5F5;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FEE715);border-radius:12px;padding:12px 28px;box-shadow:0 4px 20px rgba(255, 87, 34, 0.25);">
                <span style="color:#111111;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <!-- Card -->
            <div style="background:#1A1A1A;border:1px solid rgba(254, 231, 21, 0.25);border-radius:20px;padding:36px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <h1 style="color:#FEE715;font-size:22px;font-weight:800;margin:0 0 12px 0;">🔐 Alerta de Seguridad</h1>
              <p style="color:#999999;font-size:15px;margin:0 0 24px 0;line-height:1.6;">Hola <strong>%s</strong>, detectamos un nuevo inicio de sesión en tu cuenta de Tribu.</p>
              
              <div style="background:#222222;border:1px solid rgba(255, 255, 255, 0.04);border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="color:#F5F5F5;font-size:14px;margin:0 0 10px 0;line-height:1.5;"><strong>📱 Dispositivo:</strong> %s</p>
                <p style="color:#F5F5F5;font-size:14px;margin:0 0 10px 0;line-height:1.5;"><strong>🌐 Dirección IP:</strong> <span style="color:#FF5722;font-weight:700;">%s</span></p>
                <p style="color:#F5F5F5;font-size:14px;margin:0;line-height:1.5;"><strong>📅 Fecha y Hora:</strong> %s</p>
              </div>

              <div style="background:rgba(255, 59, 59, 0.12);border:1px solid rgba(255, 59, 59, 0.25);border-radius:12px;padding:18px;margin-bottom:28px;">
                <p style="color:#FF8888;font-size:13px;margin:0;line-height:1.6;">
                  ⚠️ Si fuiste tú, puedes ignorar este correo de forma segura. Si no reconoces esta actividad, te recomendamos cambiar tu contraseña inmediatamente desde la sección de Seguridad de tu perfil para proteger tus puntos y datos.
                </p>
              </div>
              
              <div style="text-align:center;">
                <a href="http://localhost:3000/perfil" style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FF8A50);color:#FFFFFF;text-decoration:none;padding:15px 36px;border-radius:9999px;font-weight:800;font-size:15px;box-shadow:0 4px 15px rgba(255,87,34,0.3);transition:all 0.2s ease;">
                  Ir a mi Perfil →
                </a>
              </div>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#555555;font-size:12px;line-height:1.5;">
              © 2026 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <span style="color:#555555;">Notificaciones automáticas de seguridad e inicio de sesión</span>
            </p>
          </div>
        </body>
        </html>
        """.formatted(nombreCliente, deviceSummary, ipAddress, dateStr);

    sendEmail(resendFromSeguridad, toEmail, subject, html);
  }

  private String parseUserAgent(String userAgent) {
    if (userAgent == null || userAgent.isEmpty()) return "Dispositivo Desconocido";
    String ua = userAgent.toLowerCase();
    String os = "Sistema Operativo Desconocido";
    if (ua.contains("windows")) os = "Windows";
    else if (ua.contains("macintosh") || ua.contains("mac os")) os = "macOS";
    else if (ua.contains("iphone")) os = "iPhone";
    else if (ua.contains("ipad")) os = "iPad";
    else if (ua.contains("android")) os = "Android";
    else if (ua.contains("linux")) os = "Linux";

    String browser = "Navegador";
    if (ua.contains("chrome") && !ua.contains("chromium") && !ua.contains("edg")) browser = "Chrome";
    else if (ua.contains("safari") && !ua.contains("chrome")) browser = "Safari";
    else if (ua.contains("firefox")) browser = "Firefox";
    else if (ua.contains("edge") || ua.contains("edg")) browser = "Microsoft Edge";
    else if (ua.contains("opera") || ua.contains("opr")) browser = "Opera";
    
    return browser + " en " + os;
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
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#111111;font-family:'Sora','Inter',Arial,sans-serif;color:#F5F5F5;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FEE715);border-radius:12px;padding:12px 28px;box-shadow:0 4px 20px rgba(255, 87, 34, 0.25);">
                <span style="color:#111111;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <!-- Card -->
            <div style="background:#1A1A1A;border:1px solid rgba(255, 87, 34, 0.15);border-radius:20px;padding:36px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <h1 style="color:#F5F5F5;font-size:22px;font-weight:800;margin:0 0 12px 0;">🔐 Restablecer Contraseña</h1>
              <p style="color:#999999;font-size:15px;margin:0 0 24px 0;line-height:1.6;">Hola <strong>%s</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta Tribu.</p>
              
              <div style="background:#222222;border:1px solid rgba(255, 255, 255, 0.04);border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="color:#F5F5F5;font-size:14px;margin:0;line-height:1.5;">⏱️ Este enlace es válido por <strong>15 minutos</strong> y solo puede usarse <strong>una vez</strong>.</p>
                <p style="color:#999999;font-size:13px;margin:8px 0 0 0;line-height:1.5;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña no cambiará.</p>
              </div>
              
              <div style="text-align:center;margin-bottom:24px;">
                <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FF8A50);color:#FFFFFF;text-decoration:none;padding:16px 40px;border-radius:9999px;font-weight:800;font-size:16px;box-shadow:0 4px 15px rgba(255,87,34,0.3);letter-spacing:0.3px;transition:all 0.2s ease;">
                  Restablecer mi contraseña →
                </a>
              </div>
              
              <p style="color:#555555;font-size:12px;margin:0;word-break:break-all;line-height:1.5;">
                O copia este enlace en tu navegador:<br>
                <a href="%s" style="color:#FF5722;text-decoration:none;">%s</a>
              </p>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#555555;font-size:12px;line-height:1.5;">
              © 2026 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#FF5722;text-decoration:none;font-weight:600;">tribucol.shop</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(nombreCliente, resetLink, resetLink, resetLink);
    sendEmail(resendFromSeguridad, toEmail, subject, html);
  }

  private String buildEmailHtml(String titulo, String subtitulo, String cuerpo,
      String nota, String btnTexto, String btnUrl) {

    return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#111111;font-family:'Sora','Inter',Arial,sans-serif;color:#F5F5F5;">
          <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FEE715);border-radius:12px;padding:12px 28px;box-shadow:0 4px 20px rgba(255, 87, 34, 0.25);">
                <span style="color:#111111;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🔥 Tribu</span>
              </div>
            </div>
            <!-- Card -->
            <div style="background:#1A1A1A;border:1px solid rgba(255, 87, 34, 0.15);border-radius:20px;padding:36px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <h1 style="color:#F5F5F5;font-size:24px;font-weight:800;margin:0 0 12px 0;">%s</h1>
              <p style="color:#999999;font-size:15px;margin:0 0 24px 0;line-height:1.6;">%s</p>
              <div style="background:#222222;border:1px solid rgba(255, 255, 255, 0.04);border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="color:#F5F5F5;font-size:15px;margin:0;line-height:1.6;">%s</p>
              </div>
              <p style="color:#555555;font-size:13px;margin:0 0 28px 0;line-height:1.5;">%s</p>
              <div style="text-align:center;">
                <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#FF5722,#FF8A50);color:#FFFFFF;text-decoration:none;padding:15px 36px;border-radius:9999px;font-weight:800;font-size:15px;box-shadow:0 4px 15px rgba(255,87,34,0.3);transition:all 0.2s ease;">%s →</a>
              </div>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#555555;font-size:12px;line-height:1.5;">
              © 2026 Tribu E-commerce · Mocoa, Putumayo, Colombia<br>
              <a href="http://localhost:3000" style="color:#FF5722;text-decoration:none;font-weight:600;">tribucol.shop</a>
            </p>
          </div>
        </body>
        </html>
        """.formatted(titulo, subtitulo, cuerpo, nota, btnUrl, btnTexto);
  }
}
