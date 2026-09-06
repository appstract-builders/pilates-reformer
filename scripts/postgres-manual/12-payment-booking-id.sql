-- Liga cada cobro con la reserva que lo originó, para que cancelar la clase
-- pueda anular el adeudo. Los pagos viejos quedan con booking_id NULL: se
-- siguen viendo y cobrando igual, sólo que no se anulan solos.
ALTER TABLE payment ADD COLUMN IF NOT EXISTS booking_id text;

CREATE INDEX IF NOT EXISTS payment_bookingId_idx ON payment (booking_id);
