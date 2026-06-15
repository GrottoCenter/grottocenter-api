\c grottoce;

-- Widen postal_code from varchar(5) to varchar(10) to support international postal codes
-- (e.g., UK "SW1A 2AA", Brazil "12345-678", Iran 10-digit codes)
ALTER TABLE t_grotto ALTER COLUMN postal_code TYPE varchar(10);
ALTER TABLE h_grotto ALTER COLUMN postal_code TYPE varchar(10);
