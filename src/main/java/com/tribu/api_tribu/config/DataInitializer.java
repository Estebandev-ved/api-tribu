package com.tribu.api_tribu.config;

import com.tribu.api_tribu.model.Rol;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.RolRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Se ejecuta al arrancar la app y garantiza que los roles base y el usuario
 * admin existan en la BD. Es idempotente: solo inserta si no existen.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        crearRolSiNoExiste("ADMIN", "Administrador del sistema con acceso total");
        crearRolSiNoExiste("CLIENTE", "Cliente de la tienda Tribu");
        log.info("Roles verificados correctamente.");

        crearAdminSiNoExiste();
    }

    private void crearRolSiNoExiste(String nombre, String descripcion) {
        if (rolRepository.findByNombre(nombre).isEmpty()) {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            rol.setDescripcion(descripcion);
            rolRepository.save(rol);
            log.info(" Rol '{}' creado.", nombre);
        }
    }

    private void crearAdminSiNoExiste() {
        String adminEmail = "admin@tribu.com";
        String adminPassword = "admin123";

        Rol rolAdmin = rolRepository.findByNombre("ADMIN")
                .orElseThrow(() -> new IllegalStateException("Rol ADMIN no encontrado"));

        usuarioRepository.findByEmail(adminEmail).ifPresentOrElse(admin -> {
            boolean passwordOk = false;
            try {
                passwordOk = admin.getPassword() != null
                        && admin.getPassword().startsWith("$2")
                        && passwordEncoder.matches(adminPassword, admin.getPassword());
            } catch (Exception e) {
                log.warn("Formato de contraseña inválido en la DB, se procederá a resetear.");
            }

            if (!passwordOk) {
                // Resetear contraseña y asegurar rol ADMIN
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRol(rolAdmin);
                usuarioRepository.save(admin);
                log.info(" Contraseña del admin corregida a BCrypt.");
            } else {
                log.info(" Admin ya tiene contraseña BCrypt válida.");
            }
        }, () -> {
            // El usuario no existe — crearlo desde cero
            Usuario admin = new Usuario();
            admin.setNombreCompleto("Administrador Tribu");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRol(rolAdmin);
            usuarioRepository.save(admin);
            log.info(" Usuario admin creado: {}", adminEmail);
        });
    }
}
