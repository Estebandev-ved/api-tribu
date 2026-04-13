package com.tribu.api_tribu.model;

/**
 * Tipos de beneficio disponibles por nivel VIP.
 * Cada tier puede tener uno o más de estos beneficios configurados en BD.
 */
public enum TipoBeneficio {
    /** Porcentaje de cashback sobre compras entregadas (ej: "0.05" = 5%) */
    CASHBACK_PCT,

    /** Si el usuario tiene acceso a la ruleta diaria (ej: "true") */
    RULETA_HABILITADA,

    /** Monto máximo diario que puede ganar en la ruleta (ej: "20000") */
    RULETA_LIMITE_DIARIO,

    /** Si el usuario goza de envío gratis (ej: "true") */
    ENVIO_GRATIS,

    /** Descuento extra porcentual en productos seleccionados (ej: "0.10" = 10%) */
    DESCUENTO_EXTRA_PCT
}
