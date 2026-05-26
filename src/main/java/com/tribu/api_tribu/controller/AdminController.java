package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.ActualizarEstadoPedidoRequest;
import com.tribu.api_tribu.dto.request.CrmNotaRequest;
import com.tribu.api_tribu.dto.response.CrmNotaResponse;
import com.tribu.api_tribu.dto.response.PedidoResponse;
import com.tribu.api_tribu.dto.response.ProductoFinancieroDTO;
import com.tribu.api_tribu.dto.response.DashboardKpisDTO;
import com.tribu.api_tribu.dto.response.ResumenCajaDTO;
import com.tribu.api_tribu.dto.response.RegistroVentaDTO;
import com.tribu.api_tribu.dto.response.ProductoRentabilidadDTO;
import com.tribu.api_tribu.service.CrmNotaService;
import com.tribu.api_tribu.service.FinanzasService;
import com.tribu.api_tribu.service.PedidoService;
import com.tribu.api_tribu.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PedidoService pedidoService;
    private final CrmNotaService crmNotaService;
    private final ProductoService productoService;
    private final FinanzasService finanzasService;

    // ——— Gestión de Pedidos (Panel Admin) ———

    @GetMapping("/pedidos")
    public ResponseEntity<List<PedidoResponse>> getAllPedidos() {
        return ResponseEntity.ok(pedidoService.getAllPedidos());
    }

    @GetMapping("/pedidos/estado/{estado}")
    public ResponseEntity<List<PedidoResponse>> getByEstado(@PathVariable String estado) {
        return ResponseEntity.ok(pedidoService.getByEstado(estado));
    }

    @PatchMapping("/pedidos/{id}/estado")
    public ResponseEntity<PedidoResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoPedidoRequest request) {
        return ResponseEntity.ok(pedidoService.actualizarEstado(id, request));
    }

    // ——— CRM ———

    @GetMapping("/crm/notas")
    public ResponseEntity<List<CrmNotaResponse>> getTodasLasNotas() {
        return ResponseEntity.ok(crmNotaService.getTodasLasNotas());
    }

    @GetMapping("/crm/notas/cliente/{clienteId}")
    public ResponseEntity<List<CrmNotaResponse>> getNotasPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(crmNotaService.getNotasPorCliente(clienteId));
    }

    @PostMapping("/crm/notas")
    public ResponseEntity<CrmNotaResponse> crearNota(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CrmNotaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(crmNotaService.crearNota(userDetails.getUsername(), request));
    }

    // ——— Control Financiero y Márgenes (KPIs históricos) ———

    @GetMapping("/productos/financiero")
    public ResponseEntity<List<ProductoFinancieroDTO>> getProductosFinancieros() {
        return ResponseEntity.ok(productoService.getProductosFinancieros());
    }

    @GetMapping("/dashboard/kpis")
    public ResponseEntity<DashboardKpisDTO> getDashboardKpis() {
        return ResponseEntity.ok(productoService.getDashboardKpis());
    }

    // ——— Suite Contable: Caja, Libro Diario y Rentabilidad ———

    /**
     * Resumen financiero de caja: ingresos, egresos, utilidad neta, efectivo y pendiente.
     * Seguridad: Endpoint protegido por JWT + ROLE_ADMIN. Solo accesible desde el panel admin.
     */
    @GetMapping("/finanzas/resumen-caja")
    public ResponseEntity<ResumenCajaDTO> getResumenCaja() {
        return ResponseEntity.ok(finanzasService.getResumenCaja());
    }

    /**
     * Libro Diario de Ventas automático: cada renglón es un ítem vendido de pedidos válidos.
     * Seguridad: Endpoint protegido por JWT + ROLE_ADMIN. Solo accesible desde el panel admin.
     */
    @GetMapping("/finanzas/registro-ventas")
    public ResponseEntity<List<RegistroVentaDTO>> getRegistroVentas() {
        return ResponseEntity.ok(finanzasService.getRegistroVentas());
    }

    /**
     * Análisis de rentabilidad por producto (SKU): unidades vendidas, ingresos,
     * costos y utilidad acumulada con semáforo de rendimiento.
     * Seguridad: Endpoint protegido por JWT + ROLE_ADMIN. Solo accesible desde el panel admin.
     */
    @GetMapping("/finanzas/productos-rentabilidad")
    public ResponseEntity<List<ProductoRentabilidadDTO>> getProductosRentabilidad() {
        return ResponseEntity.ok(finanzasService.getRentabilidadProductos());
    }
}
