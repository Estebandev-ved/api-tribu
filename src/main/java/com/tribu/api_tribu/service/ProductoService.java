package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.ProductoRequest;
import com.tribu.api_tribu.dto.response.ProductoResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Categoria;
import com.tribu.api_tribu.model.Producto;
import com.tribu.api_tribu.model.NotificacionEvent;
import com.tribu.api_tribu.repository.CategoriaRepository;
import com.tribu.api_tribu.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ApplicationEventPublisher eventPublisher;

    public List<ProductoResponse> getAll() {
        return productoRepository.findByActivoTrue().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductoResponse> getVirales() {
        return productoRepository.findByEsViralTrueAndActivoTrue().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductoResponse> buscarPorNombre(String nombre) {
        return productoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductoResponse> getStockBajo(Integer umbral) {
        return productoRepository.findByStockLessThanEqual(umbral).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public ProductoResponse getById(Long id) {
        return toResponse(findProducto(id));
    }

    public ProductoResponse crear(ProductoRequest request) {
        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", "id", request.getCategoriaId()));

        Producto producto = new Producto();
        mapRequestToProducto(request, producto, categoria);
        Producto guardado = productoRepository.save(producto);
        enviarNotificacionProducto(guardado);
        return toResponse(guardado);
    }

    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = findProducto(id);
        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", "id", request.getCategoriaId()));

        mapRequestToProducto(request, producto, categoria);
        return toResponse(productoRepository.save(producto));
    }

    public void eliminar(Long id) {
        Producto producto = findProducto(id);
        producto.setActivo(false); // Soft delete
        productoRepository.save(producto);
    }

    private void enviarNotificacionProducto(Producto producto) {
        NotificacionEvent event = new NotificacionEvent(
                "PRODUCTO",
                "Nuevo producto agregado",
                "Se ha agregado un nuevo producto: " + producto.getNombre(),
                producto.getCategoria().getId().toString());
        eventPublisher.publishEvent(event);
    }

    // ——— Helpers ———

    private Producto findProducto(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));
    }

    private void mapRequestToProducto(ProductoRequest req, Producto p, Categoria cat) {
        p.setNombre(req.getNombre());
        p.setDescripcion(req.getDescripcion());
        p.setPrecio(req.getPrecio());
        p.setStock(req.getStock());
        p.setImagenUrl(req.getImagenUrl());
        p.setEsViral(req.getEsViral() != null ? req.getEsViral() : false);
        p.setActivo(req.getActivo() != null ? req.getActivo() : true);
        p.setCategoria(cat);
    }

    public ProductoResponse toResponse(Producto p) {
        return ProductoResponse.builder()
                .id(p.getId())
                .nombre(p.getNombre())
                .descripcion(p.getDescripcion())
                .precio(p.getPrecio())
                .stock(p.getStock())
                .imagenUrl(p.getImagenUrl())
                .esViral(p.getEsViral())
                .activo(p.getActivo())
                .categoriaId(p.getCategoria() != null ? p.getCategoria().getId() : null)
                .categoriaNombre(p.getCategoria() != null ? p.getCategoria().getNombre() : null)
                .build();
    }
}
