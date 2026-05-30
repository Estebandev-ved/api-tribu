package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.model.RuletaConfig;
import com.tribu.api_tribu.model.RuletaGiro;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.repository.RuletaConfigRepository;
import com.tribu.api_tribu.repository.RuletaGiroRepository;
import com.tribu.api_tribu.service.SaldoService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Controlador para la Ruleta de Premios Tribu.
 * Permite a los usuarios girar una vez gratis al día y comprar giros adicionales con puntos acumulados.
 * 
 * 🛡️ MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 * 1. Control de Autenticación Centralizado: Se utiliza {@code obtenerUsuarioAutenticado()} para recuperar la
 *    identidad del usuario firmemente acoplada al contexto de Spring Security. Esto previene ataques de spoofing o
 *    intento de llamadas a nombre de otros usuarios.
 * 2. Validación de Límites Temporales: El giro diario gratuito está custodiado por {@code fechaUltimoGiroRuleta}.
 *    Se valida en base de datos previniendo solicitudes maliciosas que intenten repetir giros el mismo día.
 * 3. Transaccionalidad de Ledger Inmutable: Ambos métodos de giro operan bajo la anotación {@code @Transactional}.
 *    Si ocurre alguna falla de red o base de datos a mitad de camino, toda la operación hace rollback, evitando la duplicidad o pérdida de saldo.
 * 4. Validación Rigurosa de Fondos para Giros de Canje: En {@code girarConPuntos()} se realiza una consulta del
 *    saldo real desde la base de datos (ledger) antes de permitir la deducción. Esto impide ataques de sobregiro o "Double Spending".
 * 5. Libro Mayor (Ledger) Negativo: La deducción de puntos crea una entrada negativa inmutable del tipo {@code RECOMPENSA_CANJE},
 *    dejando pistas de auditoría claras y auditables por administradores.
 */
@RestController
@RequestMapping("/api/usuarios/ruleta")
@RequiredArgsConstructor
public class RuletaController {

    private final UsuarioRepository usuarioRepository;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final RuletaConfigRepository ruletaConfigRepository;
    private final RuletaGiroRepository ruletaGiroRepository;
    private final Random random = new Random();

    // Costo del giro adicional en puntos
    private static final double COSTO_GIRO_PUNTOS = 2000.0;

    /**
     * Endpoint para realizar el giro diario gratuito.
     * 🛡️ Seguridad: Valida el límite de 1 giro diario consultando directamente la marca de tiempo persistente.
     */
    @PostMapping("/girar")
    @Transactional
    public ResponseEntity<Map<String, Object>> girarRuleta() {
        Usuario usuario = obtenerUsuarioAutenticado();

        LocalDateTime ultimoGiro = usuario.getFechaUltimoGiroRuleta();
        if (ultimoGiro != null && ultimoGiro.toLocalDate().isEqual(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "mensaje", "Ya has girado la ruleta hoy. Puedes comprar un giro extra con tus puntos."));
        }

        Map<String, Object> premioInfo = calcularPremioAleatorioCompleto();
        double premio = (double) premioInfo.get("val");
        String tipoPremio = (String) premioInfo.get("tipo");
        String labelPremio = (String) premioInfo.get("label");
        String codigoPremio = (String) premioInfo.get("codigo");

        usuario.setFechaUltimoGiroRuleta(LocalDateTime.now());
        usuarioRepository.save(usuario);

        if (premio > 0) {
            saldoService.registrarPremioRuleta(usuario, premio);
            wsService.notificarSaldoActualizado(
                    usuario.getId(), premio, "RULETA",
                    "¡Ganaste " + labelPremio + " en la Ruleta Tribu!");
        }

        // Registrar el giro en la base de datos para auditoría y visualización del admin
        RuletaGiro giro = new RuletaGiro();
        giro.setUsuario(usuario);
        giro.setFecha(LocalDateTime.now());
        giro.setTipoGiro("GRATUITO");
        giro.setPremioMonto(premio);
        giro.setTipoPremio(tipoPremio);
        giro.setLabelPremio(labelPremio);
        giro.setCodigoPremio(codigoPremio);
        ruletaGiroRepository.save(giro);

        double nuevoSaldo = saldoService.consultarSaldoReal(usuario.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("premio", premio);
        result.put("tipoPremio", tipoPremio);
        result.put("labelPremio", labelPremio);
        result.put("codigoPremio", codigoPremio);
        result.put("nuevoSaldo", nuevoSaldo);
        return ResponseEntity.ok(result);
    }

    /**
     * Endpoint para comprar y girar la ruleta utilizando puntos de la Tribu Card.
     * 🛡️ Seguridad: Valida saldos reales contra ledger persistente en transacción segura antes de debitar.
     */
    @PostMapping("/girar-con-puntos")
    @Transactional
    public ResponseEntity<Map<String, Object>> girarConPuntos() {
        Usuario usuario = obtenerUsuarioAutenticado();

        double saldoDisponible = saldoService.consultarSaldoReal(usuario.getId());
        if (saldoDisponible < COSTO_GIRO_PUNTOS) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "mensaje", "Saldo insuficiente en tu Tribu Card. Necesitas " + String.format("%.0f", COSTO_GIRO_PUNTOS) + " pts."));
        }

        // Deducción de saldo por giro (Medida de Auditoría Ledger)
        saldoService.crearYAcreditar(
                usuario, 
                -COSTO_GIRO_PUNTOS, 
                MovimientoSaldo.TipoMovimiento.RECOMPENSA_CANJE, 
                null, 
                "Canje de " + String.format("%.0f", COSTO_GIRO_PUNTOS) + " pts por giro adicional en Ruleta."
        );

        Map<String, Object> premioInfo = calcularPremioAleatorioCompleto();
        double premio = (double) premioInfo.get("val");
        String tipoPremio = (String) premioInfo.get("tipo");
        String labelPremio = (String) premioInfo.get("label");
        String codigoPremio = (String) premioInfo.get("codigo");

        if (premio > 0) {
            saldoService.registrarPremioRuleta(usuario, premio);
            wsService.notificarSaldoActualizado(
                    usuario.getId(), premio, "RULETA",
                    "¡Ganaste " + labelPremio + " en la Ruleta Tribu!");
        }

        // Registrar el giro en la base de datos para auditoría y visualización del admin
        RuletaGiro giro = new RuletaGiro();
        giro.setUsuario(usuario);
        giro.setFecha(LocalDateTime.now());
        giro.setTipoGiro("PUNTOS");
        giro.setPremioMonto(premio);
        giro.setTipoPremio(tipoPremio);
        giro.setLabelPremio(labelPremio);
        giro.setCodigoPremio(codigoPremio);
        ruletaGiroRepository.save(giro);

        double nuevoSaldo = saldoService.consultarSaldoReal(usuario.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("premio", premio);
        result.put("tipoPremio", tipoPremio);
        result.put("labelPremio", labelPremio);
        result.put("codigoPremio", codigoPremio);
        result.put("nuevoSaldo", nuevoSaldo);
        return ResponseEntity.ok(result);
    }

    /**
     * Endpoint Administrativo: Obtener todos los giros registrados en la web.
     * 🛡️ Seguridad: Valida rol de administrador y evita fuga de información.
     */
    @GetMapping("/admin/giros")
    public ResponseEntity<List<RuletaGiro>> getTodosLosGiros() {
        Usuario admin = obtenerUsuarioAutenticado();
        if (admin.getRol() == null || !"ADMIN".equalsIgnoreCase(admin.getRol().getNombre())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(ruletaGiroRepository.findAllByOrderByFechaDesc());
    }

    /**
     * Endpoint Administrativo/Público: Obtener el nombre del producto sorpresa configurado.
     */
    @GetMapping("/admin/config")
    public ResponseEntity<Map<String, Object>> getRuletaConfig() {
        String productoRegalo = obtenerProductoRegalo();
        return ResponseEntity.ok(Map.of("productoRegalo", productoRegalo));
    }

    /**
     * Endpoint Administrativo: Guardar el nombre del producto sorpresa configurado.
     * 🛡️ Seguridad: Valida rol de administrador.
     */
    @PostMapping("/admin/config")
    @Transactional
    public ResponseEntity<Map<String, Object>> saveRuletaConfig(@RequestBody Map<String, String> payload) {
        Usuario admin = obtenerUsuarioAutenticado();
        if (admin.getRol() == null || !"ADMIN".equalsIgnoreCase(admin.getRol().getNombre())) {
            return ResponseEntity.status(403).build();
        }
        String nuevoProducto = payload.get("productoRegalo");
        if (nuevoProducto == null || nuevoProducto.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "mensaje", "El producto no puede estar vacío."));
        }

        RuletaConfig config = ruletaConfigRepository.findAll().stream()
                .findFirst()
                .orElse(new RuletaConfig());
        config.setProductoRegalo(nuevoProducto.trim());
        ruletaConfigRepository.save(config);

        return ResponseEntity.ok(Map.of("success", true, "productoRegalo", config.getProductoRegalo()));
    }

    /**
     * Helper para calcular premios aleatorios respetando la probabilidad deseada.
     * 🛡️ Seguridad: Lógica contenida 100% en backend (cero control en el cliente) para mitigar trampas de XSS/Manipulación de memoria en frontend.
     */
    private Map<String, Object> calcularPremioAleatorioCompleto() {
        int r = random.nextInt(100);
        Map<String, Object> p = new HashMap<>();

        if (r < 30) { // 30% → Casi!
            p.put("val", 0.0);
            p.put("tipo", "NADA");
            p.put("label", "0 pts");
            p.put("codigo", "");
        } else if (r < 55) { // 25% → 500 pts
            p.put("val", 500.0);
            p.put("tipo", "PUNTOS");
            p.put("label", "500 pts");
            p.put("codigo", "");
        } else if (r < 75) { // 20% → 1.000 pts
            p.put("val", 1000.0);
            p.put("tipo", "PUNTOS");
            p.put("label", "1.000 pts");
            p.put("codigo", "");
        } else if (r < 85) { // 10% → 2.000 pts
            p.put("val", 2000.0);
            p.put("tipo", "PUNTOS");
            p.put("label", "2.000 pts");
            p.put("codigo", "");
        } else if (r < 92) { // 7% → 10% Descuento (código: DTO10_RULETA) + 3.000 pts
            p.put("val", 3000.0);
            p.put("tipo", "DESCUENTO");
            p.put("label", "10% Dto 🏷️");
            p.put("codigo", "DTO10_RULETA");
        } else if (r < 97) { // 5% → Envío Gratis (código: ENVIO_GRATIS_RULETA) + 4.000 pts
            p.put("val", 4000.0);
            p.put("tipo", "ENVIO_GRATIS");
            p.put("label", "Envío Gratis 🚚");
            p.put("codigo", "ENVIO_GRATIS_RULETA");
        } else { // 3% → Producto Sorpresa (código: GADGET_VIRAL) + 5.000 pts
            p.put("val", 5000.0);
            p.put("tipo", "PRODUCTO");
            p.put("label", "¡Regalo! 🎁 (" + obtenerProductoRegalo() + ")");
            p.put("codigo", "GADGET_VIRAL");
        }
        return p;
    }

    private String obtenerProductoRegalo() {
        return ruletaConfigRepository.findAll().stream()
                .findFirst()
                .map(RuletaConfig::getProductoRegalo)
                .orElse("Gadget Magnético Viral 🎁");
    }

    private Usuario obtenerUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }
}
