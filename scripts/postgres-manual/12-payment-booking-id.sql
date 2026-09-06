-- Liga cada cobro con la reserva que lo originó, para que cancelar la clase
-- pueda anular el adeudo. Los pagos viejos quedan con booking_id NULL: se
-- siguen viendo y cobrando igual, sólo que no se anulan solos.
ALTER TABLE payment ADD COLUMN IF NOT EXISTS booking_id text;

CREATE INDEX IF NOT EXISTS payment_bookingId_idx ON payment (booking_id);

-- Anulación de pagos desde el panel: quién, cuándo y por qué. La fila no se
-- borra nunca, para que el histórico de caja siga cuadrando.
ALTER TABLE payment ADD COLUMN IF NOT EXISTS cancelled_at timestamp (3);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS cancelled_by text;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS cancel_reason text;

-- `payment.validated` quedó obsoleta: era una casilla que sólo se marcaba a sí
-- misma, ningún reporte ni saldo la leía. La columna se deja en su lugar para
-- no tocar datos históricos; se puede borrar a mano cuando quieran:
--   ALTER TABLE payment DROP COLUMN validated;
