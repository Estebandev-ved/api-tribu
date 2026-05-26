package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKpisDTO {
    private BigDecimal activoBodega; // Capital inmovilizado ($Stock * CostoProveedor)
    private BigDecimal margenPromedioGlobal; // Termómetro de rentabilidad (%)
    private BigDecimal breakEvenUnits; // Unidades que deben venderse para recuperar la inversión inicial
}
