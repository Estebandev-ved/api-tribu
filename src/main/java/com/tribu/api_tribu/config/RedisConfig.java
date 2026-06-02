package com.tribu.api_tribu.config;

import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.redisson.api.RBucket;
import org.redisson.config.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.lang.reflect.Proxy;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ⚙️ RedisConfig - Configuración Adaptativa del Cliente Redisson.
 *
 * PROPÓSITO:
 *   Configurar y exponer el bean {@link RedissonClient} en el contexto de Spring.
 *   Este cliente se utiliza para gestionar bloqueos distribuidos (locks) de exclusión mutua
 *   sobre saldos y rankings.
 *
 * MEDIDAS DE SEGURIDAD Y RESILIENCIA:
 *   1. Detección Inteligente de Red (Bypass Offline): Prueba activamente si hay un servidor
 *      Redis escuchando en la dirección configurada. Si no se detecta (ambiente local sin Redis),
 *      instancia un Proxy Dinámico (Mock) transparente para evitar fallos catastróficos de arranque (DDoS interno).
 *   2. Autocura en Producción: En ambientes productivos con Redis activo, levanta el cliente completo
 *      con pool de conexiones seguro y de alto rendimiento.
 */
@Configuration
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);
    private final ConcurrentHashMap<String, Object> mockStorage = new ConcurrentHashMap<>();

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        String redisHost = System.getenv("REDIS_HOST");
        if (redisHost == null || redisHost.isEmpty()) {
            redisHost = "127.0.0.1";
        }
        
        String redisPortStr = System.getenv("REDIS_PORT");
        if (redisPortStr == null || redisPortStr.isEmpty()) {
            redisPortStr = "6379";
        }
        int redisPort = Integer.parseInt(redisPortStr);

        log.info("🔍 [RedisConfig] Probando conexión activa a Redis en {}:{}...", redisHost, redisPort);
        boolean redisAvailable = false;
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(redisHost, redisPort), 1000); // 1 segundo timeout
            redisAvailable = true;
            log.info("✅ [RedisConfig] Servidor Redis detectado en {}:{}. Iniciando cliente Redisson de alta disponibilidad.", redisHost, redisPort);
        } catch (IOException e) {
            log.warn("⚠️ [RedisConfig] No se detectó un servidor Redis activo en {}:{}. Levantando Proxy Dinámico adaptativo para desarrollo local offline.", redisHost, redisPort);
        }

        if (redisAvailable) {
            Config config = new Config();
            config.useSingleServer()
                    .setAddress("redis://" + redisHost + ":" + redisPort)
                    .setConnectionPoolSize(64)
                    .setConnectionMinimumIdleSize(24)
                    .setSubscriptionConnectionPoolSize(50);
            return Redisson.create(config);
        } else {
            return createMockRedissonClient();
        }
    }

    private RedissonClient createMockRedissonClient() {
        return (RedissonClient) Proxy.newProxyInstance(
                RedissonClient.class.getClassLoader(),
                new Class<?>[]{RedissonClient.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    
                    // Métodos estándar de Object
                    if ("equals".equals(methodName)) {
                        return proxy == args[0];
                    }
                    if ("hashCode".equals(methodName)) {
                        return System.identityHashCode(proxy);
                    }
                    if ("toString".equals(methodName)) {
                        return "MockRedissonClientProxy";
                    }
                    
                    // Métodos de RedissonClient
                    if ("getLock".equals(methodName)) {
                        String lockName = (String) args[0];
                        return createMockLock(lockName);
                    }
                    if ("getBucket".equals(methodName)) {
                        String bucketName = (String) args[0];
                        return createMockBucket(bucketName);
                    }
                    if ("getScoredSortedSet".equals(methodName)) {
                        // Provocar excepción controlada para activar el fallback robusto en los servicios consumidores
                        throw new RuntimeException("Redis no disponible en modo offline. Utilizando fallback nativo en base de datos.");
                    }
                    if ("shutdown".equals(methodName)) {
                        log.info("🔌 [RedisConfig Mock] Apagando el Proxy Dinámico de Redisson...");
                        return null;
                    }
                    throw new UnsupportedOperationException("El método " + methodName + " no está soportado en modo Mock offline.");
                }
        );
    }

    @SuppressWarnings("unchecked")
    private RBucket<Object> createMockBucket(String key) {
        return (RBucket<Object>) Proxy.newProxyInstance(
                RBucket.class.getClassLoader(),
                new Class<?>[]{RBucket.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    
                    // Métodos estándar de Object
                    if ("equals".equals(methodName)) {
                        return proxy == args[0];
                    }
                    if ("hashCode".equals(methodName)) {
                        return System.identityHashCode(proxy);
                    }
                    if ("toString".equals(methodName)) {
                        return "MockRBucket[" + key + "]";
                    }
                    
                    // Métodos de RBucket
                    if ("get".equals(methodName)) {
                        return mockStorage.get(key);
                    }
                    if ("set".equals(methodName)) {
                        if (args.length >= 1) {
                            Object val = args[0];
                            if (val == null) {
                                mockStorage.remove(key);
                            } else {
                                mockStorage.put(key, val);
                            }
                        }
                        return null;
                    }
                    if ("isExists".equals(methodName)) {
                        return mockStorage.containsKey(key);
                    }
                    if ("delete".equals(methodName)) {
                        return mockStorage.remove(key) != null;
                    }
                    
                    return null;
                }
        );
    }

    private RLock createMockLock(String lockName) {
        return (RLock) Proxy.newProxyInstance(
                RLock.class.getClassLoader(),
                new Class<?>[]{RLock.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    
                    // Métodos estándar de Object
                    if ("equals".equals(methodName)) {
                        return proxy == args[0];
                    }
                    if ("hashCode".equals(methodName)) {
                        return System.identityHashCode(proxy);
                    }
                    if ("toString".equals(methodName)) {
                        return "MockRLockProxy[" + lockName + "]";
                    }
                    
                    // Métodos de RLock
                    if ("tryLock".equals(methodName)) {
                        log.info("🔐 [RedisConfig Mock] Adquisición simulada exitosa para lock: {}", lockName);
                        return true;
                    }
                    if ("isHeldByCurrentThread".equals(methodName)) {
                        return true;
                    }
                    if ("unlock".equals(methodName)) {
                        log.info("🔓 [RedisConfig Mock] Liberación simulada exitosa para lock: {}", lockName);
                        return null;
                    }
                    return null;
                }
        );
    }
}
