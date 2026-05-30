package com.tribu.api_tribu.config;

import com.tribu.api_tribu.model.Rol;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.RolRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Se ejecuta al arrancar la app y garantiza que los roles base y el usuario
 * admin existan en la BD. Es idempotente: solo inserta si no existen.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RolRepository rolRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        crearRolSiNoExiste("ADMIN", "Administrador del sistema con acceso total");
        crearRolSiNoExiste("CLIENTE", "Cliente de la tienda Tribu");
        crearAdminSiNoExiste();
    }

    private void crearRolSiNoExiste(String nombre, String descripcion) {
        if (rolRepository.findByNombre(nombre).isEmpty()) {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            rol.setDescripcion(descripcion);
            rolRepository.save(rol);
        }
    }

    private void crearAdminSiNoExiste() {
        String adminEmail = "admin@tribu.com";
        String adminPassword = "admin123";

        Rol rolAdmin = rolRepository.findByNombre("ADMIN")
                .orElseThrow(() -> new IllegalStateException("Rol ADMIN no encontrado"));

        usuarioRepository.findByEmail(adminEmail).ifPresentOrElse(admin -> {
            System.out.println("🔧 FORZANDO RESET DE CREDENCIALES DE ADMIN...");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setIs2faHabilitado(false);
            admin.setRol(rolAdmin);
            usuarioRepository.save(admin);
            System.out.println("🚀 CREDENCIALES Y 2FA DE ADMIN RESETEADOS EXITOSAMENTE.");
        }, () -> {
            Usuario admin = new Usuario();
            admin.setNombreCompleto("Administrador Tribu");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setIs2faHabilitado(false);
            admin.setRol(rolAdmin);
            usuarioRepository.save(admin);
        });
    }
}
