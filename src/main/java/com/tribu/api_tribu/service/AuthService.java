package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.LoginRequest;
import com.tribu.api_tribu.dto.request.RegisterRequest;
import com.tribu.api_tribu.dto.response.AuthResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Rol;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.RolRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UsuarioRepository usuarioRepository;
        private final RolRepository rolRepository;
        private final MovimientoSaldoRepository movimientoSaldoRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final AuthenticationManager authenticationManager;
        private final UserDetailsService userDetailsService;

        public AuthResponse login(LoginRequest request) {
                // Valida credenciales — lanza BadCredentialsException si falla
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

                Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email",
                                                request.getEmail()));

                UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
                String token = jwtUtil.generateToken(userDetails);

                return AuthResponse.builder()
                                .token(token)
                                .id(usuario.getId())
                                .nombreCompleto(usuario.getNombreCompleto())
                                .email(usuario.getEmail())
                                .rol(usuario.getRol() != null ? usuario.getRol().getNombre() : "CLIENTE")
                                .build();
        }

        public AuthResponse register(RegisterRequest request) {
                if (usuarioRepository.existsByEmail(request.getEmail())) {
                        throw new IllegalArgumentException("Ya existe una cuenta con el email: " + request.getEmail());
                }

                // Asigna rol CLIENTE por defecto
                Rol rolCliente = rolRepository.findByNombre("CLIENTE")
                                .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", "CLIENTE"));

                Usuario usuario = new Usuario();
                usuario.setNombreCompleto(request.getNombreCompleto());
                usuario.setEmail(request.getEmail());
                usuario.setPassword(passwordEncoder.encode(request.getPassword()));
                usuario.setTelefono(request.getTelefono());
                usuario.setCiudad(request.getCiudad());
                usuario.setRol(rolCliente);

                // Generar código de referido único (ej. TRIBU-A1B2C)
                String codigoUnico = "TRIBU-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
                usuario.setCodigoReferido(codigoUnico);

                // Procesar código promocional de referido si existe
                Usuario referente = null;
                if (request.getCodigoPromocional() != null && !request.getCodigoPromocional().isBlank()) {
                        referente = usuarioRepository.findByCodigoReferido(request.getCodigoPromocional().toUpperCase())
                                        .orElse(null);
                        if (referente != null) {
                                // El usuario nuevo entra con 5.000 COP de regalo
                                usuario.setSaldoFavor(5000.0);
                        }
                }

                usuario = usuarioRepository.save(usuario);

                // Si hubo referente válido, premiar a ambos registrando los movimientos
                if (referente != null) {
                        // Premiar al Referente (10.000 COP)
                        referente.setSaldoFavor(referente.getSaldoFavor() + 10000.0);
                        usuarioRepository.save(referente);

                        MovimientoSaldo movReferente = MovimientoSaldo.builder()
                                        .usuario(referente)
                                        .monto(10000.0)
                                        .tipo("REFERIDO_EXITOSO")
                                        .descripcion("Bono por invitar a " + usuario.getNombreCompleto())
                                        .build();
                        movimientoSaldoRepository.save(movReferente);

                        // Movimiento del usuario nuevo (5.000 COP)
                        MovimientoSaldo movNuevoRegistro = MovimientoSaldo.builder()
                                        .usuario(usuario)
                                        .monto(5000.0)
                                        .tipo("REGALO_BIENVENIDA")
                                        .descripcion("Bono por usar el código de referido: "
                                                        + request.getCodigoPromocional().toUpperCase())
                                        .build();
                        movimientoSaldoRepository.save(movNuevoRegistro);
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getEmail());
                String token = jwtUtil.generateToken(userDetails);

                return AuthResponse.builder()
                                .token(token)
                                .id(usuario.getId())
                                .nombreCompleto(usuario.getNombreCompleto())
                                .email(usuario.getEmail())
                                .rol("CLIENTE")
                                .build();
        }
}
