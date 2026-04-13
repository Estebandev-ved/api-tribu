package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.LoginRequest;
import com.tribu.api_tribu.dto.request.RegisterRequest;
import com.tribu.api_tribu.dto.response.AuthResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Rol;
import com.tribu.api_tribu.model.Tier;
import com.tribu.api_tribu.model.TierBenefit;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.RolRepository;
import com.tribu.api_tribu.repository.TierRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.security.JwtUtil;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
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

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nombreCompleto(usuario.getNombreCompleto())
                .email(usuario.getEmail())
                .rol(usuario.getRol() != null ? usuario.getRol().getNombre() : "CLIENTE")
                .tierActual(buildTierInfo(usuario))  // ← FASE 2
                .build();
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
                // Bono para el referente (10.000 COP) — Ledger CLEARED inmediato
                saldoService.registrarBonoReferente(referente, savedUsuario.getNombreCompleto());

                // Notificar al referente en tiempo real si está conectado
                wsService.notificarSaldoActualizado(
                        referente.getId(),
                        SaldoService.BONO_REFERENTE,
                        "REFERIDO",
                        savedUsuario.getNombreCompleto() + " se unió con tu código. ¡+$10.000!");

                // Bono para el nuevo usuario (5.000 COP) — Ledger CLEARED inmediato
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
}
