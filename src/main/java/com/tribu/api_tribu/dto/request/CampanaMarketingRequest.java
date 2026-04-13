package com.tribu.api_tribu.dto.request;

import com.tribu.api_tribu.model.SegmentoCampana;
import com.tribu.api_tribu.model.TipoCampana;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaMarketingRequest {
    private String titulo;
    private String cuerpo;
    private TipoCampana tipo;
    private SegmentoCampana segmento;
    private LocalDateTime fechaProgramada;
}