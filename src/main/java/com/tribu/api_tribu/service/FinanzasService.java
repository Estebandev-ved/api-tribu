package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.ProductoRentabilidadDTO;
import com.tribu.api_tribu.dto.response.RegistroVentaDTO;
import com.tribu.api_tribu.dto.response.ResumenCajaDTO;
import com.tribu.api_tribu.model.DetallePedido;
import com.tribu.api_tribu.model.Pedido;
import com.tribu.api_tribu.model.Producto;
import com.tribu.api_tribu.repository.DetallePedidoRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio financiero contable aislado, siguiendo Clean Architecture.
 * Centraliza toda la lógica de cálculo de ingresos, egresos, utilidades y rentabilidad por SKU.
 * Seguridad: Sus métodos son llamados únicamente desde AdminController, que exige JWT + ROLE_ADMIN.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanzasService {

    private static final List<String> ESTADOS_VALIDOS = List.of("PAGADO", "ENVIADO", "ENTREGADO");

    private final DetallePedidoRepository detallePedidoRepository;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    /**
     * Calcula el resumen financiero de caja.
     * Agrega: ingresos, egresos COGS, utilidad neta, efectivo en caja y dinero pendiente.
     */
    public ResumenCajaDTO getResumenCaja() {
        List<Pedido> todosPedidos = pedidoRepository.findAllByOrderByFechaPedidoDesc();
        List<DetallePedido> detallesValidos = detallePedidoRepository.findDetallesVentasValidas();

        BigDecimal ingresosTotales = BigDecimal.ZERO;
        BigDecimal egresosTotalesCogs = BigDecimal.ZERO;
        long totalItems = 0L;

        // Calcular ingresos y egresos desde detalles de pedidos válidos
        for (DetallePedido d : detallesValidos) {
            Producto p = d.getProducto();
            BigDecimal cantidad = BigDecimal.valueOf(d.getCantidad() != null ? d.getCantidad() : 0);

            // Ingreso = precioUnitario * cantidad
            BigDecimal precioUnit = d.getPrecioUnitario() != null ? d.getPrecioUnitario() : BigDecimal.ZERO;
            ingresosTotales = ingresosTotales.add(precioUnit.multiply(cantidad));

            // Egreso (COGS) = costoUnitario * cantidad
            BigDecimal costoUnit = calcularCostoUnitario(p);
            egresosTotalesCogs = egresosTotalesCogs.add(costoUnit.multiply(cantidad));

            totalItems += d.getCantidad() != null ? d.getCantidad() : 0;
        }

        BigDecimal utilidadNeta = ingresosTotales.subtract(egresosTotalesCogs);

        // Dinero pendiente: suma de pedidos en estado PENDIENTE
        BigDecimal dineroPendiente = todosPedidos.stream()
                .filter(p -> "PENDIENTE".equals(p.getEstado()))
                .map(p -> p.getTotal() != null ? p.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Efectivo en caja: suma de pedidos válidos (PAGADO, ENVIADO, ENTREGADO)
        BigDecimal efectivoCaja = todosPedidos.stream()
                .filter(p -> ESTADOS_VALIDOS.contains(p.getEstado()))
                .map(p -> p.getTotal() != null ? p.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalVentas = todosPedidos.stream()
                .filter(p -> ESTADOS_VALIDOS.contains(p.getEstado()))
                .count();

        return ResumenCajaDTO.builder()
                .ingresosTotales(ingresosTotales.setScale(2, RoundingMode.HALF_UP))
                .egresosTotalesCogs(egresosTotalesCogs.setScale(2, RoundingMode.HALF_UP))
                .utilidadNeta(utilidadNeta.setScale(2, RoundingMode.HALF_UP))
                .efectivoCaja(efectivoCaja.setScale(2, RoundingMode.HALF_UP))
                .dineroPendiente(dineroPendiente.setScale(2, RoundingMode.HALF_UP))
                .totalVentas(totalVentas)
                .totalItemsVendidos(totalItems)
                .build();
    }

    /**
     * Genera el Libro Diario de Ventas Automático.
     * Cada renglón representa un ítem vendido (DetallePedido) de pedidos válidos.
     */
    public List<RegistroVentaDTO> getRegistroVentas() {
        List<DetallePedido> detalles = detallePedidoRepository.findDetallesVentasValidas();
        List<RegistroVentaDTO> registros = new ArrayList<>();

        for (DetallePedido d : detalles) {
            Producto prod = d.getProducto();
            Pedido pedido = d.getPedido();

            BigDecimal cantidad = BigDecimal.valueOf(d.getCantidad() != null ? d.getCantidad() : 0);
            BigDecimal precioUnitario = d.getPrecioUnitario() != null ? d.getPrecioUnitario() : BigDecimal.ZERO;
            BigDecimal ingresoTotal = precioUnitario.multiply(cantidad);
            BigDecimal costoUnitario = calcularCostoUnitario(prod);
            BigDecimal costoTotal = costoUnitario.multiply(cantidad);
            BigDecimal utilidadNeta = ingresoTotal.subtract(costoTotal);

            String clienteNombre = pedido.getUsuario() != null ? pedido.getUsuario().getNombreCompleto() : "—";

            registros.add(RegistroVentaDTO.builder()
                    .id(d.getId())
                    .pedidoId(pedido.getId())
                    .fecha(pedido.getFechaPedido())
                    .producto(prod != null ? prod.getNombre() : "—")
                    .imagenUrl(prod != null ? prod.getImagenUrl() : null)
                    .cantidad(d.getCantidad())
                    .precioUnitario(precioUnitario.setScale(2, RoundingMode.HALF_UP))
                    .ingresoTotal(ingresoTotal.setScale(2, RoundingMode.HALF_UP))
                    .costoUnitario(costoUnitario.setScale(2, RoundingMode.HALF_UP))
                    .costoTotal(costoTotal.setScale(2, RoundingMode.HALF_UP))
                    .utilidadNeta(utilidadNeta.setScale(2, RoundingMode.HALF_UP))
                    .estadoPedido(pedido.getEstado())
                    .cliente(clienteNombre)
                    .build());
        }
        return registros;
    }

    /**
     * Análisis de Rentabilidad por Producto (SKU).
     * Combina el catálogo activo con los detalles de ventas históricas para dar
     * una visión acumulada de utilidad, unidades vendidas y semáforo de rendimiento.
     */
    public List<ProductoRentabilidadDTO> getRentabilidadProductos() {
        List<Producto> productos = productoRepository.findByActivoTrue();
        List<DetallePedido> detallesValidos = detallePedidoRepository.findDetallesVentasValidas();

        // Agrupar ventas por producto
        Map<Long, Long> unidadesVendidasMap = new HashMap<>();
        Map<Long, BigDecimal> ingresosMap = new HashMap<>();
        Map<Long, BigDecimal> costosMap = new HashMap<>();

        for (DetallePedido d : detallesValidos) {
            if (d.getProducto() == null) continue;
            Long prodId = d.getProducto().getId();
            int cant = d.getCantidad() != null ? d.getCantidad() : 0;
            BigDecimal cantidad = BigDecimal.valueOf(cant);
            BigDecimal precio = d.getPrecioUnitario() != null ? d.getPrecioUnitario() : BigDecimal.ZERO;
            BigDecimal costo = calcularCostoUnitario(d.getProducto());

            unidadesVendidasMap.merge(prodId, (long) cant, Long::sum);
            ingresosMap.merge(prodId, precio.multiply(cantidad), BigDecimal::add);
            costosMap.merge(prodId, costo.multiply(cantidad), BigDecimal::add);
        }

        List<ProductoRentabilidadDTO> resultado = new ArrayList<>();
        for (Producto p : productos) {
            BigDecimal precio = p.getPrecio() != null ? p.getPrecio() : BigDecimal.ZERO;
            BigDecimal costoUnit = calcularCostoUnitario(p);
            BigDecimal margenUnit = precio.subtract(costoUnit);
            BigDecimal margenPct = precio.compareTo(BigDecimal.ZERO) > 0
                    ? margenUnit.multiply(BigDecimal.valueOf(100)).divide(precio, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            Long unidades = unidadesVendidasMap.getOrDefault(p.getId(), 0L);
            BigDecimal ingresos = ingresosMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal costos = costosMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal utilidad = ingresos.subtract(costos);

            String semaforo = margenPct.compareTo(BigDecimal.valueOf(60)) > 0 ? "EXCELENTE"
                    : margenPct.compareTo(BigDecimal.valueOf(40)) >= 0 ? "MODERADO"
                    : "CRITICO";

            resultado.add(ProductoRentabilidadDTO.builder()
                    .id(p.getId())
                    .nombre(p.getNombre())
                    .imagenUrl(p.getImagenUrl())
                    .categoriaNombre(p.getCategoria() != null ? p.getCategoria().getNombre() : "—")
                    .stock(p.getStock() != null ? p.getStock() : 0)
                    .precioVenta(precio.setScale(2, RoundingMode.HALF_UP))
                    .costoUnitarioTotal(costoUnit.setScale(2, RoundingMode.HALF_UP))
                    .margenUnitario(margenUnit.setScale(2, RoundingMode.HALF_UP))
                    .margenPorcentaje(margenPct)
                    .unidadesVendidas(unidades)
                    .ingresosGenerados(ingresos.setScale(2, RoundingMode.HALF_UP))
                    .costoTotalVendido(costos.setScale(2, RoundingMode.HALF_UP))
                    .utilidadTotalGenerada(utilidad.setScale(2, RoundingMode.HALF_UP))
                    .semaforoRendimiento(semaforo)
                    .build());
        }

        // Ordenar: más rentables primero
        resultado.sort((a, b) -> b.getMargenPorcentaje().compareTo(a.getMargenPorcentaje()));
        return resultado;
    }

    /**
     * Calcula el costo unitario total de un producto sumando los 3 componentes de costo.
     * COGS = costoProveedor + costoEmpaqueEnvio + comisionPasarelaFija
     */
    private BigDecimal calcularCostoUnitario(Producto p) {
        if (p == null) return BigDecimal.ZERO;
        BigDecimal cProv = p.getCostoProveedor() != null ? p.getCostoProveedor() : BigDecimal.ZERO;
        BigDecimal cEnvio = p.getCostoEmpaqueEnvio() != null ? p.getCostoEmpaqueEnvio() : BigDecimal.ZERO;
        BigDecimal cComision = p.getComisionPasarelaFija() != null ? p.getComisionPasarelaFija() : BigDecimal.ZERO;
        return cProv.add(cEnvio).add(cComision);
    }
}
