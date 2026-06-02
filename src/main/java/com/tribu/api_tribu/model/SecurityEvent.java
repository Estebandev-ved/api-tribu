package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String eventType; // e.g., "LOGIN_ATTEMPT", "IMPOSSIBLE_TRAVEL", "DATA_EXPORT"

    @Column(nullable = false)
    private String severity; // "LOW", "MEDIUM", "HIGH", "CRITICAL"

    @Column(columnDefinition = "TEXT")
    private String description;

    private String ipAddress;
    
    private String location; // e.g., "Medellín, Colombia"
    
    private String deviceFingerprint; // Hash or descriptive string
    
    private String userAgent;

    @Column(name = "risk_score")
    private Integer riskScore; // 0 - 100

    @Column(name = "user_email")
    private String userEmail;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT", name = "encrypted_payload")
    private String encryptedPayload; // For AES-256 encrypted sensitive data

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "current_hash", length = 64)
    private String currentHash;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
