package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.Producto;
import com.tribu.api_tribu.repository.ProductoRepository;
import com.tribu.api_tribu.telegram.TelegramNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventarioService {

    private final ProductoRepository productoRepository;
    private final TelegramNotificationService telegramService;

    @Transactional
    public void verificarStockPostVenta(Producto producto) {
        int stock = producto.getStock();
        int stockCritico = producto.getStockCritico() != null ? producto.getStockCritico() : 3;
        int stockMinimo = producto.getStockMinimo() != null ? producto.getStockMinimo() : 5;

        if (stock <= stockCritico) {
            if (puedeEnviarAlerta(producto)) {
                telegramService.alertaStockCritico(producto.getNombre(), stock);
                producto.setAlertaEnviadaEn(LocalDateTime.now());
                productoRepository.save(producto);
            }
        } else if (stock <= stockMinimo) {
            if (puedeEnviarAlerta(producto)) {
                telegramService.alertaStockBajo(producto.getNombre(), stock);
                producto.setAlertaEnviadaEn(LocalDateTime.now());
                productoRepository.save(producto);
            }
        }
    }

    public boolean puedeEnviarAlerta(Producto p) {
        if (p.getAlertaEnviadaEn() == null) {
            return true;
        }
        return p.getAlertaEnviadaEn().isBefore(LocalDateTime.now().minusHours(2));
    }

    public List<Producto> getStockBajo() {
        return productoRepository.findByStockLessThanEqualOrderByStockAsc(5);
    }

    public List<Producto> getStockCritico() {
        return productoRepository.findByStockLessThanEqual(3);
    }

    @Transactional
    public Producto actualizarStock(Long productoId, Integer cantidad) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productoId));
        
        producto.setStock(cantidad);
        productoRepository.save(producto);
        
        verificarStockPostVenta(producto);
        
        return producto;
    }

    @Transactional
    public Producto actualizarUmbrales(Long productoId, Integer stockMinimo, Integer stockCritico) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productoId));
        
        producto.setStockMinimo(stockMinimo);
        producto.setStockCritico(stockCritico);
        
        return productoRepository.save(producto);
    }

    public InventarioDashboard getDashboard() {
        List<Producto> todos = productoRepository.findAll();
        
        long totalProductos = todos.size();
        long productosStockOk = todos.stream().filter(p -> p.getStock() > 5).count();
        long productosStockBajo = todos.stream().filter(p -> p.getStock() > 3 && p.getStock() <= 5).count();
        long productosStockCritico = todos.stream().filter(p -> p.getStock() <= 3).count();
        int stockTotal = todos.stream().mapToInt(p -> p.getStock() != null ? p.getStock() : 0).sum();
        
        return new InventarioDashboard(
                totalProductos,
                productosStockOk,
                productosStockBajo,
                productosStockCritico,
                stockTotal
        );
    }

    public record InventarioDashboard(
            long totalProductos,
            long productosStockOk,
            long productosStockBajo,
            long productosStockCritico,
            int stockTotal
    ) {}
}
