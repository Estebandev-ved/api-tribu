package com.tribu.api_tribu.exception;

public class TransferenciaException extends RuntimeException {
    public TransferenciaException(String message) {
        super(message);
    }

    public static class SaldoInsuficienteException extends TransferenciaException {
        public SaldoInsuficienteException() {
            super("Saldo insuficiente");
        }
    }

    public static class LimiteDiarioExcedidoException extends TransferenciaException {
        public LimiteDiarioExcedidoException() {
            super("Límite diario de $500.000 alcanzado");
        }
    }

    public static class DestinatarioNoEncontradoException extends TransferenciaException {
        public DestinatarioNoEncontradoException() {
            super("Usuario no encontrado");
        }
    }

    public static class AutoTransferenciaException extends TransferenciaException {
        public AutoTransferenciaException() {
            super("No puedes enviarte dinero a ti mismo");
        }
    }

    public static class MontoMinimoException extends TransferenciaException {
        public MontoMinimoException() {
            super("El monto mínimo es $1.000");
        }
    }

    public static class PinIncorrectoException extends TransferenciaException {
        public PinIncorrectoException() {
            super("PIN de seguridad incorrecto");
        }
    }

    public static class PinNoConfiguradoException extends TransferenciaException {
        public PinNoConfiguradoException() {
            super("Debes configurar un PIN de seguridad antes de realizar esta operación");
        }
    }
}
