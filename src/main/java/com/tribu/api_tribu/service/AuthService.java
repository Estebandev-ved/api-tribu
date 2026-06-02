package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.LoginRequest;
import com.tribu.api_tribu.dto.request.RegisterRequest;
import com.tribu.api_tribu.dto.response.AuthResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Rol;
import com.tribu.api_tribu.model.Tier;
import com.tribu.api_tribu.model.TierBenefit;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.model.RegistroAcceso;
import com.tribu.api_tribu.repository.RolRepository;
import com.tribu.api_tribu.repository.TierRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.repository.RegistroAccesoRepository;
import com.tribu.api_tribu.security.JwtUtil;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * CAMBIOS FASE 2:
 * ✅ Inyección de CashbackTierService y TierRepository
 * ✅ Login y Register incluyen tierActual en AuthResponse
 * ✅ Register asigna tier BRONCE al nuevo usuario
 * ✅ buildTierInfo() construye TierInfoDto con beneficios
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final CashbackTierService cashbackTierService;
    private final TierRepository tierRepository;
    private final SecurityAuditService securityAuditService;
    private final RegistroAccesoRepository registroAccesoRepository;
    private final TwoFactorService twoFactorService;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${google.client.id:}")
    private String googleClientId;

    /**
     * Login con soporte de doble factor (2FA).
     * Si el usuario tiene 2FA activo, devuelve requires2fa=true sin emitir JWT real.
     * El JWT definitivo se obtiene llamando a verify2fa() con el código TOTP.
     * Seguridad: la autenticación principal (contraseña) siempre se realiza primero.
     */
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        // Validar primero si no está bloqueado
        securityAuditService.validarFuerzaBruta(httpRequest);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            securityAuditService.registrarIntento(request.getEmail(), httpRequest, true, null);
        } catch (org.springframework.security.core.AuthenticationException e) {
            securityAuditService.registrarIntento(request.getEmail(), httpRequest, false, "Credenciales inválidas");
            throw e;
        }

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", request.getEmail()));

        // Si tiene 2FA activo, no emitir el token definitivo todavía
        if (Boolean.TRUE.equals(usuario.getIs2faHabilitado())) {
            return AuthResponse.builder()
                    .requires2fa(true)
                    .email(usuario.getEmail())
                    .build();
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        // Alerta de seguridad asíncrona de inicio de sesión exitoso sin 2FA
        try {
            String ipAddress = obtenerIpReal(httpRequest);
            String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "";
            emailService.enviarAlertaInicioSesion(usuario.getEmail(), usuario.getNombreCompleto(), ipAddress, userAgent);
        } catch (Exception ex) {
            log.error("❌ No se pudo enviar la alerta de inicio de sesión para {}: {}", usuario.getEmail(), ex.getMessage());
        }

        return AuthResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nombreCompleto(usuario.getNombreCompleto())
                .email(usuario.getEmail())
                .rol(usuario.getRol() != null ? usuario.getRol().getNombre() : "CLIENTE")
                .tribuPassActiva(Boolean.TRUE.equals(usuario.getTribuPassActiva()))
                .tierActual(buildTierInfo(usuario))
                .build();
    }

    /**
     * Autenticación o registro automático con Google Sign-In.
     */
    @Transactional
    public AuthResponse loginConGoogle(String googleToken, HttpServletRequest httpRequest) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + googleToken;
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> payload;
        try {
            payload = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("❌ Token de Google inválido: {}", e.getMessage());
            throw new IllegalArgumentException("Token de Google inválido o expirado");
        }

        if (payload == null || !payload.containsKey("email")) {
            throw new IllegalArgumentException("El token de Google no contiene información de email");
        }

        // Validación de Seguridad (OWASP Top 10 - Token Substitution):
        // Verificar que el token fue emitido específicamente para nuestro Client ID
        String aud = (String) payload.get("aud");
        if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(aud)) {
            log.error("❌ ERROR DE SEGURIDAD (Suplantación): aud del token ({}) no coincide con nuestro google.client.id ({})", aud, googleClientId);
            throw new IllegalArgumentException("Token de Google no autorizado para esta aplicación");
        }

        String email = (String) payload.get("email");
        String nombre = (String) payload.get("name");
        if (nombre == null || nombre.isBlank()) {
            nombre = email.split("@")[0];
        }

        // Buscar si el usuario ya existe
        Optional<Usuario> optionalUsuario = usuarioRepository.findByEmail(email);
        Usuario usuario;

        if (optionalUsuario.isPresent()) {
            usuario = optionalUsuario.get();
            log.info("🔑 Inicio de sesión de Google exitoso para usuario existente: {}", email);
        } else {
            // Registrar usuario nuevo
            log.info("🌿 Registrando nuevo usuario vía Google Sign-In: {}", email);
            Rol rolCliente = rolRepository.findByNombre("CLIENTE")
                    .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", "CLIENTE"));

            Usuario nuevoUsuario = new Usuario();
            nuevoUsuario.setNombreCompleto(nombre);
            nuevoUsuario.setEmail(email);
            nuevoUsuario.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // Contraseña aleatoria segura
            nuevoUsuario.setRol(rolCliente);
            nuevoUsuario.setCodigoReferido("TRIBU-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase());

            // Asignar tier BRONCE por defecto
            tierRepository.findByNombre("BRONCE").ifPresent(tierBronce -> {
                nuevoUsuario.setTierActual(tierBronce);
                nuevoUsuario.setNivelVip(tierBronce.getOrden());
            });

            usuario = usuarioRepository.save(nuevoUsuario);
            log.info("✅ Registro automático de Google completado para: {}", email);
        }

        // Registrar intento exitoso de auditoría
        securityAuditService.registrarIntento(email, httpRequest, true, "OAuth Google");

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails);

        // Alerta asíncrona de seguridad sobre el inicio de sesión
        try {
            String ipAddress = obtenerIpReal(httpRequest);
            String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "";
            emailService.enviarAlertaInicioSesion(usuario.getEmail(), usuario.getNombreCompleto(), ipAddress, userAgent);
        } catch (Exception ex) {
            log.error("❌ No se pudo enviar la alerta de inicio de sesión para {}: {}", usuario.getEmail(), ex.getMessage());
        }

        return AuthResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nombreCompleto(usuario.getNombreCompleto())
                .email(usuario.getEmail())
                .rol(usuario.getRol() != null ? usuario.getRol().getNombre() : "CLIENTE")
                .tribuPassActiva(Boolean.TRUE.equals(usuario.getTribuPassActiva()))
                .tierActual(buildTierInfo(usuario))
                .build();
    }

    /**
     * Verifica el código TOTP de 6 dígitos y entrega el JWT final.
     * Seguridad: sin el código correcto, no se entrega ningún token.
     */
    @Transactional
    public AuthResponse verify2fa(String email, int codigo, HttpServletRequest httpRequest) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));

        if (!Boolean.TRUE.equals(usuario.getIs2faHabilitado()) || usuario.getSecret2fa() == null) {
            throw new IllegalStateException("Este usuario no tiene 2FA habilitado");
        }

        if (!twoFactorService.validarCodigo(usuario.getSecret2fa(), codigo)) {
            throw new IllegalArgumentException("Código 2FA incorrecto o expirado");
        }

        // Registrar intento exitoso de segundo paso
        securityAuditService.registrarIntento(email, httpRequest, true, "2FA Verificado");

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails);

        // Alerta de seguridad asíncrona de inicio de sesión exitoso con 2FA
        try {
            String ipAddress = obtenerIpReal(httpRequest);
            String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "";
            emailService.enviarAlertaInicioSesion(usuario.getEmail(), usuario.getNombreCompleto(), ipAddress, userAgent);
        } catch (Exception ex) {
            log.error("❌ No se pudo enviar la alerta de inicio de sesión para {}: {}", usuario.getEmail(), ex.getMessage());
        }

        return AuthResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nombreCompleto(usuario.getNombreCompleto())
                .email(usuario.getEmail())
                .rol(usuario.getRol() != null ? usuario.getRol().getNombre() : "CLIENTE")
                .tribuPassActiva(Boolean.TRUE.equals(usuario.getTribuPassActiva()))
                .tierActual(buildTierInfo(usuario))
                .build();
    }

    /**
     * Genera un token de recuperación de contraseña y envía el correo.
     * Seguridad: token UUID criptográficamente seguro, expira en 15 min.
     * No revela si el email existe (prevención de enumeración de usuarios).
     */
    @Transactional
    public void forgotPassword(String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) {
            // No revelar si el email existe o no (anti-enumeración)
            return;
        }
        Usuario usuario = opt.get();
        String token = UUID.randomUUID().toString().replace("-", "");
        usuario.setResetPasswordToken(token);
        usuario.setResetPasswordExpires(LocalDateTime.now().plusMinutes(15));
        usuarioRepository.save(usuario);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.enviarResetPassword(email, usuario.getNombreCompleto(), resetLink);
        log.info("🔐 Token de reset enviado a {}", email);
    }

    /**
     * Valida el token y actualiza la contraseña con BCrypt.
     * Seguridad: el token se invalida inmediatamente después de usarse.
     */
    @Transactional
    public void resetPassword(String token, String nuevaPassword) {
        Usuario usuario = usuarioRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido o expirado"));

        if (usuario.getResetPasswordExpires() == null ||
            LocalDateTime.now().isAfter(usuario.getResetPasswordExpires())) {
            throw new IllegalArgumentException("El enlace de restablecimiento ha expirado. Solicita uno nuevo.");
        }

        if (nuevaPassword == null || nuevaPassword.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres");
        }

        // Invalidar token inmediatamente (uso único)
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuario.setResetPasswordToken(null);
        usuario.setResetPasswordExpires(null);
        usuarioRepository.save(usuario);
        log.info("🔑 Contraseña restablecida para usuario ID {}", usuario.getId());
    }


    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe una cuenta con el email: " + request.getEmail());
        }

        Rol rolCliente = rolRepository.findByNombre("CLIENTE")
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", "CLIENTE"));

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setTelefono(request.getTelefono());
        usuario.setCiudad(request.getCiudad());
        usuario.setRol(rolCliente);
        usuario.setCodigoReferido("TRIBU-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase());

        // Fase 2: asignar tier BRONCE al nuevo usuario
        tierRepository.findByNombre("BRONCE").ifPresent(tierBronce -> {
            usuario.setTierActual(tierBronce);
            usuario.setNivelVip(tierBronce.getOrden());
        });

        Usuario savedUsuario = usuarioRepository.save(usuario);

        // Procesar código de referido si existe
        String codigoPromo = request.getCodigoPromocional();
        if (codigoPromo != null && !codigoPromo.isBlank()) {
            Usuario referente = usuarioRepository
                    .findByCodigoReferido(codigoPromo.toUpperCase())
                    .orElse(null);

            if (referente != null) {
                // Bono para el referente (10.000 pts) — Ledger CLEARED inmediato
                saldoService.registrarBonoReferente(referente, savedUsuario.getNombreCompleto());

                // Notificar al referente en tiempo real si está conectado
                wsService.notificarSaldoActualizado(
                        referente.getId(),
                        SaldoService.BONO_REFERENTE,
                        "REFERIDO",
                        savedUsuario.getNombreCompleto() + " se unió con tu código. ¡+10.000 pts!");

                // Bono para el nuevo usuario (5.000 pts) — Ledger CLEARED inmediato
                saldoService.registrarBonoNuevoUsuario(savedUsuario, codigoPromo.toUpperCase());
            }
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUsuario.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .id(savedUsuario.getId())
                .nombreCompleto(savedUsuario.getNombreCompleto())
                .email(savedUsuario.getEmail())
                .rol("CLIENTE")
                .tribuPassActiva(Boolean.TRUE.equals(savedUsuario.getTribuPassActiva()))
                .tierActual(buildTierInfo(savedUsuario))  // ← FASE 2
                .build();
    }

    // ── Helpers Fase 2 ──────────────────────────────────────────────────

    /**
     * Construye el DTO de información de tier para la respuesta de auth.
     * Incluye nombre, orden, descripción y lista de beneficios.
     * Retorna null si no se puede resolver el tier (no rompe la respuesta).
     */
    private AuthResponse.TierInfoDto buildTierInfo(Usuario usuario) {
        try {
            List<TierBenefit> beneficios = cashbackTierService.getBeneficiosDelUsuario(usuario);
            Tier tier = cashbackTierService.resolverTier(usuario);

            List<AuthResponse.BeneficioDto> beneficiosDto = beneficios.stream()
                    .map(b -> AuthResponse.BeneficioDto.builder()
                            .tipo(b.getTipo().name())
                            .valor(b.getValor())
                            .descripcion(b.getDescripcion())
                            .build())
                    .collect(Collectors.toList());

            return AuthResponse.TierInfoDto.builder()
                    .nombre(tier.getNombre())
                    .orden(tier.getOrden())
                    .descripcion(tier.getDescripcion())
                    .beneficios(beneficiosDto)
                    .build();
        } catch (Exception e) {
            log.warn("No se pudo construir tierInfo para usuario {}: {}",
                    usuario.getId(), e.getMessage());
            return null;
        }
    }

    private String obtenerIpReal(HttpServletRequest request) {
        if (request == null) return "Desconocida";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "Desconocida";
    }

    @Transactional
    public void promoteToAdmin(String email) {
        if (!"tribuindustrias@gmail.com".equals(email)) {
            throw new IllegalArgumentException("No autorizado");
        }
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
        Rol adminRol = rolRepository.findByNombre("ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", "ADMIN"));
        usuario.setRol(adminRol);
        usuarioRepository.save(usuario);
        log.info("🏆 El usuario {} ha sido promovido a ADMIN", email);
    }

    public List<Map<String, Object>> getSesiones(String email, String currentIp, String currentUserAgent) {
        List<RegistroAcceso> accesos = registroAccesoRepository.findByEmailAndExitosoTrueOrderByFechaDesc(email);
        
        // Si no hay accesos, crear un mock del acceso actual para que la pantalla no se quede en blanco
        if (accesos.isEmpty()) {
            RegistroAcceso mockAcceso = RegistroAcceso.builder()
                    .id(-1L)
                    .email(email)
                    .ipAddress(currentIp != null ? currentIp : "127.0.0.1")
                    .exitoso(true)
                    .userAgent(currentUserAgent)
                    .fecha(LocalDateTime.now())
                    .build();
            accesos = List.of(mockAcceso);
        }

        List<Map<String, Object>> sesiones = new java.util.ArrayList<>();
        for (int i = 0; i < accesos.size(); i++) {
            RegistroAcceso r = accesos.get(i);
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getId());
            
            String ua = r.getUserAgent();
            String os = "Dispositivo Desconocido";
            String browser = "Chrome";
            
            if (ua != null) {
                String uaLower = ua.toLowerCase();
                if (uaLower.contains("windows")) {
                    os = "Windows PC";
                } else if (uaLower.contains("macintosh") || uaLower.contains("mac os")) {
                    os = "Mac";
                } else if (uaLower.contains("iphone")) {
                    os = "iPhone";
                } else if (uaLower.contains("ipad")) {
                    os = "iPad";
                } else if (uaLower.contains("android")) {
                    os = "Android Device";
                } else if (uaLower.contains("linux")) {
                    os = "Linux PC";
                }
                
                if (uaLower.contains("firefox")) {
                    browser = "Firefox";
                } else if (uaLower.contains("chrome")) {
                    browser = "Chrome";
                } else if (uaLower.contains("safari")) {
                    browser = "Safari";
                } else if (uaLower.contains("edge")) {
                    browser = "Edge";
                } else if (uaLower.contains("opera")) {
                    browser = "Opera";
                }
            }
            
            map.put("dispositivo", os);
            map.put("navegador", browser);
            map.put("ciudad", "Bogotá, Colombia");
            
            // Calcular tiempo relativo
            java.time.Duration duration = java.time.Duration.between(r.getFecha(), java.time.LocalDateTime.now());
            long seconds = Math.abs(duration.getSeconds());
            String tiempo = "Hace unos momentos";
            if (seconds >= 86400) {
                long days = seconds / 86400;
                tiempo = days + (days == 1 ? " día" : " días");
            } else if (seconds >= 3600) {
                long hours = seconds / 3600;
                tiempo = hours + (hours == 1 ? " hora" : " horas");
            } else if (seconds >= 60) {
                long minutes = seconds / 60;
                tiempo = minutes + (minutes == 1 ? " minuto" : " minutos");
            }
            map.put("tiempo", tiempo);
            
            // Determinar si es la sesión actual
            boolean isActual = false;
            if (r.getId() == -1L || i == 0) {
                isActual = true;
            } else if (currentIp != null && currentIp.equals(r.getIpAddress())) {
                isActual = true;
            }
            map.put("actual", isActual);
            
            sesiones.add(map);
        }
        return sesiones;
    }

    @Transactional
    public void cerrarSesion(Long id, String email) {
        registroAccesoRepository.deleteByIdAndEmail(id, email);
    }

    @Transactional
    public void cerrarOtrasSesiones(String email, String currentIp, String currentUserAgent) {
        List<RegistroAcceso> accesos = registroAccesoRepository.findByEmailAndExitosoTrueOrderByFechaDesc(email);
        if (!accesos.isEmpty()) {
            Long currentSessionId = accesos.get(0).getId();
            registroAccesoRepository.deleteByEmailAndExitosoTrueAndIdNot(email, currentSessionId);
        }
    }
}

