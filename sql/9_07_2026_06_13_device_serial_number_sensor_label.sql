\c grottoce;

-- Add serial_number to t_device
ALTER TABLE t_device ADD COLUMN IF NOT EXISTS serial_number varchar(200) NULL;

-- Add label to t_sensor_configuration
ALTER TABLE t_sensor_configuration ADD COLUMN IF NOT EXISTS label varchar(300) NULL;
