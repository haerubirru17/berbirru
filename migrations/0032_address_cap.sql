-- Enforce the five-address quota at the storage boundary; route count remains UX only.
CREATE TRIGGER IF NOT EXISTS addresses_max_five
BEFORE INSERT ON addresses
WHEN (SELECT COUNT(*) FROM addresses WHERE user_id = NEW.user_id) >= 5
BEGIN
  SELECT RAISE(ABORT, 'address_cap_exceeded');
END;
