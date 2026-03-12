package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.CategoriaRequest;
import com.tribu.api_tribu.dto.response.ProductoResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Categoria;
import com.tribu.api_tribu.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoService productoService;

    public List<Categoria> getAll() {
        return categoriaRepository.findByActivaTrue();
    }

    public Categoria getById(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", "id", id));
    }

    public List<ProductoResponse> getProductosByCategoria(Long id) {
        Categoria categoria = getById(id);
        return categoriaRepository.findById(id)
                .map(c -> c.getProductos().stream()
                        .filter(p -> Boolean.TRUE.equals(p.getActivo()))
                        .map(productoService::toResponse)
                        .toList())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", "id", id));
    }

    public Categoria crear(CategoriaRequest request) {
        Categoria categoria = new Categoria();
        mapRequest(request, categoria);
        return categoriaRepository.save(categoria);
    }

    public Categoria actualizar(Long id, CategoriaRequest request) {
        Categoria categoria = getById(id);
        mapRequest(request, categoria);
        return categoriaRepository.save(categoria);
    }

    public void eliminar(Long id) {
        Categoria categoria = getById(id);
        categoria.setActiva(false); // Soft delete
        categoriaRepository.save(categoria);
    }

    private void mapRequest(CategoriaRequest req, Categoria cat) {
        cat.setNombre(req.getNombre());
        cat.setDescripcion(req.getDescripcion());
        cat.setImagenUrl(req.getImagenUrl());
        cat.setActiva(req.getActiva() != null ? req.getActiva() : true);
    }
}
