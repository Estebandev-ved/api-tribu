package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.TribuPassBeneficiosDTO;
import com.tribu.api_tribu.dto.response.TribuPassEstadoDTO;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.TribuPass;
import com.tribu.api_tribu.model.TribuPass.EstadoPass;
import com.tribu.api_tribu.model.TribuPassRenovacion;
import com.tribu.api_tribu.model.TribuPassRenovacion.EstadoRenovacion;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.TribuPassRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TribuPassService {

    private static final double PRECIO_PASS = 9900.0;
    private static final int DIAS_RENOVACION = 30;

    private final TribuPassRepository passRepo;
    private final UsuarioRepository usuarioRepo;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final EmailService emailService;
    private final EfipayService efipayService;

    @Value("${efipay.webhook.url}")
    private String efipayWebhookUrl;

    @Value("${efipay.app.base.url}")
    private String efipayAppBaseUrl;

    /**
     * Activa o reactiva la suscripción Tribu Pass para un usuario.
     * 
     * Propósito:
     * Si el usuario ya posee un registro de Tribu Pass inactivo (por ejemplo, CANCELADA o EXPIRADA),
     * el método reutiliza y actualiza este registro existente en lugar de intentar realizar una inserción (INSERT),
     * evitando así violaciones de restricción de clave única (unique constraint) sobre 'usuario_id'.
     *
     * Medidas de seguridad implementadas:
     * 1. Validación de Entradas: Verificación de existencia de la entidad de usuario.
     * 2. Control de Estado Activo: Evita doble cobro y doble activación al verificar si ya posee un pase activo.
     * 3. Prevención de Sobregiro: Comprobación estricta de saldo suficiente en Tribu Card previo al débito.
     * 4. Atomicidad: Ejecución bajo una transacción global (@Transactional) para asegurar consistencia del saldo,
     *    del historial de renovaciones y del estado general del usuario.
     */
    @Transactional
    public TribuPass activar(Long usuarioId, String metodoPago) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Optional<TribuPass> existingPassOpt = passRepo.findByUsuarioId(usuarioId);
        if (existingPassOpt.isPresent() && existingPassOpt.get().getEstado() == EstadoPass.ACTIVA) {
            throw new IllegalStateException("El usuario ya tiene un Tribu Pass activo");
        }

        if ("EFIPAY".equalsIgnoreCase(metodoPago)) {
            return activarConEfipay(usuario, existingPassOpt.orElse(null));
        }

        double saldoDisponible = saldoService.consultarSaldoReal(usuarioId);
        if (saldoDisponible < PRECIO_PASS) {
            throw new IllegalArgumentException("Saldo insuficiente. Necesitas $9.900 en tu Tribu Card");
        }

        MovimientoSaldo movimiento = saldoService.crearYAcreditar(
                usuario, -PRECIO_PASS, MovimientoSaldo.TipoMovimiento.TRIBU_PASS_PAGO, null,
                "Pago Tribu Pass mensual");

        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime fechaRenovacion = ahora.plusDays(DIAS_RENOVACION);

        TribuPass pass;
        if (existingPassOpt.isPresent()) {
            pass = existingPassOpt.get();
            pass.setEstado(EstadoPass.ACTIVA);
            pass.setFechaInicio(ahora);
            pass.setFechaRenovacion(fechaRenovacion);
            pass.setPrecio(PRECIO_PASS);
            pass.setMetodoPago(metodoPago != null ? metodoPago : "SALDO_TRIBU");
            pass.setRenovacionAutomatica(true);
        } else {
            pass = TribuPass.builder()
                    .usuario(usuario)
                    .estado(EstadoPass.ACTIVA)
                    .fechaInicio(ahora)
                    .fechaRenovacion(fechaRenovacion)
                    .precio(PRECIO_PASS)
                    .metodoPago(metodoPago != null ? metodoPago : "SALDO_TRIBU")
                    .renovacionAutomatica(true)
                    .build();
        }

        pass = passRepo.save(pass);

        TribuPassRenovacion renovacion = TribuPassRenovacion.builder()
                .pass(pass)
                .fecha(ahora)
                .monto(PRECIO_PASS)
                .estado(EstadoRenovacion.EXITOSA)
                .movimientoId(movimiento.getId())
                .build();
        pass.getHistorial().add(renovacion);
        passRepo.save(pass);

        usuario.setTribuPassActiva(true);
        usuarioRepo.save(usuario);

        wsService.notificarSaldoActualizado(usuarioId, -PRECIO_PASS, "TRIBU_PASS_ACTIVADO",
                "Tribu Pass activado -$" + String.format("%.0f", PRECIO_PASS));

        enviarEmailBienvenida(usuario);

        log.info("💎 Tribu Pass activado/reactivado para usuario {} - renovación: {}", usuarioId, fechaRenovacion);
        return pass;
    }

    @Transactional
    public TribuPass activarConEfipay(Usuario usuario, TribuPass existingPass) {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime fechaRenovacion = ahora.plusDays(DIAS_RENOVACION);

        TribuPass pass;
        if (existingPass != null) {
            pass = existingPass;
            pass.setEstado(EstadoPass.PENDIENTE);
            pass.setFechaInicio(ahora);
            pass.setFechaRenovacion(fechaRenovacion);
            pass.setPrecio(PRECIO_PASS);
            pass.setMetodoPago("EFIPAY");
            pass.setRenovacionAutomatica(false);
        } else {
            pass = TribuPass.builder()
                    .usuario(usuario)
                    .estado(EstadoPass.PENDIENTE)
                    .fechaInicio(ahora)
                    .fechaRenovacion(fechaRenovacion)
                    .precio(PRECIO_PASS)
                    .metodoPago("EFIPAY")
                    .renovacionAutomatica(false)
                    .build();
        }

        pass = passRepo.save(pass);

        String approvedUrl = efipayAppBaseUrl + "/tribu-pass?efipay=approved";
        String rejectedUrl = efipayAppBaseUrl + "/tribu-pass?efipay=rejected";
        String pendingUrl = efipayAppBaseUrl + "/tribu-pass?efipay=pending";

        String description = "Tribu Pass - Usuario " + usuario.getEmail();
        if (pass.getId() != null) {
            description = "Tribu Pass #" + pass.getId() + " - " + usuario.getEmail();
        }

        EfipayService.EfipayPaymentResponse efipayResponse = efipayService.generatePayment(
                "PASS-" + (pass.getId() != null ? pass.getId() : 0),
                PRECIO_PASS,
                description,
                efipayWebhookUrl,
                approvedUrl,
                rejectedUrl,
                pendingUrl
        );

        if (efipayResponse != null) {
            pass.setEfipayPaymentId(efipayResponse.paymentId());
            pass.setEfipayCheckoutUrl(efipayResponse.checkoutUrl());
            pass.setEfipayStatus("PENDIENTE");
            passRepo.save(pass);
        } else {
            log.error("Failed to generate efipay payment for Tribu Pass, usuario {}", usuario.getId());
            throw new RuntimeException("Error al generar el pago con Efipay. Intenta de nuevo.");
        }

        log.info("⏳ Tribu Pass pendiente de pago Efipay para usuario {}", usuario.getId());
        return pass;
    }

    @Transactional
    public void cancelar(Long usuarioId) {
        TribuPass pass = passRepo.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("No tienes un Tribu Pass activo"));

        if (pass.getEstado() != EstadoPass.ACTIVA) {
            throw new IllegalStateException("El Tribu Pass no está activo");
        }

        pass.setEstado(EstadoPass.CANCELADA);
        pass.setRenovacionAutomatica(false);
        passRepo.save(pass);

        enviarConfirmacionCancelacion(pass.getUsuario());

        log.info("❌ Tribu Pass cancelado para usuario {}", usuarioId);
    }

    @Transactional
    public void procesarRenovacion(TribuPass pass) {
        Usuario usuario = pass.getUsuario();
        double saldoDisponible = saldoService.consultarSaldoReal(usuario.getId());

        LocalDateTime ahora = LocalDateTime.now();

        if (saldoDisponible < PRECIO_PASS) {
            pass.setEstado(EstadoPass.EXPIRADA);
            pass.setRenovacionAutomatica(false);
            passRepo.save(pass);

            usuario.setTribuPassActiva(false);
            usuarioRepo.save(usuario);

            enviarAvisoExpiracion(usuario, pass);
            log.warn("⚠️ Tribu Pass expirado por saldo insuficiente para usuario {}", usuario.getId());
            return;
        }

        MovimientoSaldo movimiento = saldoService.crearYAcreditar(
                usuario, -PRECIO_PASS, MovimientoSaldo.TipoMovimiento.TRIBU_PASS_PAGO, null,
                "Renovación automática Tribu Pass");

        LocalDateTime nuevaFechaRenovacion = ahora.plusDays(DIAS_RENOVACION);
        pass.setFechaRenovacion(nuevaFechaRenovacion);
        pass = passRepo.save(pass);

        TribuPassRenovacion renovacion = TribuPassRenovacion.builder()
                .pass(pass)
                .fecha(ahora)
                .monto(PRECIO_PASS)
                .estado(EstadoRenovacion.EXITOSA)
                .movimientoId(movimiento.getId())
                .build();
        pass.getHistorial().add(renovacion);
        passRepo.save(pass);

        enviarReciboRenovacion(pass, movimiento.getId());
        log.info("🔄 Tribu Pass renovado para usuario {} - próxima renovación: {}", 
                usuario.getId(), nuevaFechaRenovacion);
    }

    public boolean tienePassActiva(Long usuarioId) {
        return passRepo.findByUsuarioIdAndEstado(usuarioId, EstadoPass.ACTIVA).isPresent();
    }

    public TribuPass getPassActivo(Long usuarioId) {
        return passRepo.findByUsuarioIdAndEstado(usuarioId, EstadoPass.ACTIVA).orElse(null);
    }

    public TribuPassEstadoDTO getMiEstado(Long usuarioId) {
        TribuPass pass = passRepo.findByUsuarioId(usuarioId).orElse(null);
        
        if (pass == null || pass.getEstado() != EstadoPass.ACTIVA) {
            return TribuPassEstadoDTO.builder()
                    .activa(false)
                    .estado(pass != null ? pass.getEstado() : null)
                    .beneficios(getBeneficios())
                    .build();
        }

        return TribuPassEstadoDTO.builder()
                .activa(true)
                .estado(pass.getEstado())
                .fechaInicio(pass.getFechaInicio())
                .fechaRenovacion(pass.getFechaRenovacion())
                .precio(pass.getPrecio())
                .renovacionAutomatica(pass.getRenovacionAutomatica())
                .beneficios(getBeneficios())
                .build();
    }

    public List<TribuPassRenovacion> getHistorial(Long usuarioId) {
        TribuPass pass = passRepo.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("No tienes un Tribu Pass"));
        return pass.getHistorial();
    }

    public TribuPassBeneficiosDTO getBeneficios() {
        return TribuPassBeneficiosDTO.builder()
                .multiplicadorCashback(2.0)
                .envioGratis(true)
                .accesoFlashSalesAnticipado(true)
                .limiteRuletaExtra(5000.0)
                .descuentoCupones(10.0)
                .build();
    }

    @Transactional
    public void actualizarRenovacionAutomatica(Long usuarioId, boolean enabled) {
        TribuPass pass = passRepo.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("No tienes un Tribu Pass"));
        
        pass.setRenovacionAutomatica(enabled);
        if (!enabled && pass.getEstado() == EstadoPass.ACTIVA) {
            pass.setEstado(EstadoPass.CANCELADA);
        }
        passRepo.save(pass);
    }

    private void enviarEmailBienvenida(Usuario usuario) {
        String subject = "💎 ¡Bienvenido a Tribu Pass!";
        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
              <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
                <div style="text-align:center;margin-bottom:32px;">
                  <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:16px;padding:12px 24px;">
                    <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">💎 Tribu Pass</span>
                  </div>
                </div>
                <div style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;margin-bottom:24px;">
                  <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0 0 12px 0;">¡Felicidades, <strong>%s</strong>!</h1>
                  <p style="color:#94a3b8;font-size:15px;margin:0 0 20px 0;">Tu Tribu Pass está activo. Ahora ganas el doble en todas tus compras.</p>
                  <div style="background:#1a1a28;border-radius:12px;padding:20px;margin-bottom:20px;">
                    <p style="color:#f1f5f9;font-size:15px;margin:0;">🎁 <strong>Tus beneficios:</strong></p>
                    <ul style="color:#94a3b8;font-size:14px;margin:10px 0 0 0;padding-left:20px;">
                      <li>💰 Cashback x2 en todas tus compras</li>
                      <li>🚚 Envío gratis siempre</li>
                      <li>⚡ Flash sales 30 min antes</li>
                      <li>🎰 +$5.000 en límite de ruleta</li>
                    </ul>
                  </div>
                  <a href="http://localhost:3000/tribu-pass" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#000;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:700;font-size:15px;">Ver mis beneficios →</a>
                </div>
                <p style="text-align:center;color:#334155;font-size:12px;">© 2025 Tribu E-commerce</p>
              </div>
            </body>
            </html>
            """.formatted(usuario.getNombreCompleto());
        emailService.sendEmail(usuario.getEmail(), subject, html);
    }

    private void enviarConfirmacionCancelacion(Usuario usuario) {
        String subject = "❌ Tribu Pass cancelado";
        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#fff;">
              <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
                <h1>Tu Tribu Pass ha sido cancelado</h1>
                <p>Puedes reactivarlo cuando quieras desde la app.</p>
                <a href="http://localhost:3000/tribu-pass" style="color:#f59e0b;">Reactivar Tribu Pass</a>
              </div>
            </body>
            </html>
            """;
        emailService.sendEmail(usuario.getEmail(), subject, html);
    }

    private void enviarAvisoExpiracion(Usuario usuario, TribuPass pass) {
        String subject = "⚠️ Tu Tribu Pass ha expirado";
        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#fff;">
              <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
                <h1>Tu Tribu Pass ha expirado</h1>
                <p>No teníamos saldo suficiente para renovar tu suscripción ($9.900).</p>
                <p>Recarga tu Tribu Card y reactívalo cuando quieras.</p>
                <a href="http://localhost:3000/tribu-pass" style="color:#f59e0b;">Reactivar Tribu Pass</a>
              </div>
            </body>
            </html>
            """;
        emailService.sendEmail(usuario.getEmail(), subject, html);
    }

    private void enviarReciboRenovacion(TribuPass pass, Long movimientoId) {
        String subject = "🔄 Recibo de renovación - Tribu Pass";
        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#fff;">
              <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
                <h1>Recibo de renovación - Tribu Pass</h1>
                <p>Monto: $9.900 COP</p>
                <p>Próxima renovación: %s</p>
                <p>¡Sigue disfrutando de todos tus beneficios!</p>
              </div>
            </body>
            </html>
            """.formatted(pass.getFechaRenovacion());
        emailService.sendEmail(pass.getUsuario().getEmail(), subject, html);
    }

    @Transactional
    public TribuPass confirmarPagoEfipayLocal(Long usuarioId) {
        TribuPass pass = passRepo.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("No tienes un Tribu Pass registrado"));

        if (pass.getEstado() == EstadoPass.PENDIENTE) {
            pass.setEstado(EstadoPass.ACTIVA);
            pass.setRenovacionAutomatica(true);
            pass.setFechaInicio(LocalDateTime.now());
            pass.setFechaRenovacion(LocalDateTime.now().plusDays(DIAS_RENOVACION));
            pass = passRepo.save(pass);

            Usuario usuario = pass.getUsuario();
            usuario.setTribuPassActiva(true);
            usuarioRepo.save(usuario);

            // Registrar renovación exitosa
            TribuPassRenovacion renovacion = TribuPassRenovacion.builder()
                    .pass(pass)
                    .fecha(LocalDateTime.now())
                    .monto(pass.getPrecio())
                    .estado(EstadoRenovacion.EXITOSA)
                    .movimientoId(null)
                    .build();
            
            if (pass.getHistorial() == null) {
                pass.setHistorial(new java.util.ArrayList<>());
            }
            pass.getHistorial().add(renovacion);
            pass = passRepo.save(pass);

            wsService.notificarSaldoActualizado(
                    usuario.getId(), 0,
                    "TRIBU_PASS_ACTIVADO",
                    "Tribu Pass activado via Efipay (Sincronizado)");
            
            enviarEmailBienvenida(usuario);
            log.info("💎 Tribu Pass activado localmente mediante callback para usuario {}", usuario.getId());
        }
        return pass;
    }
}
