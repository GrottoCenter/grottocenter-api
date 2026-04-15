\c grottoce;

-- Marks all legacy users' as emails as inactive (so they undergo the new verification flow) 
-- while ensuring their existing emails are treated as valid initially.

UPDATE t_caver
SET activated = false,
    mail_is_valid = true
WHERE activated = true OR mail_is_valid = false;
