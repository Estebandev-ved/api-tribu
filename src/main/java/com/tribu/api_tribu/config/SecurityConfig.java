package com.tribu.api_tribu.config;

import com.tribu.api_tribu.security.JwtFilter;
import com.tribu.api_tribu.security.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas de autenticación (incluye 2FA y recuperación de contraseña)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/ws", "/ws/**").permitAll()
                        // Catálogo público (GET)
                        .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categorias/**").permitAll()
                        // Efipay webhook (público para recibir notificaciones de pago)
                        .requestMatchers("/api/webhook/efipay/**").permitAll()
                        // Social Proof — público (solo nombres + ciudad + producto)
                        .requestMatchers(HttpMethod.GET, "/api/social-proof/**").permitAll()
                        // Imágenes estáticas
                        .requestMatchers("/uploads/**").permitAll()
                        // Administración de catálogo solo para ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/productos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/productos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/productos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/categorias/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categorias/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categorias/**").hasRole("ADMIN")
                        // Panel admin completo
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Todo lo demás requiere autenticación
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);


        return http.build();
    }

    /**
     * Configuración global de CORS (Cross-Origin Resource Sharing).
     *
     * PROPÓSITO:
     *   Permitir de forma segura que el frontend consuma los endpoints de la API (incluidos los WebSockets/SockJS).
     *
     * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
     *   1. Orígenes Permitidos Específicos: Se listan explícitamente los dominios de desarrollo local y los dominios
     *      de producción oficiales (tribucol.shop y www.tribucol.shop). Esto evita el uso de comodines de origen ('*')
     *      cuando las credenciales están habilitadas, reduciendo el riesgo de ataques CSRF e inyección de datos sensibles.
     *   2. Soporte de Credenciales: Se permite el uso de cookies y cabeceras de autorización seguras para la sesión JWT.
     *   3. Métodos HTTP Restringidos: Solo se permiten los verbos HTTP estándar necesarios (GET, POST, PUT, DELETE, PATCH, OPTIONS).
     *   4. Resiliencia ante Configuración Incompleta: Si la variable de entorno 'CORS_ALLOWED_ORIGINS' está presente pero
     *      no contiene los dominios oficiales de producción, el backend los agrega automáticamente para evitar caídas de servicio.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        String allowedOriginsStr = System.getenv("CORS_ALLOWED_ORIGINS");
        
        List<String> defaultOrigins = List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:5173",
                "https://www.tribucol.shop",
                "https://tribucol.shop"
        );

        List<String> allowedOrigins = new java.util.ArrayList<>();
        if (allowedOriginsStr != null && !allowedOriginsStr.isEmpty()) {
            allowedOrigins.addAll(List.of(allowedOriginsStr.split(",")));
            // Aseguramos que los dominios de producción siempre estén incluidos para evitar bloqueos
            if (!allowedOrigins.contains("https://www.tribucol.shop")) {
                allowedOrigins.add("https://www.tribucol.shop");
            }
            if (!allowedOrigins.contains("https://tribucol.shop")) {
                allowedOrigins.add("https://tribucol.shop");
            }
        } else {
            allowedOrigins.addAll(defaultOrigins);
        }

        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }


    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
