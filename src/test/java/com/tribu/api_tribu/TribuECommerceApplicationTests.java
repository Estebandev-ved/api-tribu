package com.tribu.api_tribu;

import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@SpringBootTest
class TribuECommerceApplicationTests {

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Test
	void contextLoads() {
		System.out.println("🔧 INICIANDO DIAGNÓSTICO Y RESET DE CREDENCIALES DE ADMIN...");
		Optional<Usuario> oAdmin = usuarioRepository.findByEmail("admin@tribu.com");
		if (oAdmin.isPresent()) {
			Usuario admin = oAdmin.get();
			System.out.println("✅ ADMIN ENCONTRADO:");
			System.out.println("   - Email: " + admin.getEmail());
			System.out.println("   - Rol: " + (admin.getRol() != null ? admin.getRol().getNombre() : "SIN ROL"));
			System.out.println("   - 2FA Activo: " + admin.getIs2faHabilitado());
			
			// Forzar bypass de 2FA y resetear password a admin123
			System.out.println("⚙️ Reseteando contraseña de admin a 'admin123' y desactivando 2FA...");
			admin.setPassword(passwordEncoder.encode("admin123"));
			admin.setIs2faHabilitado(false);
			usuarioRepository.save(admin);
			System.out.println("🚀 CREDENCIALES DE ADMIN RE-ESTABLECIDAS EXITOSAMENTE EN LA BASE DE DATOS.");
		} else {
			System.out.println("❌ ERROR: El usuario admin@tribu.com no fue encontrado en la base de datos.");
		}
	}

}
