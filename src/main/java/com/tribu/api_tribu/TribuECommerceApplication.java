package com.tribu.api_tribu;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class TribuECommerceApplication {

	public static void main(String[] args) {
		// Cargar variables de entorno desde .env
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();
		
		dotenv.entries().forEach(entry -> {
			if (System.getProperty(entry.getKey()) == null) {
				System.setProperty(entry.getKey(), entry.getValue());
			}
		});

		// DB Recovery Hook to delete failed flyway migrations
		try {
			Class.forName("com.mysql.cj.jdbc.Driver");
			String dbPass = System.getProperty("DB_PASSWORD");
			if (dbPass == null) dbPass = "";
			String url = "jdbc:mysql://localhost:3306/tribu_db?useSSL=false&serverTimezone=America/Bogota";
			System.out.println("[DB Recovery] Connecting to database to repair Flyway history...");
			try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, "root", dbPass)) {
				try (java.sql.Statement stmt = conn.createStatement()) {
					int rows = stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE success = 0");
					if (rows > 0) {
						System.out.println("[DB Recovery] Successfully removed " + rows + " failed Flyway migration record(s).");
					}
				}
			}
		} catch (Exception e) {
			System.out.println("[DB Recovery] Note: DB recovery hook bypassed or table not present yet: " + e.getMessage());
		}

		SpringApplication.run(TribuECommerceApplication.class, args);
	}

}
